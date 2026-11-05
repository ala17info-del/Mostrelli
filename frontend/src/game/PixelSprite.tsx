import React, { memo } from "react";
import { View } from "react-native";

import { SPECIES_LIST } from "./data";
import { PAL, SPRITES } from "./sprites";

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
};

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(f > 1 ? c + (255 - c) * (f - 1) : c * f));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const isEdge = (c: string | undefined) => !c || c === "." || c === "k";

// Auto-shading: highlight on top edges, shadow on bottom/right edges for volume.
function pixelColor(grid: string[], ri: number, ci: number, look: Record<string, string> | undefined, silhouette?: boolean) {
  const ch = grid[ri][ci];
  if (ch === ".") return "transparent";
  if (silhouette) return "#000000";
  const base = look?.[ch] ?? PAL[ch];
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

// Renders a pixel grid (12x12 or 16x16), merging horizontal runs of equal color into one View.
function PixelSpriteBase({ name, size, look, silhouette, flip, testID }: Props) {
  const grid = gridFor(name, size >= 40);
  const px = size / grid.length;
  return (
    <View testID={testID} style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }}>
      {grid.map((row, ri) => {
        const runs: { c: string; len: number }[] = [];
        for (let ci = 0; ci < row.length; ci++) {
          const c = pixelColor(grid, ri, ci, look, silhouette);
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
