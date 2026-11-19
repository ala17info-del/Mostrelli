// Procedural pixel art for the newer Mostrelli: a symmetric body grown from a seed, outlined in
// black, with eyes, mouth and (for evolved forms) an accessory. Same palette letters as sprites.ts.
export type Recipe = {
  seed: number;
  body: string; // main colour letter
  shade: string; // darker colour letter
  light: string; // highlight letter
  shape: "round" | "tall" | "wide" | "drop" | "bean";
  ears?: "points" | "round" | "antenna" | "leaf" | "none";
  feet?: boolean;
  acc?: "crown" | "hat" | "horns" | "bow" | "halo" | "none";
  mouth?: "smile" | "open" | "teeth";
};

function rng(seed: number) {
  let a = seed | 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n = 12 (base form) or 16 (evolved form). Returns rows of palette letters, "." = empty. */
export function makeSprite(rc: Recipe, n: 12 | 16): string[] {
  const r = rng(rc.seed * 31 + n);
  const g: string[][] = Array.from({ length: n }, () => Array(n).fill("."));
  const half = n / 2;
  const top = n === 12 ? 3 : 5, bottom = n - 2;
  const cy = (top + bottom) / 2, ry = (bottom - top) / 2 + 0.3;
  const rxBase = { round: 0.42, tall: 0.32, wide: 0.47, drop: 0.4, bean: 0.38 }[rc.shape] * n;
  // Body: an ellipse with a little seeded wobble, mirrored left-right.
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < half; x++) {
      const dy = (y + 0.5 - cy) / ry;
      let rx = rxBase;
      if (rc.shape === "drop") rx *= 0.55 + 0.45 * Math.min(1, (y - top + 1) / (bottom - top));
      if (rc.shape === "bean") rx *= 1 - 0.18 * Math.sin(((y - top) / (bottom - top)) * Math.PI * 2);
      const dx = (half - (x + 0.5)) / rx;
      const wob = (r() - 0.5) * 0.12;
      if (dx * dx + dy * dy <= 1 + wob) { g[y][x] = rc.body; g[y][n - 1 - x] = rc.body; }
    }
  }
  const at = (y: number, x: number) => (y >= 0 && x >= 0 && y < n && x < n ? g[y][x] : ".");
  const put = (y: number, x: number, c: string) => { if (y >= 0 && x >= 0 && y < n && x < n) g[y][x] = c; };
  const set = (y: number, x: number, c: string) => { if (y >= 0 && x >= 0 && y < n && x < n) { g[y][x] = c; g[y][n - 1 - x] = c; } };
  // Ears / antennae on the top edge.
  let firstRow = g.findIndex((row) => row.some((c) => c !== "."));
  const edgeX = g[firstRow + 1]?.findIndex((c) => c !== ".") ?? 2;
  const ex = Math.max(1, edgeX + (n === 16 ? 1 : 0));
  if (rc.ears === "points") { set(firstRow - 1, ex, rc.body); set(firstRow - 2, ex, rc.body); set(firstRow - 1, ex + 1, rc.body); }
  if (rc.ears === "round") { set(firstRow - 1, ex, rc.body); set(firstRow - 1, ex + 1, rc.body); set(firstRow - 2, ex, rc.body); set(firstRow - 2, ex + 1, rc.body); }
  if (rc.ears === "antenna") { set(firstRow - 1, ex + 1, "k"); set(firstRow - 2, ex + 1, "k"); set(firstRow - 3, ex + 1, rc.light); }
  if (rc.ears === "leaf") { put(firstRow - 1, half - 1, "g"); put(firstRow - 2, half, "g"); put(firstRow - 1, half, "G"); }
  if (rc.feet) { const fy = bottom; set(fy, Math.floor(half / 2), rc.shade); set(fy, Math.floor(half / 2) + 1, rc.shade); }
  // Shading: lower-right of the body darker, a highlight on the upper-left.
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (g[y][x] !== rc.body) continue;
    if (at(y + 1, x) === "." || at(y + 2, x) === ".") g[y][x] = rc.shade;
  }
  const hy = firstRow + 2, hx = edgeX + 1;
  if (at(hy, hx) === rc.body) put(hy, hx, rc.light);
  if (at(hy, hx + 1) === rc.body && n === 16) put(hy, hx + 1, rc.light);
  // Face: eyes at ~45% height, mouth below.
  const eyY = Math.round(top + (bottom - top) * 0.42), eyX = Math.round(half - n * (rc.shape === "tall" ? 0.17 : 0.2));
  set(eyY, eyX, "k"); set(eyY - 1, eyX, "w");
  if (n === 16) { set(eyY, eyX - 1, "k"); set(eyY - 1, eyX - 1, "w"); }
  const my = eyY + (n === 16 ? 3 : 2);
  if (rc.mouth === "open") { put(my, half - 1, "r"); put(my, half, "r"); put(my + 1, half - 1, "k"); put(my + 1, half, "k"); }
  else if (rc.mouth === "teeth") { for (let x = half - 2; x <= half + 1; x++) put(my, x, "w"); put(my + 1, half - 2, "k"); put(my + 1, half + 1, "k"); }
  else { put(my, half - 2, "k"); put(my, half + 1, "k"); put(my + 1, half - 1, "k"); put(my + 1, half, "k"); }
  // Evolved forms wear something.
  firstRow = g.findIndex((row) => row.some((c) => c !== "."));
  if (rc.acc === "crown") { for (let x = half - 3; x <= half + 2; x++) put(firstRow - 1, x, "z"); put(firstRow - 2, half - 3, "z"); put(firstRow - 2, half, "z"); put(firstRow - 2, half + 2, "z"); }
  if (rc.acc === "hat") { for (let x = half - 4; x <= half + 3; x++) put(firstRow - 1, x, "B"); for (let x = half - 2; x <= half + 1; x++) { put(firstRow - 2, x, "B"); put(firstRow - 3, x, "B"); } }
  if (rc.acc === "horns") { set(firstRow - 1, half - 3, "e"); set(firstRow - 2, half - 4, "e"); set(firstRow - 3, half - 4, "e"); }
  if (rc.acc === "bow") { put(firstRow, half - 2, "p"); put(firstRow, half + 1, "p"); put(firstRow - 1, half - 3, "P"); put(firstRow - 1, half + 2, "P"); put(firstRow, half - 1, "r"); put(firstRow, half, "r"); }
  if (rc.acc === "halo") { for (let x = half - 2; x <= half + 1; x++) put(firstRow - 2, x, "y"); }
  // Black outline around everything.
  const out = g.map((row) => [...row]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (g[y][x] !== ".") continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dy, dx]) => { const c = at(y + dy, x + dx); return c !== "." && c !== "k"; })) out[y][x] = "k";
  }
  return out.map((row) => row.join(""));
}
