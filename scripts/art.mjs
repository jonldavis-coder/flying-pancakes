import fs from "node:fs";
import path from "node:path";

const COLORS = {
  wheat: "#e6c27a",
  crepe: "#f3e2b0",
  buckwheat: "#8d6a45",
  corn: "#e2b007",
  rice: "#f7f1e4",
  fermented: "#c4a574",
  potato: "#d7b07a",
  vegetable: "#7d9a62",
  oat: "#c4a36a",
  cassava: "#efe6d2",
  chickpea: "#e0c36a",
  filled: "#d9a441",
  oven: "#f0d48a",
  fritter: "#c47a3a",
  cheese: "#f4e7b2",
  egg: "#f6e27a",
  flatbread: "#e7d3a1"
};

function hash(text) {
  let value = 0;
  for (const char of text) value = (value * 33 + char.charCodeAt(0)) % 10000;
  return value;
}

export function pancakeIllustration(pancake) {
  const base = COLORS[pancake.baseType] || "#c4552a";
  const n = hash(pancake.slug);
  const dots = [0, 1, 2, 3, 4].map((i) => {
    const x = 250 + ((n + i * 47) % 180);
    const y = 210 + ((n * (i + 3)) % 70);
    const r = 3 + (i % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#1c1915" opacity="0.18"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-labelledby="title">
  <title id="title">Illustration of ${escapeXml(pancake.name)}</title>
  <rect width="800" height="520" fill="#f7f1e4"/>
  <rect x="18" y="18" width="764" height="484" fill="none" stroke="#e2b007" stroke-width="16"/>
  <rect x="42" y="42" width="716" height="436" fill="#1e4d5c"/>
  <path d="M80 430c80-40 140-20 200-60s120-30 180 10 140 20 220-20" fill="none" stroke="#e2b007" stroke-width="3" opacity="0.45"/>
  <ellipse cx="430" cy="360" rx="170" ry="28" fill="#142f38"/>
  <rect x="250" y="300" width="360" height="28" rx="8" fill="#5c5346"/>
  <ellipse cx="430" cy="300" rx="120" ry="28" fill="#c47a3a"/>
  <ellipse cx="430" cy="278" rx="116" ry="26" fill="${base}"/>
  <ellipse cx="430" cy="258" rx="108" ry="24" fill="#f3e2b0"/>
  <ellipse cx="430" cy="242" rx="100" ry="22" fill="${base}"/>
  ${dots}
  <path d="M150 150l46-8-28-36 8 40 34 6-40 8 28 36-8-40z" fill="#f7f1e4"/>
  <path d="M168 148h70" stroke="#f7f1e4" stroke-width="3"/>
  <circle cx="620" cy="120" r="36" fill="none" stroke="#e2b007" stroke-width="3"/>
  <path d="M620 92v18M620 148v-10M598 120h12M642 120h-10" stroke="#e2b007" stroke-width="2"/>
</svg>`;
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function writeIllustration(root, pancake) {
  const rel = `assets/images/pancakes/${pancake.slug}.svg`;
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pancakeIllustration(pancake));
  return rel;
}

export function heroSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
  <rect width="800" height="520" fill="#1e4d5c"/>
  <rect x="16" y="16" width="768" height="488" fill="none" stroke="#e2b007" stroke-width="14"/>
  <circle cx="390" cy="250" r="120" fill="none" stroke="#f7f1e4" stroke-width="3" opacity="0.7"/>
  <ellipse cx="390" cy="250" rx="120" ry="46" fill="none" stroke="#f7f1e4" stroke-width="2" opacity="0.7"/>
  <path d="M270 250h240M390 130v240" stroke="#f7f1e4" stroke-width="2" opacity="0.45"/>
  <ellipse cx="180" cy="150" rx="36" ry="44" fill="#e2b007"/>
  <path d="M164 190h32l-8 18h-16z" fill="#f7f1e4"/>
  <path d="M250 210c40-10 80 20 130-10 40-24 90-10 140 16" fill="none" stroke="#e2b007" stroke-width="3" stroke-dasharray="8 7"/>
  <ellipse cx="560" cy="360" rx="70" ry="16" fill="#142f38"/>
  <ellipse cx="560" cy="348" rx="54" ry="12" fill="#e6c27a"/>
  <ellipse cx="560" cy="336" rx="48" ry="11" fill="#f3e2b0"/>
</svg>`;
}

export function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="#e2b007"/>
  <rect x="6" y="6" width="52" height="52" fill="#1e4d5c"/>
  <circle cx="32" cy="34" r="12" fill="none" stroke="#f7f1e4" stroke-width="2"/>
  <path d="M14 18l16-3-10-12 3 14 12 2-14 3 10 12-3-14z" fill="#f7f1e4"/>
</svg>`;
}
