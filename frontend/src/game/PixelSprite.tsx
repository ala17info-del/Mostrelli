import React, { memo } from "react";
import { Image, Platform, View } from "react-native";

import { SPECIES_LIST } from "./data";
import { PAL, SPRITES } from "./sprites";
import { SPECIES } from "./data";
import { vivid } from "@/src/theme";

const EVOLVED = new Set(SPECIES_LIST.map((s) => s.evo?.to).filter(Boolean) as string[]);
// Evolved forms are drawn a bit bigger in battle.
export const battleSize = (s: string, base: number) => (EVOLVED.has(s) ? Math.round(base * 1.2) : base);

type Props = {
  name: string;
  size: number;
  look?: Record<string, string>;
  silhouette?: boolean;
  flip?: boolean;
  testID?: string;
  /** Cromatico: same drawing, colours rotated around the colour wheel. */
  shiny?: boolean;
};

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(f > 1 ? c + (255 - c) * (f - 1) : c * f));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const isEdge = (c: string | undefined) => !c || c === "." || c === "k";

// Auto-shading: highlight on top edges, shadow on bottom/right edges for volume.
function hueShift(hex: string, deg: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  // Rotate in YIQ-like space: keeps brightness, changes the hue.
  const m = [
    0.299 + 0.701 * c + 0.168 * s, 0.587 - 0.587 * c + 0.33 * s, 0.114 - 0.114 * c - 0.497 * s,
    0.299 - 0.299 * c - 0.328 * s, 0.587 + 0.413 * c + 0.035 * s, 0.114 - 0.114 * c + 0.292 * s,
    0.299 - 0.3 * c + 1.25 * s, 0.587 - 0.588 * c - 1.05 * s, 0.114 + 0.886 * c - 0.203 * s,
  ];
  const out = [m[0] * r + m[1] * g + m[2] * b, m[3] * r + m[4] * g + m[5] * b, m[6] * r + m[7] * g + m[8] * b];
  return "#" + out.map((v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, "0")).join("");
}

// ---- Nicer Mostrelli: volume, coloured outline and a highlight (only creatures, not people).
const BOX = new WeakMap<string[], { x0: number; y0: number; x1: number; y1: number }>();
function boxOf(grid: string[]) {
  let b = BOX.get(grid);
  if (!b) {
    let x0 = 99, y0 = 99, x1 = 0, y1 = 0;
    grid.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } }));
    b = { x0, y0, x1, y1 };
    BOX.set(grid, b);
  }
  return b;
}
function mix(hex: string, f: number) {
  // f > 1 towards white, f < 1 towards black
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f));
  return "#" + ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}
function creatureColor(grid: string[], ri: number, ci: number, look: Record<string, string> | undefined, shiny?: boolean) {
  const base = pixelColor(grid, ri, ci, look, false, shiny);
  if (!base || base === "transparent" || base[0] !== "#") return base;
  const ch = grid[ri][ci];
  const at = (y: number, x: number) => grid[y]?.[x] ?? ".";
  const near = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;
  if (ch === "k") {
    // Outline: within two pixels of the silhouette edge it takes a dark version of the nearest body
    // colour (outer ring darker, inner ring a bit lighter) instead of flat black.
    const edge1 = near.some(([dy, dx]) => at(ri + dy, ci + dx) === ".");
    const edge2 = !edge1 && near.some(([dy, dx]) => near.some(([ey, ex]) => at(ri + dy + ey, ci + dx + ex) === "."));
    if (!edge1 && !edge2) return base; // eyes, mouth and inner lines stay black
    let found: string | null = null;
    for (let r = 1; r <= 3 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r && !found; dx++) {
        const c = at(ri + dy, ci + dx);
        if (c !== "." && c !== "k" && c !== "w" && c !== "n") { const pc = pixelColor(grid, ri + dy, ci + dx, look, false, shiny); if (pc && pc[0] === "#") found = pc; }
      }
    }
    if (!found) return base;
    return mix(found, edge1 ? 0.3 : 0.52);
  }
  if (ch === "w" || ch === "n") return base; // eyes stay crisp
  const b = boxOf(grid);
  const fx = (ci - b.x0) / Math.max(1, b.x1 - b.x0), fy = (ri - b.y0) / Math.max(1, b.y1 - b.y0);
  let c = mix(base, 1.16 - 0.4 * (0.65 * fy + 0.35 * fx)); // light from the top-left
  // A small highlight near the top-left edge of the body.
  if (fy < 0.34 && fx < 0.5 && (at(ri - 1, ci) === "k" || at(ri - 2, ci) === "k") && at(ri, ci - 1) !== ".") c = mix(c, 1.4);
  return c;
}

function pixelColor(grid: string[], ri: number, ci: number, look: Record<string, string> | undefined, silhouette?: boolean, shiny?: boolean) {
  const ch = grid[ri][ci];
  if (ch === ".") return "transparent";
  if (silhouette) return "#000000";
  const raw0 = look?.[ch] ?? PAL[ch];
  const raw = shiny && raw0 && raw0[0] === "#" && ch !== "k" && ch !== "w" && ch !== "n" ? hueShift(raw0, 150) : raw0;
  const base = raw && raw[0] === "#" ? vivid(raw) : raw;
  if (ch === "k" || !base || base[0] !== "#") return base;
  if (isEdge(grid[ri - 1]?.[ci])) return shade(base, 1.22);
  if (isEdge(grid[ri + 1]?.[ci])) return shade(base, 0.72);
  if (isEdge(grid[ri][ci + 1])) return shade(base, 0.85);
  return base;
}

// Scale2x: doubles resolution with smoothed diagonals -> smaller, more detailed pixels.
function scale2x(g: string[]): string[] {
  const out: string[] = [];
  for (let y = 0; y < g.length; y++) {
    const row = g[y];
    let r1 = "", r2 = "";
    for (let x = 0; x < row.length; x++) {
      const E = row[x];
      const B = g[y - 1]?.[x] ?? E, H = g[y + 1]?.[x] ?? E, D = row[x - 1] ?? E, Fc = row[x + 1] ?? E;
      let e0 = E, e1 = E, e2 = E, e3 = E;
      if (B !== H && D !== Fc) {
        e0 = D === B ? D : E;
        e1 = B === Fc ? Fc : E;
        e2 = D === H ? D : E;
        e3 = H === Fc ? Fc : E;
      }
      r1 += e0 + e1;
      r2 += e2 + e3;
    }
    out.push(r1, r2);
  }
  return out;
}

const scaled = new Map<string, string[]>();
function gridFor(name: string, hi: boolean) {
  const g = SPRITES[name] ?? SPRITES.person;
  if (!hi) return g;
  let s = scaled.get(name);
  if (!s) {
    s = scale2x(g);
    scaled.set(name, s);
  }
  return s;
}

// Web: each sprite becomes one small image (cached) instead of dozens of <div>s.
const WEB = Platform.OS === "web" && typeof document !== "undefined";
const imgCache = new Map<string, string>();
// Every species sprite gets the nicer creature shading (people and objects keep the flat style).
const colorOf = (name: string, grid: string[], y: number, x: number, look: Record<string, string> | undefined, silhouette?: boolean, shiny?: boolean) =>
  !silhouette && SPECIES[name] ? creatureColor(grid, y, x, look, shiny) : pixelColor(grid, y, x, look, silhouette, shiny);

function spriteImage(name: string, hi: boolean, look: Record<string, string> | undefined, silhouette: boolean | undefined, shiny?: boolean) {
  const key = `${name}|${hi ? 2 : 1}|${shiny ? "S" : ""}|${look ? JSON.stringify(look) : ""}|${silhouette ? 1 : 0}`;
  const hit = imgCache.get(key);
  if (hit) return hit;
  const grid = gridFor(name, hi);
  const n = grid.length, w = grid[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < w; x++) {
      const c = colorOf(name, grid, y, x, look, silhouette, shiny);
      if (!c || c === "transparent") continue;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const url = canvas.toDataURL("image/png");
  imgCache.set(key, url);
  return url;
}

// Renders a pixel grid (12x12 or 16x16), merging horizontal runs of equal color into one View.
function PixelSpriteBase({ name, size, look, silhouette, flip, testID, shiny }: Props) {
  if (WEB) {
    const uri = spriteImage(name, size >= 40, look, silhouette, shiny);
    if (uri) {
      return (
        <View testID={testID} style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }}>
          <Image source={{ uri }} style={{ width: size, height: size }} fadeDuration={0} />
        </View>
      );
    }
  }
  const grid = gridFor(name, size >= 40);
  const px = size / grid.length;
  return (
    <View testID={testID} style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }}>
      {grid.map((row, ri) => {
        const runs: { c: string; len: number }[] = [];
        for (let ci = 0; ci < row.length; ci++) {
          const c = colorOf(name, grid, ri, ci, look, silhouette, shiny);
          const last = runs[runs.length - 1];
          if (last && last.c === c) last.len++;
          else runs.push({ c, len: 1 });
        }
        return (
          <View key={ri} style={{ flexDirection: "row", height: px }}>
            {runs.map((r, i) => (
              <View key={i} style={{ width: px * r.len, height: px, backgroundColor: r.c }} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

export const PixelSprite = memo(PixelSpriteBase);

/** Colours of a sprite, pixel by pixel ("transparent" for empty), as the game draws them. */
export function spritePixels(name: string, hi = true, flat = false): string[][] {
  const grid = gridFor(name, hi);
  return grid.map((row, y) => [...row].map((_, x) => (flat ? pixelColor(grid, y, x, undefined) : colorOf(name, grid, y, x, undefined)) ?? "transparent"));
}
