function vehiclePath(vehicle) {
  if (vehicle === "train") return `<rect x="70" y="250" width="70" height="28" rx="4" fill="#f7f1e4"/><circle cx="86" cy="282" r="6" fill="#1c1915"/><circle cx="124" cy="282" r="6" fill="#1c1915"/>`;
  if (vehicle === "boat") return `<path d="M60 270h90l-12 18h-66z" fill="#f7f1e4"/><path d="M104 270v-28h4l24 28" stroke="#f7f1e4" fill="none" stroke-width="3"/>`;
  if (vehicle === "balloon") return `<ellipse cx="110" cy="250" rx="28" ry="34" fill="#e2b007"/><path d="M98 284h24l-6 16h-12z" fill="#f7f1e4"/>`;
  return `<path d="M70 268l36-8-16-20 6 22 18 4-22 6 16 20-6-22z" fill="#e2b007"/>`;
}

export function bookCoverSvg({ title, eyebrow, vehicle = "plane" }) {
  const lines = wrap(title, 22).slice(0, 4);
  const text = lines.map((line, i) => `<text x="48" y="${210 + i * 42}" fill="#f7f1e4" font-family="Georgia, serif" font-size="34">${escapeXml(line)}</text>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="#1e4d5c"/>
  <rect x="18" y="18" width="564" height="764" fill="none" stroke="#e2b007" stroke-width="16"/>
  <text x="48" y="90" fill="#e2b007" font-family="Georgia, serif" font-size="18" letter-spacing="3">${escapeXml(eyebrow || "FLYING PANCAKES")}</text>
  ${text}
  ${vehiclePath(vehicle).replaceAll("70", "430").replaceAll("60", "420").replaceAll("110", "470").replaceAll("104", "464").replaceAll("98", "458")}
  <text x="48" y="720" fill="#f7f1e4" font-family="Georgia, serif" font-size="16">Field book · Not a ranking</text>
</svg>`;
}

export function boxSetCoverSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
  <rect width="800" height="520" fill="#1e4d5c"/>
  <rect x="16" y="16" width="768" height="488" fill="none" stroke="#e2b007" stroke-width="14"/>
  <rect x="90" y="150" width="170" height="240" fill="#163844" stroke="#e2b007" stroke-width="6"/>
  <rect x="230" y="120" width="170" height="270" fill="#8c2f1e" stroke="#e2b007" stroke-width="6"/>
  <rect x="370" y="90" width="190" height="300" fill="#f7f1e4" stroke="#e2b007" stroke-width="6"/>
  <text x="90" y="450" fill="#f7f1e4" font-family="Georgia, serif" font-size="28">Complete Collection</text>
  <text x="90" y="482" fill="#e2b007" font-family="Georgia, serif" font-size="16">Save 30% · Coming soon</text>
</svg>`;
}

export function routeMapSvg(points) {
  const width = 800;
  const height = 360;
  const pad = 36;
  const projected = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (projected.length < 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 120"><rect width="800" height="120" fill="#f7f1e4"/><text x="24" y="68" font-family="Georgia, serif" font-size="18">The stops are listed in the contents.</text></svg>`;
  }
  const xy = projected.map((p) => ({
    x: pad + ((p.lng + 180) / 360) * (width - pad * 2),
    y: pad + ((90 - p.lat) / 180) * (height - pad * 2),
    label: p.label || ""
  }));
  const d = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const dots = xy.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#8c2f1e"/>`).join("");
  const labels = xy.filter((_, i) => i === 0 || i === xy.length - 1 || i % Math.ceil(xy.length / 6) === 0)
    .map((p) => `<text x="${(p.x + 8).toFixed(1)}" y="${(p.y - 8).toFixed(1)}" font-family="Georgia, serif" font-size="12">${escapeXml(p.label)}</text>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f4efe4"/>
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="#e2b007" stroke-width="6"/>
  <path d="${d}" fill="none" stroke="#1e4d5c" stroke-width="3" stroke-dasharray="7 6"/>
  ${dots}
  ${labels}
</svg>`;
}

function wrap(text, size) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > size && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
