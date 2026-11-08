import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import React, { memo, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { GameMap, ITEMS } from "./data";
import { PixelSprite } from "./PixelSprite";
import { ANIMATED_TILES, TileArt } from "./TileArt";
import { PixelText } from "./ui";

type Props = {
  map: GameMap;
  px: number;
  py: number;
  dir: string;
  cols: number;
  rows: number;
  size: number;
  defeated: string[];
  picked: string[];
  stepMs?: number;
};

// The whole map is drawn once (memoised). Walking only moves the camera and the player with
// native-driven transforms, so a step never re-renders the 256 tiles.
const WEB = Platform.OS === "web";
// Tall things (trees, roofs, walls) cast a soft shadow on the ground tile just below them.
const TALL = new Set(["T", "R", "H", "B", "D"]);
const Ground = memo(function Ground({ map, size, phase }: { map: GameMap; size: number; phase: number }) {
  return (
    <>
      {map.tiles.map((row, y) => (
        <View key={y} style={st.row}>
          {row.split("").map((ch, x) => (
            <View key={x} style={{ width: size, height: size }}>
              <TileArt ch={ch} size={size} x={x} y={y} phase={ANIMATED_TILES.has(ch) ? phase : 0} shadow={!TALL.has(ch) && TALL.has(map.tiles[y - 1]?.[x] ?? "")} />
            </View>
          ))}
        </View>
      ))}
    </>
  );
});

const Actors = memo(function Actors({ map, size, defeated, picked }: { map: GameMap; size: number; defeated: string[]; picked: string[] }) {
  return (
    <>
      {(map.pickups ?? []).filter((p) => !picked.includes(p.id)).map((p) => (
        <View key={p.id} style={[st.actor, { left: p.x * size, top: p.y * size }]} testID={`pickup-${p.id}`}>
          <Bob size={size}>
            <View style={[st.sparkle, { width: size * 0.5, height: size * 0.5, left: size * 0.25, top: size * 0.25 }]} />
            <PixelSprite name={ITEMS[p.item].kind === "level" ? "caramella" : "vasetto"} size={size * 0.8} />
          </Bob>
        </View>
      ))}
      {map.npcs.map((npc) => {
        const beaten = defeated.includes(npc.id);
        return (
          <View key={npc.id} style={[st.actor, { left: npc.x * size, top: npc.y * size, width: size, height: size }]} testID={`npc-${npc.id}`}>
            <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
            <PixelSprite name="person" size={size} look={npc.look} />
            {(npc.kind === "heal" || npc.kind === "shop") && (
              <View style={[st.badge, { top: -size * 0.42, backgroundColor: npc.kind === "heal" ? "#2e7d32" : "#fbc02d" }]} testID={`marker-${npc.kind}-${npc.id}`}>
                <MaterialDesignIcons name={npc.kind === "heal" ? "heart-plus" : "cart"} size={11} color={npc.kind === "heal" ? "#ffffff" : "#1a1a1a"} />
                <PixelText style={[st.badgeTxt, { color: npc.kind === "heal" ? "#ffffff" : "#1a1a1a" }]}>{npc.kind === "heal" ? "CURA" : "MARKET"}</PixelText>
              </View>
            )}
            {(npc.kind === "trainer" || npc.kind === "boss") && (
              <View style={[st.badge, { top: -size * 0.42, backgroundColor: beaten ? "#2e7d32" : npc.kind === "boss" ? "#c0392b" : "#424242", opacity: beaten ? 0.7 : 1 }]} testID={`marker-${npc.kind}-${npc.id}`}>
                <MaterialDesignIcons name={beaten ? "check-bold" : npc.kind === "boss" ? "crown" : "sword-cross"} size={11} color="#ffffff" />
              </View>
            )}
          </View>
        );
      })}
    </>
  );
});

function Bob({ size, children }: { size: number; children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-size * 0.08, { duration: 500 }), withTiming(0, { duration: 500 })), -1);
  }, [size, y]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ alignItems: "center", justifyContent: "center", width: size, height: size }, s]}>{children}</Animated.View>;
}

const Player = memo(function Player({ dir, frame, size }: { dir: string; frame: number; size: number }) {
  const walk = frame % 2 === 1;
  const name = dir === "up" ? (walk ? "person_back_walk" : "person_back") : dir === "down" ? (walk ? "person_walk" : "person") : walk ? "person_side_walk" : "person_side";
  return (
    <>
      <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
      <PixelSprite name={name} size={size} flip={dir === "left"} />
    </>
  );
});

export function TileMap({ map, px, py, dir, cols, rows, size, defeated, picked, stepMs = 170 }: Props) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => 1 - p), 900);
    return () => clearInterval(t);
  }, []);
  const hx = Math.floor(cols / 2);
  const hy = Math.floor(rows / 2);
  const W = map.tiles[0].length, Hh = map.tiles.length;
  const clamp = (v: number, h: number, n: number, len: number) => (len >= n ? Math.max(h, Math.min(len - 1 - (n - 1 - h), v)) : Math.floor(len / 2));
  const camTx = -(clamp(px, hx, cols, W) - hx) * size;
  const camTy = -(clamp(py, hy, rows, Hh) - hy) * size;
  const camX = useSharedValue(camTx);
  const camY = useSharedValue(camTy);
  const plX = useSharedValue(px * size);
  const plY = useSharedValue(py * size);
  const bob = useSharedValue(0);
  const prev = useRef({ px, py, id: map.id, size });
  const [frame, setFrame] = useState(0);
  const p0 = prev.current;
  const jumpNow = p0.id !== map.id || p0.size !== size || Math.abs(px - p0.px) + Math.abs(py - p0.py) > 1;
  // Browsers (iPhone Safari): let the compositor animate with CSS transitions instead of JS frames.
  const webMove = (tx: number, ty: number) => ({
    transform: [{ translateX: tx }, { translateY: ty }],
    transitionProperty: "transform", transitionDuration: jumpNow ? "0ms" : `${stepMs}ms`, transitionTimingFunction: "linear", willChange: "transform",
  }) as any;
  useEffect(() => {
    const p = prev.current;
    const jump = p.id !== map.id || p.size !== size || Math.abs(px - p.px) + Math.abs(py - p.py) > 1;
    const moved = px !== p.px || py !== p.py;
    prev.current = { px, py, id: map.id, size };
    if (jump) {
      camX.value = camTx;
      camY.value = camTy;
      plX.value = px * size;
      plY.value = py * size;
      return;
    }
    if (!moved) return;
    setFrame((f) => f + 1);
    if (WEB) return;
    const ease = { duration: stepMs, easing: Easing.linear };
    camX.value = withTiming(camTx, ease);
    camY.value = withTiming(camTy, ease);
    plX.value = withTiming(px * size, ease);
    plY.value = withTiming(py * size, ease);
    bob.value = withSequence(withTiming(-size * 0.06, { duration: stepMs / 2 }), withTiming(0, { duration: stepMs / 2 }));
  }, [px, py, map.id, size, stepMs, camTx, camTy, camX, camY, plX, plY, bob]);
  const camStyle = useAnimatedStyle(() => ({ transform: [{ translateX: camX.value }, { translateY: camY.value }] }));
  const plStyle = useAnimatedStyle(() => ({ transform: [{ translateX: plX.value }, { translateY: plY.value + bob.value }] }));
  const offX = W < cols ? Math.floor((cols - W) / 2) * size : 0;
  const offY = Hh < rows ? Math.floor((rows - Hh) / 2) * size : 0;
  return (
    <View testID="tile-map" style={{ width: cols * size, height: rows * size, overflow: "hidden", backgroundColor: "#0b0b0b" }}>
      <Animated.View style={[{ position: "absolute", left: offX, top: offY, width: W * size, height: Hh * size }, WEB ? webMove(camTx, camTy) : camStyle]}>
        <Ground map={map} size={size} phase={phase} />
        <Actors map={map} size={size} defeated={defeated} picked={picked} />
        <Animated.View style={[st.actor, { width: size, height: size }, WEB ? webMove(px * size, py * size) : plStyle]} testID="player-sprite">
          <Player dir={dir} frame={frame} size={size} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row" },
  actor: { position: "absolute", left: 0, top: 0 },
  shadow: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" },
  sparkle: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,241,150,0.55)" },
  badge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 1, borderColor: "#1a1a1a" },
  badgeTxt: { fontSize: 8, lineHeight: 11 },
});
