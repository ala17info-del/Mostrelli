import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

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
  dmg: {
    position: "absolute",
    fontFamily: FONT,
    fontSize: 24,
    textShadowColor: "#1a1a1a",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});
