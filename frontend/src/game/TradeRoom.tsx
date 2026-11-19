import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { api } from "@/src/api";
import { colors } from "@/src/theme";

import { Side } from "./duelEngine";
import { Mon, monName } from "./engine";
import { useGame } from "./GameContext";
import { Live } from "./LiveBattle";
import { PixelSprite } from "./PixelSprite";
import { hap, PixelText, RetroButton } from "./ui";

// Trade room: each player offers one Mostrello, both confirm, the server swaps them in both saves.
export function TradeRoom({ live, setLive, onExit, setMsg }: { live: Live; setLive: (l: Live) => void; onExit: () => void; setMsg: (m: string) => void }) {
  const { save, flush, reload } = useGame();
  const side = live.side;
  const foe: Side = side === "host" ? "guest" : "host";
  const foeName = side === "host" ? live.guest?.name : live.host.name;
  const mine = live.offers[side], theirs = live.offers[foe];
  const done = live.trade_done;

  const call = async (path: string, body?: object) => {
    try {
      setLive(await api<Live>(`/live/${live.code}/${path}`, { method: "POST", body: JSON.stringify(body ?? {}) }));
      hap("success");
    } catch (e: any) {
      setMsg(e.message);
    }
  };
  const offer = async (m: Mon) => {
    await flush(); // the server reads the saved state, so it must be up to date
    call("offer", { uid: m.uid });
  };

  React.useEffect(() => {
    if (done) reload();
  }, [done, reload]);

  if (!save) return null;
  const all = [...save.party.map((m) => ({ m, where: "Squadra" })), ...save.box.map((m) => ({ m, where: "Cantina" }))];
  return (
    <View style={{ gap: 12 }} testID="trade-room">
      <PixelText style={styles.h}>Scambio con {foeName}</PixelText>
      <View style={styles.offers}>
        <Offer label="Tu offri" mon={mine} ok={!!live.confirms[side]} testID="trade-my-offer" />
        <PixelText style={styles.swap}>⇄</PixelText>
        <Offer label={`${foeName} offre`} mon={theirs} ok={!!live.confirms[foe]} testID="trade-their-offer" />
      </View>
      {done ? (
        <>
          <PixelText testID="trade-done" style={styles.ok}>Scambio completato! {theirs ? monName(theirs) : ""} ora è tuo ed è già nel tuo salvataggio.</PixelText>
          <RetroButton testID="trade-exit-btn" label="Torna al gioco" onPress={onExit} />
        </>
      ) : (
        <>
          <RetroButton testID="trade-confirm-btn" label={live.confirms[side] ? "Confermato, in attesa..." : "Conferma scambio"} disabled={!mine || !theirs || !!live.confirms[side]} onPress={() => call("confirm")} />
          <PixelText style={styles.meta}>Lo scambio avviene solo quando confermate entrambi. Se uno dei due cambia offerta, le conferme si azzerano.</PixelText>
          <PixelText style={styles.h}>Scegli cosa offrire</PixelText>
          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 6 }}>
            {all.map(({ m, where }) => (
              <Pressable key={m.uid} testID={`trade-pick-${m.uid}`} onPress={() => offer(m)} style={[styles.row, mine?.uid === m.uid && styles.rowOn]}>
                <PixelSprite name={m.s} size={36} />
                <PixelText style={{ flex: 1 }}>{monName(m)} Lv{m.lv}</PixelText>
                <PixelText style={styles.meta}>{where}</PixelText>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function Offer({ label, mon, ok, testID }: { label: string; mon?: Mon; ok: boolean; testID: string }) {
  return (
    <View style={styles.offer} testID={testID}>
      <PixelText style={styles.meta}>{label}</PixelText>
      {mon ? <PixelSprite name={mon.s} size={56} /> : <View style={{ width: 56, height: 56 }} />}
      <PixelText numberOfLines={1}>{mon ? `${monName(mon)} Lv${mon.lv}` : "..."}</PixelText>
      {ok && <PixelText style={styles.ok}>✓ Confermato</PixelText>}
    </View>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 15 },
  meta: { fontSize: 11, color: colors.muted, lineHeight: 16 },
  ok: { color: colors.brandTertiary, fontSize: 12 },
  offers: { flexDirection: "row", alignItems: "center", gap: 8 },
  offer: { flex: 1, alignItems: "center", gap: 4, borderRadius: 14, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 8, minHeight: 130 },
  swap: { fontSize: 22, color: colors.brandSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, minHeight: 52 },
  rowOn: { borderColor: colors.brandSecondary, borderRadius: 14, borderWidth: 2 },
});
