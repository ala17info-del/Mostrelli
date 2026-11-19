// Timed commands in battle (in the spirit of action RPGs): one tap to strike, one tap to guard.
// Attack: stop the cursor in the gold band. Guard: tap when the shrinking ring meets the shield.
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from "react-native-reanimated";

import { colors } from "@/src/theme";

import { hap, PixelText } from "./ui";

import { Grade } from "./engine";

export { ATK_MULT, GUARD_MULT } from "./engine";
export type { Grade } from "./engine";

const ATK_MS = 1150;
const GUARD_MS = 950;

export function TimedCommand({ moveName, guard, onDone }: { moveName: string; guard: boolean; onDone: (atk: Grade, grd: Grade) => void }) {
  const [stage, setStage] = useState<"atk" | "grd">("atk");
  const [result, setResult] = useState<Grade | null>(null);
  const atkGrade = useRef<Grade>("mancato");
  const cursor = useSharedValue(0);
  const ring = useSharedValue(0);
  // Gold band position changes every turn so it never becomes muscle memory.
  const band = useRef(0.52 + Math.random() * 0.26).current;
  const done = useRef(false);

  const finishAtk = (g: Grade) => {
    atkGrade.current = g;
    setResult(g);
    if (g === "perfetto") hap("success"); else if (g === "buono") hap("medium");
    setTimeout(() => {
      setResult(null);
      if (guard) setStage("grd");
      else end("mancato");
    }, 380);
  };
  const end = (g: Grade) => {
    if (done.current) return;
    done.current = true;
    onDone(atkGrade.current, g);
  };

  useEffect(() => {
    if (stage === "atk") {
      cursor.value = 0;
      cursor.value = withTiming(1, { duration: ATK_MS, easing: Easing.linear });
      const t = setTimeout(() => { if (stage === "atk" && !result) finishAtk("mancato"); }, ATK_MS + 60);
      return () => { clearTimeout(t); cancelAnimation(cursor); };
    }
    ring.value = 0;
    ring.value = withTiming(1, { duration: GUARD_MS, easing: Easing.in(Easing.quad) });
    const t = setTimeout(() => { setResult("mancato"); setTimeout(() => end("mancato"), 300); }, GUARD_MS + 60);
    return () => { clearTimeout(t); cancelAnimation(ring); };
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = () => {
    if (result) return;
    if (stage === "atk") {
      const d = Math.abs(cursor.value - band);
      cancelAnimation(cursor);
      finishAtk(d < 0.055 ? "perfetto" : d < 0.14 ? "buono" : "mancato");
    } else {
      // Ring scale goes 2.4 -> 0.4; the shield edge is at scale 1 (ring.value 0.7).
      const d = Math.abs(ring.value - 0.7);
      cancelAnimation(ring);
      const g: Grade = d < 0.07 ? "perfetto" : d < 0.16 ? "buono" : "mancato";
      setResult(g);
      if (g === "perfetto") hap("success"); else if (g === "buono") hap("medium");
      setTimeout(() => end(g), 360);
    }
  };

  // Keyboard on computers: Space / Enter / Z taps.
  const tapRef = useRef(tap);
  tapRef.current = tap;
  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) return;
    const on = (e: KeyboardEvent) => { if (!e.repeat && ["z", "Z", "Enter", " "].includes(e.key)) { e.preventDefault(); tapRef.current(); } };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({ left: `${cursor.value * 100}%` }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: 2.4 - ring.value * 2 }], opacity: ring.value < 0.95 ? 1 : 0.3 }));

  return (
    <Pressable testID="battle-qte" onPressIn={tap} style={st.box}>
      <PixelText style={st.title}>{stage === "atk" ? `${moveName}: tocca nella zona d'oro!` : "Para! Tocca quando il cerchio tocca lo scudo"}</PixelText>
      {stage === "atk" ? (
        <View style={st.bar}>
          <View style={[st.good, { left: `${(band - 0.14) * 100}%`, width: "28%" }]} />
          <View style={[st.gold, { left: `${(band - 0.055) * 100}%`, width: "11%" }]} />
          <Animated.View style={[st.cursor, cursorStyle]} />
        </View>
      ) : (
        <View style={st.guardArea}>
          <View style={st.shield}><PixelText style={st.shieldTxt}>🛡</PixelText></View>
          <Animated.View style={[st.ring, ringStyle]} />
        </View>
      )}
      {result && (
        <Animated.View entering={ZoomIn.duration(160)} style={st.resultWrap}>
          <PixelText style={[st.result, { color: result === "perfetto" ? "#f2c94c" : result === "buono" ? colors.brandTertiary : colors.muted }]}>
            {result === "perfetto" ? (stage === "atk" ? "PERFETTO!" : "PARATA PERFETTA!") : result === "buono" ? "BUONO!" : "Mancato..."}
          </PixelText>
        </Animated.View>
      )}
      <Animated.View entering={FadeIn.delay(300)}><PixelText style={st.hint}>Tocca ovunque in questo riquadro</PixelText></Animated.View>
    </Pressable>
  );
}

// Charge gauge: perfect hits fill it; when full the special move is ready.
export function ChargeGauge({ value, max }: { value: number; max: number }) {
  return (
    <View style={st.gauge} testID="battle-charge">
      <PixelText style={st.gaugeTxt}>CARICA</PixelText>
      {Array.from({ length: max }, (_, i) => (
        <View key={i} style={[st.pip, i < value && st.pipOn]} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  box: { minHeight: 150, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, padding: 14, gap: 12, justifyContent: "center" },
  title: { fontSize: 14, textAlign: "center" },
  bar: { height: 34, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  good: { position: "absolute", top: 0, bottom: 0, backgroundColor: "rgba(76,175,80,0.45)" },
  gold: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#f2c94c" },
  cursor: { position: "absolute", top: -2, bottom: -2, width: 6, marginLeft: -3, backgroundColor: colors.onSurface },
  guardArea: { height: 90, alignItems: "center", justifyContent: "center" },
  shield: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: "#f2c94c", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  shieldTxt: { fontSize: 24 },
  ring: { position: "absolute", width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: colors.brandPrimary },
  resultWrap: { position: "absolute", left: 0, right: 0, top: 8, alignItems: "center" },
  result: { fontSize: 20, letterSpacing: 2 },
  hint: { fontSize: 10, color: colors.muted, textAlign: "center" },
  gauge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  gaugeTxt: { fontSize: 10, color: colors.muted, marginRight: 2 },
  pip: { width: 14, height: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceTertiary },
  pipOn: { backgroundColor: "#f2c94c" },
});
