import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { GameMap } from "./data";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

import { PixelSprite } from "./PixelSprite";
import { PixelText } from "./ui";
import { ANIMATED_TILES, TileArt } from "./TileArt";

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

export function TileMap({ map, px, py, dir, cols, rows, size, defeated }: Props) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => 1 - p), 650);
    return () => clearInterval(t);
  }, []);
  const playerSprite = dir === "up" ? "person_back" : (px + py) % 2 ? "person_walk" : "person";
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
          <TileArt ch={ch} size={size} x={x} y={y} phase={ANIMATED_TILES.has(ch) ? phase : 0} />
          {(npc || isMe) && <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />}
          {npc && (
            <View style={st.actor} testID={`npc-${npc.id}`}>
              <PixelSprite name="person" size={size} look={npc.look} />
            </View>
          )}
          {npc && (npc.kind === "heal" || npc.kind === "shop") && (
            <View style={[st.badge, { top: -size * 0.42, backgroundColor: npc.kind === "heal" ? "#2e7d32" : "#fbc02d" }]} testID={`marker-${npc.kind}-${npc.id}`}>
              <MaterialDesignIcons name={npc.kind === "heal" ? "heart-plus" : "cart"} size={11} color={npc.kind === "heal" ? "#ffffff" : "#1a1a1a"} />
              <PixelText style={[st.badgeTxt, { color: npc.kind === "heal" ? "#ffffff" : "#1a1a1a" }]}>{npc.kind === "heal" ? "CURA" : "MARKET"}</PixelText>
            </View>
          )}
          {npc && (npc.kind === "trainer" || npc.kind === "boss") && (
            <View style={[st.badge, { top: -size * 0.42, backgroundColor: defeated.includes(npc.id) ? "#2e7d32" : npc.kind === "boss" ? "#c0392b" : "#424242", opacity: defeated.includes(npc.id) ? 0.7 : 1 }]} testID={`marker-${npc.kind}-${npc.id}`}>
              <MaterialDesignIcons name={defeated.includes(npc.id) ? "check-bold" : npc.kind === "boss" ? "crown" : "sword-cross"} size={11} color="#ffffff" />
            </View>
          )}
          {isMe && (
            <View style={st.actor} testID="player-sprite">
              <PixelSprite name={playerSprite} size={size} flip={dir === "left"} />
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
  shadow: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" },
  badge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 1, borderColor: "#1a1a1a" },
  badgeTxt: { fontSize: 8, lineHeight: 11 },
});
