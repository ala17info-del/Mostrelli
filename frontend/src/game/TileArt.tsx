import React, { memo } from "react";
import { View, ViewStyle } from "react-native";

// Richer pixel tiles. Colors are fixed pixel-art content (same in any theme).
const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

type P = { ch: string; size: number; x: number; y: number; phase: number };

// Warmer, more saturated handheld-style palette applied on top of the original tile colours.
const REMAP: Record<string, string> = {
  "#7cb342": "#78c850", "#5f9a2e": "#58a838", "#4e8a26": "#3f8f30", "#3f8f3a": "#38a048", "#17502a": "#1d5c34",
  "#b6dd78": "#c8f088", "#9ccc5a": "#a8e070", "#d7b98a": "#e8c890", "#f0d9a0": "#f8e4a8", "#2a8a8a": "#3098c8",
  "#1d7f99": "#2878c0", "#8fd3d3": "#90d8f0", "#7fd3e6": "#88d0f8", "#b8ecef": "#c8f0ff", "#a83a2a": "#c84830",
  "#8d3b23": "#a04830", "#b5562f": "#c86038", "#ecdcb8": "#f8ecd0", "#4a4a4a": "#505868", "#b8a68e": "#c0b0a0",
};
const rc = (c: string) => REMAP[c] ?? c;

function Px({ l, t, w, h, c, r }: { l: number; t: number; w: number; h: number; c: string; r?: number }) {
  const st: ViewStyle = { position: "absolute", left: l, top: t, width: w, height: h, backgroundColor: rc(c) };
  if (r) st.borderRadius = r;
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

function TileArtBase({ ch, size: s, x, y, phase }: P) {
  const u = s / 8;
  const hv = hash(x, y);
  const base: Record<string, string> = {
    ",": "#7cb342", G: "#3f8f3a", T: "#7cb342", ".": "#d7b98a", C: "#b8a68e", P: "#b5562f", W: "#2a8a8a",
    O: "#1d7f99", R: "#a83a2a", H: "#ecdcb8", D: "#ecdcb8", B: "#8d3b23", F: "#7cb342", S: "#7cb342",
    A: "#4a4a4a", Y: "#f0d9a0", Q: "#f0d9a0", U: "#f0d9a0", X: "#0b0b0b",
  };
  const bg = rc(base[ch] ?? base.X);
  let inner: React.ReactNode = null;
  switch (ch) {
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
      inner = (
        <>
          <Px l={0} t={u * 3.8} w={s} h={u * 0.4} c="#9c8a72" />
          <Px l={0} t={u * 7.6} w={s} h={u * 0.4} c="#9c8a72" />
          <Px l={u * 3.8} t={0} w={u * 0.4} h={u * 4} c="#9c8a72" />
          <Px l={(y % 2 ? 1.8 : 5.8) * u} t={u * 4} w={u * 0.4} h={u * 4} c="#9c8a72" />
          <Px l={u * 0.5} t={u * 0.5} w={u * 2} h={u * 0.5} c="#cbbba3" />
        </>
      );
      break;
    case "P":
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 1.2} c="#c96a40" />
          <Px l={u * 1.5} t={u * 2} w={u * 5} h={u * 6} c="#6e2e17" r={u * 2.5} />
          <Px l={u * 1.5} t={u * 5} w={u * 5} h={u * 3} c="#6e2e17" />
          <Px l={u * 0.3} t={u * 1.2} w={u * 1.2} h={u * 6.8} c="#d07a4c" />
          <Px l={u * 2} t={u * 7} w={u * 4} h={u} c="#8a6a50" />
        </>
      );
      break;
    case "W":
    case "O": {
      const off = phase ? u * 2 : 0;
      inner = (
        <>
          <Px l={u + off} t={u * 2} w={u * 3} h={u * 0.6} c={ch === "O" ? "#7fd3e6" : "#8fd3d3"} />
          <Px l={u * 4 - off} t={u * 5.5} w={u * 3} h={u * 0.6} c={ch === "O" ? "#7fd3e6" : "#8fd3d3"} />
          {ch === "O" && hv % 4 === 0 && <Px l={u * 6} t={u} w={u * 0.8} h={u * 0.8} c="#ffffff" />}
          <Px l={u * 2 + off / 2} t={u * 3.8} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
          <Px l={u * 6 - off / 2} t={u * 7} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
        </>
      );
      break;
    }
    case "R":
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <Px key={ty} l={0} t={ty * u + u * 1.6} w={s} h={u * 0.4} c="#7a2519" />
          ))}
          {[0, 2, 4, 6].map((ty) => (
            <Px key={`h${ty}`} l={((ty / 2) % 2 ? 1 : 4) * u} t={ty * u} w={u * 0.4} h={u * 1.6} c="#7a2519" />
          ))}
          <Px l={0} t={0} w={s} h={u * 0.5} c="#c4553f" />
        </>
      );
      break;
    case "H":
      inner = (
        <>
          <Px l={u * 2} t={u * 1.5} w={u * 4} h={u * 4} c="#3a3a3a" />
          <Px l={u * 2.4} t={u * 1.9} w={u * 3.2} h={u * 3.2} c="#8fb8b8" />
          <Px l={u * 2.4} t={u * 1.9} w={u * 1.2} h={u * 1.2} c="#cfe6e6" />
          <Px l={u * 0.8} t={u * 1.5} w={u * 1.2} h={u * 4} c="#2e6b3a" />
          <Px l={u * 6} t={u * 1.5} w={u * 1.2} h={u * 4} c="#2e6b3a" />
          <Px l={0} t={u * 7.4} w={s} h={u * 0.6} c="#c9b48c" />
        </>
      );
      break;
    case "D":
      inner = (
        <>
          <Px l={u * 1.5} t={u * 1} w={u * 5} h={u * 7} c="#3e2a20" />
          <Px l={u * 2} t={u * 1.5} w={u * 4} h={u * 6.5} c="#6d4c41" />
          <Px l={u * 3.8} t={u * 1.5} w={u * 0.4} h={u * 6.5} c="#4e342e" />
          <Px l={u * 4.6} t={u * 4.5} w={u * 0.7} h={u * 0.7} c="#fbc02d" />
        </>
      );
      break;
    case "B":
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={0} t={ty * u + u * 1.7} w={s} h={u * 0.3} c="#5e2414" />
              <Px l={((ty / 2) % 2 ? 2 : 5) * u} t={ty * u} w={u * 0.3} h={u * 1.7} c="#5e2414" />
            </React.Fragment>
          ))}
          <Px l={u * 0.5} t={u * 0.3} w={u * 2} h={u * 0.5} c="#b0553a" />
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
  return <View style={{ width: s, height: s, backgroundColor: bg, overflow: "hidden" }}>{inner}</View>;
}

export const TileArt = memo(TileArtBase);
export const ANIMATED_TILES = new Set(["G", "W", "O", "Q"]);
