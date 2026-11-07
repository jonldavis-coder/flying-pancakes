import { pancake } from "../pancake-shape.js";

export function entry(spec) {
  return pancake({
    slug: spec.slug,
    name: spec.name,
    country: spec.country,
    countryCode: spec.cc,
    region: spec.region,
    locale: spec.locale,
    culture: spec.culture,
    baseType: spec.base,
    heat: spec.heat || "none",
    diets: spec.diets,
    allergens: spec.allergens,
    uses: spec.uses,
    flavor: spec.flavor,
    history: spec.history,
    background: spec.background,
    whyItTastes: spec.why,
    authenticTouch: spec.touch,
    method: spec.method,
    served: spec.served,
    funFacts: spec.facts,
    yieldText: spec.yield,
    servings: spec.servings || 4,
    prepMinutes: spec.prep,
    cookMinutes: spec.cook,
    ingredients: spec.ing,
    steps: spec.steps,
    variations: spec.variations || [],
    pairings: spec.pairings || [],
    pronunciation: spec.say || "",
    alsoCountries: spec.also || [],
    safety: spec.safety || "",
    usAreas: spec.us || [],
    storage: spec.storage
  });
}

export const WHEAT = {
  diets: ["vegetarian", "nut-free"],
  allergens: ["wheat", "egg", "dairy"]
};

export const WHEAT_VEGAN = {
  diets: ["vegetarian", "vegan", "dairy-free", "nut-free"],
  allergens: ["wheat"]
};

export const GF_VEGAN = {
  diets: ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free"],
  allergens: []
};

export const GF_EGG = {
  diets: ["vegetarian", "gluten-free", "dairy-free", "nut-free"],
  allergens: ["egg"]
};

export const GF_DAIRY_EGG = {
  diets: ["vegetarian", "gluten-free", "nut-free"],
  allergens: ["egg", "dairy"]
};

export function griddleSteps(fat, batterNote, serve) {
  return [
    "Stir the dry ingredients together, then stir in the wet ingredients until the batter is combined.",
    batterNote,
    `Heat a griddle or heavy skillet over medium heat and film it with ${fat}.`,
    "Spoon on the batter. Cook until the underside is browned and the top looks set.",
    "Flip once and cook the second side through.",
    serve
  ];
}
