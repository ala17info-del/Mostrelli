import * as Clipboard from "expo-clipboard";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useGame } from "@/src/game/GameContext";
import { Live, LiveBattle, ROOM_BOSSES } from "@/src/game/LiveBattle";
import { TradeRoom } from "@/src/game/TradeRoom";
import { PixelSprite } from "@/src/game/PixelSprite";
import { hap, PixelText, RetroButton } from "@/src/game/ui";
import { colors, FONT } from "@/src/theme";

export default function Diretta() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save, flush } = useGame();
  const [live, setLive] = useState<Live | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"pvp" | "coop" | "trade">("pvp");
  const [boss, setBoss] = useState(ROOM_BOSSES[0]?.id ?? "");

  const liveCode = live?.code;
  const done = live?.status === "done";
  useEffect(() => {
    if (!liveCode || done) return;
    const t = setInterval(() => {
      api<Live>(`/live/${liveCode}`).then(setLive).catch(() => {});
    }, 1500);
    return () => clearInterval(t);
  }, [liveCode, done]);

  if (!save) return <Redirect href="/" />;

  const body = () => JSON.stringify({ name: save.name, party: save.party, mode, boss: mode === "coop" ? boss : undefined });
  const run = async (fn: () => Promise<Live>) => {
    setBusy(true);
    setMsg("");
    try {
      await flush(); // make sure freshly bought items are saved before the server checks them
      setLive(await fn());
      hap("success");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };
  const create = () => run(() => api<Live>("/live", { method: "POST", body: body() }));
  const join = () => {
    if (code.trim().length < 6) return setMsg("Inserisci il codice di 6 caratteri.");
    run(() => api<Live>(`/live/${code.trim().toUpperCase()}/join`, { method: "POST", body: body() }));
  };

  if (live && live.guest && live.mode !== "trade") return <LiveBattle live={live} setLive={setLive} onExit={() => router.back()} />;

  return (
    <View style={styles.root} testID="live-screen">
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Pressable testID="live-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Torna</PixelText>
        </Pressable>
        <PixelText style={styles.title}>STANZE ONLINE</PixelText>
        <PixelText style={styles.meta}>Crea una stanza e condividi il codice. Sfida: uno contro uno. Coppia: tu e un amico contro un Capopalestra (vittoria = soldi e Caramella Rara). Scambio: vi scambiate un Mostrello, solo se confermate entrambi.</PixelText>
        {!!msg && <PixelText testID="live-msg" style={styles.msg}>{msg}</PixelText>}

        {live && live.guest && live.mode === "trade" ? (
          <TradeRoom live={live} setLive={setLive} onExit={() => router.back()} setMsg={setMsg} />
        ) : live ? (
          <View style={styles.card} testID="live-waiting-room">
            <PixelText style={styles.h}>Il tuo codice</PixelText>
            <PixelText testID="live-code" style={styles.code}>{live.code}</PixelText>
            <RetroButton testID="live-copy-btn" variant="secondary" label="Copia codice" onPress={async () => { await Clipboard.setStringAsync(live.code); setMsg(`Codice ${live.code} copiato! Mandalo al tuo amico.`); }} />
            <View style={styles.waitRow}>
              <ActivityIndicator color={colors.brandSecondary} />
              <PixelText style={styles.meta}>In attesa che il tuo amico entri con il codice...</PixelText>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <PixelText style={styles.h}>Entra in una sfida</PixelText>
              <TextInput testID="live-code-input" value={code} onChangeText={(t) => setCode(t.toUpperCase())} maxLength={6} autoCapitalize="characters" placeholder="ES. AB12CD" placeholderTextColor={colors.muted} style={styles.input} />
              <RetroButton testID="live-join-btn" label="Entra e lotta!" disabled={busy} onPress={join} />
            </View>
            <View style={styles.card}>
              <PixelText style={styles.h}>Crea una stanza</PixelText>
              <View style={styles.team}>
                {([["pvp", "Sfida"], ["coop", "In coppia"], ["trade", "Scambio"]] as const).map(([k, l]) => (
                  <Pressable key={k} testID={`room-mode-${k}`} onPress={() => { hap("selection"); setMode(k); }} style={[styles.chip, mode === k && styles.chipOn]}>
                    <PixelText style={{ fontSize: 12 }}>{l}</PixelText>
                  </Pressable>
                ))}
              </View>
              {mode === "coop" && (
                <View style={{ gap: 6 }}>
                  <PixelText style={styles.meta}>Contro chi lottate?</PixelText>
                  {ROOM_BOSSES.map((b) => (
                    <Pressable key={b.id} testID={`room-boss-${b.id}`} onPress={() => setBoss(b.id)} style={[styles.chip, boss === b.id && styles.chipOn]}>
                      <PixelText style={{ fontSize: 12 }}>{b.name} · Lv{Math.max(...(b.team ?? []).map((t) => t[1])) + 3}</PixelText>
                    </Pressable>
                  ))}
                </View>
              )}
              <View style={styles.team}>
                {save.party.map((m) => (
                  <PixelSprite key={m.uid} name={m.s} size={40} />
                ))}
              </View>
              <RetroButton testID="live-create-btn" variant="secondary" label="Crea codice" disabled={busy} onPress={create} />
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  title: { fontSize: 22 },
  meta: { fontSize: 11, color: colors.muted, lineHeight: 16, flexShrink: 1 },
  msg: { color: colors.brandSecondary, fontSize: 13 },
  card: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 12, gap: 10 },
  h: { fontSize: 15, color: colors.onSurface },
  input: { height: 52, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surface, color: colors.onSurface, paddingHorizontal: 12, fontFamily: FONT, fontSize: 18, letterSpacing: 4 },
  team: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  code: { fontSize: 32, letterSpacing: 6, color: colors.brandSecondary, textAlign: "center" },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  chip: { borderWidth: 2, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, minHeight: 44, justifyContent: "center", backgroundColor: colors.surface },
  chipOn: { borderColor: colors.brandSecondary, backgroundColor: colors.surfaceTertiary },
});
