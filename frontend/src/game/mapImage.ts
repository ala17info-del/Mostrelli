// Web only: draws a whole map into ONE image (canvas -> PNG data URL).
// On the web every tile is otherwise a pile of <div>s (thousands per map), which is what makes
// Safari slow. Here the same TileArt drawing code is "played back" onto a canvas: each <View> with a
// background becomes a filled rectangle. One image per map and animation frame, cached.
import React from "react";
import { View } from "react-native";

import type { GameMap } from "./data";
import { neighbours, TileArtBase } from "./TileArt";

type Rect = { l: number; t: number; w: number; h: number; c: string; r: number | [number, number, number, number] };
const TALL = new Set(["T", "R", "H", "B", "D", "N", "K", "M", "I", "=", "%", "&", "^", "!"]);

function flat(style: any): any {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style;
}

// Walks a React element tree made only of function components, fragments and <View>s.
function collect(node: React.ReactNode, ox: number, oy: number, out: Rect[]) {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") return;
  if (Array.isArray(node)) return node.forEach((n) => collect(n, ox, oy, out));
  const el = node as React.ReactElement<any>;
  let type: any = el.type;
  if (type === React.Fragment) return collect(el.props.children, ox, oy, out);
  if (type && type.$$typeof === Symbol.for("react.memo")) type = type.type;
  if (type !== View && typeof type === "function" && !(type.prototype && type.prototype.isReactComponent)) {
    return collect(type(el.props), ox, oy, out);
  }
  // A host <View>: its style gives position, size and colour.
  const st = flat(el.props?.style);
  const l = ox + (st.position === "absolute" ? st.left ?? 0 : 0);
  const t = oy + (st.position === "absolute" ? st.top ?? 0 : 0);
  if (st.backgroundColor && st.width != null && st.height != null) {
    const per = st.borderTopLeftRadius != null || st.borderTopRightRadius != null || st.borderBottomRightRadius != null || st.borderBottomLeftRadius != null;
    out.push({ l, t, w: st.width, h: st.height, c: st.backgroundColor, r: per ? [st.borderTopLeftRadius ?? 0, st.borderTopRightRadius ?? 0, st.borderBottomRightRadius ?? 0, st.borderBottomLeftRadius ?? 0] : st.borderRadius ?? 0 });
  }
  collect(el.props?.children, l, t, out);
}

/** Rectangles that make up one tile, in map pixels. */
export function tileRects(map: GameMap, size: number, phase: 0 | 1, x: number, y: number): Rect[] {
  const ch = map.tiles[y][x];
  const shadow = !TALL.has(ch) && TALL.has(map.tiles[y - 1]?.[x] ?? "");
  const rects: Rect[] = [];
  collect(TileArtBase({ ch, size, x, y, phase, shadow, nb: neighbours(map.tiles, x, y) }), x * size, y * size, rects);
  return rects;
}

const cache = new Map<string, string>();

export function mapImage(map: GameMap, size: number, phase: 0 | 1): string | null {
  if (typeof document === "undefined") return null;
  const key = `${map.id}:${size}:${phase}:${map.tiles.join("")}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const dpr = Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const W = map.tiles[0].length, H = map.tiles.length;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * size * dpr);
  canvas.height = Math.round(H * size * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const rects = tileRects(map, size, phase, x, y);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x * size, y * size, size, size); // tiles clip their content (overflow: hidden)
      ctx.clip();
      for (const r of rects) {
        ctx.fillStyle = r.c;
        const lim = (v: number) => Math.max(0, Math.min(v, r.w / 2, r.h / 2));
        const rr = Array.isArray(r.r) ? r.r.map(lim) : lim(r.r);
        if ((Array.isArray(rr) ? rr.some((v) => v > 0) : rr > 0) && (ctx as any).roundRect) {
          ctx.beginPath();
          (ctx as any).roundRect(r.l, r.t, r.w, r.h, rr);
          ctx.fill();
        } else ctx.fillRect(r.l, r.t, r.w, r.h);
      }
      ctx.restore();
    }
  }
  const url = canvas.toDataURL("image/png");
  if (cache.size > 24) cache.delete(cache.keys().next().value as string);
  cache.set(key, url);
  return url;
}
