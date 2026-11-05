import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import { GameMap } from "./data";
import { PixelSprite } from "./PixelSprite";

const TILE_BG: Record<string, string> = {
  ",": "#7cb342", G: "#3f8f3a", T: "#7cb342", ".": "#d7b98a", C: "#b8a68e", P: "#b5562f",
  W: "#2a8a8a", R: "#a83a2a", H: "#e8d5b0", D: "#e8d5b0", B: "#8d3b23", F: "#7cb342",
  S: "#7cb342", A: "#4a4a4a", X: "#0b0b0b",
};

const Tile = memo(function Tile({ ch, size }: { ch: string; size: number }) {
  const s = size;
  const bg = TILE_BG[ch] ?? TILE_BG.X;
  return (
    <View style={{ width: s, height: s, backgroundColor: bg, overflow: "hidden" }}>
      {ch === "G" && (
        <>
          <View style={[st.blade, { left: s * 0.15, top: s * 0.25, width: s * 0.12, height: s * 0.4 }]} />
          <View style={[st.blade, { left: s * 0.45, top: s * 0.45, width: s * 0.12, height: s * 0.4 }]} />
          <View style={[st.blade, { left: s * 0.72, top: s * 0.15, width: s * 0.12, height: s * 0.4 }]} />
        </>
      )}
      {ch === "T" && (
        <>
          <View style={{ position: "absolute", left: s * 0.42, top: s * 0.6, width: s * 0.16, height: s * 0.35, backgroundColor: "#5d3a1a" }} />
          <View style={{ position: "absolute", left: s * 0.1, top: s * 0.05, width: s * 0.8, height: s * 0.65, borderRadius: s * 0.3, backgroundColor: "#1f5e2a", borderWidth: 2, borderColor: "#123d1a" }} />
        </>
      )}
      {ch === "F" && (
        <>
          <View style={[st.dot, { left: s * 0.2, top: s * 0.25, backgroundColor: "#fbc02d", width: s * 0.18, height: s * 0.18 }]} />
          <View style={[st.dot, { left: s * 0.6, top: s * 0.6, backgroundColor: "#f4a6b0", width: s * 0.18, height: s * 0.18 }]} />
        </>
      )}
      {ch === "C" && <View style={{ position: "absolute", inset: 0, borderWidth: 1, borderColor: "#9c8a72" }} />}
      {ch === "P" && <View style={{ position: "absolute", left: s * 0.2, top: s * 0.3, width: s * 0.6, height: s * 0.7, backgroundColor: "#6e2e17", borderTopLeftRadius: s * 0.3, borderTopRightRadius: s * 0.3 }} />}
      {ch === "W" && <View style={{ position: "absolute", left: s * 0.15, top: s * 0.4, width: s * 0.5, height: 2, backgroundColor: "#8fd3d3" }} />}
      {ch === "R" && <View style={{ position: "absolute", left: 0, right: 0, top: s * 0.5, height: 2, backgroundColor: "#7a2519" }} />}
      {ch === "H" && <View style={{ position: "absolute", left: s * 0.3, top: s * 0.25, width: s * 0.4, height: s * 0.35, backgroundColor: "#5b7a7a", borderWidth: 1, borderColor: "#3a3a3a" }} />}
      {ch === "D" && <View style={{ position: "absolute", left: s * 0.25, top: s * 0.2, width: s * 0.5, height: s * 0.8, backgroundColor: "#6d4c41" }} />}
      {ch === "B" && <View style={{ position: "absolute", left: s * 0.3, top: s * 0.2, width: s * 0.4, height: s * 0.2, backgroundColor: "#2a1208" }} />}
      {ch === "A" && <View style={{ position: "absolute", left: s * 0.3, top: s * 0.47, width: s * 0.4, height: 2, backgroundColor: "#f5f5f5" }} />}
      {ch === "S" && (
        <>
          <View style={{ position: "absolute", left: s * 0.44, top: s * 0.5, width: s * 0.12, height: s * 0.45, backgroundColor: "#4e2e18" }} />
          <View style={{ position: "absolute", left: s * 0.15, top: s * 0.15, width: s * 0.7, height: s * 0.4, backgroundColor: "#a0703c", borderWidth: 2, borderColor: "#4e2e18" }} />
        </>
      )}
    </View>
  );
});

type Props = {
  map: GameMap;
  px: number;
  py: number;
  dir: string;
  cols: number;
  rows: number;
  size: number;
  defeated: string[];
};

export function TileMap({ map, px, py, dir, cols, rows, size }: Props) {
  const hx = Math.floor(cols / 2);
  const hy = Math.floor(rows / 2);
  const W = map.tiles[0].length, Hh = map.tiles.length;
  const clamp = (v: number, h: number, n: number, len: number) => (len >= n ? Math.max(h, Math.min(len - 1 - (n - 1 - h), v)) : Math.floor(len / 2));
  const cx = clamp(px, hx, cols, W);
  const cy = clamp(py, hy, rows, Hh);
  const npcAt: Record<string, (typeof map.npcs)[number]> = {};
  for (const n of map.npcs) npcAt[`${n.x},${n.y}`] = n;
  const out = [];
  for (let r = 0; r < rows; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      const x = cx - hx + c;
      const y = cy - hy + r;
      const ch = map.tiles[y]?.[x] ?? "X";
      const npc = npcAt[`${x},${y}`];
      const isMe = x === px && y === py;
      cells.push(
        <View key={c} style={{ width: size, height: size }}>
          <Tile ch={ch} size={size} />
          {npc && (
            <View style={st.actor} testID={`npc-${npc.id}`}>
              <PixelSprite name="person" size={size} look={npc.look} />
            </View>
          )}
          {isMe && (
            <View style={st.actor} testID="player-sprite">
              <PixelSprite name="person" size={size} flip={dir === "left"} />
            </View>
          )}
        </View>,
      );
    }
    out.push(
      <View key={r} style={{ flexDirection: "row" }}>
        {cells}
      </View>,
    );
  }
  return <View testID="tile-map">{out}</View>;
}

const st = StyleSheet.create({
  blade: { position: "absolute", backgroundColor: "#245e24" },
  dot: { position: "absolute", borderRadius: 999 },
  actor: { position: "absolute", left: 0, top: 0 },
});
