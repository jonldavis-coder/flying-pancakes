#!/usr/bin/env python3
"""Swap place photos that are animals, prints, or buildings for landscapes."""

import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fetch = load("fetch-photos")
places = load("assign-places")

FIXES = {
    "IN": {
        "queries": [("Munnar tea plantations", ["munnar"]), ("Alleppey backwaters Kerala", ["alleppey", "kerala"])],
        "block": r"calliophis|snake|nigrescens|species",
    },
    "IE": {
        "queries": [("Cliffs of Moher", ["moher"])],
        "block": r"painting|png",
    },
    "LB": {
        "queries": [("Bsharri Cedars of God", ["bsharri", "cedars of god"]), ("Cedars of Lebanon forest", ["cedar"])],
        "block": r"engraving|illustration|tent|png",
    },
    "SA": {
        "queries": [("Elephant Rock AlUla", ["elephant rock", "alula", "al-ula"]), ("Hegra tombs Madain", ["hegra", "madain"])],
        "block": r"inscription|euting|rubbing",
    },
    "US-alaska": {
        "queries": [("Wonder Lake Denali", ["wonder lake", "denali"]), ("Denali mountain Alaska", ["denali"])],
        "block": r"animal|caribou|reindeer|moose|bear|wolf|fence",
    },
    "US-hudson": {
        "queries": [("Bear Mountain Bridge", ["bear mountain"]), ("Hudson Highlands New York", ["hudson"])],
        "block": r"barnum|stereograph|stereo|by deloss",
    },
    "FR-normandy": {
        "queries": [("Falaise d'Aval Etretat", ["etretat", "aval"])],
        "block": r"möwen|mowen|dohlen|fütterung|futterung|seagull|möwe",
    },
    "DK": {
        "queries": [("Møns Klint chalk cliff", ["klint"])],
        "block": r"geocenter|geo center|geo-center",
    },
    "CA-acadia": {
        "queries": [("Hopewell Rocks New Brunswick", ["hopewell"])],
        "block": r"formation",
    },
}


def main():
    manifest = json.loads((ROOT / "data" / "photos.json").read_text())
    photos = manifest["photos"]
    assignments = manifest["assignments"]
    import subprocess
    raw = subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import { SAUCES } from './data/pancakes/index.js';"
        "process.stdout.write(JSON.stringify(SAUCES.map(p => ({slug:p.slug,name:p.name,country:p.country,countryCode:p.countryCode,region:p.region,locale:p.locale||''}))));"
    ], cwd=ROOT)
    pancakes = {item["slug"]: item for item in json.loads(raw)}
    for key, spec in FIXES.items():
        block = re.compile(spec["block"], re.I)
        chosen = None
        for query, need in spec["queries"]:
            for hit in fetch.search(query, limit=12):
                if block.search(hit["title"]) or fetch.BAD_TITLE.search(hit["title"]) or fetch.FOODISH.search(hit["title"]):
                    continue
                if not any(fetch.norm(token) in fetch.norm(hit["title"]) for token in need):
                    continue
                chosen = hit
                break
            if chosen:
                break
        if not chosen:
            print("FAIL", key)
            continue
        photo_id = re.sub(r"[^a-z0-9]+", "-", fetch.norm(chosen["title"])).strip("-")[:80]
        if photo_id not in photos:
            print("download", chosen["title"])
            blob = fetch.download(chosen["thumb"])
            versions = fetch.save_versions(blob, photo_id)
            photos[photo_id] = {
                "id": photo_id,
                "title": chosen["title"],
                "page": chosen["page"],
                "artist": chosen["artist"],
                "license": chosen["license"],
                "licenseUrl": chosen["licenseUrl"],
                "versions": versions,
            }
        count = 0
        for slug, pancake in pancakes.items():
            if places.place_key(pancake) != key:
                continue
            assignment = assignments.get(slug)
            if not assignment or assignment["kind"] != "place":
                continue
            label_place = places.LABELS.get(key, pancake.get("locale") or pancake["country"])
            assignments[slug] = {
                "photoId": photo_id,
                "kind": "place",
                "alt": f"Landscape of {label_place}. This photograph shows the place, not the pancake.",
                "label": f"Photograph of the place ({label_place}), not the dish.",
            }
            count += 1
        print(f"FIXED {key} ({count}) <- {chosen['title']}")
    used = {item["photoId"] for item in assignments.values()}
    manifest["photos"] = {pid: photo for pid, photo in photos.items() if pid in used}
    manifest["uniqueCount"] = len(manifest["photos"])
    (ROOT / "data" / "photos.json").write_text(json.dumps(manifest, indent=2) + "\n")
    keep = set()
    for photo_id in manifest["photos"]:
        for width in ("480", "800", "1200"):
            keep.add(f"{photo_id}-{width}.webp")
    removed = 0
    for path in (ROOT / "assets" / "photos").glob("*.webp"):
        if path.name not in keep:
            path.unlink()
            removed += 1
    print("unique", manifest["uniqueCount"], "removed", removed)


if __name__ == "__main__":
    main()
