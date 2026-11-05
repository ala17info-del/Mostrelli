import * as Clipboard from "expo-clipboard";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { Mon } from "@/src/game/engine";
import { useGame } from "@/src/game/GameContext";
import { PixelSprite } from "@/src/game/PixelSprite";
import { hap, PixelText, RetroButton } from "@/src/game/ui";
import { colors, FONT } from "@/src/theme";

type DuelInfo = { code: string; name: string; party: Mon[]; wins: number; losses: number };

export default function Sfida() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save, setDuel } = useGame();
  const [mine, setMine] = useState<DuelInfo[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<DuelInfo[]>("/duel/mine").then(setMine).catch(() => {});
  }, []);
  useEffect(load, [load]);

  if (!save) return <Redirect href="/" />;

  const create = async () => {
    setBusy(true);
    setMsg("");
    try {
      const d = await api<DuelInfo>("/duel", { method: "POST", body: JSON.stringify({ name: save.name, party: save.party }) });
      hap("success");
      setMsg(`Codice creato: ${d.code}. Mandalo a un amico!`);
      load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (code.trim().length < 6) return setMsg("Inserisci il codice di 6 caratteri.");
    if (!save.party.some((m) => m.hp > 0)) return setMsg("La tua squadra è esausta: passa prima da un punto CURA.");
    setBusy(true);
    setMsg("");
    try {
      const d = await api<DuelInfo>(`/duel/${code.trim().toUpperCase()}`);
      setDuel({ code: d.code, name: d.name, party: d.party });
      router.back();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root} testID="duel-screen">
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Pressable testID="duel-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Torna</PixelText>
        </Pressable>
        <PixelText style={styles.title}>SFIDA TRA AMICI</PixelText>
        <PixelText style={styles.meta}>Crea un codice con la tua squadra attuale e mandalo a un amico, oppure inserisci il suo codice per sfidare la sua squadra. Le sfide non danneggiano i tuoi mostrelli.</PixelText>
        {!!msg && <PixelText testID="duel-msg" style={styles.msg}>{msg}</PixelText>}

        <Pressable testID="duel-live-btn" onPress={() => router.push("/diretta")} style={styles.live}>
          <PixelText style={styles.liveTitle}>● SFIDA IN DIRETTA</PixelText>
          <PixelText style={styles.meta}>Lotta in tempo reale contro un amico, turno per turno. Tocca qui ›</PixelText>
        </Pressable>

        <View style={styles.card}>
          <PixelText style={styles.h}>Accetta una sfida</PixelText>
          <TextInput testID="duel-code-input" value={code} onChangeText={(t) => setCode(t.toUpperCase())} maxLength={6} autoCapitalize="characters" placeholder="ES. AB12CD" placeholderTextColor={colors.muted} style={styles.input} />
          <RetroButton testID="duel-accept-btn" label="Lotta!" disabled={busy} onPress={accept} />
        </View>

        <View style={styles.card}>
          <PixelText style={styles.h}>Crea una sfida</PixelText>
          <View style={styles.team}>
            {save.party.map((m) => (
              <PixelSprite key={m.uid} name={m.s} size={40} />
            ))}
          </View>
          <RetroButton testID="duel-create-btn" variant="secondary" label="Genera codice" disabled={busy} onPress={create} />
        </View>

        <PixelText style={styles.h}>I tuoi codici</PixelText>
        {mine.length === 0 && <PixelText style={styles.meta}>Nessun codice ancora.</PixelText>}
        {mine.map((d) => (
          <Pressable key={d.code} testID={`duel-mine-${d.code}`} onPress={async () => { await Clipboard.setStringAsync(d.code); setMsg(`Codice ${d.code} copiato!`); }} style={styles.row}>
            <PixelText style={styles.code}>{d.code}</PixelText>
            <PixelText style={styles.meta}>Vittorie {d.wins} · Sconfitte {d.losses} · tocca per copiare</PixelText>
          </Pressable>
        ))}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  title: { fontSize: 22 },
  meta: { fontSize: 11, color: colors.muted, lineHeight: 16 },
  msg: { color: colors.brandSecondary, fontSize: 13 },
  card: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 12, gap: 10 },
  h: { fontSize: 15, color: colors.onSurface },
  input: { height: 52, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surface, color: colors.onSurface, paddingHorizontal: 12, fontFamily: FONT, fontSize: 18, letterSpacing: 4 },
  team: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  row: { borderWidth: 1, borderColor: colors.border, padding: 10, gap: 4, backgroundColor: colors.surfaceSecondary },
  code: { fontSize: 18, letterSpacing: 3, color: colors.brandSecondary },
  live: { borderWidth: 3, borderColor: colors.brandPrimary, backgroundColor: colors.surfaceSecondary, padding: 12, gap: 4, minHeight: 64 },
  liveTitle: { fontSize: 16, color: colors.brandPrimary },
});
