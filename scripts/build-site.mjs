import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAUCES } from "../data/pancakes/index.js";
import { BOOKS as USE_BOOKS } from "../data/books.js";
import { FLAGSHIP_BOOKS } from "../data/flagship-books.js";
import { SHOP } from "../data/shop.js";
import { COUNTRY_NAMES } from "../data/country-names.js";
import {
  BASE_TYPES,
  DIET_IDS,
  DIETS,
  HEATS,
  REGIONS,
  REGION_NAMES,
  USES,
  continentOf,
  labelOf
} from "../data/vocabulary.js";
import { escapeHtml } from "../assets/js/lib/escape.js";
import { isoDuration, formatMinutes } from "../assets/js/lib/format.js";
import { slugify } from "../assets/js/lib/slug.js";
import { faviconSvg, heroSvg } from "./art.mjs";
import { bookCoverSvg, boxSetCoverSvg, routeMapSvg } from "./covers.mjs";
import { boxSetQuote, notifyHref, priceLabel } from "../assets/js/lib/shop.js";
import { adSlot, page } from "./layout.mjs";
import { JOURNEYS, VEHICLES } from "../data/journeys.js";
import { PANCAKE_101, GLOSSARY, WHO_SETTLED } from "../data/learn.js";

const BOOKS = [...FLAGSHIP_BOOKS, ...USE_BOOKS];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://jonldavis-coder.github.io/flying-pancakes";
const TODAY = "2026-11-07";

function write(rel, contents) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function resetGenerated() {
  for (const dir of ["pancakes", "explore", "books", "map", "learn", "about", "privacy", "terms", "affiliate", "guidelines", "journeys", "credits", "assets/images/pancakes"]) {
    fs.rmSync(path.join(root, dir), { recursive: true, force: true });
  }
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function validate(pancakes) {
  const errors = [];
  const slugs = new Set();
  const names = new Set();
  const banned = /national geographic|natgeo|lorem ipsum|\bTODO\b|testimonial/i;
  for (const pancake of pancakes) {
    const where = pancake.slug || pancake.name || "(missing slug)";
    const need = ["slug", "name", "country", "countryCode", "region", "culture", "baseType", "heat", "flavor", "history", "background", "method", "served", "yieldText"];
    for (const key of need) {
      if (!String(pancake[key] || "").trim()) errors.push(`${where}: missing ${key}`);
    }
    if (slugs.has(pancake.slug)) errors.push(`${where}: duplicate slug`);
    slugs.add(pancake.slug);
    const norm = normalizeName(pancake.name);
    if (names.has(norm)) errors.push(`${where}: duplicate or near-duplicate name`);
    names.add(norm);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pancake.slug || "")) errors.push(`${where}: bad slug`);
    if (!/^[A-Z]{2}$/.test(pancake.countryCode || "")) errors.push(`${where}: countryCode must be ISO alpha-2`);
    if (!REGION_NAMES.includes(pancake.region)) errors.push(`${where}: unknown region ${pancake.region}`);
    if (!BASE_TYPES.some(([id]) => id === pancake.baseType)) errors.push(`${where}: unknown base ${pancake.baseType}`);
    if (!HEATS.some(([id]) => id === pancake.heat)) errors.push(`${where}: unknown heat ${pancake.heat}`);
    if (!Array.isArray(pancake.uses) || pancake.uses.length < 1) errors.push(`${where}: uses`);
    for (const use of pancake.uses || []) if (!USES.some(([id]) => id === use)) errors.push(`${where}: bad use ${use}`);
    for (const diet of pancake.diets || []) if (!DIET_IDS.includes(diet)) errors.push(`${where}: bad diet ${diet}`);
    for (const code of pancake.alsoCountries || []) {
      if (!/^[A-Z]{2}$/.test(code)) errors.push(`${where}: bad alsoCountries ${code}`);
    }
    if (!Array.isArray(pancake.funFacts) || pancake.funFacts.length < 1 || pancake.funFacts.length > 3) {
      errors.push(`${where}: need 1 to 3 fun facts`);
    }
    for (const fact of pancake.funFacts || []) if (String(fact).trim().length < 20) errors.push(`${where}: thin fun fact`);
    if (String(pancake.history).length < 80) errors.push(`${where}: history too short`);
    if (String(pancake.background).length < 40) errors.push(`${where}: background too short`);
    if (String(pancake.whyItTastes || "").trim().length < 80) errors.push(`${where}: why it tastes this way`);
    if (String(pancake.authenticTouch || "").trim().length < 40) errors.push(`${where}: authentic touch`);
    if (!Array.isArray(pancake.ingredients) || pancake.ingredients.length < 3) errors.push(`${where}: ingredients`);
    if (!Array.isArray(pancake.steps) || pancake.steps.length < 3) errors.push(`${where}: steps`);
    if (!Number.isInteger(pancake.prepMinutes) || pancake.prepMinutes < 0) errors.push(`${where}: prep`);
    if (!Number.isInteger(pancake.cookMinutes) || pancake.cookMinutes < 0) errors.push(`${where}: cook`);
    if ((pancake.prepMinutes || 0) + (pancake.cookMinutes || 0) < 1) errors.push(`${where}: time`);
    if (!Number.isInteger(pancake.servings) || pancake.servings < 1) errors.push(`${where}: servings`);
    if (!Number.isFinite(pancake.lat) || !Number.isFinite(pancake.lng)) errors.push(`${where}: lat/lng`);
    if (!String(pancake.place || "").trim()) errors.push(`${where}: place`);
    const blob = JSON.stringify(pancake);
    if (banned.test(blob)) errors.push(`${where}: banned phrasing`);
    const allergens = new Set(pancake.allergens || []);
    const diets = new Set(pancake.diets || []);
    if ((allergens.has("meat") || allergens.has("fish") || allergens.has("shellfish")) && (diets.has("vegetarian") || diets.has("vegan"))) {
      errors.push(`${where}: diet conflicts with meat or fish`);
    }
    if ((allergens.has("dairy") || allergens.has("egg") || allergens.has("honey")) && diets.has("vegan")) {
      errors.push(`${where}: vegan conflict`);
    }
    if (allergens.has("dairy") && diets.has("dairy-free")) errors.push(`${where}: dairy-free conflict`);
    if (allergens.has("wheat") && diets.has("gluten-free")) errors.push(`${where}: gluten-free conflict`);
    if ((allergens.has("peanut") || allergens.has("tree-nut")) && diets.has("nut-free")) errors.push(`${where}: nut-free conflict`);
    if (!COUNTRY_NAMES[pancake.countryCode]) errors.push(`${where}: add ${pancake.countryCode} to country-names.js`);
    for (const code of pancake.alsoCountries || []) {
      if (!COUNTRY_NAMES[code]) errors.push(`${where}: add ${code} to country-names.js`);
    }
  }
  const continents = new Set(pancakes.map((pancake) => continentOf(pancake.region)));
  for (const name of ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"]) {
    if (!continents.has(name)) errors.push(`missing continent ${name}`);
  }
  if (pancakes.length < 250) errors.push(`need at least 250 pancakes, have ${pancakes.length}`);
  if (errors.length) {
    console.error(errors.slice(0, 40).join("\n"));
    throw new Error(`Catalog failed validation (${errors.length} problems).`);
  }
}

function countriesOf(pancake) {
  return [pancake.countryCode, ...(pancake.alsoCountries || [])];
}

function searchText(pancake) {
  return [
    pancake.name,
    pancake.country,
    pancake.region,
    pancake.locale,
    pancake.culture,
    pancake.flavor,
    pancake.background,
    labelOf(BASE_TYPES, pancake.baseType),
    labelOf(HEATS, pancake.heat),
    ...(pancake.uses || []),
    ...(pancake.pairings || []),
    ...(pancake.funFacts || [])
  ].join(" ").toLowerCase();
}

function og(title, description, url, image) {
  const src = image || `${ORIGIN}/${pancakes[0].photo}`;
  return `<meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${escapeHtml(src)}">`;
}

function selectOptions(list, blank) {
  const head = `<option value="">${escapeHtml(blank)}</option>`;
  const rest = list.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
  return head + rest;
}

function filterForm(countryOptions) {
  return `<form id="filters" class="filters" role="search">
      <div class="filter-grid">
        <label>Search
          <input name="q" type="search" placeholder="Dosa, Appalachia, buckwheat…" autocomplete="off">
        </label>
        <label>Region
          <select name="region">${selectOptions(REGIONS.map(([name]) => [name, name]), "All regions")}</select>
        </label>
        <label>Base type
          <select name="type">${selectOptions(BASE_TYPES, "All types")}</select>
        </label>
        <label>Heat
          <select name="heat">${selectOptions(HEATS, "Any heat")}</select>
        </label>
        <label>Use
          <select name="use">${selectOptions(USES, "Any use")}</select>
        </label>
        <label>Diet
          <select name="diet">${selectOptions(DIETS, "Any diet")}</select>
        </label>
        <label>Country
          <select name="country">${countryOptions}</select>
        </label>
      </div>
    </form>`;
}

function card(pancake) {
  const countries = countriesOf(pancake).join(",");
  const record = pancake.photoRecord;
  const photo = record.photo;
  const small = photo.versions["480"];
  const medium = photo.versions["800"];
  const kind = record.kind === "place" ? `<span class="photo-kind">${escapeHtml(record.label)}</span> ` : "";
  return `<article class="card" data-slug="${escapeHtml(pancake.slug)}" data-region="${escapeHtml(pancake.region)}" data-type="${escapeHtml(pancake.baseType)}" data-heat="${escapeHtml(pancake.heat)}" data-uses="${escapeHtml(pancake.uses.join(","))}" data-diets="${escapeHtml((pancake.diets || []).join(","))}" data-countries="${escapeHtml(countries)}" data-search="${escapeHtml(searchText(pancake))}">
        <a class="card-media" href="pancakes/${pancake.slug}/">
          <picture>
            <source type="image/webp" srcset="${small.src} 480w, ${medium.src} 800w" sizes="(max-width: 720px) 100vw, 33vw">
            <img src="${small.src}" alt="${escapeHtml(record.alt)}" width="${small.width}" height="${small.height}" loading="lazy" decoding="async">
          </picture>
          <span class="badge">${escapeHtml(pancake.country)}</span>
        </a>
        <p class="photo-credit">${kind}${creditHtml(photo)}</p>
        <div class="card-body">
          <p class="eyebrow">${escapeHtml(pancake.region)} · ${escapeHtml(labelOf(BASE_TYPES, pancake.baseType))}</p>
          <h2><a href="pancakes/${pancake.slug}/">${escapeHtml(pancake.name)}</a></h2>
          <p>${escapeHtml(pancake.flavor)}</p>
          <p class="meta">${escapeHtml(labelOf(HEATS, pancake.heat))} · ${formatMinutes(pancake.prepMinutes + pancake.cookMinutes)} · ${escapeHtml(pancake.yieldText)}</p>
          <p class="meta rating">No ratings yet</p>
          <p class="meta hearts">No hearts yet</p>
        </div>
      </article>`;
}

function recipeBody(pancake, { book = false } = {}) {
  const facts = pancake.funFacts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("");
  const ingredients = pancake.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const steps = pancake.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const variations = (pancake.variations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const pairings = (pancake.pairings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const uses = pancake.uses.map((item) => `<li>${escapeHtml(labelOf(USES, item))}</li>`).join("");
  const diets = (pancake.diets || []).map((item) => `<li>${escapeHtml(labelOf(DIETS, item))}</li>`).join("");
  const safety = pancake.safety ? `<p class="safety">${escapeHtml(pancake.safety)}</p>` : "";
  return `<p class="print-only print-brand">Flying Pancakes of the World</p>
      <p class="eyebrow">${escapeHtml(pancake.country)} · ${escapeHtml(pancake.region)}</p>
      <h2 class="pancake-title">${book ? escapeHtml(pancake.name) : ""}</h2>
      ${book ? "" : ""}
      <p class="dek">${escapeHtml(pancake.flavor)}</p>
      <p class="meta recipe-meta">${formatMinutes(pancake.prepMinutes)} prep · ${formatMinutes(pancake.cookMinutes)} cook · Serves ${pancake.servings} · ${escapeHtml(pancake.yieldText)}</p>
      <div class="story-block">
        <h3>History</h3>
        <p>${escapeHtml(pancake.history)}</p>
        <h3>Cultural background</h3>
        <p>${escapeHtml(pancake.background)}</p>
        <h3>Why it tastes this way</h3>
        <p>${escapeHtml(pancake.whyItTastes)}</p>
        <h3>How it is made</h3>
        <p>${escapeHtml(pancake.method)}</p>
        <p class="authentic-touch"><strong>Authentic touch. </strong>${escapeHtml(pancake.authenticTouch)}</p>
        <h3>How it is used</h3>
        <p>${escapeHtml(pancake.served)}</p>
      </div>
      <aside class="fun-facts">
        <h3>Field notes</h3>
        <ul>${facts}</ul>
      </aside>
      <h3>Ingredients</h3>
      <ul class="ingredients">${ingredients}</ul>
      <h3 class="steps-heading">Steps</h3>
      <ol class="steps">${steps}</ol>
      ${safety}
      <p class="note">${escapeHtml(pancake.storage)} Home cooking, not a professional food-safety instruction.</p>
      <div class="variations">
        <h3>Variations</h3>
        ${variations ? `<ul>${variations}</ul>` : "<p>The classic version is the one written above.</p>"}
      </div>
      <div class="pairings">
        <h3>Pairings and uses</h3>
        <ul class="tag-row">${uses}</ul>
        ${pairings ? `<ul>${pairings}</ul>` : ""}
        ${diets ? `<ul class="tag-row">${diets}</ul>` : ""}
      </div>`;
}

function pancakeJson(pancake) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: pancake.name,
    description: `${pancake.flavor} ${pancake.history}`.slice(0, 480),
    image: `${ORIGIN}/${pancake.photo}`,
    recipeCategory: labelOf(BASE_TYPES, pancake.baseType),
    recipeCuisine: pancake.culture || pancake.country,
    recipeYield: pancake.yieldText,
    prepTime: isoDuration(pancake.prepMinutes),
    cookTime: isoDuration(pancake.cookMinutes),
    totalTime: isoDuration(pancake.prepMinutes + pancake.cookMinutes),
    recipeIngredient: pancake.ingredients,
    recipeInstructions: pancake.steps.map((text) => ({ "@type": "HowToStep", text })),
    keywords: [pancake.region, pancake.country, labelOf(HEATS, pancake.heat), ...pancake.uses].join(", "),
    author: { "@type": "Organization", name: "Flying Pancakes of the World" },
    url: `${ORIGIN}/pancakes/${pancake.slug}/`
  };
}

function breadcrumb(pancake) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Journal", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: pancake.region, item: `${ORIGIN}/explore/region/${slugify(pancake.region)}/` },
      { "@type": "ListItem", position: 3, name: pancake.name, item: `${ORIGIN}/pancakes/${pancake.slug}/` }
    ]
  };
}

function pancakePage(pancake, count, nav) {
  const description = `${pancake.name}: ${pancake.flavor} A recipe from ${pancake.country}, with origin, method, and field notes.`;
  const shared = (pancake.alsoCountries || []).map((code) => COUNTRY_NAMES[code]).filter(Boolean);
  const originExtra = shared.length ? `<p>Also cooked as a staple in ${escapeHtml(shared.join(", "))}.</p>` : "";
  return page({
    title: `${pancake.name} · Flying Pancakes`,
    description,
    current: "home",
    pageName: "pancake",
    pancakeCount: count,
    canonical: `${ORIGIN}/pancakes/${pancake.slug}/`,
    jsonLd: [pancakeJson(pancake), breadcrumb(pancake)],
    extraHead: og(pancake.name, description, `${ORIGIN}/pancakes/${pancake.slug}/`, `${ORIGIN}/${pancake.photo}`),
    main: `<article id="pancake-root" class="wrap" data-slug="${escapeHtml(pancake.slug)}">
      ${figureHtml(pancake.photoRecord, { eager: true, className: "pancake-hero pancake-photo", sizes: "(max-width: 1100px) 100vw, 1100px" })}
      <div class="pancake-layout">
      <div>
        <p class="print-only print-brand">Flying Pancakes of the World</p>
        <p class="eyebrow">Arriving in ${escapeHtml(pancake.place || pancake.locale || pancake.country)}</p>
        <h1 class="pancake-title">${escapeHtml(pancake.name)}</h1>
        <p class="arrival">You come in by ${escapeHtml((nav && nav.vehicleLabel) || "plane")}. ${escapeHtml(pancake.country)} · ${escapeHtml(pancake.region)}.</p>
        ${pancake.pronunciation ? `<p class="meta">Pronounced ${escapeHtml(pancake.pronunciation)}</p>` : ""}
        <p class="dek">${escapeHtml(pancake.flavor)}</p>
        <p class="meta recipe-meta">${formatMinutes(pancake.prepMinutes)} prep · ${formatMinutes(pancake.cookMinutes)} cook · Serves ${pancake.servings} · ${escapeHtml(pancake.yieldText)}</p>
        <p class="meta" id="rating-summary">No ratings yet</p>
        <p class="meta" id="heart-summary">No hearts yet</p>
        <ul class="tag-row">
          <li>${escapeHtml(labelOf(BASE_TYPES, pancake.baseType))}</li>
          <li>${escapeHtml(labelOf(HEATS, pancake.heat))}</li>
          ${(pancake.diets || []).map((diet) => `<li>${escapeHtml(labelOf(DIETS, diet))}</li>`).join("")}
        </ul>
        <div class="story-block">
          <h2>History</h2>
          <p>${escapeHtml(pancake.history)}</p>
          <h2>Cultural background</h2>
          <p>${escapeHtml(pancake.background)}</p>
          <h2>Why it tastes this way</h2>
          <p>${escapeHtml(pancake.whyItTastes)}</p>
          <h2>How it is made</h2>
          <p>${escapeHtml(pancake.method)}</p>
          <aside class="authentic-touch">
            <h2>Authentic touch</h2>
            <p>${escapeHtml(pancake.authenticTouch)}</p>
          </aside>
          <h2>How it is used</h2>
          <p>${escapeHtml(pancake.served)}</p>
        </div>
        <aside class="fun-facts">
          <h2>Field notes</h2>
          <ul>${pancake.funFacts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>
        </aside>
        ${adSlot("pancake_rail")}
        <h2>Ingredients</h2>
        <ul class="ingredients">${pancake.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <h2 class="steps-heading">Steps</h2>
        <ol class="steps">${pancake.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        ${pancake.safety ? `<p class="safety">${escapeHtml(pancake.safety)}</p>` : ""}
        <p class="note">${escapeHtml(pancake.storage)} This is a home recipe, not professional food-safety advice.</p>
        <div class="variations section-rule">
          <h2>Variations</h2>
          ${(pancake.variations || []).length ? `<ul>${pancake.variations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>The classic version is the one written above.</p>"}
        </div>
        <div class="pairings">
          <h2>Pairings</h2>
          <ul>${(pancake.pairings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
        <div id="print-actions" class="no-print button-row"></div>
        <div id="community-actions" class="no-print section-rule"></div>
        <section id="twists" class="no-print section-rule"></section>
        <section id="comments" class="no-print section-rule" aria-label="Comments"></section>
      </div>
      <aside class="rail">
        <div class="origin-card">
          <h2>Origin</h2>
          <dl>
            <dt>Country</dt><dd>${escapeHtml(pancake.country)}</dd>
            <dt>Region</dt><dd><a href="explore/region/${slugify(pancake.region)}/">${escapeHtml(pancake.region)}</a></dd>
            <dt>Locale</dt><dd>${escapeHtml(pancake.locale || pancake.country)}</dd>
            <dt>Culture</dt><dd>${escapeHtml(pancake.culture)}</dd>
            <dt>Base</dt><dd><a href="explore/type/${pancake.baseType}/">${escapeHtml(labelOf(BASE_TYPES, pancake.baseType))}</a></dd>
            <dt>Heat</dt><dd>${escapeHtml(labelOf(HEATS, pancake.heat))}</dd>
          </dl>
          ${originExtra}
          <p><a href="map/?country=${escapeHtml(pancake.countryCode)}">See this country on the route map</a></p>
        </div>
        ${nav && nav.next ? `<aside class="next-stop no-print">
          <p class="eyebrow">Next stop</p>
          <h2><a href="pancakes/${nav.next.slug}/">${escapeHtml(nav.next.name)}</a></h2>
          <p>${escapeHtml(nav.next.place || nav.next.country)} · ${escapeHtml(nav.journey ? nav.journey.title : pancake.region)}</p>
          <p class="meta">Arrive by ${escapeHtml(nav.vehicleLabel)}${nav.journey ? ` · <a href="journeys/${nav.journey.slug}/">Open the journey</a>` : ""}</p>
        </aside>` : ""}
      </aside>
      </div>
    </article>`
  });
}

function feature(region, copy, pancakes) {
  const examples = pancakes.filter((pancake) => pancake.region === region).slice(0, 3).map((pancake) => pancake.name).join(" · ");
  const count = pancakes.filter((pancake) => pancake.region === region).length;
  return `<a class="feature" href="explore/region/${slugify(region)}/">
        <span class="count">${count} pancakes</span>
        <p class="eyebrow">${escapeHtml(region)}</p>
        <h2>${escapeHtml(copy.title)}</h2>
        <p>${escapeHtml(copy.text)} ${escapeHtml(examples)}.</p>
      </a>`;
}

function explorePage({ title, description, current, crumbs, pancakes, count, hero }) {
  const heroHtml = hero
    ? `${figureHtml(hero.photoRecord, { eager: true, className: "region-hero", sizes: "(max-width: 1100px) 100vw, 1100px" })}
      <p class="meta">Lead photograph from the <a href="pancakes/${hero.slug}/">${escapeHtml(hero.name)}</a> page.</p>`
    : "";
  const image = hero ? `${ORIGIN}/${hero.photo}` : undefined;
  return page({
    title: `${title} · Flying Pancakes`,
    description,
    current,
    pageName: "explore",
    pancakeCount: count,
    canonical: crumbs,
    extraHead: og(title, description, crumbs, image),
    main: `<div class="wrap">
      ${adSlot("explore_top")}
      <p class="eyebrow">Explore</p>
      <h1>${escapeHtml(title)}</h1>
      ${heroHtml}
      <p class="lede">${escapeHtml(description)}</p>
      <p class="results-count">${pancakes.length} ${pancakes.length === 1 ? "pancake" : "pancakes"}</p>
      <div class="grid">${pancakes.map(card).join("\n") || "<p>None yet.</p>"}</div>
    </div>`
  });
}

function bookPancakes(book, pancakes) {
  if (book.slugs) {
    return book.slugs.map((slug) => pancakes.find((pancake) => pancake.slug === slug)).filter(Boolean);
  }
  return pancakes.filter(book.match);
}

function checkboxGroup(name, list) {
  return `<div class="checks">${list.map(([value, label]) => `<label><input type="checkbox" name="${name}" value="${escapeHtml(value)}"> ${escapeHtml(label)}</label>`).join("")}</div>`;
}

resetGenerated();
validate(SAUCES);
const photoManifest = JSON.parse(fs.readFileSync(path.join(root, "data/photos.json"), "utf8"));

function photoRecord(slug) {
  const assignment = photoManifest.assignments[slug];
  if (!assignment) throw new Error(`No photo assignment for ${slug}`);
  const photo = photoManifest.photos[assignment.photoId];
  if (!photo?.versions?.["1200"]) throw new Error(`Missing photo file for ${slug}`);
  return { ...assignment, photo };
}

function creditHtml(photo) {
  const license = photo.licenseUrl
    ? `<a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>`
    : escapeHtml(photo.license);
  return `${escapeHtml(photo.artist)} · ${license} · <a href="${escapeHtml(photo.page)}">Wikimedia Commons</a>`;
}

function figureHtml(record, { eager = false, className = "photo-figure", sizes = "(max-width: 720px) 100vw, 800px" } = {}) {
  const photo = record.photo;
  const small = photo.versions["480"];
  const medium = photo.versions["800"];
  const large = photo.versions["1200"];
  const kind = record.kind === "place" ? `<span class="photo-kind">${escapeHtml(record.label)}</span> ` : "";
  const priority = eager ? ' fetchpriority="high"' : "";
  return `<figure class="${className}${record.kind === "place" ? " is-place" : " is-dish"}">
    <picture>
      <source type="image/webp" srcset="${small.src} 480w, ${medium.src} 800w, ${large.src} 1200w" sizes="${escapeHtml(sizes)}">
      <img src="${medium.src}" alt="${escapeHtml(record.alt)}" width="${medium.width}" height="${medium.height}" loading="${eager ? "eager" : "lazy"}" decoding="async"${priority}>
    </picture>
    <figcaption>${kind}${escapeHtml(photo.title)} · ${creditHtml(photo)}</figcaption>
  </figure>`;
}

function leadOf(list) {
  return list.find((pancake) => pancake.photoRecord.kind === "dish") || list[0];
}

const pancakes = SAUCES.map((pancake) => {
  const record = photoRecord(pancake.slug);
  return {
    ...pancake,
    photoRecord: record,
    photo: record.photo.versions["1200"].src
  };
});
pancakes.sort((a, b) => a.name.localeCompare(b.name));
const count = pancakes.length;
const bySlug = new Map(pancakes.map((pancake) => [pancake.slug, pancake]));

function stopNav(pancake) {
  const journey = JOURNEYS.find((item) => item.stops.includes(pancake.slug));
  let next = null;
  if (journey) {
    const stops = journey.stops.map((slug) => bySlug.get(slug)).filter(Boolean);
    const index = stops.findIndex((item) => item.slug === pancake.slug);
    if (index !== -1 && stops.length > 1) next = stops[(index + 1) % stops.length];
  }
  if (!next) {
    const peers = pancakes.filter((item) => item.region === pancake.region);
    const index = peers.findIndex((item) => item.slug === pancake.slug);
    if (index !== -1 && peers.length > 1) next = peers[(index + 1) % peers.length];
  }
  const vehicle = journey?.vehicle || pancake.arriveBy || "plane";
  return { next, journey: next && journey ? journey : null, vehicle, vehicleLabel: VEHICLES[vehicle] || "Plane" };
}

write("assets/images/hero.svg", heroSvg());
write("favicon.svg", faviconSvg());

const countryName = new Map(Object.entries(COUNTRY_NAMES));
for (const pancake of pancakes) countryName.set(pancake.countryCode, pancake.country);
const countryOptions = `<option value="">All countries</option>` + [...countryName.entries()]
  .filter(([code]) => pancakes.some((pancake) => countriesOf(pancake).includes(code)))
  .sort((a, b) => a[1].localeCompare(b[1]))
  .map(([code, name]) => `<option value="${code}">${escapeHtml(name)}</option>`)
  .join("");

const catalog = pancakes.map((pancake) => ({
  slug: pancake.slug,
  name: pancake.name,
  country: pancake.country,
  countryCode: pancake.countryCode,
  alsoCountries: pancake.alsoCountries || [],
  region: pancake.region,
  baseType: pancake.baseType,
  heat: pancake.heat,
  diets: pancake.diets || [],
  uses: pancake.uses,
  flavor: pancake.flavor,
  search: searchText(pancake)
}));
write("assets/js/catalog.js", `// Generated by scripts/build-site.mjs. Do not edit by hand.\nexport const PANCAKE_COUNT = ${count};\nexport const COUNTRY_NAMES = ${JSON.stringify(Object.fromEntries(countryName))};\nexport const CATALOG = ${JSON.stringify(catalog)};\n`);
write("data/index.json", JSON.stringify({ count, growingTo: 1000, pancakes: catalog }, null, 2));

const homeDesc = `A travel journal of the world's pancakes: ${count} recipes so far, with origins, history, and a route map. Growing to 1,000 pancakes.`;
const settledCard = `<a class="feature feature-passport" href="learn/who-settled-the-flavor/">
        <span class="count">United States</span>
        <p class="eyebrow">Settlers, immigrants, and the griddle</p>
        <h2>Who settled the flavor</h2>
        <p>Dutch buckwheat in the Hudson Valley, Pennsylvania Dutch potato cakes, English and Scots-Irish habits in Appalachia, Southeastern corn cakes, Lowcountry rice, and Scandinavian plates in the Upper Midwest.</p>
      </a>`;
const features = [
  ["South Asia", { title: "Dosas, appams, and cheelas", text: "Fermented rice and lentil batters, gram-flour breakfasts, and the pancakes that go with chutney and sambar." }],
  ["East Asia", { title: "Savory cakes from the street", text: "Jianbing, scallion pancakes, okonomiyaki, and jeon, each tied to a city and a batter." }],
  ["Western Europe", { title: "Crepes, oatcakes, and the griddle", text: "Brittany, the British Isles, and the thin pancakes that use up eggs and fat before Lent." }]
].map(([region, copy]) => feature(region, copy, pancakes)).join("\n");

const spotlightSlugs = ["masala-dosa", "injera", "osaka-okonomiyaki", "galette-complete", "poffertjes", "pupusas", "dutch-baby"];
const spotlight = spotlightSlugs.map((slug) => pancakes.find((pancake) => pancake.slug === slug)).filter((pancake) => pancake && pancake.photoRecord.kind === "dish");
const heroPancake = spotlight[0] || leadOf(pancakes);

write("index.html", page({
  title: "Flying Pancakes of the World",
  description: homeDesc,
  current: "home",
  pageName: "home",
  pancakeCount: count,
  canonical: `${ORIGIN}/`,
  extraHead: og("Flying Pancakes of the World", homeDesc, `${ORIGIN}/`, `${ORIGIN}/${heroPancake.photo}`) + `
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Flying Pancakes of the World",
    url: `${ORIGIN}/`,
    description: homeDesc,
    potentialAction: {
      "@type": "SearchAction",
      target: `${ORIGIN}/?q={query}`,
      "query-input": "required name=query"
    }
  })}</script>`,
  main: `<div class="wrap">
      <section class="hero">
        <div>
          <p class="eyebrow">Travel journal · Issue 01</p>
          <h1>Come fly for pancakes.</h1>
          <p class="lede">The invitation is a voyage. Balloon, plane, train, and boat. Each stop is a real pancake: a recipe that works, a history that stays inside what can be checked, and a note on why it tastes the way it does. This issue holds ${count} pancakes. The journal is growing to 1,000.</p>
          <p class="button-row"><a class="button" href="map/">Open the route map</a> <a class="button button-quiet" href="journeys/">Curated journeys</a></p>
        </div>
        <div class="hero-media">
          ${figureHtml(heroPancake.photoRecord, { eager: true, className: "hero-photo", sizes: "(max-width: 900px) 100vw, 46vw" })}
          <p class="meta"><a href="pancakes/${heroPancake.slug}/">${escapeHtml(heroPancake.name)}</a> · ${escapeHtml(heroPancake.country)}</p>
        </div>
      </section>
      ${adSlot("home_after_hero")}
      <h2>From the journal</h2>
      <div class="photo-strip">
        ${spotlight.map((pancake) => `<article>
          <a href="pancakes/${pancake.slug}/">
            <img src="${pancake.photoRecord.photo.versions["480"].src}" alt="${escapeHtml(pancake.photoRecord.alt)}" width="${pancake.photoRecord.photo.versions["480"].width}" height="${pancake.photoRecord.photo.versions["480"].height}" loading="lazy" decoding="async">
            <h2>${escapeHtml(pancake.name)}</h2>
            <p class="meta">${escapeHtml(pancake.country)}</p>
          </a>
          <p class="photo-credit">${pancake.photoRecord.kind === "place" ? `<span class="photo-kind">${escapeHtml(pancake.photoRecord.label)}</span> ` : ""}${creditHtml(pancake.photoRecord.photo)}</p>
        </article>`).join("\n")}
      </div>
      <section class="feature-band" aria-label="Voyage features">
        ${settledCard}
        ${features}
      </section>
      ${adSlot("home_mid")}
      <h2>Browse the journal</h2>
      ${filterForm(countryOptions)}
      <p id="results-count" class="results-count" aria-live="polite">${count} pancakes</p>
      <p id="empty-results" hidden>No pancakes match. Clear a filter and try a country, a heat level, or a single ingredient.</p>
      <div id="pancake-list" class="grid">
        ${pancakes.map(card).join("\n")}
      </div>
    </div>`
}));

write("map/index.html", page({
  title: "Route map · Flying Pancakes",
  description: "A route map of pancake journeys. Each leg is marked with a balloon, plane, train, or boat. Choose a country to list its pancakes.",
  current: "map",
  pageName: "map",
  pancakeCount: count,
  canonical: `${ORIGIN}/map/`,
  extraHead: `<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">` + og("Pancake route map", "Route map of pancake journeys with a vehicle on each leg.", `${ORIGIN}/map/`),
  extraFoot: `<script src="assets/vendor/leaflet/leaflet.js"></script>`,
  main: `<div class="wrap">
      ${adSlot("map_top")}
      <p class="eyebrow">Route map</p>
      <h1>The voyage, leg by leg</h1>
      <p class="lede">Colored lines are curated journeys. A balloon, plane, train, or boat sits on each leg. Countries are shaded by how many journal pancakes name them. The lists under the map work without JavaScript. This is a schematic, not a navigation chart.</p>
      <div id="route-legend" class="route-legend"></div>
      ${filterForm(countryOptions)}
      <p id="map-status" class="results-count" role="status">${count} pancakes for all countries.</p>
      <div id="world-map" role="application" aria-label="Route map of pancake journeys"></div>
      <div id="journey-list" class="section-rule">
        <h2>Journeys</h2>
        ${JOURNEYS.map((journey) => {
          const stops = journey.stops.map((slug) => bySlug.get(slug)).filter(Boolean);
          return `<section><h3>${escapeHtml(journey.title)}</h3><p>${escapeHtml(journey.dek)} By ${escapeHtml(VEHICLES[journey.vehicle] || journey.vehicle)}.</p><ol>${stops.map((stop) => `<li><a href="pancakes/${stop.slug}/">${escapeHtml(stop.name)}</a> · ${escapeHtml(stop.place || stop.country)}</li>`).join("")}</ol><p><a href="journeys/${journey.slug}/">Read the journey</a></p></section>`;
        }).join("\n")}
      </div>
      <div id="country-results" class="section-rule"></div>
    </div>`
}));

const exploreLinks = (items, hrefFor, labelFor) => items.map((item) => {
  const key = Array.isArray(item) ? item[0] : item;
  const label = labelFor(item);
  const n = pancakes.filter((pancake) => hrefFor.count(pancake, key)).length;
  return `<a class="explore-card" href="${hrefFor.href(key)}"><p class="eyebrow">${n} pancakes</p><h2>${escapeHtml(label)}</h2></a>`;
}).join("\n");

write("explore/index.html", page({
  title: "Explore · Flying Pancakes",
  description: "Browse pancakes by region, base type, and use.",
  current: "explore",
  pageName: "explore",
  pancakeCount: count,
  canonical: `${ORIGIN}/explore/`,
  main: `<div class="wrap">
      <p class="eyebrow">Explore</p>
      <h1>Three ways through the shelf</h1>
      <h2>By region</h2>
      <div class="explore-grid">${REGIONS.map(([name]) => {
        const group = pancakes.filter((pancake) => pancake.region === name);
        if (!group.length) return "";
        const lead = leadOf(group);
        const small = lead.photoRecord.photo.versions["480"];
        const kind = lead.photoRecord.kind === "place" ? `<span class="photo-kind">${escapeHtml(lead.photoRecord.label)}</span> ` : "";
        return `<article class="explore-card">
          <a href="explore/region/${slugify(name)}/">
            <img src="${small.src}" alt="${escapeHtml(lead.photoRecord.alt)}" width="${small.width}" height="${small.height}" loading="lazy" decoding="async">
            <p class="eyebrow">${group.length} pancakes</p>
            <h2>${escapeHtml(name)}</h2>
          </a>
          <p class="photo-credit">${kind}${creditHtml(lead.photoRecord.photo)}</p>
        </article>`;
      }).join("\n")}</div>
      <h2>By type</h2>
      <div class="explore-grid">${exploreLinks(BASE_TYPES, {
        href: (key) => `explore/type/${key}/`,
        count: (pancake, key) => pancake.baseType === key
      }, ([, label]) => label)}</div>
      <h2>By use</h2>
      <div class="explore-grid">${exploreLinks(USES, {
        href: (key) => `explore/use/${key}/`,
        count: (pancake, key) => pancake.uses.includes(key)
      }, ([, label]) => label)}</div>
    </div>`
}));

for (const [name] of REGIONS) {
  const group = pancakes.filter((pancake) => pancake.region === name);
  if (!group.length) continue;
  const url = `${ORIGIN}/explore/region/${slugify(name)}/`;
  write(`explore/region/${slugify(name)}/index.html`, explorePage({
    title: name,
    description: `${group.length} pancakes from ${name}.`,
    current: "explore",
    crumbs: url,
    pancakes: group,
    count,
    hero: leadOf(group)
  }));
}
for (const [id, label] of BASE_TYPES) {
  const group = pancakes.filter((pancake) => pancake.baseType === id);
  if (!group.length) continue;
  write(`explore/type/${id}/index.html`, explorePage({
    title: label,
    description: `${group.length} pancakes with the base type ${label}.`,
    current: "explore",
    crumbs: `${ORIGIN}/explore/type/${id}/`,
    pancakes: group,
    count
  }));
}
for (const [id, label] of USES) {
  const group = pancakes.filter((pancake) => pancake.uses.includes(id));
  if (!group.length) continue;
  write(`explore/use/${id}/index.html`, explorePage({
    title: label,
    description: `Pancakes used for ${label.toLowerCase()}.`,
    current: "explore",
    crumbs: `${ORIGIN}/explore/use/${id}/`,
    pancakes: group,
    count
  }));
}

for (const pancake of pancakes) write(`pancakes/${pancake.slug}/index.html`, pancakePage(pancake, count, stopNav(pancake)));

const centroids = loadCentroids();
const builtBooks = BOOKS.map((book) => {
  const members = bookPancakes(book, pancakes);
  const missing = (book.slugs || []).filter((slug) => !pancakes.some((pancake) => pancake.slug === slug));
  if (missing.length) throw new Error(`Book ${book.slug} is missing ${missing.join(", ")}`);
  if (members.length < 3) throw new Error(`Book ${book.slug} has only ${members.length} pancakes`);
  const price = SHOP.prices[book.slug] || SHOP.defaultPrice;
  return { ...book, members, price };
});
if (builtBooks.some((book) => book.slug === "top-100-pancakes" && book.members.length !== 100)) {
  const found = builtBooks.find((book) => book.slug === "top-100-pancakes");
  throw new Error(`Top 100 book has ${found?.members.length || 0} pancakes`);
}

const quote = boxSetQuote(builtBooks.map((book) => book.price), SHOP.boxSetDiscount);
write("assets/images/books/complete-collection.svg", boxSetCoverSvg());
write("assets/js/shop-config.js", `// Generated from data/shop.js. Placeholder prices, not final.\nwindow.FLYING_PANCAKES_SHOP = ${JSON.stringify({
  openingSoon: SHOP.openingSoon,
  pricesAreFinal: SHOP.pricesAreFinal,
  notifyEmail: SHOP.notifyEmail,
  boxSetDiscount: SHOP.boxSetDiscount,
  products: builtBooks.map((book) => ({
    id: book.slug,
    name: book.title,
    pricePlaceholder: book.price,
    page: `books/${book.slug}/`
  })),
  boxSet: {
    id: "complete-collection",
    name: "Complete Collection",
    page: "shop/complete-collection/",
    discount: SHOP.boxSetDiscount
  }
}, null, 2)};\n`);

function buyBox(title, price) {
  return `<aside class="buy-box no-print">
      <p class="status-pill">Coming soon</p>
      <p class="price">${escapeHtml(priceLabel(price, SHOP))}</p>
      <p><a class="button" href="${escapeHtml(notifyHref(SHOP, title))}">Coming soon</a></p>
    </aside>`;
}

function bookRoute(book) {
  if (book.route?.length) {
    return book.route.map((pair, index) => ({
      lat: pair[0],
      lng: pair[1],
      label: book.members[index]?.country || ""
    }));
  }
  return book.members.map((pancake) => {
    if (Number.isFinite(pancake.lat) && Number.isFinite(pancake.lng)) {
      return { lat: pancake.lat, lng: pancake.lng, label: pancake.place || pancake.country };
    }
    const center = centroids[pancake.countryCode];
    if (!center) return null;
    return { lat: center[0], lng: center[1], label: pancake.country };
  }).filter(Boolean);
}

const boxCard = `<a class="book-card box-card" href="shop/complete-collection/">
        <img src="assets/images/books/complete-collection.svg" alt="Cover design for the Complete Collection box set" width="800" height="520">
        <p class="eyebrow">Box set · Save 30%</p>
        <h2>Complete Collection</h2>
        <p>Every field book in this issue. The set price is 30% off the sum of the individual placeholder prices.</p>
        <p class="price">${escapeHtml(priceLabel(quote.total, SHOP))}</p>
      </a>`;

write("books/index.html", page({
  title: "Recipe books · Flying Pancakes",
  description: "Flagship recipe books and field booklets, printable now. Buying the books is coming soon. Prices are placeholders.",
  current: "books",
  pageName: "books",
  pancakeCount: count,
  canonical: `${ORIGIN}/books/`,
  main: `<div class="wrap">
      <p class="eyebrow">Field books</p>
      <h1>Recipe books</h1>
      <p class="lede">Curated books for a later print or download edition, plus the use-based booklets. You can read and print them now. The buy buttons say coming soon, and every price is a placeholder, not an offer.</p>
      <div class="book-list">
        ${boxCard}
        ${builtBooks.map((book) => {
          const lead = leadOf(book.members);
          const small = lead.photoRecord.photo.versions["480"];
          const kind = lead.photoRecord.kind === "place" ? `<span class="photo-kind">${escapeHtml(lead.photoRecord.label)}</span> ` : "";
          return `<article class="book-card">
          <a href="books/${book.slug}/">
            <img src="${small.src}" alt="${escapeHtml(lead.photoRecord.alt)}" width="${small.width}" height="${small.height}" loading="lazy" decoding="async">
            <p class="eyebrow">${book.members.length} pancakes · ${escapeHtml(priceLabel(book.price, SHOP))}</p>
            <h2>${escapeHtml(book.title)}</h2>
            <p>${escapeHtml(book.dek)}</p>
          </a>
          <p class="photo-credit">${kind}${creditHtml(lead.photoRecord.photo)}</p>
        </article>`;
        }).join("\n")}
      </div>
    </div>`
}));

write("shop/index.html", page({
  title: "Shop · Flying Pancakes",
  description: "Coming soon: printable recipe books. Prices are placeholders, not final.",
  current: "shop",
  pageName: "shop",
  pancakeCount: count,
  canonical: `${ORIGIN}/shop/`,
  main: `<div class="wrap">
      <p class="status-pill">Coming soon</p>
      <h1>Shop</h1>
      <p class="lede">The books can be read and printed now. Selling them comes later. Prices below are placeholders, not an offer and not final. Nothing is for sale while this sign is up.</p>
      <div class="book-list">
        ${boxCard}
        ${builtBooks.map((book) => `<a class="book-card" href="books/${book.slug}/"><p class="eyebrow">${escapeHtml(priceLabel(book.price, SHOP))}</p><h2>${escapeHtml(book.title)}</h2><p>${escapeHtml(book.dek)}</p></a>`).join("\n")}
      </div>
    </div>`
}));

write("shop/complete-collection/index.html", page({
  title: "Complete Collection · Flying Pancakes",
  description: "The box set of every Flying Pancakes recipe book. The price is 30% off the sum of the individual placeholder prices.",
  current: "shop",
  pageName: "shop",
  pancakeCount: count,
  canonical: `${ORIGIN}/shop/complete-collection/`,
  main: `<article class="wrap book-hero">
      <img class="cover" src="assets/images/books/complete-collection.svg" alt="Original cover design for the Complete Collection box set" width="800" height="520">
      <div>
        <p class="status-pill">Coming soon</p>
        <h1>Complete Collection</h1>
        <p class="dek">Every recipe book in this issue, in one set. The discount is 30% off the sum of the individual placeholder prices. It is computed from those prices, not typed in as a separate amount.</p>
        <p class="save-flag">Save 30%</p>
        <ul class="price-lines">
          <li>Individual books, added up: ${escapeHtml(priceLabel(quote.sum, SHOP))}</li>
          <li>You save: ${escapeHtml(priceLabel(quote.savings, SHOP))}</li>
          <li>Set price: ${escapeHtml(priceLabel(quote.total, SHOP))}</li>
        </ul>
        ${buyBox("Complete Collection", quote.total)}
        <p class="note">Placeholder prices, not final. No checkout is turned on.</p>
      </div>
      <h2>Books in the set</h2>
      <ol class="contents">
        ${builtBooks.map((book) => `<li><a href="books/${book.slug}/">${escapeHtml(book.title)}</a> · ${escapeHtml(priceLabel(book.price, SHOP))}</li>`).join("")}
      </ol>
    </article>`
}));

for (const book of builtBooks) {
  const url = `${ORIGIN}/books/${book.slug}/`;
  const coverPath = `assets/images/books/${book.slug}.svg`;
  write(coverPath, bookCoverSvg({ title: book.title, eyebrow: "Flying Pancakes", vehicle: book.vehicle || "plane" }));
  const route = bookRoute(book);
  const routePath = `assets/images/books/${book.slug}-route.svg`;
  write(routePath, routeMapSvg(route));
  const continents = [];
  for (const pancake of book.members) {
    const name = continentOf(pancake.region);
    if (name && !continents.includes(name)) continents.push(name);
  }
  const continentLine = book.slug === "top-100-pancakes"
    ? `<p>This reading route crosses ${continents.length} continents: ${escapeHtml(continents.join(", "))}.</p>`
    : "";
  write(`books/${book.slug}/index.html`, page({
    title: `${book.title} · Flying Pancakes`,
    description: book.dek,
    current: "books",
    pageName: "book",
    pancakeCount: count,
    canonical: url,
    extraHead: og(book.title, book.dek, url, `${ORIGIN}/${leadOf(book.members).photo}`),
    main: `<article class="wrap book">
        ${figureHtml(leadOf(book.members).photoRecord, { eager: true, className: "book-lead", sizes: "(max-width: 1100px) 100vw, 1100px" })}
        <div class="book-hero">
          <img class="cover" src="${coverPath}" alt="Original cover design for ${escapeHtml(book.title)}" width="600" height="800">
          <header class="book-cover">
            <p class="eyebrow">Recipe book${book.vehicle ? ` · ${escapeHtml(book.vehicle)}` : ""}</p>
            <h1>${escapeHtml(book.title)}</h1>
            <p class="dek">${escapeHtml(book.dek)}</p>
            ${book.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            ${continentLine}
            ${book.selectionNote ? `<aside class="authentic-touch"><h2>How this list was chosen</h2><p>${escapeHtml(book.selectionNote)}</p></aside>` : ""}
            ${buyBox(book.title, book.price)}
            <p class="no-print"><button id="print-book" type="button">Print this book</button></p>
            ${adSlot("book_after_intro")}
          </header>
        </div>
        <h2>Route</h2>
        <figure class="route-map">
          <img src="${routePath}" alt="Schematic route for ${escapeHtml(book.title)}" width="800" height="360">
          <figcaption>A schematic of the route, not a navigation chart.</figcaption>
        </figure>
        <h2>Contents</h2>
        <ol class="contents">
          ${book.members.map((pancake, index) => `<li><a href="pancakes/${pancake.slug}/">${escapeHtml(pancake.name)}</a> · ${escapeHtml(pancake.country)} · <a href="#pancake-${pancake.slug}">recipe ${index + 1}</a></li>`).join("")}
        </ol>
        ${book.members.map((pancake) => `<article class="book-recipe" id="pancake-${pancake.slug}">
          ${figureHtml(pancake.photoRecord, { className: "book-photo", sizes: "(max-width: 800px) 100vw, 800px" })}
          <p class="meta">${escapeHtml(pancake.country)} · ${escapeHtml(labelOf(HEATS, pancake.heat))} · ${escapeHtml(pancake.yieldText)}</p>
          ${recipeBody(pancake, { book: true }).replace("<h2 class=\"pancake-title\"></h2>", `<h2 class="pancake-title">${escapeHtml(pancake.name)}</h2>`)}
          <p class="no-print"><a href="pancakes/${pancake.slug}/">Open the journal page</a></p>
        </article>`).join("\n")}
      </article>`
  }));
}

function loadCentroids() {
  const data = JSON.parse(fs.readFileSync(path.join(root, "assets/maps/countries.geojson"), "utf8"));
  const map = {};
  for (const feature of data.features) {
    const iso = feature.properties.iso;
    let minX = 180;
    let maxX = -180;
    let minY = 90;
    let maxY = -90;
    const walk = (node) => {
      if (typeof node?.[0] === "number") {
        minX = Math.min(minX, node[0]);
        maxX = Math.max(maxX, node[0]);
        minY = Math.min(minY, node[1]);
        maxY = Math.max(maxY, node[1]);
        return;
      }
      if (Array.isArray(node)) node.forEach(walk);
    };
    walk(feature.geometry?.coordinates);
    if (minX <= maxX) map[iso] = [(minY + maxY) / 2, (minX + maxX) / 2];
  }
  return map;
}

write("assets/js/route-data.js", `// Generated by scripts/build-site.mjs. Do not edit by hand.\nexport const ROUTES = ${JSON.stringify(JOURNEYS.map((journey) => ({
  slug: journey.slug,
  title: journey.title,
  vehicle: journey.vehicle,
  dek: journey.dek,
  stops: journey.stops.map((slug) => bySlug.get(slug)).filter(Boolean).map((pancake) => ({
    slug: pancake.slug,
    name: pancake.name,
    lat: pancake.lat,
    lng: pancake.lng,
    country: pancake.country,
    place: pancake.place || pancake.locale || pancake.country
  }))
})))};\n`);

const journeyCards = JOURNEYS.map((journey) => {
  const stops = journey.stops.map((slug) => bySlug.get(slug)).filter(Boolean);
  const lead = leadOf(stops);
  const small = lead.photoRecord.photo.versions["480"];
  const kind = lead.photoRecord.kind === "place" ? `<span class="photo-kind">${escapeHtml(lead.photoRecord.label)}</span> ` : "";
  return `<article class="explore-card">
    <a href="journeys/${journey.slug}/">
      <img src="${small.src}" alt="${escapeHtml(lead.photoRecord.alt)}" width="${small.width}" height="${small.height}" loading="lazy" decoding="async">
      <p class="eyebrow">${escapeHtml(VEHICLES[journey.vehicle] || journey.vehicle)} · ${stops.length} stops</p>
      <h2>${escapeHtml(journey.title)}</h2>
      <p>${escapeHtml(journey.dek)}</p>
    </a>
    <p class="photo-credit">${kind}${creditHtml(lead.photoRecord.photo)}</p>
  </article>`;
}).join("\n");

write("journeys/index.html", page({
  title: "Journeys · Flying Pancakes",
  description: "Curated pancake voyages by balloon, plane, train, and boat.",
  current: "journeys",
  pageName: "static",
  pancakeCount: count,
  canonical: `${ORIGIN}/journeys/`,
  main: `<div class="wrap">
      <p class="eyebrow">Voyages</p>
      <h1>Curated journeys</h1>
      <p class="lede">Each journey is a reading route through pancakes already in the journal. The vehicle is part of the story. The line on the map is a schematic, not a track you can follow with a compass.</p>
      <div class="explore-grid">${journeyCards}</div>
    </div>`
}));

for (const journey of JOURNEYS) {
  const stops = journey.stops.map((slug) => bySlug.get(slug)).filter(Boolean);
  if (stops.length < 3) throw new Error(`Journey ${journey.slug} has only ${stops.length} pancakes`);
  const url = `${ORIGIN}/journeys/${journey.slug}/`;
  write(`journeys/${journey.slug}/index.html`, page({
    title: `${journey.title} · Flying Pancakes`,
    description: journey.dek,
    current: "journeys",
    pageName: "static",
    pancakeCount: count,
    canonical: url,
    extraHead: og(journey.title, journey.dek, url, `${ORIGIN}/${leadOf(stops).photo}`),
    main: `<article class="wrap">
        <p class="eyebrow">${escapeHtml(VEHICLES[journey.vehicle] || journey.vehicle)}</p>
        <h1>${escapeHtml(journey.title)}</h1>
        ${figureHtml(leadOf(stops).photoRecord, { eager: true, className: "journey-hero", sizes: "(max-width: 1100px) 100vw, 1100px" })}
        <p class="dek">${escapeHtml(journey.dek)}</p>
        ${journey.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        <p><a href="map/#journey-${journey.slug}">See this route on the map</a></p>
        <ol class="journey-stops">
          ${stops.map((pancake, index) => `<li>
            ${figureHtml(pancake.photoRecord, { className: "photo-figure", sizes: "(max-width: 720px) 100vw, 720px" })}
            <p><a href="pancakes/${pancake.slug}/">${escapeHtml(pancake.name)}</a> · Arriving in ${escapeHtml(pancake.place || pancake.country)} · stop ${index + 1} of ${stops.length}</p>
          </li>`).join("")}
        </ol>
      </article>`
  }));
}

write("learn/pancake-101/index.html", page({
  title: "Pancake 101 · Flying Pancakes",
  description: "Batters, fermentation, griddles, and the words that get mixed up: pancake, crepe, flapjack, and johnny cake.",
  current: "learn",
  pageName: "static",
  pancakeCount: count,
  canonical: `${ORIGIN}/learn/pancake-101/`,
  main: `<article class="wrap prose">
      <p class="eyebrow">School</p>
      <h1>Pancake 101</h1>
      <p class="lede">A short course in the batters behind the journal: wheat and buttermilk, crepes, fermented cakes, and the griddle.</p>
      ${PANCAKE_101.map((section) => `<section><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`).join("\n")}
      <p><a href="learn/glossary/">Read the glossary</a> · <a href="learn/who-settled-the-flavor/">Who settled the flavor</a></p>
    </article>`
}));

write("learn/who-settled-the-flavor/index.html", page({
  title: "Who settled the flavor · Flying Pancakes",
  description: "How settlers and immigrants shaped regional pancakes in the United States, told through specific cakes and the people who cooked them.",
  current: "learn",
  pageName: "static",
  pancakeCount: count,
  canonical: `${ORIGIN}/learn/who-settled-the-flavor/`,
  main: `<article class="wrap prose">
      <p class="eyebrow">United States</p>
      <h1>Who settled the flavor</h1>
      ${WHO_SETTLED.map((paragraph) => `<p>${paragraph}</p>`).join("\n")}
    </article>`
}));

write("learn/glossary/index.html", page({
  title: "Glossary · Flying Pancakes",
  description: "A glossary of pancake words: crepe, dosa, injera, hoecake, flapjack, and the names that change by country.",
  current: "learn",
  pageName: "static",
  pancakeCount: count,
  canonical: `${ORIGIN}/learn/glossary/`,
  main: `<article class="wrap prose">
      <p class="eyebrow">School</p>
      <h1>Glossary</h1>
      <dl class="glossary">
        ${GLOSSARY.map(([term, definition]) => `<dt id="${slugify(term)}">${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("\n")}
      </dl>
    </article>`
}));

function prosePage({ file, canonical, title, description, current, paragraphs, robots = "" }) {
  write(file, page({
    title: `${title} · Flying Pancakes`,
    description,
    current,
    pageName: "static",
    pancakeCount: count,
    robots,
    canonical: `${ORIGIN}/${canonical}`,
    main: `<article class="wrap prose"><h1>${escapeHtml(title)}</h1>${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</article>`
  }));
}

prosePage({
  file: "about/index.html",
  canonical: "about/",
  title: "About",
  description: "What Flying Pancakes of the World is, and how the recipes and histories were chosen.",
  current: "about",
  paragraphs: [
    `Flying Pancakes of the World is a travel journal of pancakes and their griddled relatives. This issue has ${count} pancakes. The public goal is 1,000. The count on the site is the number of edited entries, and it will change when new entries are added.`,
    "Each stop has a home recipe, a place on the route, a cultural note, a short history, a note on why it tastes this way, an authentic touch, and one to three field notes. If a popular origin story is disputed, the page says so or leaves it out.",
    "Photographs are real pictures downloaded from Wikimedia Commons under CC0, CC BY, CC BY-SA, or public domain. Each one carries the photographer and the license. A photograph is used as the dish only when it shows that pancake. When it does not, the page shows a landscape of the place and says so. Book covers and route lines are drawings made for this site. The route map uses Natural Earth country shapes and Leaflet, with no paid map key. Full credits are on the <a href=\"credits/\">photo credits</a> page. It is a sister site to Flying Sauces of the World.",
    "The community tools follow the same pattern as the related project <a href=\"https://jonldavis-coder.github.io/granny-recipes/\">Granny Recipes</a>: comments, hearts, star ratings, and reader submissions. Twists are extra here. Until Supabase is connected, a banner says that those notes stay in the browser.",
    "The site is published by jonldavis-coder and hosted on GitHub Pages from the main branch."
  ]
});

prosePage({
  file: "guidelines/index.html",
  canonical: "guidelines/",
  title: "Community guidelines",
  description: "Rules for comments, twists, and submitted pancakes.",
  current: "about",
  paragraphs: [
    "Be specific and decent. Comment on the pancake, not on a person.",
    "A twist is your change to a published recipe. Say what you changed. Do not present a twist as the classic.",
    "Do not submit a copied paywalled recipe, a fabricated history, or instructions for making someone sick.",
    "Do not post home canning times or raw bitter-cassava processing. Cassava recipes on this site use commercial cassava flour or a packaged product.",
    "The owner can hide comments, twists, and submitted pancakes. Reports are for spam, harassment, dangerous instructions, and recipes that are simply wrong."
  ]
});

prosePage({
  file: "affiliate/index.html",
  canonical: "affiliate/",
  title: "Affiliate disclosure",
  description: "How affiliate links and ads would be labeled if they are added.",
  current: "about",
  paragraphs: [
    "This draft explains the policy. It is not a legal contract.",
    "Flying Pancakes does not currently run advertisements. The ads configuration is set to provider “none”, and the empty slots are hidden. They are omitted from print views even if a provider is turned on later.",
    "There are no affiliate links in this issue. If a link later earns a commission, the page that carries it will say so near the link. A commission would not change the recipe or the history.",
    "Product names appear only to identify a well-known commercial example of a style. Naming a product is not an endorsement and not an offer to sell it."
  ]
});

prosePage({
  file: "privacy/index.html",
  canonical: "privacy/",
  title: "Privacy",
  description: "Draft privacy notes for Flying Pancakes.",
  current: "about",
  paragraphs: [
    "This is a draft, not a lawyer’s privacy policy.",
    "The journal itself is static files on GitHub Pages. In demo mode, accounts, comments, hearts, ratings, twists, and submitted pancakes are stored in your browser’s localStorage. They are not sent to a server. Anyone with access to that browser profile can read them.",
    "If Supabase is connected later, account email, display name, comments, ratings, hearts, twists, reports, and submitted pancakes are stored in that project. The anon key is public. Row level security is what limits access. The service-role key is never placed in this repository.",
    "The ads provider is none, and this repository does not include an analytics tracker. Type on the pages may be requested from Google Fonts, which is a third-party request. The map file and Leaflet are served from this site.",
    "Do not submit another person’s private information in a comment or a pancake."
  ]
});

prosePage({
  file: "terms/index.html",
  canonical: "terms/",
  title: "Terms",
  description: "Draft terms for using Flying Pancakes.",
  current: "about",
  paragraphs: [
    "This is a draft for readers, not legal advice and not a complete contract.",
    "Recipes are home cooking notes. You are responsible for allergens, doneness, and storage. The diet tags match the written recipe and are not a medical diet.",
    "You keep your own words when you comment, add a twist, or submit a pancake. You give the site permission to display them on the field guide. Do not post what you do not have the right to post.",
    "The owner may remove community posts. The edited field guide can be corrected when a history or a recipe is wrong.",
    "The site is offered as-is. Counts, maps, and pages can change as the guide grows toward 1,000 pancakes."
  ]
});

write("404.html", page({
  title: "Page not found · Flying Pancakes",
  description: "That page is not in the field guide.",
  current: "",
  pageName: "static",
  robots: "noindex",
  pancakeCount: count,
  main: `<div class="wrap prose"><h1>That page is not on the map</h1><p>The link may be mistyped, or the pancake may not be in this issue yet.</p><p><a class="button" href="index.html">Back to the journal</a></p></div>`
}));

write("login.html", page({
  title: "Sign in · Flying Pancakes",
  description: "Sign in to rate, comment, heart, and submit a pancake.",
  current: "",
  pageName: "auth",
  robots: "noindex",
  pancakeCount: count,
  main: `<div class="wrap prose">
      <h1>Sign in</h1>
      <p id="auth-status" role="status"></p>
      <form id="signin-form" class="form-card" data-auth>
        <h2>Have an account</h2>
        <label for="signin-email">Email</label>
        <input id="signin-email" name="email" type="email" autocomplete="username" required>
        <label for="signin-password">Password</label>
        <input id="signin-password" name="password" type="password" autocomplete="current-password" required>
        <p class="visually-hidden"><label>Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label></p>
        <p class="form-error" role="alert"></p>
        <button type="submit">Sign in</button>
      </form>
      <form id="signup-form" class="form-card" data-auth>
        <h2>Create an account</h2>
        <label for="display-name">Display name</label>
        <input id="display-name" name="displayName" maxlength="40" required>
        <label for="signup-email">Email</label>
        <input id="signup-email" name="email" type="email" autocomplete="username" required>
        <label for="signup-password">Password</label>
        <input id="signup-password" name="password" type="password" autocomplete="new-password" required>
        <p class="visually-hidden"><label>Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label></p>
        <p class="form-error" role="alert"></p>
        <button type="submit">Create account</button>
      </form>
      <form id="magic-form" class="form-card" data-auth>
        <h2>Email a one-time link</h2>
        <label for="magic-email">Email</label>
        <input id="magic-email" name="email" type="email" autocomplete="username" required>
        <p class="visually-hidden"><label>Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label></p>
        <p class="form-error" role="alert"></p>
        <button type="submit">Send a link</button>
      </form>
    </div>`
}));

write("moderate.html", page({
  title: "Moderate · Flying Pancakes",
  description: "Owner tools for hiding community posts.",
  current: "",
  pageName: "moderate",
  robots: "noindex",
  pancakeCount: count,
  main: `<div class="wrap prose"><h1>Moderation desk</h1><div id="moderate-root"></div></div>`
}));

write("submit.html", page({
  title: "Submit a pancake · Flying Pancakes",
  description: "Submit a pancake that is not already in the field guide.",
  current: "submit",
  pageName: "submit",
  pancakeCount: count,
  canonical: `${ORIGIN}/submit.html`,
  main: `<div class="wrap">
      <h1>Submit a pancake</h1>
      <p class="lede">Use this for a real pancake that is missing from the guide. For a change to a published recipe, add a twist on that pancake’s page.</p>
      <p id="submit-auth-note" class="note" hidden></p>
      <form id="submit-form" class="form-card">
        <label for="name">Name</label>
        <input id="name" name="name" required maxlength="120">
        <label for="country">Country</label>
        <input id="country" name="country" required maxlength="60">
        <label for="region">Region</label>
        <select id="region" name="region" required>${selectOptions(REGIONS.map(([name]) => [name, name]), "Choose a region")}</select>
        <label for="baseType">Base type</label>
        <select id="baseType" name="baseType" required>${selectOptions(BASE_TYPES, "Choose a type")}</select>
        <label for="heat">Heat</label>
        <select id="heat" name="heat" required>${selectOptions(HEATS, "Choose a heat")}</select>
        <label for="flavor">Flavor, in one line</label>
        <input id="flavor" name="flavor" required maxlength="400">
        <label for="story">Origin note</label>
        <textarea id="story" name="story" required maxlength="2000" rows="5"></textarea>
        <label for="funFact">One field note</label>
        <input id="funFact" name="funFact" required maxlength="400">
        <label for="yieldText">Yield</label>
        <input id="yieldText" name="yieldText" required maxlength="80" placeholder="about 1 cup">
        <label for="servings">Servings</label>
        <input id="servings" name="servings" type="number" min="1" max="100" required>
        <label for="prepMinutes">Prep minutes</label>
        <input id="prepMinutes" name="prepMinutes" type="number" min="0" max="1440" required>
        <label for="cookMinutes">Cook minutes</label>
        <input id="cookMinutes" name="cookMinutes" type="number" min="0" max="1440" required>
        <fieldset><legend>Uses</legend>${checkboxGroup("uses", USES)}</fieldset>
        <fieldset><legend>Diet, if the recipe matches</legend>${checkboxGroup("diets", DIETS)}</fieldset>
        <label for="ingredients">Ingredients, one per line</label>
        <textarea id="ingredients" name="ingredients" required rows="8"></textarea>
        <label for="steps">Steps, one per line</label>
        <textarea id="steps" name="steps" required rows="8"></textarea>
        <label for="photo">Optional picture, illustration or food only</label>
        <input id="photo" name="photo" type="file" accept="image/*">
        <p class="visually-hidden"><label>Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label></p>
        <p class="form-error" role="alert"></p>
        <button type="submit">Submit pancake</button>
      </form>
    </div>`
}));

write("pancake.html", page({
  title: "Community pancake · Flying Pancakes",
  description: "A pancake submitted by a reader.",
  current: "home",
  pageName: "dynamic",
  robots: "noindex",
  pancakeCount: count,
  main: `<div class="wrap"><article id="pancake-root"></article><noscript><p>This page needs JavaScript to show a pancake saved in the browser.</p></noscript></div>`
}));

const creditGroups = new Map();
for (const pancake of pancakes) {
  const photo = pancake.photoRecord.photo;
  if (!creditGroups.has(photo.id)) creditGroups.set(photo.id, { photo, uses: [] });
  creditGroups.get(photo.id).uses.push(pancake);
}
const creditArticles = [...creditGroups.values()]
  .sort((a, b) => a.photo.title.localeCompare(b.photo.title))
  .map(({ photo, uses }) => {
    const small = photo.versions["480"];
    const dishUses = uses.filter((pancake) => pancake.photoRecord.kind === "dish");
    const placeUses = uses.filter((pancake) => pancake.photoRecord.kind === "place");
    const links = (list) => list.map((pancake) => `<a href="pancakes/${pancake.slug}/">${escapeHtml(pancake.name)}</a>`).join(", ");
    const lines = [];
    if (dishUses.length) lines.push(`<p>Photograph of the dish on ${links(dishUses)}.</p>`);
    if (placeUses.length) lines.push(`<p>Photograph of the place, not the dish, on ${links(placeUses)}.</p>`);
    return `<article>
      <img src="${small.src}" alt="${escapeHtml(photo.title)}" width="${small.width}" height="${small.height}" loading="lazy" decoding="async">
      <div>
        <h2>${escapeHtml(photo.title)}</h2>
        <p class="photo-credit">${creditHtml(photo)}</p>
        ${lines.join("\n")}
      </div>
    </article>`;
  }).join("\n");

write("credits/index.html", page({
  title: "Photo credits · Flying Pancakes",
  description: "Every photograph in this journal, with the photographer, the license, and the pages that use it.",
  current: "about",
  pageName: "static",
  pancakeCount: count,
  canonical: `${ORIGIN}/credits/`,
  extraHead: og("Photo credits", "Photographers and licenses for every picture in Flying Pancakes of the World.", `${ORIGIN}/credits/`),
  main: `<article class="wrap">
      <p class="eyebrow">Wikimedia Commons</p>
      <h1>Photo credits</h1>
      <p class="lede">${photoManifest.dishCount} pancake pages use a photograph of that dish. ${photoManifest.placeCount} use a landscape of the place, labeled as the place. ${photoManifest.uniqueCount} photographs in all. Files are stored with this site. Nothing is hotlinked.</p>
      <p>Licenses are CC0, CC BY, CC BY-SA, or public domain. CC BY and CC BY-SA require credit, which is printed under each picture and again here.</p>
      <div class="credits-list">
        ${creditArticles}
      </div>
    </article>`
}));

const urls = [];
function collect(rel) {
  if (!rel.endsWith(".html")) return;
  if (["404.html", "login.html", "moderate.html", "pancake.html"].includes(rel)) return;
  if (rel === "index.html") urls.push(`${ORIGIN}/`);
  else if (rel.endsWith("/index.html")) urls.push(`${ORIGIN}/${rel.slice(0, -"index.html".length)}`);
  else urls.push(`${ORIGIN}/${rel}`);
}
function walk(dir, prefix = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (["node_modules", "scripts", "test", "supabase", "data", "assets"].includes(entry.name) && prefix === "") continue;
      walk(path.join(dir, entry.name), rel);
    } else if (entry.name.endsWith(".html")) collect(rel);
  }
}
walk(root);
const uniqueUrls = [...new Set(urls)].sort();
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls.map((loc) => `  <url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
write(".nojekyll", "");

console.log(`Built ${count} pancakes, ${builtBooks.length} books, ${uniqueUrls.length} sitemap URLs.`);
