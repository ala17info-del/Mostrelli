import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { INTRO_LINES, SPECIES, STARTERS, TYPES } from "@/src/game/data";
import { newSave, useGame } from "@/src/game/GameContext";
import { PixelSprite } from "@/src/game/PixelSprite";
import { hap, PixelText, RetroButton } from "@/src/game/ui";
import { colors, FONT } from "@/src/theme";

export default function Intro() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { setSave, flush } = useGame();
  const [line, setLine] = useState(0);
  const [name, setName] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <Redirect href="/" />;

  const talking = line < INTRO_LINES.length;
  const start = async () => {
    if (!pick || !name.trim()) return;
    setBusy(true);
    setSave(newSave(name.trim().slice(0, 12), pick));
    await flush();
    router.replace("/game");
  };

  return (
    <View style={styles.root} testID="intro-screen">
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.prof}>
          <PixelSprite name="person" size={96} look={{ A: "#1a1a1a", C: "#1a1a1a" }} />
          <PixelText style={styles.profName}>Dottor Balanzone</PixelText>
        </View>
        {talking ? (
          <Pressable testID="intro-dialog" onPress={() => { hap("selection"); setLine(line + 1); }} style={styles.dialog}>
            <Animated.View key={line} entering={FadeIn.duration(200)}>
              <PixelText style={styles.dialogTxt}>{INTRO_LINES[line]}</PixelText>
            </Animated.View>
            <PixelText style={styles.next}>▼ tocca</PixelText>
          </Pressable>
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            <PixelText style={styles.label}>Il tuo nome</PixelText>
            <TextInput testID="intro-name-input" style={styles.input} value={name} onChangeText={setName} maxLength={12} placeholder="es. Rossella" placeholderTextColor={colors.muted} />
            <PixelText style={[styles.label, { marginTop: 24 }]}>Scegli il tuo primo mostrello</PixelText>
            {STARTERS.map((s) => {
              const sp = SPECIES[s];
              const on = pick === s;
              return (
                <Pressable key={s} testID={`intro-starter-${s}`} onPress={() => { hap("selection"); setPick(s); }} style={[styles.card, on && { borderColor: colors.brandSecondary, backgroundColor: colors.surfaceTertiary }]}>
                  <PixelSprite name={s} size={64} />
                  <View style={{ flex: 1 }}>
                    <PixelText style={styles.cardName}>{sp.name}</PixelText>
                    <PixelText style={[styles.cardType, { color: TYPES[sp.type].color }]}>Tipo {TYPES[sp.type].name}</PixelText>
                    <PixelText style={styles.cardDesc}>{sp.desc}</PixelText>
                  </View>
                </Pressable>
              );
            })}
            <RetroButton testID="intro-start-btn" label={busy ? "Salvataggio..." : "Parti per l'avventura"} disabled={!pick || !name.trim() || busy} onPress={start} style={{ marginTop: 16 }} />
          </Animated.View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  prof: { alignItems: "center", marginBottom: 24 },
  profName: { marginTop: 8, color: colors.brandSecondary },
  dialog: { borderWidth: 2, borderColor: colors.onSurface, backgroundColor: colors.surfaceSecondary, padding: 16, minHeight: 150, justifyContent: "space-between" },
  dialogTxt: { fontSize: 16, lineHeight: 24 },
  next: { alignSelf: "flex-end", color: colors.brandSecondary, fontSize: 12 },
  label: { color: colors.onSurfaceSecondary, marginBottom: 8, fontSize: 13 },
  input: { height: 52, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, color: colors.onSurface, paddingHorizontal: 12, fontFamily: FONT, fontSize: 15 },
  card: { flexDirection: "row", gap: 12, padding: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, marginBottom: 8, alignItems: "center" },
  cardName: { fontSize: 16 },
  cardType: { fontSize: 12, marginTop: 2 },
  cardDesc: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 18 },
});
