import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { FONT } from "@/src/theme";

import { TypeId } from "./data";

// Pixel particle palettes per move type (fixed pixel-art colors).
const FX: Record<TypeId, { colors: string[]; shape: "square" | "streak" | "cloud" | "bubble" }> = {
  sugo: { colors: ["#c0392b", "#e0913a", "#8e1f14", "#f2c94c"], shape: "square" },
  terme: { colors: ["#8d6e63", "#ffffff", "#d7ccc8", "#5d4037"], shape: "cloud" },
  campi: { colors: ["#4caf50", "#2e7d32", "#7b1f3a", "#9ccc5a"], shape: "square" },
  motore: { colors: ["#fbc02d", "#ffffff", "#ffeb3b", "#f57f17"], shape: "streak" },
  nebbia: { colors: ["#cfd8dc", "#9e9e9e", "#eceff1", "#757575"], shape: "cloud" },
  chiacchiera: { colors: ["#ffffff", "#e0913a", "#f3e3b5", "#ffcc80"], shape: "bubble" },
};

function Particle({ i, n, color, shape }: { i: number; n: number; color: string; shape: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 520 + (i % 3) * 80, easing: Easing.out(Easing.quad) });
  }, [p, i]);
  const ang = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
  const dist = 34 + (i % 4) * 10;
  const st = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: Math.cos(ang) * dist * p.value },
      { translateY: Math.sin(ang) * dist * p.value - (shape === "cloud" ? 18 * p.value : 0) },
      { rotate: shape === "streak" ? `${(ang * 180) / Math.PI}deg` : "0deg" },
      { scale: shape === "cloud" ? 1 + p.value : 1 - p.value * 0.4 },
    ],
  }));
  const size = shape === "cloud" ? 12 : shape === "bubble" ? 9 : 7;
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: shape === "streak" ? 18 : size,
          height: shape === "streak" ? 4 : size,
          backgroundColor: color,
          borderWidth: shape === "bubble" ? 1 : 0,
          borderColor: "#1a1a1a",
        },
        st,
      ]}
    />
  );
}

// A short scene of its own for each type, under the particles and the damage number.
function Piece({ delay, dur, from, to, style, children }: { delay: number; dur: number; from: [number, number, number, number]; to: [number, number, number, number]; style: object; children?: React.ReactNode }) {
  // from/to: [x, y, scale, rotate°]; fades out at the end.
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(delay, withTiming(1, { duration: dur, easing: Easing.out(Easing.quad) })); }, [p, delay, dur]);
  const st = useAnimatedStyle(() => ({
    opacity: p.value === 0 ? 0 : p.value < 0.7 ? 1 : (1 - p.value) / 0.3,
    transform: [
      { translateX: from[0] + (to[0] - from[0]) * p.value },
      { translateY: from[1] + (to[1] - from[1]) * p.value },
      { scale: from[2] + (to[2] - from[2]) * p.value },
      { rotate: `${from[3] + (to[3] - from[3]) * p.value}deg` },
    ],
  }));
  return <Animated.View style={[styles.particle, style, st]}>{children}</Animated.View>;
}

function TypeShow({ type }: { type: TypeId }) {
  const r = (i: number, k: number) => ((i * 37 + k * 11) % 21) - 10;
  switch (type) {
    case "sugo": // thick sauce blobs splatting onto the target
      return <>{Array.from({ length: 6 }, (_, i) => (
        <Piece key={i} delay={i * 40} dur={420} from={[-70 + r(i, 1), -40 + r(i, 2), 0.6, 0]} to={[r(i, 3) * 2.4, r(i, 4) * 1.6, 1.5, 40]} style={{ width: 16, height: 12, borderRadius: 8, backgroundColor: i % 2 ? "#c0392b" : "#e0573a", borderWidth: 2, borderColor: "#7a1d12" }} />
      ))}</>;
    case "campi": // a whirl of leaves around the target
      return <>{Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <Piece key={i} delay={i * 30} dur={700} from={[Math.cos(a) * 60, Math.sin(a) * 40, 0.8, 0]} to={[Math.cos(a + 2.2) * 18, Math.sin(a + 2.2) * 14 - 20, 1.1, 300]} style={{ width: 12, height: 7, borderRadius: 6, backgroundColor: i % 3 ? "#5cb85c" : "#9ccc5a", borderWidth: 1, borderColor: "#2e6b2e" }} />;
      })}</>;
    case "terme": // steam columns and bubbles rising
      return <>{Array.from({ length: 7 }, (_, i) => (
        <Piece key={i} delay={i * 60} dur={800} from={[r(i, 1) * 3, 30, 0.6, 0]} to={[r(i, 1) * 3 + r(i, 5), -60, 1.8, 0]} style={{ width: i % 2 ? 22 : 12, height: i % 2 ? 22 : 12, borderRadius: 11, backgroundColor: i % 2 ? "rgba(255,255,255,0.75)" : "rgba(160,220,255,0.8)", borderWidth: i % 2 ? 0 : 1, borderColor: "#5aa8e8" }} />
      ))}</>;
    case "motore": // speed lines whooshing across, then an exhaust puff
      return <>
        {Array.from({ length: 6 }, (_, i) => (
          <Piece key={i} delay={i * 25} dur={300} from={[-120, -30 + i * 12, 1, 0]} to={[60, -30 + i * 12, 1, 0]} style={{ width: 46, height: 3, borderRadius: 2, backgroundColor: i % 2 ? "#ffffff" : "#fbc02d" }} />
        ))}
        <Piece delay={200} dur={600} from={[30, 10, 0.5, 0]} to={[50, -10, 2.2, 0]} style={{ width: 26, height: 20, borderRadius: 12, backgroundColor: "rgba(90,90,90,0.6)" }} />
      </>;
    case "nebbia": // fog banks wrapping the target
      return <>{Array.from({ length: 5 }, (_, i) => (
        <Piece key={i} delay={i * 70} dur={900} from={[(i % 2 ? 1 : -1) * 90, -20 + i * 12, 0.8, 0]} to={[(i % 2 ? 1 : -1) * 10, -20 + i * 12, 1.6, 0]} style={{ width: 60, height: 22, borderRadius: 11, backgroundColor: "rgba(230,235,240,0.85)" }} />
      ))}</>;
    case "chiacchiera": // speech bubbles popping up
      return <>{["Bla!", "Mo' dai!", "Ciò!"].map((t, i) => (
        <Piece key={i} delay={i * 120} dur={650} from={[-40 + i * 40, 10, 0.3, -8]} to={[-40 + i * 40, -50 - (i % 2) * 14, 1, 4]} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#1a1a1a" }}>
          <Animated.Text style={{ fontFamily: FONT, fontSize: 11, color: "#1a1a1a" }}>{t}</Animated.Text>
        </Piece>
      ))}</>;
  }
  return null;
}

export function HitFx({ type, dmg, crit, eff }: { type: TypeId; dmg: number; crit: boolean; eff: number }) {
  const conf = FX[type];
  const n = crit || eff > 1 ? 14 : 10;
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [pop]);
  const popStyle = useAnimatedStyle(() => ({
    opacity: pop.value < 0.75 ? 1 : (1 - pop.value) * 4,
    transform: [{ translateY: -40 * pop.value }, { scale: pop.value < 0.15 ? 0.6 + pop.value * 4 : 1.2 }],
  }));
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <TypeShow type={type} />
      {Array.from({ length: n }).map((_, i) => (
        <Particle key={i} i={i} n={n} color={conf.colors[i % conf.colors.length]} shape={conf.shape} />
      ))}
      <Animated.Text style={[styles.dmg, { color: eff > 1 ? "#fbc02d" : "#ffffff" }, popStyle]}>
        -{dmg}
        {crit ? "!" : ""}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  particle: { position: "absolute" },
  glow: { position: "absolute", width: 110, height: 110, borderRadius: 999, backgroundColor: "#66bb6a" },
  dmg: {
    position: "absolute",
    fontFamily: FONT,
    fontSize: 24,
    textShadowColor: "#1a1a1a",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});

function Spark({ i }: { i: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 900 + (i % 4) * 120, easing: Easing.out(Easing.quad) });
  }, [p, i]);
  const x = ((i * 37) % 80) - 40;
  const st = useAnimatedStyle(() => ({
    opacity: p.value < 0.7 ? 1 : (1 - p.value) * 3.3,
    transform: [{ translateX: x + Math.sin(p.value * 6 + i) * 6 }, { translateY: 30 - 90 * p.value }, { rotate: "45deg" }],
  }));
  return <Animated.View style={[styles.particle, { width: i % 3 ? 6 : 10, height: i % 3 ? 6 : 10, backgroundColor: ["#66bb6a", "#ffffff", "#b9f6ca", "#fbc02d"][i % 4] }, st]} />;
}

export function HealFx({ label }: { label?: string }) {
  const g = useSharedValue(0);
  useEffect(() => {
    g.value = withTiming(1, { duration: 1100 });
  }, [g]);
  const glow = useAnimatedStyle(() => ({ opacity: g.value < 0.3 ? g.value * 2 : (1 - g.value) * 0.85, transform: [{ scale: 0.6 + g.value * 0.8 }] }));
  return (
    <View pointerEvents="none" style={styles.wrap} testID="heal-fx">
      <Animated.View style={[styles.glow, glow]} />
      {Array.from({ length: 16 }).map((_, i) => (
        <Spark key={i} i={i} />
      ))}
      {!!label && <Animated.Text style={[styles.dmg, { color: "#b9f6ca" }, glow]}>{label}</Animated.Text>}
    </View>
  );
}

// Evolution scene: dark backdrop with turning rays, the old and new silhouettes swapping faster and
// faster, a white flash, then the new form in colour among sparkles.
export function EvolveScene({ from, to, size, Sprite }: { from: string; to: string; size: number; Sprite: (p: { name: string; size: number; silhouette?: boolean }) => React.ReactElement }) {
  const t = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 2800, easing: Easing.linear });
    spin.value = withTiming(1, { duration: 6000, easing: Easing.linear });
  }, [t, spin]);
  const swap = (k: 0 | 1) => (v: number) => {
    "worklet";
    if (v >= 0.86) return 0;
    const s = Math.sin(v * v * 60);
    return (s > 0 ? 1 : 0) === (k === 0 ? 1 : 0) ? 1 : 0;
  };
  const oldSt = useAnimatedStyle(() => ({ opacity: swap(0)(t.value), transform: [{ scale: 1 + Math.sin(t.value * 30) * 0.05 }] }));
  const newSil = useAnimatedStyle(() => ({ opacity: swap(1)(t.value), transform: [{ scale: 1 + Math.sin(t.value * 30) * 0.05 }] }));
  const reveal = useAnimatedStyle(() => ({ opacity: t.value < 0.88 ? 0 : 1, transform: [{ scale: t.value < 0.88 ? 0.6 : 1 + (1 - t.value) * 2 }] }));
  const flash = useAnimatedStyle(() => ({ opacity: t.value < 0.84 ? 0 : t.value < 0.9 ? (t.value - 0.84) / 0.06 : Math.max(0, 1 - (t.value - 0.9) / 0.1) }));
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }], opacity: 0.25 + t.value * 0.5 }));
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,8,40,0.88)", alignItems: "center", justifyContent: "center" }]} testID="evolve-scene">
      <Animated.View style={[{ position: "absolute", width: 420, height: 420, alignItems: "center", justifyContent: "center" }, rays]}>
        {Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={{ position: "absolute", width: 420, height: 14, backgroundColor: i % 2 ? "rgba(255,214,90,0.35)" : "rgba(255,255,255,0.18)", transform: [{ rotate: `${i * 15}deg` }] }} />
        ))}
      </Animated.View>
      <Animated.View style={[{ position: "absolute" }, oldSt]}><Sprite name={from} size={size} silhouette /></Animated.View>
      <Animated.View style={[{ position: "absolute" }, newSil]}><Sprite name={to} size={size} silhouette /></Animated.View>
      <Animated.View style={[{ position: "absolute" }, reveal]}><Sprite name={to} size={size} /></Animated.View>
      {Array.from({ length: 10 }, (_, i) => <Spark key={i} i={i} />)}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#ffffff" }, flash]} />
    </View>
  );
}
