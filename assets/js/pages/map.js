import { CATALOG, COUNTRY_NAMES } from "../catalog.js";
import { matchesPancake, readFilters, writeFilters } from "../lib/filter.js";
import { el } from "../lib/dom.js";
import { siteUrl } from "../lib/url.js";
import { EXTRA_CENTROIDS, ISO_ALIASES } from "../../../data/extra-centroids.js";
import { JOURNEYS, VEHICLES } from "../../../data/journeys.js";
import { labelOf, BASE_TYPES, HEATS } from "../../../data/vocabulary.js";

function countriesOf(pancake) {
  return [pancake.countryCode, ...(pancake.alsoCountries || [])].filter(Boolean);
}

function record(pancake) {
  return {
    region: pancake.region,
    baseType: pancake.baseType,
    heat: pancake.heat,
    uses: pancake.uses || [],
    diets: pancake.diets || [],
    countries: countriesOf(pancake),
    search: pancake.search || ""
  };
}

function featureIso(iso) {
  return ISO_ALIASES[iso] || iso;
}

export async function init() {
  const form = document.getElementById("filters");
  const list = document.getElementById("country-results");
  const status = document.getElementById("map-status");
  if (!form || !list) return;

  const params = new URLSearchParams(location.search);
  const initial = readFilters(params);
  for (const [key, value] of Object.entries({
    q: initial.query,
    region: initial.region,
    type: initial.baseType,
    heat: initial.heat,
    use: initial.use,
    diet: initial.diet,
    country: initial.country
  })) {
    const field = form.elements[key];
    if (field && value) field.value = value;
  }

  const state = { country: initial.country || "", layer: null, geo: null };

  function currentFilters() {
    const data = new FormData(form);
    return {
      query: String(data.get("q") || ""),
      region: String(data.get("region") || ""),
      baseType: String(data.get("type") || ""),
      heat: String(data.get("heat") || ""),
      use: String(data.get("use") || ""),
      diet: String(data.get("diet") || ""),
      country: state.country
    };
  }

  function visiblePancakes() {
    const filters = currentFilters();
    return CATALOG.filter((pancake) => matchesPancake(record(pancake), filters));
  }

  function countsFor(pancakes) {
    const counts = new Map();
    for (const pancake of pancakes) {
      const filters = { ...currentFilters(), country: "" };
      if (!matchesPancake(record(pancake), filters)) continue;
      for (const code of countriesOf(pancake)) {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    }
    return counts;
  }

  function pancakeItem(pancake) {
    return el("li", {}, [
      el("a", { href: `pancakes/${pancake.slug}/` }, pancake.name),
      el("span", { class: "meta" }, ` ${pancake.country} · ${labelOf(BASE_TYPES, pancake.baseType)} · ${labelOf(HEATS, pancake.heat)}`)
    ]);
  }

  function renderList() {
    const pancakes = visiblePancakes().sort((a, b) => a.name.localeCompare(b.name));
    list.replaceChildren();
    list.append(el("h2", {}, state.country
      ? `Pancakes linked to ${countryName(state.country)}`
      : "Pancakes by country"));
    if (!pancakes.length) {
      list.append(el("p", {}, "No pancakes match these filters."));
      if (status) status.textContent = "No pancakes match these filters.";
      return;
    }
    if (state.country) {
      const ul = el("ul", { class: "pancake-links" });
      for (const pancake of pancakes) ul.append(pancakeItem(pancake));
      list.append(ul);
    } else {
      const groups = new Map();
      for (const pancake of pancakes) {
        if (!groups.has(pancake.country)) groups.set(pancake.country, []);
        groups.get(pancake.country).push(pancake);
      }
      for (const [country, items] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const ul = el("ul", { class: "pancake-links" });
        for (const pancake of items) ul.append(pancakeItem(pancake));
        list.append(el("section", { class: "country-group" }, [
          el("h3", {}, `${country} · ${items.length}`),
          ul
        ]));
      }
    }
    if (status) {
      const label = state.country ? countryName(state.country) : "all countries";
      status.textContent = `${pancakes.length} pancakes for ${label}.`;
    }
  }

  function countryName(code) {
    if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
    const named = CATALOG.find((item) => item.countryCode === code);
    return named ? named.country : code;
  }

  function shade(count, max) {
    if (!count) return "#d9d0c1";
    const t = Math.min(1, count / Math.max(3, max));
    const light = [232, 214, 176];
    const deep = [140, 42, 28];
    const mix = light.map((channel, index) => Math.round(channel + (deep[index] - channel) * t));
    return `rgb(${mix.join(",")})`;
  }

  function restyle() {
    if (!state.layer) return;
    const counts = countsFor(CATALOG);
    let max = 1;
    for (const value of counts.values()) max = Math.max(max, value);
    state.layer.setStyle((feature) => {
      const code = featureIso(feature.properties.iso);
      const count = counts.get(code) || 0;
      const selected = state.country && state.country === code;
      return {
        fillColor: shade(count, max),
        fillOpacity: count ? 0.92 : 0.55,
        color: selected ? "#1c1915" : "#5c5346",
        weight: selected ? 2.2 : 0.6
      };
    });
  }

  function selectCountry(code) {
    state.country = code || "";
    const select = form.elements.country;
    if (select) select.value = state.country;
    writeFilters(currentFilters());
    restyle();
    renderList();
    if (code) list.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("input", () => {
    writeFilters(currentFilters());
    restyle();
    renderList();
  });
  form.addEventListener("change", () => {
    if (form.elements.country) state.country = form.elements.country.value || "";
    writeFilters(currentFilters());
    restyle();
    renderList();
  });
  form.addEventListener("submit", (event) => event.preventDefault());

  renderList();

  const mapNode = document.getElementById("world-map");
  if (!mapNode || !window.L) {
    if (status) status.textContent = "The country list is ready. The shaded map did not load.";
    return;
  }

  const map = window.L.map(mapNode, {
    scrollWheelZoom: false,
    minZoom: 1,
    worldCopyJump: true,
    attributionControl: true
  }).setView([18, 8], 2);
  map.attributionControl.addAttribution("Map shapes: Natural Earth");

  try {
    const response = await fetch(siteUrl("assets/maps/countries.geojson"));
    if (!response.ok) throw new Error("map");
    state.geo = await response.json();
  } catch {
    if (status) status.textContent = "The country list is ready. The map file did not load.";
    return;
  }

  state.layer = window.L.geoJSON(state.geo, {
    onEachFeature(feature, layer) {
      const code = featureIso(feature.properties.iso);
      const name = feature.properties.name || code;
      layer.bindTooltip(name, { sticky: true });
      layer.on("click", () => selectCountry(code));
    }
  }).addTo(map);

  const pinned = new Set();
  for (const pancake of CATALOG) {
    for (const code of countriesOf(pancake)) pinned.add(code);
  }
  const present = new Set(state.geo.features.map((feature) => featureIso(feature.properties.iso)));
  for (const code of pinned) {
    if (present.has(code) || !EXTRA_CENTROIDS[code]) continue;
    const [lat, lng] = EXTRA_CENTROIDS[code];
    const marker = window.L.circleMarker([lat, lng], {
      radius: 7,
      color: "#1c1915",
      weight: 1,
      fillColor: "#e2b007",
      fillOpacity: 1
    }).addTo(map);
    marker.bindTooltip(countryName(code), { sticky: true });
    marker.on("click", () => selectCountry(code));
  }

  drawRoutes(map);
  restyle();
  if (state.country) selectCountry(state.country);
}

const VEHICLE_ICONS = {
  balloon: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><ellipse cx="16" cy="12" rx="8" ry="10" fill="#e2b007" stroke="#1c1915"/><path d="M12 22h8l-2 6h-4z" fill="#f7f1e4" stroke="#1c1915"/></svg>`,
  train: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect x="4" y="8" width="24" height="12" rx="2" fill="#f7f1e4" stroke="#1c1915"/><circle cx="10" cy="22" r="2" fill="#1c1915"/><circle cx="22" cy="22" r="2" fill="#1c1915"/></svg>`,
  boat: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M4 18h24l-4 6H8z" fill="#f7f1e4" stroke="#1c1915"/><path d="M16 18V8h2l6 10" fill="none" stroke="#1e4d5c" stroke-width="2"/></svg>`,
  plane: `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M2 18l12-2 8-8 2 2-6 8 8 2-2 2-8-2-4 6-2-2 2-6L4 20z" fill="#e2b007" stroke="#1c1915"/></svg>`
};

function drawRoutes(map) {
  const layer = window.L.layerGroup().addTo(map);
  for (const journey of JOURNEYS) {
    const latlngs = (journey.route || []).map(([lat, lng]) => [lat, lng]);
    if (latlngs.length < 2) continue;
    window.L.polyline(latlngs, {
      color: "#1c1915",
      weight: 2.5,
      opacity: 0.8,
      dashArray: "7 6"
    }).addTo(layer);
    for (let index = 0; index < latlngs.length - 1; index += 1) {
      const mid = [
        (latlngs[index][0] + latlngs[index + 1][0]) / 2,
        (latlngs[index][1] + latlngs[index + 1][1]) / 2
      ];
      const vehicle = (journey.vehicles && journey.vehicles[index + 1]) || journey.vehicle || "plane";
      const icon = window.L.divIcon({
        className: "vehicle-marker",
        html: VEHICLE_ICONS[vehicle] || VEHICLE_ICONS.plane,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      window.L.marker(mid, { icon, keyboard: false, interactive: true })
        .bindTooltip(`${journey.title} · ${VEHICLES[vehicle] || vehicle}`, { sticky: true })
        .addTo(layer);
    }
  }
}
