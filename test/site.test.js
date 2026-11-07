import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { PANCAKES } from "../data/pancakes/index.js";
import { continentOf } from "../data/vocabulary.js";
import { matchesPancake } from "../assets/js/lib/filter.js";
import { summarizeRatings } from "../assets/js/lib/ratings.js";
import { createDemoAdapter } from "../assets/js/demo-adapter.js";
import { isSupabaseConfigured } from "../assets/js/adapter.js";
import { boxSetQuote, priceLabel } from "../assets/js/lib/shop.js";
import { FLAGSHIP_BOOKS } from "../data/flagship-books.js";
import { SHOP } from "../data/shop.js";
import { JOURNEYS } from "../data/journeys.js";

const root = path.resolve(import.meta.dirname, "..");

function memoryStorage() {
  let raw = null;
  return {
    load() {
      return raw ? JSON.parse(raw) : null;
    },
    save(next) {
      raw = JSON.stringify(next);
    }
  };
}

test("the journal has at least 250 pancakes and taste notes", () => {
  assert.ok(PANCAKES.length >= 250);
  const slugs = new Set();
  const continents = new Set();
  for (const pancake of PANCAKES) {
    assert.equal(slugs.has(pancake.slug), false);
    slugs.add(pancake.slug);
    assert.ok(pancake.whyItTastes.length >= 80);
    assert.ok(pancake.authenticTouch.length >= 40);
    assert.ok(pancake.funFacts.length >= 1 && pancake.funFacts.length <= 3);
    assert.ok(pancake.ingredients.length >= 3);
    assert.ok(pancake.steps.length >= 3);
    continents.add(continentOf(pancake.region));
    const blob = `${pancake.history} ${pancake.background} ${pancake.whyItTastes}`;
    assert.equal(/national geographic|natgeo/i.test(blob), false);
  }
  for (const name of ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"]) {
    assert.equal(continents.has(name), true);
  }
});

test("the United States route and the requested regions are covered", () => {
  const areas = { south: 0, appalachia: 0, east: 0, north: 0 };
  for (const pancake of PANCAKES) {
    for (const area of pancake.usAreas || []) {
      if (areas[area] != null) areas[area] += 1;
    }
  }
  assert.ok(areas.south >= 8);
  assert.ok(areas.appalachia >= 6);
  assert.ok(areas.east >= 8);
  assert.ok(areas.north >= 8);
  const countries = new Set(PANCAKES.map((pancake) => pancake.countryCode));
  for (const code of ["IE", "GB", "FR", "NL", "SE", "NO", "RU", "IN", "KR", "JP", "CN", "CU", "MX", "ES", "ET", "NG"]) {
    assert.equal(countries.has(code), true, code);
  }
  const africa = new Set(PANCAKES.filter((pancake) => continentOf(pancake.region) === "Africa").map((pancake) => pancake.countryCode));
  assert.ok(africa.size >= 6);
});

test("filters match region, heat, use, and diet", () => {
  const item = {
    region: "Western Europe",
    baseType: "crepe",
    heat: "none",
    uses: ["dessert"],
    diets: ["vegetarian"],
    countries: ["FR"],
    search: "crepe france"
  };
  assert.equal(matchesPancake(item, { query: "france" }), true);
  assert.equal(matchesPancake(item, { region: "Western Europe", use: "dessert" }), true);
  assert.equal(matchesPancake(item, { diet: "vegan" }), false);
});

test("ratings average once", () => {
  assert.deepEqual(summarizeRatings([5, 4]), { ratingAvg: 4.5, ratingCount: 2 });
});

test("demo mode stores a heart, a rating, a comment, and a twist", async () => {
  const demo = createDemoAdapter({}, { storage: memoryStorage() });
  const human = { honeypot: "", openedAt: Date.now() - 5000 };
  await demo.signUp({ email: "cook@example.com", password: "longpassword", displayName: "Cook" }, human);
  const slug = "plain-dosa";
  const rated = await demo.setRating(slug, 5);
  assert.equal(rated.myRating, 5);
  const heart = await demo.setHeart(slug, true);
  assert.equal(heart.heartedByMe, true);
  await demo.addComment(slug, "The ferment should smell sour, not rotten.", human);
  await demo.addTwist(slug, { title: "Extra fenugreek", body: "I add a few more fenugreek seeds to the soak." }, human);
  assert.equal((await demo.listComments(slug)).length, 1);
  assert.equal((await demo.listTwists(slug)).length, 1);
});

test("supabase stays off until both slots are filled", () => {
  assert.equal(isSupabaseConfigured({ SUPABASE_URL: "", SUPABASE_ANON_KEY: "" }), false);
  const config = fs.readFileSync(path.join(root, "config.js"), "utf8");
  assert.match(config, /SUPABASE_URL:\s*""/);
  assert.match(config, /SUPABASE_ANON_KEY:\s*""/);
  const ads = fs.readFileSync(path.join(root, "ads-config.js"), "utf8");
  assert.match(ads, /provider:\s*"none"/);
});

test("the box set is 30 percent off the sum of placeholder book prices", () => {
  assert.equal(SHOP.openingSoon, true);
  assert.equal(SHOP.pricesAreFinal, false);
  assert.equal(SHOP.boxSetDiscount, 0.3);
  const quote = boxSetQuote([10, 10], 0.3);
  assert.equal(quote.sum, 20);
  assert.equal(quote.savings, 6);
  assert.equal(quote.total, 14);
  assert.match(priceLabel("14", SHOP), /Placeholder price/);
  assert.match(priceLabel("14", SHOP), /not final/);
  const top = FLAGSHIP_BOOKS.find((book) => book.slug === "top-100-pancakes");
  assert.equal(top.slugs.length, 100);
  assert.match(top.selectionNote, /not a ranking/i);
  const appalachia = FLAGSHIP_BOOKS.find((book) => book.slug === "appalachian-griddle-cakes");
  for (const slug of ["appalachian-buckwheat-cakes", "sorghum-flapjacks", "appalachian-cornmeal-cakes"]) {
    assert.equal(appalachia.slugs.includes(slug), true);
  }
  assert.ok(JOURNEYS.length >= 5);
});

test("pages, map, books, and taste sections were generated", () => {
  assert.equal(fs.existsSync(path.join(root, ".nojekyll")), true);
  assert.equal(fs.existsSync(path.join(root, "sitemap.xml")), true);
  assert.equal(fs.existsSync(path.join(root, "robots.txt")), true);
  assert.equal(fs.existsSync(path.join(root, "supabase/schema.sql")), true);
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(home, /Growing to 1,000/);
  assert.match(home, /Come fly the griddle/);
  assert.match(home, new RegExp(`${PANCAKES.length} pancakes`));
  const pancake = fs.readFileSync(path.join(root, "pancakes/plain-dosa/index.html"), "utf8");
  assert.match(pancake, /Why it tastes this way/);
  assert.match(pancake, /Authentic touch/);
  assert.match(pancake, /Arriving in/);
  assert.match(pancake, /Next stop/);
  assert.match(pancake, /application\/ld\+json/);
  const book = fs.readFileSync(path.join(root, "books/crepes-of-france/index.html"), "utf8");
  assert.match(book, /Why it tastes this way/);
  const box = fs.readFileSync(path.join(root, "shop/complete-collection/index.html"), "utf8");
  assert.match(box, /Save 30%/);
  assert.match(box, /Coming soon/);
  assert.match(box, /Appalachian Griddle Cakes/);
  const topPage = fs.readFileSync(path.join(root, "books/top-100-pancakes/index.html"), "utf8");
  assert.match(topPage, /not a ranking/i);
  assert.match(topPage, /continents/);
  const map = fs.readFileSync(path.join(root, "map/index.html"), "utf8");
  assert.match(map, /route map/i);
  const settled = fs.readFileSync(path.join(root, "features/who-settled-the-flavor/index.html"), "utf8");
  assert.match(settled, /Who settled the flavor/);
  const css = fs.readFileSync(path.join(root, "assets/css/styles.css"), "utf8");
  assert.match(css, /@media print/);
  assert.match(css, /\.ad-slot/);
});
