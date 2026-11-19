import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { INTRO_LINES, SPECIES, STARTERS, TYPES } from "@/src/game/data";
import { newSave, useGame } from "@/src/game/GameContext";
import { PixelSprite } from "@/src/game/PixelSprite";
import { hap, PixelText, RetroButton } from "@/src/game/ui";
import { colors, FONT } from "@/src/theme";

// The restaurant scene: three covered plates on the counter, Prof. Albe behind it. Tap a plate:
// the silver cloche lifts and the Mostrello under it hops out.
const PLATE_W = 96;
function Plate({ s, open, onPress, i }: { s: string; open: boolean; onPress: () => void; i: number }) {
  const lift = useSharedValue(0);
  const idle = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    idle.value = withDelay(i * 220, withRepeat(withSequence(withTiming(-3, { duration: 700 }), withTiming(0, { duration: 700 })), -1));
  }, [idle, i]);
  useEffect(() => {
    lift.value = withTiming(open ? 1 : 0, { duration: 380, easing: Easing.out(Easing.back(1.4)) });
    if (open) hop.value = withDelay(250, withRepeat(withSequence(withTiming(-10, { duration: 220, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) })), -1));
    else hop.value = withTiming(0, { duration: 150 });
  }, [open, lift, hop]);
  const cloche = useAnimatedStyle(() => ({ transform: [{ translateY: -60 * lift.value + (1 - lift.value) * idle.value }, { rotate: `${-14 * lift.value}deg` }], opacity: 1 - lift.value * 0.85 }));
  const mon = useAnimatedStyle(() => ({ opacity: lift.value, transform: [{ translateY: hop.value + (1 - lift.value) * 14 }, { scale: 0.6 + 0.4 * lift.value }] }));
  return (
    <Pressable testID={`intro-starter-${s}`} onPress={onPress} style={styles.plateWrap}>
      <View style={styles.plate}><View style={styles.plateIn} /></View>
      <Animated.View style={[styles.monOnPlate, mon]}><PixelSprite name={s} size={60} /></Animated.View>
      <Animated.View style={[styles.cloche, cloche]}>
        <View style={styles.clocheKnob} />
        <View style={styles.clocheDome}><View style={styles.clocheShine} /></View>
        <View style={styles.clocheRim} />
      </Animated.View>
    </Pressable>
  );
}

export default function Intro() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { setSave, flush } = useGame();
  const [line, setLine] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"m" | "f">("m");
  const [step, setStep] = useState<"who" | "dish">("who");
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <Redirect href="/" />;

  const talking = line < INTRO_LINES.length;
  const start = async () => {
    if (!pick || !name.trim()) return;
    setBusy(true);
    setSave(newSave(name.trim().slice(0, 12), pick, { map: "bologna", gender, lv: 5 }));
    await flush();
    router.replace("/game");
  };
  const sp = pick ? SPECIES[pick] : null;

  if (step === "dish") {
    return (
      <View style={styles.root} testID="intro-screen">
        <View style={[styles.room, { paddingTop: insets.top + 12 }]}>
          {/* back wall: sign, shelves with jars and bottles, a hanging prosciutto */}
          <View style={styles.wall}>
            <View style={styles.sign}><PixelText style={styles.signTxt}>TRATTORIA DA ALBE</PixelText></View>
            <View style={styles.shelfRow}>
              {[0, 1].map((k) => (
                <View key={k} style={styles.shelf}>
                  {["#c0392b", "#2e7d32", "#fbc02d", "#7b1f3a", "#e0913a"].map((c, j) => <View key={j} style={[styles.bottle, { backgroundColor: c, height: 18 + ((j + k) % 3) * 5 }]} />)}
                </View>
              ))}
            </View>
          </View>
          {/* checkered floor */}
          <View style={styles.floor}>
            {Array.from({ length: 14 }, (_, r) => (
              <View key={r} style={{ flexDirection: "row" }}>
                {Array.from({ length: 8 }, (_, c) => <View key={c} style={[styles.floorTile, (r + c) % 2 === 0 && styles.floorTileDark]} />)}
              </View>
            ))}
          </View>
          {/* Prof. Albe behind the counter, the counter with three plates, the player in front */}
          <View style={styles.albe}><PixelSprite name="prof_albe" size={64} /></View>
          <View style={styles.counter}>
            <View style={styles.cloth} />
            <View style={styles.plates}>
              {STARTERS.map((s, i) => <Plate key={s} s={s} i={i} open={pick === s} onPress={() => { hap("medium"); setPick(pick === s ? null : s); }} />)}
            </View>
          </View>
          <View style={styles.player}><PixelSprite name={gender === "f" ? "person_back_f" : "person_back"} size={56} /></View>
        </View>
        <View style={[styles.box, { marginBottom: insets.bottom + 12 }]} testID="intro-dish-box">
          {(["tl", "tr", "bl", "br"] as const).map((k) => <View key={k} style={[styles.boxDot, k[0] === "t" ? { top: -5 } : { bottom: -5 }, k[1] === "l" ? { left: -5 } : { right: -5 }]} />)}
          {!sp ? (
            <PixelText style={styles.boxTxt}>
              <PixelText style={styles.boxName}>Prof. Albe: </PixelText>
              Ecco i tre piatti della casa, {name.trim()}! Sotto ogni campana c'è un Mostrello. Ogni viaggio comincia con una <PixelText style={{ color: colors.brandPrimary }}>scelta</PixelText>.
            </PixelText>
          ) : (
            <Animated.View key={pick} entering={FadeIn.duration(200)} style={{ gap: 8 }}>
              <PixelText style={styles.boxTxt}>
                <PixelText style={styles.boxName}>{sp.name}</PixelText>
                <PixelText style={{ color: TYPES[sp.type].color }}> · tipo {TYPES[sp.type].name}</PixelText>
                {"\n"}{sp.desc}
              </PixelText>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <RetroButton testID="intro-start-btn" label={busy ? "..." : `Scelgo ${sp.name}!`} disabled={busy} onPress={start} style={{ flex: 1 }} small />
                <RetroButton testID="intro-close-btn" variant="ghost" label="Ci penso" onPress={() => setPick(null)} small />
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="intro-screen">
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.prof}>
          <View style={styles.profRing}><PixelSprite name="prof_albe" size={96} /></View>
          <PixelText style={styles.profName}>Prof. Albe</PixelText>
        </View>
        {talking ? (
          <Pressable testID="intro-dialog" onPress={() => { hap("selection"); setLine(line + 1); }} style={styles.dialog}>
            <Animated.View key={line} entering={FadeIn.duration(200)}>
              <PixelText style={styles.dialogTxt}>{INTRO_LINES[line]}</PixelText>
            </Animated.View>
            <PixelText style={styles.next}>▼ tocca</PixelText>
          </Pressable>
        ) : (
          <Animated.View entering={FadeIn.duration(250)} style={{ gap: 14 }}>
            <PixelText style={styles.label}>Come ti chiami?</PixelText>
            <TextInput testID="intro-name-input" style={styles.input} value={name} onChangeText={setName} maxLength={12} placeholder="es. Rossella" placeholderTextColor={colors.muted} />
            <PixelText style={styles.label}>Chi sei?</PixelText>
            <View style={styles.row}>
              {(["m", "f"] as const).map((g) => (
                <Pressable key={g} testID={`intro-gender-${g}`} onPress={() => { hap("selection"); setGender(g); }} style={[styles.who, gender === g && styles.on]}>
                  <PixelSprite name={g === "f" ? "person_f" : "person"} size={72} />
                  <PixelText style={styles.cardName}>{g === "f" ? "Ragazza" : "Ragazzo"}</PixelText>
                </Pressable>
              ))}
            </View>
            <RetroButton testID="intro-next-btn" label="Andiamo in trattoria!" disabled={!name.trim()} onPress={() => { hap("selection"); setStep("dish"); }} />
          </Animated.View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  prof: { alignItems: "center", marginBottom: 20 },
  room: { flex: 1, alignItems: "center", overflow: "hidden" },
  wall: { position: "absolute", left: 0, right: 0, top: 0, height: "38%", backgroundColor: "#f3e1b6", borderBottomWidth: 8, borderBottomColor: "#a0703c", alignItems: "center", justifyContent: "flex-end", paddingBottom: 14, gap: 10 },
  sign: { backgroundColor: "#7a4a22", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 3, borderColor: "#c88a4a" },
  signTxt: { color: "#ffe9b8", fontSize: 13, letterSpacing: 2 },
  shelfRow: { flexDirection: "row", gap: 40 },
  shelf: { flexDirection: "row", alignItems: "flex-end", gap: 5, paddingHorizontal: 8, paddingBottom: 4, borderBottomWidth: 5, borderBottomColor: "#8a5a30" },
  bottle: { width: 10, borderRadius: 4, borderWidth: 1, borderColor: "rgba(0,0,0,0.3)" },
  floor: { position: "absolute", left: 0, right: 0, top: "38%", bottom: 0, overflow: "hidden" },
  floorTile: { flex: 1, aspectRatio: 1, backgroundColor: "#e9c48f" },
  floorTileDark: { backgroundColor: "#c9844d" },
  albe: { position: "absolute", top: "30%" },
  counter: { position: "absolute", top: "44%", width: 340, height: 120, alignItems: "center", justifyContent: "center" },
  cloth: { position: "absolute", left: 0, right: 0, top: 18, bottom: 0, backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 4, borderColor: "#d84a3a", borderBottomWidth: 12 },
  plates: { flexDirection: "row", gap: 14, marginTop: -10 },
  plateWrap: { width: PLATE_W, height: 110, alignItems: "center", justifyContent: "flex-end" },
  plate: { width: 86, height: 30, borderRadius: 43, backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#c9c9c9", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  plateIn: { width: 58, height: 18, borderRadius: 29, backgroundColor: "#f2f2f2", borderWidth: 1, borderColor: "#dddddd" },
  monOnPlate: { position: "absolute", bottom: 26 },
  cloche: { position: "absolute", bottom: 26, alignItems: "center" },
  clocheKnob: { width: 14, height: 10, borderRadius: 7, backgroundColor: "#8f98a3", marginBottom: -2 },
  clocheDome: { width: 74, height: 50, borderTopLeftRadius: 37, borderTopRightRadius: 37, backgroundColor: "#c4ccd6", borderWidth: 2, borderColor: "#7f8994", overflow: "hidden" },
  clocheShine: { position: "absolute", left: 12, top: 8, width: 14, height: 22, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.75)" },
  clocheRim: { width: 84, height: 7, borderRadius: 4, backgroundColor: "#7f8994" },
  player: { position: "absolute", top: "70%" },
  box: { marginHorizontal: 12, padding: 16, minHeight: 130, borderRadius: 16, backgroundColor: "#fbfbf7", borderWidth: 4, borderColor: "#3a3a4a", justifyContent: "center" },
  boxDot: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#e23b3b", borderWidth: 2, borderColor: "#3a3a4a" },
  boxTxt: { color: "#2a2a35", fontSize: 14, lineHeight: 21 },
  boxName: { color: "#2a2a35", fontSize: 15 },
  profRing: { width: 128, height: 128, borderRadius: 64, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, borderWidth: 3, borderColor: colors.brandSecondary },
  row: { flexDirection: "row", gap: 12 },
  who: { flex: 1, alignItems: "center", gap: 6, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  on: { borderColor: colors.brandSecondary, backgroundColor: colors.surfaceTertiary },
  profName: { marginTop: 8, color: colors.brandSecondary },
  dialog: { borderRadius: 18, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, padding: 18, minHeight: 150, justifyContent: "space-between" },
  dialogTxt: { fontSize: 16, lineHeight: 24 },
  next: { alignSelf: "flex-end", color: colors.brandSecondary, fontSize: 12 },
  label: { color: colors.onSurfaceSecondary, marginBottom: 8, fontSize: 13 },
  input: { height: 52, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, color: colors.onSurface, paddingHorizontal: 12, fontFamily: FONT, fontSize: 15 },
  card: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, marginBottom: 8, alignItems: "center" },
  cardName: { fontSize: 16 },
  cardType: { fontSize: 12, marginTop: 2 },
  cardDesc: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 18 },
});
