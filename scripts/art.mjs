import fs from "node:fs";
import path from "node:path";

const COLORS = {
  "wheat-batter": "#e2b007",
  crepe: "#f3d48a",
  buckwheat: "#8a6a3b",
  yeasted: "#d4a24e",
  "fermented-batter": "#c4a15a",
  "rice-batter": "#f7f1e4",
  "lentil-batter": "#c9843a",
  cornmeal: "#e0a100",
  masa: "#f0d48a",
  potato: "#e6c98a",
  oat: "#c4a574",
  "egg-cake": "#f0c84a",
  stuffed: "#d9a441",
  fritter: "#c47a2a",
  flatbread: "#e7d3a1",
  "mold-cake": "#e2b007",
  "oven-pancake": "#f2d48b"
};

function hash(text) {
  let value = 0;
  for (const char of text) value = (value * 33 + char.charCodeAt(0)) % 10000;
  return value;
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function vehicleMark(vehicle) {
  if (vehicle === "train") return `<g transform="translate(600 92)"><rect width="70" height="26" rx="4" fill="#f7f1e4"/><circle cx="16" cy="30" r="6" fill="#1c1915"/><circle cx="52" cy="30" r="6" fill="#1c1915"/></g>`;
  if (vehicle === "boat") return `<g transform="translate(600 100)"><path d="M0 20h78l-10 16H10z" fill="#f7f1e4"/><path d="M40 20V0h3l22 20" stroke="#f7f1e4" fill="none" stroke-width="3"/></g>`;
  if (vehicle === "balloon") return `<g transform="translate(630 78)"><ellipse cx="0" cy="0" rx="26" ry="32" fill="#e2b007"/><path d="M-10 30h20l-5 14h-10z" fill="#f7f1e4"/></g>`;
  return `<g transform="translate(610 100)"><path d="M0 18l36-8-16-20 6 22 18 4-22 6 16 20-6-22z" fill="#e2b007"/></g>`;
}

export function pancakeIllustration(pancake) {
  const base = COLORS[pancake.baseType] || "#e2b007";
  const n = hash(pancake.slug || pancake.name || "cake");
  const bubbles = [0, 1, 2, 3, 4, 5].map((i) => {
    const x = 300 + ((n + i * 53) % 200);
    const y = 250 + ((n * (i + 2)) % 36);
    const r = 3 + (i % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffaf2" opacity="0.55"/>`;
  }).join("");
  const stack = pancake.baseType === "crepe" || pancake.baseType === "flatbread" || pancake.baseType === "fermented-batter"
    ? `<ellipse cx="400" cy="300" rx="150" ry="28" fill="${base}"/><ellipse cx="400" cy="286" rx="146" ry="22" fill="#fffaf2" opacity="0.35"/>`
    : `<ellipse cx="400" cy="318" rx="132" ry="28" fill="#c9843a"/>
       <ellipse cx="400" cy="300" rx="132" ry="28" fill="${base}"/>
       <ellipse cx="400" cy="282" rx="128" ry="26" fill="#f0d48a"/>
       <ellipse cx="400" cy="268" rx="120" ry="22" fill="${base}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-labelledby="title">
  <title id="title">Illustration of ${escapeXml(pancake.name)}</title>
  <rect width="800" height="520" fill="#f7f1e4"/>
  <rect x="18" y="18" width="764" height="484" fill="none" stroke="#e2b007" stroke-width="16"/>
  <rect x="42" y="42" width="716" height="436" fill="#1e4d5c"/>
  <path d="M80 430c80-40 140-20 200-60s120-30 180 10 140 20 220-20" fill="none" stroke="#e2b007" stroke-width="3" opacity="0.45"/>
  <ellipse cx="400" cy="340" rx="168" ry="36" fill="#142f38"/>
  ${stack}
  ${bubbles}
  ${vehicleMark(pancake.arriveBy)}
  <circle cx="150" cy="120" r="28" fill="none" stroke="#e2b007" stroke-width="3"/>
  <path d="M150 98v10M150 140v-8M132 120h10M168 120h-8" stroke="#e2b007" stroke-width="2"/>
</svg>`;
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
  <path d="M40 400c120-80 180-40 260-90s160-40 240 10 150 30 220-30" fill="none" stroke="#e2b007" stroke-width="3" opacity="0.7"/>
  <ellipse cx="430" cy="360" rx="70" ry="16" fill="#142f38"/>
  <ellipse cx="430" cy="346" rx="68" ry="16" fill="#e2b007"/>
  <ellipse cx="430" cy="332" rx="64" ry="15" fill="#f0d48a"/>
  <ellipse cx="430" cy="318" rx="60" ry="14" fill="#e2b007"/>
  <g transform="translate(120 150)">
    <ellipse cx="0" cy="0" rx="36" ry="44" fill="#e2b007"/>
    <path d="M-14 40h28l-8 18h-12z" fill="#f7f1e4"/>
  </g>
  <g transform="translate(250 210)">
    <path d="M0 20l40-8-18-22 6 24 20 4-24 6 18 22-6-24z" fill="#f7f1e4"/>
  </g>
  <g transform="translate(560 180)">
    <rect width="78" height="28" rx="4" fill="#f7f1e4"/>
    <circle cx="18" cy="34" r="7" fill="#1c1915"/>
    <circle cx="58" cy="34" r="7" fill="#1c1915"/>
  </g>
  <g transform="translate(620 300)">
    <path d="M0 16h90l-14 18H14z" fill="#f7f1e4"/>
    <path d="M46 16V-8h4l26 24" stroke="#f7f1e4" fill="none" stroke-width="3"/>
  </g>
</svg>`;
}

export function faviconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="#e2b007"/>
  <rect x="6" y="6" width="52" height="52" fill="#1e4d5c"/>
  <ellipse cx="34" cy="40" rx="16" ry="6" fill="#e2b007"/>
  <ellipse cx="34" cy="34" rx="14" ry="5" fill="#f7f1e4"/>
  <path d="M12 18l10-2-6-8 2 9 8 1-9 2 6 8-2-9z" fill="#f7f1e4"/>
</svg>`;
}
