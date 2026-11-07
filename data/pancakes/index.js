import { US } from "./us.js";
import { ISLES } from "./isles.js";
import { FRANCE_NL } from "./france-nl.js";
import { SCANDINAVIA } from "./scandinavia.js";
import { EAST_EUROPE } from "./east-europe.js";
import { AFRICA } from "./africa.js";
import { INDIA } from "./india.js";
import { EAST_ASIA } from "./east-asia.js";
import { AMERICAS } from "./americas.js";
import { REST } from "./rest.js";
import { EXTRA_FACTS, FILL } from "./fill.js";

function withFill(list) {
  return list.map((pancake) => {
    const extra = FILL[pancake.slug] || {};
    const funFacts = extra.funFacts || pancake.funFacts || EXTRA_FACTS[pancake.slug];
    return { ...pancake, ...extra, funFacts };
  });
}

export const PANCAKES = withFill([
  ...US,
  ...ISLES,
  ...FRANCE_NL,
  ...SCANDINAVIA,
  ...EAST_EUROPE,
  ...AFRICA,
  ...INDIA,
  ...EAST_ASIA,
  ...AMERICAS,
  ...REST
]);
