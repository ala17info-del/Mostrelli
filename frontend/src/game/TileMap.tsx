import React, { useEffect, useRef, useState } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
  stepMs?: number;
};

export function TileMap({ map, px, py, dir, cols, rows, size, defeated, stepMs = 170 }: Props) {
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
  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const plX = useSharedValue((px - cx + hx) * size);
  const plY = useSharedValue((py - cy + hy) * size);
  const prev = useRef({ cx, cy, px, py, id: map.id });
  useEffect(() => {
    const p = prev.current;
    const jump = p.id !== map.id || Math.abs(px - p.px) + Math.abs(py - p.py) > 1;
    const dx = cx - p.cx, dy = cy - p.cy;
    prev.current = { cx, cy, px, py, id: map.id };
    const ease = { duration: stepMs, easing: Easing.linear };
    const tx = (px - cx + hx) * size, ty = (py - cy + hy) * size;
    if (jump) {
      camX.value = 0;
      camY.value = 0;
      plX.value = tx;
      plY.value = ty;
      return;
    }
    if (dx || dy) {
      camX.value = dx * size;
      camY.value = dy * size;
      camX.value = withTiming(0, ease);
      camY.value = withTiming(0, ease);
    }
    plX.value = withTiming(tx, ease);
    plY.value = withTiming(ty, ease);
  }, [cx, cy, px, py, map.id, size, hx, hy, stepMs, camX, camY, plX, plY]);
  const camStyle = useAnimatedStyle(() => ({ transform: [{ translateX: camX.value }, { translateY: camY.value }] }));
  const plStyle = useAnimatedStyle(() => ({ transform: [{ translateX: plX.value }, { translateY: plY.value }] }));
  const npcAt: Record<string, (typeof map.npcs)[number]> = {};
  for (const n of map.npcs) npcAt[`${n.x},${n.y}`] = n;
  const out = [];
  for (let r = -1; r <= rows; r++) {
    const cells = [];
    for (let c = -1; c <= cols; c++) {
      const x = cx - hx + c;
      const y = cy - hy + r;
      const ch = map.tiles[y]?.[x] ?? "X";
      const npc = npcAt[`${x},${y}`];
      cells.push(
        <View key={c} style={{ width: size, height: size }}>
          <TileArt ch={ch} size={size} x={x} y={y} phase={ANIMATED_TILES.has(ch) ? phase : 0} />
          {npc && <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />}
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

        </View>,
      );
    }
    out.push(
      <View key={r} style={{ flexDirection: "row" }}>
        {cells}
      </View>,
    );
  }
  return (
    <View testID="tile-map" style={{ width: cols * size, height: rows * size, overflow: "hidden" }}>
      <Animated.View style={[{ position: "absolute", left: -size, top: -size }, camStyle]}>{out}</Animated.View>
      <Animated.View style={[st.actor, plStyle]} testID="player-sprite">
        <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
        <PixelSprite name={playerSprite} size={size} flip={dir === "left"} />
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  blade: { position: "absolute", backgroundColor: "#245e24" },
  dot: { position: "absolute", borderRadius: 999 },
  actor: { position: "absolute", left: 0, top: 0 },
  shadow: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" },
  badge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 1, borderColor: "#1a1a1a" },
  badgeTxt: { fontSize: 8, lineHeight: 11 },
});
