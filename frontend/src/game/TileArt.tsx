import React, { memo } from "react";
import { View, ViewStyle } from "react-native";

import { vivid } from "@/src/theme";

// Richer pixel tiles. Colors are fixed pixel-art content (same in any theme).
const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

type P = { ch: string; size: number; x: number; y: number; phase: number; shadow?: boolean; nb?: string };

// Warmer, more saturated handheld-style palette applied on top of the original tile colours.
const REMAP: Record<string, string> = {
  "#7cb342": "#78c850", "#5f9a2e": "#58a838", "#4e8a26": "#3f8f30", "#3f8f3a": "#38a048", "#17502a": "#1d5c34",
  "#b6dd78": "#c8f088", "#9ccc5a": "#a8e070", "#d7b98a": "#e8c890", "#f0d9a0": "#f8e4a8", "#2a8a8a": "#3098c8",
  "#1d7f99": "#2878c0", "#8fd3d3": "#90d8f0", "#7fd3e6": "#88d0f8", "#b8ecef": "#c8f0ff", "#a83a2a": "#c84830",
  "#8d3b23": "#a04830", "#b5562f": "#c86038", "#ecdcb8": "#f8ecd0", "#4a4a4a": "#505868", "#b8a68e": "#c0b0a0",
};
// Handheld-adventure look (soft pastel greens, round trees, sandy paths, light blue water).
const SOFT: Record<string, string> = {
  "#7cb342": "#8fd4a4", "#4e8a26": "#64b482", "#5f9a2e": "#74c290", "#b6dd78": "#b4ecc4", "#9ccc5a": "#9edcb0",
  "#3f8f3a": "#58b070", "#245e24": "#2f7a48", "#6fbf4a": "#8ad89c", "#2f7a2c": "#3f8f5a",
  "#123d1a": "#1e4a2c", "#1f5e2a": "#3d9840", "#2e8b3a": "#6cc048", "#56b04f": "#a8e070", "#17502a": "#2e7a34", "#3a9a44": "#88d058",
  "#5d3a1a": "#7a4a28", "#5a8f2a": "#5aa070", "#d7b98a": "#e6cc8e",
  "#2a8a8a": "#5aa8e8", "#1d7f99": "#3a88d8", "#8fd3d3": "#a8d8f8", "#7fd3e6": "#98d0f8", "#b8ecef": "#d8f0ff",
};
// "!#rrggbb" = exact colour of the new hand-made tiles (no remapping).
const rc = (c: string) => (c[0] === "!" ? c.slice(1) : SOFT[c] ?? vivid(REMAP[c] ?? c));

function Px({ l, t, w, h, c, r, rad }: { l: number; t: number; w: number; h: number; c: string; r?: number; rad?: [number, number, number, number] }) {
  const st: ViewStyle = { position: "absolute", left: l, top: t, width: w, height: h, backgroundColor: rc(c) };
  if (r) st.borderRadius = r;
  if (rad) { st.borderTopLeftRadius = rad[0]; st.borderTopRightRadius = rad[1]; st.borderBottomRightRadius = rad[2]; st.borderBottomLeftRadius = rad[3]; }
  return <View style={st} />;
}

function Grass({ s, hv }: { s: number; hv: number }) {
  const u = s / 8;
  const f = s / 16;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const v = (hv >> (i * 5)) & 1023;
        return (
          <React.Fragment key={i}>
            <Px l={((v % 13) + 1) * f} t={(((v >> 4) % 12) + 2) * f} w={f} h={f} c="#4e8a26" />
            <Px l={((v % 13) + 2) * f} t={(((v >> 4) % 12) + 1) * f} w={f} h={f} c="#5f9a2e" />
          </React.Fragment>
        );
      })}
      <Px l={((hv >> 13) % 14) * f} t={((hv >> 17) % 14) * f} w={f} h={f} c="#b6dd78" />
      <Px l={((hv % 5) + 1) * u} t={((hv >> 3) % 5 + 1) * u} w={u} h={u} c="#5f9a2e" />
      <Px l={((hv >> 5) % 5 + 2) * u} t={((hv >> 7) % 4 + 3) * u} w={u} h={u} c="#5f9a2e" />
      {hv % 3 === 0 && <Px l={((hv >> 9) % 6 + 1) * u} t={((hv >> 11) % 6 + 1) * u} w={u} h={u} c="#9ccc5a" />}
    </>
  );
}

function Sand({ s, hv }: { s: number; hv: number }) {
  const u = s / 8;
  return (
    <>
      <Px l={((hv % 6) + 1) * u} t={((hv >> 3) % 6 + 1) * u} w={u} h={u} c="#dcbf7c" />
      <Px l={((hv >> 6) % 6 + 1) * u} t={((hv >> 9) % 6 + 1) * u} w={u} h={u} c="#fff1c9" />
    </>
  );
}

// ---- Soft handheld-style tiles -------------------------------------------------------------
// Grass with little tufts, tall grass with pointed blades, round trees with a highlight, sandy
// paths and water whose corners round off where they meet the grass, striped roofs, cream walls
// with white-framed windows, red doors. nb = the four neighbours (north, east, south, west).
const PATHS = new Set([".", "C", "P"]);
const WATERS = new Set(["W", "O"]);
const GR = "!#88d0a0";

function corners(nb: string | undefined, group: Set<string>, r: number): [number, number, number, number] {
  if (!nb) return [0, 0, 0, 0];
  // A corner is rounded only where both of its sides touch something else ("_" = map edge).
  const [n, e, so, w] = nb.split("").map((c) => c === "_" || group.has(c));
  const k = (a: boolean, b: boolean) => (a || b ? 0 : r);
  return [k(n, w), k(n, e), k(so, e), k(so, w)];
}

function Tufts({ u, hv }: { u: number; hv: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => {
        const v = (hv >> (i * 7)) & 127;
        const l = ((v % 6) + 0.6) * u, t = (((v >> 3) % 6) + 0.8) * u;
        return (
          <React.Fragment key={i}>
            <Px l={l} t={t} w={u * 0.45} h={u * 0.9} c="!#6cbc8a" r={u * 0.2} />
            <Px l={l + u * 0.55} t={t + u * 0.2} w={u * 0.45} h={u * 0.7} c="!#6cbc8a" r={u * 0.2} />
            <Px l={l + u * 0.1} t={t - u * 0.15} w={u * 0.3} h={u * 0.3} c="!#b8ecc8" r={u * 0.15} />
          </React.Fragment>
        );
      })}
    </>
  );
}

function softTile(ch: string, s: number, hv: number, phase: number, nb?: string): { bg: string; inner: React.ReactNode } | null {
  const u = s / 8;
  switch (ch) {
    case ",":
      return { bg: GR, inner: <Tufts u={u} hv={hv} /> };
    case "F": {
      const cols = ["!#f05a5a", "!#ffffff", "!#ff9ec0", "!#ffd84a"];
      const flower = (cx: number, cy: number, c: string, k: number) => (
        <React.Fragment key={k}>
          <Px l={cx - u * 0.3} t={cy + u * 0.6} w={u * 0.6} h={u * 1} c="!#4ca868" r={u * 0.3} />
          {[[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]].map(([dx, dy], i) => (
            <Px key={i} l={cx + dx * u - u * 0.55} t={cy + dy * u - u * 0.55} w={u * 1.1} h={u * 1.1} c={c} r={u * 0.55} />
          ))}
          <Px l={cx - u * 0.4} t={cy - u * 0.4} w={u * 0.8} h={u * 0.8} c="!#ffe070" r={u * 0.4} />
        </React.Fragment>
      );
      return { bg: GR, inner: <>{flower(u * 2.2, u * 2.4, cols[hv % 4], 0)}{flower(u * 5.6, u * 5.2, cols[(hv >> 2) % 4], 1)}</> };
    }
    case "G": {
      const sway = phase ? u * 0.35 : 0;
      const blade = (cx: number, by: number, k: number) => (
        <React.Fragment key={k}>
          <Px l={cx - u * 1.1} t={by - u * 1.2} w={u * 2.2} h={u * 1.4} c="!#2a7444" rad={[u * 1.1, u * 1.1, u * 0.2, u * 0.2]} />
          <Px l={cx - u * 0.75 + sway} t={by - u * 2.6} w={u * 1.5} h={u * 1.8} c="!#2a7444" rad={[u * 0.75, u * 0.75, 0, 0]} />
          <Px l={cx - u * 0.9} t={by - u * 1.15} w={u * 1.8} h={u * 1.2} c="!#4ca868" rad={[u * 0.9, u * 0.9, u * 0.2, u * 0.2]} />
          <Px l={cx - u * 0.55 + sway} t={by - u * 2.45} w={u * 1.1} h={u * 1.6} c="!#4ca868" rad={[u * 0.55, u * 0.55, 0, 0]} />
          <Px l={cx - u * 0.25 + sway} t={by - u * 2.3} w={u * 0.4} h={u * 0.7} c="!#9ee0a8" r={u * 0.2} />
        </React.Fragment>
      );
      return { bg: "!#68bc80", inner: <>{blade(u * 2, u * 4, 0)}{blade(u * 6, u * 4, 1)}{blade(u * 4, u * 8, 2)}{blade(u * 0, u * 8, 3)}{blade(u * 8, u * 8, 4)}</> };
    }
    case "T":
      return {
        bg: GR,
        inner: (
          <>
            <Px l={u * 1} t={u * 6.2} w={u * 6} h={u * 1.5} c="!#5aa878" r={u * 0.75} />
            <Px l={u * 3.3} t={u * 5.2} w={u * 1.4} h={u * 2} c="!#8a5a30" r={u * 0.3} />
            <Px l={u * 0.3} t={u * 0.1} w={u * 7.4} h={u * 6.2} c="!#2c5e34" r={u * 3.1} />
            <Px l={u * 0.75} t={u * 0.5} w={u * 6.5} h={u * 5.4} c="!#3a8c3e" r={u * 2.7} />
            <Px l={u * 0.9} t={u * 0.55} w={u * 6} h={u * 4.6} c="!#4cab4c" r={u * 2.3} />
            <Px l={u * 1.5} t={u * 0.9} w={u * 3.8} h={u * 3} c="!#6cc45a" r={u * 1.5} />
            <Px l={u * 2} t={u * 1.3} w={u * 1.6} h={u * 1.1} c="!#a8e27a" r={u * 0.55} />
            <Px l={u * 4.6} t={u * 2.4} w={u * 0.7} h={u * 0.7} c="!#a8e27a" r={u * 0.35} />
          </>
        ),
      };
    case ".":
    case "C": {
      const rad = corners(nb, PATHS, u * 3);
      const stones = ch === "C";
      return {
        bg: GR,
        inner: (
          <>
            <Px l={0} t={0} w={s} h={s} c={stones ? "!#d6c6ae" : "!#ecd49a"} rad={rad} />
            {stones
              ? [0, 1, 2, 3].map((i) => (
                  <React.Fragment key={i}>
                    <Px l={((i % 2) * 4 + ((i >> 1) % 2) * 2 + 0.4) * u} t={(Math.floor(i / 2) * 4 + 0.5) * u} w={u * 3.2} h={u * 3} c="!#c2b096" r={u * 1.2} />
                    <Px l={((i % 2) * 4 + ((i >> 1) % 2) * 2 + 0.8) * u} t={(Math.floor(i / 2) * 4 + 0.8) * u} w={u * 1.6} h={u * 0.8} c="!#e8dcc8" r={u * 0.4} />
                  </React.Fragment>
                ))
              : [0, 1, 2].map((i) => {
                  const v = (hv >> (i * 6)) & 63;
                  return <Px key={i} l={((v % 6) + 1) * u} t={(((v >> 3) % 6) + 1) * u} w={u * 0.6} h={u * 0.6} c={i === 2 ? "!#f8e8c0" : "!#d6ba7e"} r={u * 0.3} />;
                })}
          </>
        ),
      };
    }
    case "W":
    case "O": {
      const rad = corners(nb, WATERS, u * 3);
      const w = phase ? u * 0.6 : 0;
      return {
        bg: GR,
        inner: (
          <>
            <Px l={0} t={0} w={s} h={s} c={ch === "O" ? "!#4a98e0" : "!#68b4f0"} rad={rad} />
            <Px l={u * 1 + w} t={u * 2} w={u * 2.4} h={u * 0.5} c="!#c8ecff" r={u * 0.25} />
            <Px l={u * 4.4 - w} t={u * 5.2} w={u * 2.2} h={u * 0.5} c="!#c8ecff" r={u * 0.25} />
          </>
        ),
      };
    }
    case "R": {
      const [n, , so] = (nb ?? "RRRR").split("");
      return {
        bg: "!#e8604a",
        inner: (
          <>
            {[1, 3, 5, 7].map((ty) => <Px key={ty} l={0} t={ty * u - u * 0.35} w={s} h={u * 0.55} c="!#b83a28" />)}
            {[0, 2, 4, 6].map((ty) => <Px key={`h${ty}`} l={0} t={ty * u + u * 0.3} w={s} h={u * 0.45} c="!#f48a6a" />)}
            {n !== "R" && <Px l={0} t={0} w={s} h={u * 0.9} c="!#ffb090" />}
            {so !== "R" && <Px l={0} t={s - u * 1.1} w={s} h={u * 1.1} c="!#8a2418" />}
          </>
        ),
      };
    }
    case "H":
    case "D": {
      const door = ch === "D";
      return {
        bg: "!#f4e2b4",
        inner: (
          <>
            <Px l={0} t={s - u * 1.2} w={s} h={u * 1.2} c="!#d8c08c" />
            {door ? (
              <>
                <Px l={u * 1.6} t={u * 1.2} w={u * 4.8} h={u * 6.8} c="!#a83a2c" rad={[u * 2.4, u * 2.4, 0, 0]} />
                <Px l={u * 2} t={u * 1.6} w={u * 4} h={u * 6.4} c="!#d84a3a" rad={[u * 2, u * 2, 0, 0]} />
                <Px l={u * 3} t={u * 2.4} w={u * 2} h={u * 1.6} c="!#8ac8f0" r={u * 0.5} />
                <Px l={u * 5} t={u * 5} w={u * 0.6} h={u * 0.6} c="!#ffd860" r={u * 0.3} />
              </>
            ) : (
              <>
                <Px l={u * 1.4} t={u * 1.4} w={u * 5.2} h={u * 4.4} c="!#ffffff" r={u * 0.8} />
                <Px l={u * 1.9} t={u * 1.9} w={u * 4.2} h={u * 3.4} c="!#6aa8e0" r={u * 0.5} />
                <Px l={u * 2.2} t={u * 2.2} w={u * 1.5} h={u * 1.1} c="!#bfe6ff" r={u * 0.4} />
                <Px l={u * 3.9} t={u * 1.9} w={u * 0.3} h={u * 3.4} c="!#ffffff" />
                <Px l={u * 1.2} t={u * 5.8} w={u * 5.6} h={u * 0.6} c="!#a86a3a" r={u * 0.3} />
              </>
            )}
          </>
        ),
      };
    }
    case "%":
      // Protesters: three people, two of them holding placards on sticks (red writing on white).
      return {
        bg: "!#e6cc8e",
        inner: (
          <>
            {[[0.3, 3, "!#c0392b", "!#5d3a1a"], [2.7, 3.4, "!#1565c0", "!#c48a3a"], [5.1, 3, "!#2e7d32", "!#1a1a1a"]].map(([x, y, shirt, hair], i) => (
              <React.Fragment key={i}>
                <Px l={u * (x as number)} t={u * ((y as number) + 1.8)} w={u * 2.6} h={u * 3} c={shirt as string} r={u * 0.8} />
                <Px l={u * ((x as number) + 0.45)} t={u * (y as number)} w={u * 1.7} h={u * 1.9} c="!#ffcc9a" r={u * 0.85} />
                <Px l={u * ((x as number) + 0.35)} t={u * ((y as number) - 0.2)} w={u * 1.9} h={u * 0.75} c={hair as string} r={u * 0.4} />
                <Px l={u * ((x as number) + 0.8)} t={u * ((y as number) + 0.85)} w={u * 0.3} h={u * 0.35} c="!#2a2a2a" />
                <Px l={u * ((x as number) + 1.45)} t={u * ((y as number) + 0.85)} w={u * 0.3} h={u * 0.35} c="!#2a2a2a" />
              </React.Fragment>
            ))}
            {/* placards held high (the sticks end on the shoulders, behind the heads) */}
            {[[0.2, -0.2], [4.9, 0]].map(([x, y], i) => (
              <React.Fragment key={`c${i}`}>
                <Px l={u * (x + 1.25)} t={u * (y + 2.1)} w={u * 0.35} h={u * 0.8} c="!#7a4a22" />
                <Px l={u * x} t={u * y + u * 0.2} w={u * 2.9} h={u * 2} c="!#ffffff" r={u * 0.25} />
                <Px l={u * (x + 0.35)} t={u * (y + 0.6)} w={u * 2.2} h={u * 0.35} c="!#d43c3c" />
                <Px l={u * (x + 0.35)} t={u * (y + 1.2)} w={u * 1.5} h={u * 0.35} c="!#d43c3c" />
              </React.Fragment>
            ))}
          </>
        ),
      };
    case "!":
      // A solemn gate in a brick wall, barred with a padlock.
      return {
        bg: "!#b5562f",
        inner: (
          <>
            {[1.6, 3.6, 5.6].map((y, i) => <Px key={i} l={0} t={u * y} w={s} h={u * 0.25} c="!#8a3e20" />)}
            <Px l={u * 1.2} t={u * 0.8} w={u * 5.6} h={u * 7.2} c="!#5a3416" rad={[u * 2.8, u * 2.8, 0, 0]} />
            <Px l={u * 1.6} t={u * 1.2} w={u * 4.8} h={u * 6.8} c="!#7a4a22" rad={[u * 2.4, u * 2.4, 0, 0]} />
            <Px l={u * 3.9} t={u * 1.2} w={u * 0.25} h={u * 6.8} c="!#5a3416" />
            <Px l={u * 1.6} t={u * 4} w={u * 4.8} h={u * 0.7} c="!#3a3a3a" />
            <Px l={u * 3.3} t={u * 4.3} w={u * 1.4} h={u * 1.3} c="!#e0b33a" r={u * 0.3} />
            <Px l={u * 3.55} t={u * 3.7} w={u * 0.9} h={u * 0.8} c="!#e0b33a" rad={[u * 0.45, u * 0.45, 0, 0]} />
            <Px l={u * 3.85} t={u * 4.7} w={u * 0.3} h={u * 0.5} c="!#3a3a3a" />
          </>
        ),
      };
    case "&":
      // A thick, thorny hedge with a few berries.
      return {
        bg: GR,
        inner: (
          <>
            <Px l={u * 0.2} t={u * 1.2} w={u * 7.6} h={u * 6.4} c="!#1f5e2e" r={u * 2.2} />
            <Px l={u * 0.6} t={u * 1.5} w={u * 6.8} h={u * 5.4} c="!#2f7d3a" r={u * 2} />
            {[[1.4, 2.2], [4.2, 1.9], [2.6, 4.2], [5.2, 4.4]].map(([x, y], i) => <Px key={i} l={u * x} t={u * y} w={u * 2} h={u * 1.6} c="!#4ea64e" r={u * 0.8} />)}
            {[[2, 3.4], [5.6, 3], [3.6, 5.6]].map(([x, y], i) => <Px key={`b${i}`} l={u * x} t={u * y} w={u * 0.7} h={u * 0.7} c="!#d43c5a" r={u * 0.35} />)}
          </>
        ),
      };
    case "^":
      // A big boulder with cracks.
      return {
        bg: "!#e6cc8e",
        inner: (
          <>
            <Px l={u * 0.8} t={u * 6.2} w={u * 6.4} h={u * 1.2} c="rgba(0,0,0,0.25)" r={u * 0.6} />
            <Px l={u * 0.6} t={u * 1.2} w={u * 6.8} h={u * 5.8} c="!#5c5c66" r={u * 2.6} />
            <Px l={u * 0.9} t={u * 1.4} w={u * 6} h={u * 5} c="!#8a8a96" r={u * 2.3} />
            <Px l={u * 1.8} t={u * 2} w={u * 2.4} h={u * 1.4} c="!#b8b8c4" r={u * 0.7} />
            <Px l={u * 4.4} t={u * 3.4} w={u * 0.4} h={u * 2.4} c="!#4a4a52" />
            <Px l={u * 3.4} t={u * 4.6} w={u * 1.4} h={u * 0.4} c="!#4a4a52" />
          </>
        ),
      };
    case "=":
      // Balcony on a facade: tall window behind, a stone slab and a railing in front.
      return {
        bg: "!#f4e2b4",
        inner: (
          <>
            <Px l={u * 1.6} t={u * 0.6} w={u * 4.8} h={u * 4.4} c="!#6aa8e0" rad={[u * 2.4, u * 2.4, 0, 0]} />
            <Px l={u * 1.6} t={u * 0.6} w={u * 4.8} h={u * 0.7} c="!#ffffff" rad={[u * 2.4, u * 2.4, 0, 0]} />
            <Px l={0} t={u * 5} w={s} h={u * 1.2} c="!#b8b2a2" />
            {[0.4, 2.2, 4, 5.8, 7.2].map((x, i) => <Px key={i} l={u * x} t={u * 3.6} w={u * 0.5} h={u * 1.5} c="!#5a5248" />)}
            <Px l={0} t={u * 3.4} w={s} h={u * 0.4} c="!#5a5248" />
            <Px l={0} t={u * 6.2} w={s} h={u * 1.8} c="!#d8c08c" />
          </>
        ),
      };
    case "S":
      return {
        bg: GR,
        inner: (
          <>
            <Tufts u={u} hv={hv} />
            <Px l={u * 3.5} t={u * 4} w={u} h={u * 3.6} c="!#7a4a22" r={u * 0.3} />
            <Px l={u * 0.8} t={u * 0.9} w={u * 6.4} h={u * 3.8} c="!#7a4a22" r={u * 1} />
            <Px l={u * 1.1} t={u * 1.2} w={u * 5.8} h={u * 3.2} c="!#c88a4a" r={u * 0.8} />
            <Px l={u * 2} t={u * 2.1} w={u * 4} h={u * 0.45} c="!#f4dcb0" r={u * 0.2} />
            <Px l={u * 2} t={u * 3} w={u * 3} h={u * 0.45} c="!#f4dcb0" r={u * 0.2} />
          </>
        ),
      };
  }
  return null;
}

export function TileArtBase({ ch, size: s, x, y, phase, shadow, nb }: P) {
  const u = s / 8;
  const hv = hash(x, y);
  const base: Record<string, string> = {
    ",": "#7cb342", G: "#3f8f3a", T: "#7cb342", ".": "#d7b98a", C: "#b8a68e", P: "#b5562f", W: "#2a8a8a",
    O: "#1d7f99", R: "#a83a2a", H: "#ecdcb8", D: "#ecdcb8", B: "#8d3b23", F: "#7cb342", S: "#7cb342",
    A: "#4a4a4a", Y: "#f0d9a0", Q: "#f0d9a0", U: "#f0d9a0", X: "#0b0b0b", I: "!#88d0a0", "=": "!#f4e2b4", "%": "!#e6cc8e", "&": "!#88d0a0", "^": "!#e6cc8e", "!": "!#b5562f",
    L: "#a0703c", K: "#a0703c", M: "#b8a68e", N: "#e9d8b4", V: "#9c2a2a", J: "#b8a68e",
  };
  const rt = softTile(ch, s, hv, phase, nb);
  const bg = rt ? rc(rt.bg) : rc(base[ch] ?? base.X);
  let inner: React.ReactNode = null;
  if (rt) inner = rt.inner;
  else switch (ch) {
    case ",":
    case "S":
    case "F":
      inner = (
        <>
          <Grass s={s} hv={hv} />
          {ch === "F" && (
            <>
              <Px l={u} t={u * 2} w={u * 2} h={u * 2} c="#fbc02d" r={u} />
              <Px l={u * 1.5} t={u * 2.5} w={u} h={u} c="#e0913a" />
              <Px l={u * 5} t={u * 5} w={u * 2} h={u * 2} c="#f4a6b0" r={u} />
              <Px l={u * 5.5} t={u * 5.5} w={u} h={u} c="#ffffff" />
            </>
          )}
          {ch === "S" && (
            <>
              <Px l={u * 3.5} t={u * 4} w={u} h={u * 4} c="#4e2e18" />
              <Px l={u} t={u} w={u * 6} h={u * 3.5} c="#a0703c" />
              <Px l={u} t={u} w={u * 6} h={u * 0.6} c="#c4925a" />
              <Px l={u * 2} t={u * 2.2} w={u * 4} h={u * 0.5} c="#4e2e18" />
            </>
          )}
        </>
      );
      break;
    case "G": {
      const sh = phase ? u * 0.5 : 0;
      inner = (
        <>
          {[1, 3.5, 6].map((lx, i) => (
            <React.Fragment key={i}>
              <Px l={lx * u - u * 0.5 + (i % 2 ? sh : -sh)} t={u * (i === 1 ? 3 : 1.5)} w={u} h={u * 4} c="#245e24" />
              <Px l={lx * u - u * 0.5 + (i % 2 ? sh : -sh)} t={u * (i === 1 ? 3 : 1.5)} w={u} h={u} c="#6fbf4a" />
            </React.Fragment>
          ))}
          <Px l={0} t={u * 7} w={s} h={u} c="#2f7a2c" />
        </>
      );
      break;
    }
    case "T":
      inner = (
        <>
          <Px l={u * 1} t={u * 6.5} w={u * 6} h={u * 1.2} c="#5a8f2a" r={u} />
          <Px l={u * 3.3} t={u * 5} w={u * 1.4} h={u * 2.5} c="#5d3a1a" />
          <Px l={u * 0.5} t={u * 0.3} w={u * 7} h={u * 5.5} c="#123d1a" r={u * 2.5} />
          <Px l={u * 0.9} t={u * 0.6} w={u * 6.2} h={u * 4.8} c="#1f5e2a" r={u * 2.2} />
          <Px l={u * 1.8} t={u * 1.2} w={u * 2.5} h={u * 1.8} c="#2e8b3a" r={u} />
          <Px l={u * 2.2} t={u * 1.5} w={u} h={u * 0.8} c="#56b04f" />
          <Px l={u * 4.6} t={u * 1.4} w={u * 0.5} h={u * 0.5} c="#2e8b3a" />
          <Px l={u * 5.4} t={u * 2.6} w={u * 0.5} h={u * 0.5} c="#17502a" />
          <Px l={u * 2.6} t={u * 3.6} w={u * 0.5} h={u * 0.5} c="#17502a" />
          <Px l={u * 4.2} t={u * 3.9} w={u * 0.5} h={u * 0.5} c="#17502a" />
          <Px l={u * 1.4} t={u * 2.8} w={u * 0.5} h={u * 0.5} c="#3a9a44" />
        </>
      );
      break;
    case ".":
      inner = (
        <>
          {[0, 1, 2].map((i) => {
            const v = (hv >> (i * 6)) & 1023;
            return (
              <React.Fragment key={i}>
                <Px l={((v % 13) + 1) * (s / 16)} t={(((v >> 4) % 13) + 1) * (s / 16)} w={s / 16} h={s / 16} c="#b89464" />
                <Px l={((v % 13) + 1) * (s / 16)} t={(((v >> 4) % 13) + 2) * (s / 16)} w={s / 16} h={s / 16} c="#f0dcb4" />
              </React.Fragment>
            );
          })}
          <Px l={((hv % 6) + 1) * u} t={((hv >> 4) % 6 + 1) * u} w={u} h={u} c="#c4a372" />
          <Px l={((hv >> 8) % 6 + 1) * u} t={((hv >> 12) % 6 + 1) * u} w={u} h={u * 0.8} c="#e6cda3" />
        </>
      );
      break;
    case "C":
      // Cobblestones: rounded stones with light top and shaded bottom.
      inner = (
        <>
          {[0, 1, 2].map((j) =>
            [0, 1, 2].map((i) => {
              const v = hash(x * 3 + i, y * 3 + j) % 3;
              const l = (i * 2.7 + (j % 2 ? 0.6 : 0.1)) * u, t = (j * 2.7 + 0.2) * u;
              return (
                <React.Fragment key={`${i}${j}`}>
                  <Px l={l} t={t} w={u * 2.3} h={u * 2.3} c={["#b8a68e", "#c4b39a", "#ab9a82"][v]} r={u * 0.8} />
                  <Px l={l + u * 0.4} t={t + u * 0.3} w={u * 1.2} h={u * 0.4} c="#dacbb4" />
                  <Px l={l + u * 0.3} t={t + u * 1.8} w={u * 1.7} h={u * 0.4} c="#8f7f68" />
                </React.Fragment>
              );
            }),
          )}
        </>
      );
      break;
    case "P":
      // Portico arch: pillars with capitals, shaded vault and lit floor.
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 1.3} c="#d98a5c" />
          <Px l={0} t={u * 1.1} w={s} h={u * 0.3} c="#a85a34" />
          <Px l={u * 1.4} t={u * 1.6} w={u * 5.2} h={u * 6.4} c="#4a1f10" r={u * 2.6} />
          <Px l={u * 1.4} t={u * 4.5} w={u * 5.2} h={u * 3.5} c="#4a1f10" />
          <Px l={u * 1.9} t={u * 3} w={u * 4.2} h={u * 5} c="#6e2e17" r={u * 2} />
          <Px l={u * 1.9} t={u * 6.6} w={u * 4.2} h={u * 1.4} c="#9a7a5a" />
          <Px l={u * 0.1} t={u * 1.4} w={u * 1.3} h={u * 6.6} c="#d07a4c" />
          <Px l={u * 6.6} t={u * 1.4} w={u * 1.3} h={u * 6.6} c="#c06a3e" />
          <Px l={0} t={u * 1.4} w={u * 1.6} h={u * 0.5} c="#e8a070" />
          <Px l={u * 6.4} t={u * 1.4} w={u * 1.6} h={u * 0.5} c="#e8a070" />
          <Px l={u * 0.3} t={u * 2} w={u * 0.3} h={u * 6} c="#e8a070" />
        </>
      );
      break;
    case "W":
    case "O": {
      const off = phase ? u * 2 : 0;
      const hi = ch === "O" ? "#7fd3e6" : "#8fd3d3";
      inner = (
        <>
          <Px l={0} t={u * 5} w={s} h={u * 3} c={ch === "O" ? "#17607a" : "#237a7a"} />
          <Px l={u + off} t={u * 2} w={u * 3} h={u * 0.6} c={hi} />
          <Px l={u * 1.5 + off} t={u * 1.5} w={u * 2} h={u * 0.5} c="#d8f6ff" />
          <Px l={u * 4 - off} t={u * 5.5} w={u * 3} h={u * 0.6} c={hi} />
          {ch === "O" && hv % 4 === 0 && <Px l={u * 6} t={u} w={u * 0.8} h={u * 0.8} c="#ffffff" />}
          <Px l={u * 2 + off / 2} t={u * 3.8} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
          <Px l={u * 6 - off / 2} t={u * 7} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
        </>
      );
      break;
    }
    case "R":
      // Terracotta roof tiles (coppi) in staggered rows with light and shade.
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={0} t={ty * u} w={s} h={u * 0.5} c="#d9704c" />
              <Px l={0} t={ty * u + u * 1.55} w={s} h={u * 0.45} c="#6e2015" />
              {[0, 2, 4, 6, 8].map((cx) => (
                <Px key={cx} l={(cx - ((ty / 2) % 2)) * u} t={ty * u + u * 0.3} w={u * 0.35} h={u * 1.3} c="#8e321e" />
              ))}
              {[1, 5].map((cx) => (
                <Px key={`s${cx}`} l={(cx - ((ty / 2) % 2) + 0.4) * u} t={ty * u + u * 0.6} w={u * 0.5} h={u * 0.3} c="#e8906c" />
              ))}
            </React.Fragment>
          ))}
        </>
      );
      break;
    case "H":
      // Plaster wall with cornice, stone window frame and green shutters (persiane).
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 0.8} c="#c9b48c" />
          <Px l={0} t={u * 0.8} w={s} h={u * 0.25} c="#a8946c" />
          {hv % 3 === 0 && <Px l={((hv >> 3) % 6 + 1) * u} t={u * 6.2} w={u * 0.5} h={u * 0.4} c="#d8c7a0" />}
          <Px l={u * 2.2} t={u * 1.6} w={u * 3.6} h={u * 4.2} c="#d8c8a8" />
          <Px l={u * 2.6} t={u * 2} w={u * 2.8} h={u * 3.4} c="#4d7894" />
          <Px l={u * 2.6} t={u * 2} w={u * 1.1} h={u * 1.2} c="#a9d2e8" />
          <Px l={u * 3.9} t={u * 2} w={u * 0.25} h={u * 3.4} c="#d8c8a8" />
          <Px l={u * 2.6} t={u * 3.6} w={u * 2.8} h={u * 0.25} c="#d8c8a8" />
          <Px l={u * 0.6} t={u * 1.6} w={u * 1.5} h={u * 4.2} c="#2e6b3a" />
          <Px l={u * 5.9} t={u * 1.6} w={u * 1.5} h={u * 4.2} c="#2e6b3a" />
          {[2.3, 3.1, 3.9, 4.7].map((t) => (
            <React.Fragment key={t}>
              <Px l={u * 0.7} t={u * t} w={u * 1.3} h={u * 0.2} c="#1f4f2a" />
              <Px l={u * 6} t={u * t} w={u * 1.3} h={u * 0.2} c="#1f4f2a" />
            </React.Fragment>
          ))}
          <Px l={u * 2} t={u * 5.8} w={u * 4} h={u * 0.5} c="#b8a68e" />
          <Px l={0} t={u * 7.2} w={s} h={u * 0.8} c="#b9a47c" />
        </>
      );
      break;
    case "D":
      // Arched wooden door in a stone frame, with planks, knocker and a step.
      inner = (
        <>
          <Px l={u * 1.2} t={u * 0.6} w={u * 5.6} h={u * 6.8} c="#c9b48c" r={u * 2.8} />
          <Px l={u * 1.2} t={u * 3.5} w={u * 5.6} h={u * 3.9} c="#c9b48c" />
          <Px l={u * 1.8} t={u * 1.2} w={u * 4.4} h={u * 6.2} c="#6d4c41" r={u * 2.2} />
          <Px l={u * 1.8} t={u * 3.5} w={u * 4.4} h={u * 3.9} c="#6d4c41" />
          {[2.8, 3.9, 5].map((l) => <Px key={l} l={u * l} t={u * 1.6} w={u * 0.25} h={u * 5.8} c="#4e342e" />)}
          <Px l={u * 1.8} t={u * 1.4} w={u * 1} h={u * 0.4} c="#8d6e63" />
          <Px l={u * 4.5} t={u * 4.3} w={u * 0.7} h={u * 0.7} c="#fbc02d" r={u} />
          <Px l={u * 0.8} t={u * 7.3} w={u * 6.4} h={u * 0.7} c="#9c8a72" />
          <Px l={u * 0.8} t={u * 7.3} w={u * 6.4} h={u * 0.2} c="#cbbba3" />
        </>
      );
      break;
    case "B":
      // Brick wall: staggered bricks with varied tones and mortar.
      inner = (
        <>
          <Px l={0} t={0} w={s} h={s} c="#5e2414" />
          {[0, 2, 4, 6].map((ty) =>
            [-1, 2, 5, 8].map((bx) => {
              const l = (bx + ((ty / 2) % 2 ? 1.5 : 0)) * u;
              const v = hash(x * 5 + bx + 2, y * 4 + ty) % 3;
              return (
                <React.Fragment key={`${ty}${bx}`}>
                  <Px l={l + u * 0.15} t={ty * u + u * 0.15} w={u * 2.7} h={u * 1.7} c={["#9a4428", "#8d3b23", "#a8502f"][v]} />
                  <Px l={l + u * 0.15} t={ty * u + u * 0.15} w={u * 2.7} h={u * 0.3} c="#b8603e" />
                </React.Fragment>
              );
            }),
          )}
        </>
      );
      break;
    case "L":
    case "K":
      // Wooden floor planks; "K" adds an oak barrel on top.
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={0} t={ty * u} w={s} h={u * 0.35} c="#b8844a" />
              <Px l={0} t={ty * u + u * 1.7} w={s} h={u * 0.3} c="#6e4626" />
              <Px l={(((ty + x * 3 + y) % 5) + 1.5) * u} t={ty * u} w={u * 0.3} h={u * 2} c="#6e4626" />
            </React.Fragment>
          ))}
          {ch === "K" && (
            <>
              <Px l={u * 0.8} t={u * 6.6} w={u * 6.4} h={u * 1.2} c="rgba(0,0,0,0.3)" r={u * 3} />
              <Px l={u * 0.8} t={u * 0.6} w={u * 6.4} h={u * 6.8} c="#5a3418" r={u * 2.4} />
              <Px l={u * 1.2} t={u * 0.9} w={u * 5.6} h={u * 6.2} c="#7a4a24" r={u * 2.2} />
              <Px l={u * 2} t={u * 1.2} w={u * 1} h={u * 5.6} c="#9a6434" />
              <Px l={u * 0.8} t={u * 1.8} w={u * 6.4} h={u * 0.6} c="#3e3e3e" />
              <Px l={u * 0.8} t={u * 5.4} w={u * 6.4} h={u * 0.6} c="#3e3e3e" />
              <Px l={u * 1} t={u * 1.8} w={u * 6} h={u * 0.2} c="#8a8a8a" />
              <Px l={u * 3.6} t={u * 3.5} w={u * 0.8} h={u * 0.8} c="#2a1608" r={u} />
            </>
          )}
        </>
      );
      break;
    case "M": {
      // Market stall: striped awning over a crate of fresh produce.
      const fruit = [["#d32f2f", "#e53935"], ["#fbc02d", "#f9a825"], ["#7cb342", "#558b2f"], ["#ef6c00", "#fb8c00"]][hv % 4];
      inner = (
        <>
          {[0, 1, 2, 3].map((i) => <Px key={i} l={i * 2 * u} t={0} w={u} h={u * 3} c={hv % 2 ? "#c0392b" : "#2e7d32"} />)}
          {[0, 1, 2, 3].map((i) => <Px key={`w${i}`} l={(i * 2 + 1) * u} t={0} w={u} h={u * 3} c="#fff8e1" />)}
          {[0.5, 2.5, 4.5, 6.5].map((l) => <Px key={`sc${l}`} l={l * u} t={u * 2.8} w={u * 1.2} h={u * 0.6} c={hv % 2 ? "#8e2a1f" : "#1f5a24"} r={u} />)}
          <Px l={u * 0.5} t={u * 4} w={u * 7} h={u * 3.6} c="#8d5a2b" />
          <Px l={u * 0.5} t={u * 4} w={u * 7} h={u * 0.4} c="#b07a42" />
          <Px l={u * 0.5} t={u * 5.8} w={u * 7} h={u * 0.3} c="#5e3a1a" />
          {[[1, 4.6], [2.6, 4.4], [4.2, 4.7], [5.8, 4.4], [1.8, 5.2], [3.4, 5.2], [5, 5.2]].map(([l, t], i) => (
            <React.Fragment key={`f${i}`}>
              <Px l={l * u} t={t * u} w={u * 1.3} h={u * 1.2} c={fruit[i % 2]} r={u} />
              <Px l={(l + 0.3) * u} t={(t + 0.2) * u} w={u * 0.4} h={u * 0.3} c="#ffffff" />
            </React.Fragment>
          ))}
          <Px l={u * 0.6} t={u * 6.2} w={u * 0.5} h={u * 1.8} c="#5e3a1a" />
          <Px l={u * 6.9} t={u * 6.2} w={u * 0.5} h={u * 1.8} c="#5e3a1a" />
        </>
      );
      break;
    }
    case "N":
      // Indoor wall: plaster, cornice and wood wainscot; some walls have shelves with bottles.
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 0.7} c="#c9b48c" />
          <Px l={0} t={u * 4.2} w={s} h={u * 3.8} c="#7a4a24" />
          <Px l={0} t={u * 4.2} w={s} h={u * 0.4} c="#9a6434" />
          <Px l={u * 0.8} t={u * 5.2} w={u * 2.6} h={u * 2.2} c="#6a3e1e" />
          <Px l={u * 4.6} t={u * 5.2} w={u * 2.6} h={u * 2.2} c="#6a3e1e" />
          {hv % 3 === 0 && (
            <>
              <Px l={u * 0.6} t={u * 3.2} w={u * 6.8} h={u * 0.4} c="#5e3a1a" />
              {[1, 2.4, 3.8, 5.2].map((l, i) => <Px key={l} l={l * u} t={u * 1.6} w={u * 0.8} h={u * 1.6} c={["#2e5e2a", "#7b1f3a", "#3e2a20", "#c49a2c"][i]} r={u * 0.2} />)}
            </>
          )}
          {hv % 3 === 1 && (
            <>
              <Px l={u * 2.2} t={u * 1.1} w={u * 3.6} h={u * 2.6} c="#c49a2c" />
              <Px l={u * 2.6} t={u * 1.5} w={u * 2.8} h={u * 1.8} c="#5d8aa8" />
              <Px l={u * 2.6} t={u * 2.6} w={u * 2.8} h={u * 0.7} c="#6f9a3a" />
            </>
          )}
        </>
      );
      break;
    case "J":
      // Side wall: stone pilaster with blocks, light edge and shadow edge.
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={u * 0.4} t={ty * u + u * 0.2} w={u * 7.2} h={u * 1.6} c={(ty / 2 + y) % 2 ? "#c4b39a" : "#ab9a82"} />
              <Px l={u * 0.4} t={ty * u + u * 0.2} w={u * 7.2} h={u * 0.3} c="#dacbb4" />
            </React.Fragment>
          ))}
          <Px l={0} t={0} w={u * 0.4} h={s} c="#8f7f68" />
          <Px l={u * 7.6} t={0} w={u * 0.4} h={s} c="#6e604c" />
        </>
      );
      break;
    case "V":
      // Red carpet with a golden border.
      inner = (
        <>
          <Px l={0} t={u * 0.4} w={s} h={u * 0.5} c="#e0b040" />
          <Px l={0} t={u * 7.1} w={s} h={u * 0.5} c="#e0b040" />
          <Px l={u * 3.4} t={u * 3.4} w={u * 1.2} h={u * 1.2} c="#e0b040" />
          <Px l={u * 1} t={u * 2} w={u * 0.6} h={u * 0.6} c="#7a1d1d" />
          <Px l={u * 6.4} t={u * 5.4} w={u * 0.6} h={u * 0.6} c="#7a1d1d" />
        </>
      );
      break;
    case "A":
      inner = (
        <>
          <Px l={u * 2.5} t={u * 3.7} w={u * 3} h={u * 0.6} c="#f5f5f5" />
          <Px l={((hv % 6) + 1) * u} t={((hv >> 4) % 6 + 1) * u} w={u * 0.6} h={u * 0.6} c="#5c5c5c" />
        </>
      );
      break;
    case "Y":
      inner = <Sand s={s} hv={hv} />;
      break;
    case "Q": {
      const sh = phase ? u * 0.4 : 0;
      inner = (
        <>
          <Sand s={s} hv={hv} />
          {[1.5, 4, 6.2].map((lx, i) => (
            <Px key={i} l={lx * u + (i % 2 ? sh : -sh)} t={u * (i === 1 ? 2.5 : 1.5)} w={u * 0.8} h={u * 4.5} c="#8fae3a" />
          ))}
          <Px l={u * 3} t={u * 1.5} w={u * 0.8} h={u * 0.8} c="#c8dc6a" />
        </>
      );
      break;
    }
    case "I":
      // Street lamp: cast-iron post with a lantern (it lights up at night, see TileMap NightLights).
      inner = (
        <>
          <Tufts u={u} hv={hv} />
          <Px l={u * 2.6} t={u * 7.1} w={u * 2.8} h={u * 0.7} c="rgba(0,0,0,0.25)" r={u} />
          <Px l={u * 3.6} t={u * 2.6} w={u * 0.8} h={u * 4.8} c="#2b2f3a" />
          <Px l={u * 3.2} t={u * 7} w={u * 1.6} h={u * 0.6} c="#2b2f3a" />
          <Px l={u * 2.7} t={u * 0.9} w={u * 2.6} h={u * 0.5} c="#2b2f3a" />
          <Px l={u * 2.9} t={u * 1.4} w={u * 2.2} h={u * 1.4} c="#f6e7a1" />
          <Px l={u * 3.1} t={u * 1.6} w={u * 0.6} h={u * 1} c="#ffffff" />
          <Px l={u * 2.7} t={u * 2.7} w={u * 2.6} h={u * 0.4} c="#2b2f3a" />
          <Px l={u * 3.6} t={u * 0.5} w={u * 0.8} h={u * 0.5} c="#2b2f3a" />
        </>
      );
      break;
    case "U":
      inner = (
        <>
          <Sand s={s} hv={hv} />
          <Px l={u * 1.5} t={u * 7} w={u * 5} h={u * 0.8} c="#d9bf86" r={u} />
          <Px l={u * 3.6} t={u * 2.5} w={u * 0.8} h={u * 5} c="#ffffff" />
          <Px l={u * 0.3} t={u * 0.3} w={u * 7.4} h={u * 3} c="#c0392b" r={u * 3} />
          <Px l={u * 2.2} t={u * 0.3} w={u * 1.4} h={u * 2.7} c="#ffffff" />
          <Px l={u * 4.6} t={u * 0.3} w={u * 1.4} h={u * 2.7} c="#ffffff" />
        </>
      );
      break;
  }
  return (
    <View style={{ width: s, height: s, backgroundColor: bg, overflow: "hidden" }}>
      
      {inner}
      {shadow && (
        <>
          <Px l={0} t={0} w={s} h={u * 1.2} c="rgba(20,10,0,0.28)" />
          <Px l={0} t={u * 1.2} w={s} h={u * 0.6} c="rgba(20,10,0,0.12)" />
        </>
      )}
    </View>
  );
}

/** The four neighbours of a tile (north, east, south, west); "_" outside the map. */
export function neighbours(tiles: string[], x: number, y: number) {
  const at = (xx: number, yy: number) => tiles[yy]?.[xx] ?? "_";
  return at(x, y - 1) + at(x + 1, y) + at(x, y + 1) + at(x - 1, y);
}
export const TileArt = memo(TileArtBase);
export const ANIMATED_TILES = new Set(["G", "W", "O", "Q"]);
