import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

// Breathing (soft squash & stretch anchored at the feet) plus an occasional little hop.
export function Breathe({ size, children, delay = 0, hop = true, amount = 1 }: { size: number; children: React.ReactNode; delay?: number; hop?: boolean; amount?: number }) {
  const t = useSharedValue(0);
  const j = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true));
    if (hop) {
      j.value = withDelay(delay, withRepeat(withSequence(
        withDelay(2400, withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 190, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 260 }),
      ), -1));
    }
    return () => { cancelAnimation(t); cancelAnimation(j); };
  }, [delay, hop, t, j]);
  const style = useAnimatedStyle(() => {
    const sy = 1 + 0.05 * amount * t.value;
    const sx = 1 - 0.03 * amount * t.value;
    return { transform: [{ translateY: -size * 0.14 * j.value - ((sy - 1) * size) / 2 }, { scaleX: sx }, { scaleY: sy }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

export type DayPhase = "alba" | "giorno" | "tramonto" | "notte";

export function dayPhase(h: number): DayPhase {
  if (h >= 5 && h < 8) return "alba";
  if (h >= 8 && h < 18) return "giorno";
  if (h >= 18 && h < 21) return "tramonto";
  return "notte";
}

const TINT: Record<DayPhase, string | null> = {
  alba: "rgba(255,150,110,0.20)",
  giorno: null,
  tramonto: "rgba(255,95,40,0.28)",
  notte: "rgba(12,22,80,0.48)",
};

// Real-time lighting: follows the device clock, rechecked every minute.
export function useDayPhase() {
  const [p, setP] = useState<DayPhase>(() => dayPhase(new Date().getHours()));
  useEffect(() => {
    const id = setInterval(() => setP(dayPhase(new Date().getHours())), 60000);
    return () => clearInterval(id);
  }, []);
  return p;
}

export function DayNightOverlay() {
  const p = useDayPhase();
  const tint = TINT[p];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`daynight-${p}`}>
      {tint && <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
    </View>
  );
}
