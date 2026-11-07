#!/usr/bin/env python3
"""Replace place photos with photographs whose titles name that place."""

import importlib.util
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("fetch_photos", ROOT / "scripts" / "fetch-photos.py")
fetch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetch)

DEMOTE = {
    "english-pikelets",
    "mauritian-crepes",
    "ghanaian-tatale",
    "jamaican-festival",
    "normandy-apple-crepes",
    "sweet-potato-pancakes",
    "estonian-kohupiim-pancakes",
    "jamaican-bammy",
    "bahamian-johnnycake",
}

BAD_PLACE = re.compile(
    r"painting|lithograph|engraving|etching|watercolor|oil on|chromolithograph|"
    r"\bby (louis|edgar|bruno|anton|joseph|adriaen|alfred)|"
    r"meeker|chittussi|liljefors|degas|van stalbemt|"
    r"editable|template|modis|satellite|land grant|illustration|drawing|"
    r"diagram|logo|coat of arms|portrait|doll|poodle|shewing|museum|"
    r"\b(person|people|soldier|wedding|protest|crowd|selfie)\b|"
    r"flii|architecture building",
    re.I,
)

# Each key maps to searches. A hit must contain one of the need-tokens.
SPECS = {
    "US-appalachia": [("Cades Cove Great Smoky Mountains", ["cades cove", "smoky mountains"])],
    "US-new-england": [("Acadia National Park Maine coast", ["acadia", "maine"])],
    "US-hudson": [("Hudson Highlands New York", ["hudson"])],
    "US-michigan": [("Sleeping Bear Dunes Michigan", ["sleeping bear", "michigan"])],
    "US-southwest": [("Monument Valley", ["monument valley"])],
    "US-alaska": [("Denali National Park", ["denali"])],
    "US-hawaii": [("Na Pali Coast Kauai", ["na pali", "kauai", "hawaii"])],
    "US-california": [("Golden Gate Bridge", ["golden gate"])],
    "US-midwest": [("Lake Superior shoreline", ["superior", "minnesota"])],
    "US-south": [("Atchafalaya Basin", ["atchafalaya", "louisiana"])],
    "US": [("Yosemite Valley", ["yosemite"])],
    "CA-newfoundland": [("Gros Morne National Park", ["gros morne", "newfoundland"])],
    "CA-acadia": [("Hopewell Rocks New Brunswick", ["hopewell", "new brunswick"])],
    "CA": [("Moraine Lake Banff", ["moraine lake", "banff"])],
    "GB-scotland": [("Quiraing Isle of Skye", ["skye", "quiraing"])],
    "GB-north": [("Bamburgh Castle Northumberland", ["bamburgh", "northumberland"])],
    "GB-lancashire": [("Pendle Hill Lancashire", ["pendle", "lancashire"])],
    "GB-derbyshire": [("Mam Tor Derbyshire", ["mam tor", "derbyshire", "peak district"])],
    "GB-wales": [("Snowdonia Eryri", ["snowdon", "eryri"])],
    "GB-england": [("Bibury Cotswolds", ["bibury", "cotswold"])],
    "FR-brittany": [("Pointe du Raz Brittany", ["raz", "brittany", "bretagne"])],
    "FR-normandy": [("Etretat cliffs", ["etretat"])],
    "FR": [("Lavender fields Provence", ["provence", "valensole"])],
    "NL": [("Kinderdijk", ["kinderdijk"])],
    "BE": [("Bruges canal", ["bruges", "brugge"])],
    "SE": [("Stockholm archipelago", ["stockholm"])],
    "NO": [("Geirangerfjord", ["geiranger"])],
    "DK": [("Møns Klint", ["møn", "mons klint", "denmark"])],
    "FI": [("Lake Inari Finland", ["inari", "finland"])],
    "IS": [("Skógafoss", ["skogafoss", "skógafoss"])],
    "DE": [("Neuschwanstein Castle", ["neuschwanstein"])],
    "AT": [("Hallstatt", ["hallstatt"])],
    "CH": [("Lauterbrunnen valley", ["lauterbrunnen"])],
    "RU": [("Lake Baikal", ["baikal"])],
    "UA": [("Carpathian Mountains Ukraine", ["carpathian", "ukraine"])],
    "PL": [("Morskie Oko", ["morskie oko"])],
    "HU": [("Fisherman's Bastion Budapest", ["budapest"])],
    "CZ": [("Český Krumlov", ["krumlov"])],
    "SK": [("High Tatras Slovakia", ["tatra", "slovakia"])],
    "RO": [("Bran Castle", ["bran"])],
    "BG": [("Rila Monastery", ["rila"])],
    "RS": [("Fruška Gora", ["fruska", "fruška"])],
    "HR": [("Dubrovnik walls", ["dubrovnik"])],
    "BY": [("Mir Castle Belarus", ["mir castle", "belarus"])],
    "LT": [("Trakai Castle", ["trakai"])],
    "LV": [("Riga old town", ["riga"])],
    "EE": [("Tallinn old town", ["tallinn"])],
    "AL": [("Albanian Riviera", ["albania"])],
    "ES": [("Alhambra Granada", ["alhambra"])],
    "PT": [("Pena Palace Sintra", ["sintra", "pena"])],
    "IT": [("Vernazza Cinque Terre", ["vernazza", "cinque terre"])],
    "GR": [("Oia Santorini", ["santorini", "oia"])],
    "ET": [("Simien Mountains", ["simien", "semien"])],
    "ER": [("Asmara Eritrea", ["asmara", "eritrea"])],
    "SO": [("Mogadishu lighthouse", ["mogadishu", "somalia"])],
    "SD": [("Pyramids of Meroë", ["meroe", "meroë"])],
    "MA": [("Aït Benhaddou", ["benhaddou", "ait ben"])],
    "DZ": [("Algiers bay", ["algiers", "algeria"])],
    "TN": [("Sidi Bou Said", ["sidi bou said"])],
    "EG": [("Philae temple", ["philae", "luxor"])],
    "NG": [("Lekki beach Lagos", ["lekki", "lagos", "nigeria"])],
    "GH": [("Cape Coast Castle", ["cape coast"])],
    "KE": [("Maasai Mara", ["mara", "masai"])],
    "ZM": [("Victoria Falls Zambia", ["victoria falls"])],
    "MG": [("Avenue of the Baobabs", ["baobab"])],
    "ZA": [("Table Mountain Cape Town", ["table mountain"])],
    "UG": [("Murchison Falls", ["murchison"])],
    "DJ": [("Lake Assal Djibouti", ["assal", "djibouti"])],
    "YE": [("Socotra dragon blood", ["socotra"])],
    "AE": [("Liwa Oasis", ["liwa"])],
    "TR": [("Cappadocia balloons", ["cappadocia"])],
    "IL": [("Masada", ["masada"])],
    "AF": [("Band-e-Amir", ["band-e-amir", "band e amir"])],
    "AZ": [("Maiden Tower Baku", ["baku"])],
    "AM": [("Geghard monastery", ["geghard"])],
    "IR": [("Persepolis", ["persepolis"])],
    "SA": [("AlUla Hegra", ["alula", "al-ula", "hegra"])],
    "LB": [("Cedars of God", ["cedar"])],
    "GE": [("Svaneti towers", ["svaneti", "mestia"])],
    "AU": [("Uluru", ["uluru"])],
    "NZ": [("Milford Sound", ["milford"])],
    "WS": [("To Sua Samoa", ["samoa"])],
    "FJ": [("Fiji island beach", ["fiji"])],
    "MU": [("Le Morne Brabant", ["morne", "mauritius"])],
    "IN": [("Western Ghats Kerala", ["western ghats", "munnar", "kerala"])],
    "LK": [("Sigiriya", ["sigiriya"])],
    "BD": [("Sundarbans", ["sundarbans"])],
    "NP": [("Annapurna", ["annapurna"])],
    "PK": [("Hunza Valley", ["hunza"])],
    "KR": [("Bukchon Hanok Village", ["bukchon", "hanok"])],
    "JP": [("Mount Fuji Kawaguchi", ["fuji"])],
    "CN": [("Li River Guilin", ["guilin", "li river"])],
    "TW": [("Taroko Gorge", ["taroko"])],
    "VN": [("Ha Long Bay", ["ha long", "halong"])],
    "TH": [("Railay Beach", ["railay"])],
    "MY": [("Petronas Towers", ["petronas"])],
    "ID": [("Tegallalang rice terrace", ["tegallalang", "tegalalang"])],
    "PH": [("Chocolate Hills Bohol", ["chocolate hills"])],
    "MM": [("Bagan temples", ["bagan"])],
    "SG": [("Marina Bay Singapore", ["marina bay"])],
    "MX": [("Chichén Itzá", ["chichen", "chichén"])],
    "SV": [("Santa Ana Volcano El Salvador", ["el salvador", "santa ana"])],
    "CU": [("Malecón Havana", ["havana", "habana", "malecon", "malecón"])],
    "JM": [("Blue Mountains Jamaica", ["jamaica"])],
    "DO": [("Punta Cana", ["punta cana", "dominican"])],
    "BS": [("Nassau Bahamas", ["bahamas", "nassau"])],
    "TT": [("Maracas Bay", ["maracas", "tobago"])],
    "PR": [("El Yunque", ["yunque"])],
    "HT": [("Citadelle Laferrière", ["citadelle"])],
    "MQ": [("Mount Pelée", ["martinique", "pelee", "pelée"])],
    "HN": [("Roatán", ["roatan", "roatán"])],
    "CR": [("Arenal Volcano", ["arenal"])],
    "NI": [("Granada Nicaragua cathedral", ["nicaragua"])],
    "VE": [("Salto Ángel", ["angel falls", "kukenan", "venezuela"])],
    "CO": [("Cocora Valley", ["cocora"])],
    "BR": [("Iguaçu Falls", ["iguacu", "iguaçu", "iguazu"])],
    "AR": [("Perito Moreno Glacier", ["perito moreno"])],
    "CL": [("Torres del Paine", ["torres del paine"])],
    "EC": [("Cotopaxi", ["cotopaxi"])],
    "PE": [("Machu Picchu", ["machu picchu"])],
    "PY": [("Itaipu Paraguay", ["itaipu", "paraguay"])],
    "UY": [("Punta del Este", ["punta del este", "uruguay"])],
    "BO": [("Salar de Uyuni", ["uyuni"])],
}

LABELS = {
    "US-appalachia": "the Great Smoky Mountains in Appalachia",
    "US-new-england": "the Maine coast in New England",
    "US-hudson": "the Hudson Valley, New York",
    "US-michigan": "Michigan",
    "US-southwest": "Monument Valley in the American Southwest",
    "US-alaska": "Denali, Alaska",
    "US-hawaii": "the Hawaiian coast",
    "US-california": "the Golden Gate, San Francisco",
    "US-midwest": "the Lake Superior shore in the Midwest",
    "US-south": "the Atchafalaya Basin in Louisiana",
    "US": "Yosemite Valley in the United States",
    "CA-newfoundland": "Gros Morne, Newfoundland",
    "CA-acadia": "the Bay of Fundy, New Brunswick",
    "CA": "Banff, Canada",
    "GB-scotland": "the Isle of Skye, Scotland",
    "GB-north": "the Northumberland coast, England",
    "GB-lancashire": "Lancashire, England",
    "GB-derbyshire": "the Peak District, Derbyshire",
    "GB-wales": "Eryri (Snowdonia), Wales",
    "GB-england": "the Cotswolds, England",
    "FR-brittany": "the Brittany coast, France",
    "FR-normandy": "the cliffs at Étretat, Normandy",
    "FR": "Provence, France",
    "GE": "Svaneti, Georgia",
    "TT": "Maracas Bay, Trinidad",
    "PR": "El Yunque, Puerto Rico",
    "AE": "Liwa Oasis in the United Arab Emirates",
    "AM": "Geghard monastery in Armenia",
    "BE": "a canal in Bruges, Belgium",
    "BR": "Iguazu Falls, on the Brazilian side",
    "BS": "Nassau in the Bahamas",
    "CH": "the Lauterbrunnen valley in Switzerland",
    "CL": "Torres del Paine in Chile",
    "CN": "the Li River at Yangshuo, China",
    "CO": "the Cocora Valley in Colombia",
    "CR": "Arenal Volcano in Costa Rica",
    "CU": "the Malecón in Havana, Cuba",
    "CZ": "Český Krumlov in Czechia",
    "DE": "Neuschwanstein and the Alpsee in Bavaria, Germany",
    "DJ": "Lake Assal in Djibouti",
    "DK": "Møns Klint in Denmark",
    "DZ": "the bay of Algiers, Algeria",
    "EE": "the old town of Tallinn, Estonia",
    "ET": "the Simien Mountains in Ethiopia",
    "FI": "Lake Inari in Finland",
    "FJ": "a beach on Matamanoa, Fiji",
    "GH": "Cape Coast Castle in Ghana",
    "GR": "Oia on Santorini, Greece",
    "HR": "the city walls of Dubrovnik, Croatia",
    "IE": "the Cliffs of Moher in Ireland",
    "IN": "the tea hills at Munnar in Kerala, India",
    "IS": "Skógafoss in Iceland",
    "IT": "Vernazza in the Cinque Terre, Italy",
    "JM": "the Blue Mountains in Jamaica",
    "LB": "the Cedars of God at Bsharri, Lebanon",
    "LK": "Sigiriya in Sri Lanka",
    "MM": "the temples of Bagan, Myanmar",
    "MU": "Le Morne Brabant in Mauritius",
    "MX": "Chichén Itzá in Yucatán, Mexico",
    "NI": "the cathedral at Granada, Nicaragua",
    "NL": "Kinderdijk in the Netherlands",
    "NO": "Geirangerfjord in Norway",
    "NZ": "Milford Sound in New Zealand",
    "PL": "Morskie Oko in Poland",
    "PT": "Pena Palace at Sintra, Portugal",
    "RS": "Fruška Gora in Serbia",
    "RU": "Olkhon Island on Lake Baikal, Russia",
    "SA": "Elephant Rock at AlUla, Saudi Arabia",
    "SE": "the Stockholm archipelago, Sweden",
    "SK": "the High Tatras in Slovakia",
    "SO": "the Mogadishu waterfront, Somalia",
    "TR": "Cappadocia in Turkey",
    "UG": "Murchison Falls in Uganda",
    "VE": "Margarita Island, Venezuela",
    "WS": "the To Sua ocean trench in Samoa",
    "ZM": "Victoria Falls",
}


def place_key(pancake):
    slug = pancake["slug"]
    code = pancake["countryCode"]
    blob = " ".join([slug, pancake.get("locale") or "", pancake.get("name") or ""]).lower()
    if code == "US":
        if any(word in blob for word in ["appalach", "sorghum", "dried-apple", "dried apple"]):
            return "US-appalachia"
        if "hudson" in blob:
            return "US-hudson"
        if "michigan" in blob:
            return "US-michigan"
        if any(word in blob for word in ["rhode", "maine", "vermont", "cape-cod", "cape cod", "apple-cider", "cranberry"]):
            return "US-new-england"
        if any(word in blob for word in ["new mexico", "new-mexico", "hopi", "navajo", "piki", "southwest"]):
            return "US-southwest"
        if "alaska" in blob:
            return "US-alaska"
        if "hawai" in blob:
            return "US-hawaii"
        if any(word in blob for word in ["francisco", "california"]):
            return "US-california"
        if any(word in blob for word in ["minnesota", "midwest"]):
            return "US-midwest"
        if any(word in blob for word in ["orleans", "louisiana", "lowcountry", "georgia", "florida", "texas", "pecan", "hoecake", "molasses", "foster", "southern", "corn oyster", "corn-oyster", "lacy", "plantain", "buttermilk"]):
            return "US-south"
        return "US"
    if code == "CA":
        if "newfoundland" in blob or "touton" in blob:
            return "CA-newfoundland"
        if "acad" in blob or "ploye" in blob:
            return "CA-acadia"
        return "CA"
    if code == "GB":
        if any(word in blob for word in ["scottish", "scotch", "tattie", "highland"]):
            return "GB-scotland"
        if any(word in blob for word in ["singing", "hinnie", "northumberland", "newcastle"]):
            return "GB-north"
        if "lancashire" in blob:
            return "GB-lancashire"
        if "derbyshire" in blob:
            return "GB-derbyshire"
        if any(word in blob for word in ["welsh", "wales", "crempog"]):
            return "GB-wales"
        return "GB-england"
    if code == "FR":
        if any(word in blob for word in ["brittany", "breton", "galette"]):
            return "FR-brittany"
        if "normandy" in blob or "normandie" in blob:
            return "FR-normandy"
        return "FR"
    return code


def acceptable(hit, need, key):
    title = hit["title"]
    if BAD_PLACE.search(title) or fetch.FOODISH.search(title):
        return False
    low = fetch.norm(title)
    if key == "WS" and "american samoa" in low:
        return False
    if key == "GE" and ("united states" in low or "atlanta" in low):
        return False
    if key == "TT" and "philippines" in low:
        return False
    if key == "JM" and "hindu" in low:
        return False
    return any(fetch.norm(token) in low for token in need)


def find_hit(key, pancake):
    queries = list(SPECS.get(key, []))
    country = pancake.get("country") or ""
    if country and key == pancake["countryCode"]:
        queries.append((f"{country} landscape", [country]))
    for query, need in queries:
        hits = fetch.search(query, limit=12)
        for hit in hits:
            if acceptable(hit, need, key):
                return hit
    return None


def store(photos, hit):
    photo_id = re.sub(r"[^a-z0-9]+", "-", fetch.norm(hit["title"])).strip("-")[:80]
    if photo_id not in photos:
        print("download", hit["title"])
        blob = fetch.download(hit["thumb"])
        versions = fetch.save_versions(blob, photo_id)
        photos[photo_id] = {
            "id": photo_id,
            "title": hit["title"],
            "page": hit["page"],
            "artist": hit["artist"],
            "license": hit["license"],
            "licenseUrl": hit["licenseUrl"],
            "versions": versions,
        }
    return photo_id


def main():
    manifest = json.loads((ROOT / "data" / "photos.json").read_text())
    photos = manifest["photos"]
    assignments = manifest["assignments"]
    raw = subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import { SAUCES } from './data/pancakes/index.js';"
        "process.stdout.write(JSON.stringify(SAUCES.map(p => ({slug:p.slug,name:p.name,country:p.country,countryCode:p.countryCode,region:p.region,locale:p.locale||''}))));"
    ], cwd=ROOT)
    pancakes = json.loads(raw)
    cache = {}
    failed = []
    for pancake in pancakes:
        slug = pancake["slug"]
        current = assignments.get(slug)
        place = pancake.get("locale") or pancake["country"]
        if current and current["kind"] == "dish" and slug not in DEMOTE:
            current["alt"] = f"{pancake['name']} from {place}. The photograph shows this dish."
            current["label"] = "Photograph of the dish."
            continue
        key = place_key(pancake)
        if key not in cache:
            hit = find_hit(key, pancake)
            if not hit:
                cache[key] = None
                print("FAIL", key)
            else:
                photo_id = store(photos, hit)
                cache[key] = photo_id
                print(f"PLACE {key} <- {hit['title']}")
        photo_id = cache[key]
        if not photo_id:
            failed.append(slug)
            continue
        label_place = LABELS.get(key, place)
        assignments[slug] = {
            "photoId": photo_id,
            "kind": "place",
            "alt": f"Landscape of {label_place}. This photograph shows the place, not the pancake.",
            "label": f"Photograph of the place ({label_place}), not the dish.",
        }
    used = {item["photoId"] for item in assignments.values()}
    manifest["photos"] = {key: value for key, value in photos.items() if key in used}
    manifest["assignments"] = assignments
    dish = sum(1 for item in assignments.values() if item["kind"] == "dish")
    manifest["dishCount"] = dish
    manifest["placeCount"] = len(assignments) - dish
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
    print(f"dishes {dish} places {manifest['placeCount']} unique {manifest['uniqueCount']} assigned {len(assignments)} of {len(pancakes)} removed_files {removed}")
    if failed:
        print("STILL MISSING", ", ".join(failed))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
