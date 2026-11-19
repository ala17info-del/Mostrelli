// Weather in battle, tied to the place: fog in the Bassa, sun at the seaside, snow in the Apennines,
// wind on the hills, muggy heat in town. Each one boosts one type; fog also lowers accuracy.
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";

import { MAPS, TypeId } from "./data";

export type Weather = "nebbia" | "sole" | "neve" | "vento" | "afa";
export const WEATHER: Record<Weather, { label: string; boost: TypeId; intro: string; accMod: number }> = {
  nebbia: { label: "Nebbia", boost: "nebbia", accMod: -10, intro: "Cala un nebbione da tagliare col coltello: si vede poco e i Mostrelli Nebbia si scatenano!" },
  sole: { label: "Solleone", boost: "terme", accMod: 0, intro: "Il sole picchia forte: i Mostrelli Terme sono in gran forma!" },
  neve: { label: "Neve", boost: "terme", accMod: 0, intro: "Nevica! Chi ha le acque calde delle Terme si sente a casa." },
  vento: { label: "Vento", boost: "campi", accMod: 0, intro: "Tira un bel vento tra le colline: i Mostrelli Campi prendono forza!" },
  afa: { label: "Afa", boost: "chiacchiera", accMod: 0, intro: "Che afa in città! Tutti si lamentano e i Mostrelli Chiacchiera ne approfittano." },
};
export const WEATHER_BOOST = 1.25;

const BY_TERRAIN: Record<string, Weather> = { p: "nebbia", f: "nebbia", m: "sole", a: "neve", h: "vento", c: "afa" };
const BY_MAP: Record<string, Weather> = { ferrara: "nebbia", altedo: "nebbia", maggiore: "nebbia", riviera: "sole", ravenna: "sole", bologna: "afa", modena: "afa", parma: "afa", imola: "vento", csp: "vento", osteria: "vento" };

/** About half of the battles in a place have its typical weather. */
export function weatherFor(mapId: string): Weather | undefined {
  const m = MAPS[mapId];
  const w = BY_MAP[mapId] ?? (m?.terrain ? BY_TERRAIN[m.terrain] : undefined);
  return w && Math.random() < 0.5 ? w : undefined;
}

export const weatherMult = (w: Weather | undefined, type: TypeId) => (w && WEATHER[w].boost === type ? WEATHER_BOOST : 1);

function Flake({ i, kind, w, h }: { i: number; kind: "neve" | "vento"; w: number; h: number }) {
  const t = useSharedValue(0);
  const x0 = useMemo(() => Math.random() * w, [w]);
  const dur = kind === "neve" ? 2600 + (i % 5) * 400 : 900 + (i % 4) * 200;
  useEffect(() => {
    t.value = withDelay((i * 173) % 1500, withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1));
    return () => cancelAnimation(t);
  }, [t, i, dur]);
  const s = useAnimatedStyle(() =>
    kind === "neve"
      ? { transform: [{ translateX: x0 + Math.sin(t.value * 6 + i) * 12 }, { translateY: -10 + t.value * (h + 20) }] }
      : { transform: [{ translateX: -40 + t.value * (w + 80) }, { translateY: (x0 / w) * h }] },
  );
  return <Animated.View style={[kind === "neve" ? st.flake : st.gust, s]} />;
}

function Fog() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [t]);
  const a = useAnimatedStyle(() => ({ opacity: 0.35 + t.value * 0.2, transform: [{ translateX: -30 + t.value * 60 }] }));
  const b = useAnimatedStyle(() => ({ opacity: 0.25 + (1 - t.value) * 0.2, transform: [{ translateX: 30 - t.value * 60 }] }));
  return (
    <>
      <Animated.View style={[st.fog, { top: "15%" }, a]} />
      <Animated.View style={[st.fog, { top: "50%" }, b]} />
    </>
  );
}

export function WeatherLayer({ weather, w, h }: { weather?: Weather; w: number; h: number }) {
  if (!weather) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={`battle-weather-${weather}`}>
      {weather === "nebbia" && <Fog />}
      {weather === "sole" && <View style={st.sun} />}
      {weather === "afa" && <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,170,60,0.12)" }]} />}
      {(weather === "neve" || weather === "vento") && Array.from({ length: weather === "neve" ? 22 : 8 }, (_, i) => <Flake key={i} i={i} kind={weather} w={w} h={h} />)}
    </View>
  );
}

const st = StyleSheet.create({
  fog: { position: "absolute", left: "-20%", width: "140%", height: "35%", borderRadius: 999, backgroundColor: "rgba(235,238,240,0.9)" },
  sun: { position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,230,140,0.35)" },
  flake: { position: "absolute", left: 0, top: 0, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.9)" },
  gust: { position: "absolute", left: 0, top: 0, width: 40, height: 2, backgroundColor: "rgba(255,255,255,0.6)" },
});
