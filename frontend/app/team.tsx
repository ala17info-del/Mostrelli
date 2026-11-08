import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sfx } from "@/src/game/audio";
import { ITEMS, ItemId, MOVES, SPECIES, TYPES } from "@/src/game/data";
import { applyItem, knownMoves, Mon, monName, stats } from "@/src/game/engine";
import { useGame } from "@/src/game/GameContext";
import { PixelSprite } from "@/src/game/PixelSprite";
import { hap, HpBar, PixelText, RetroButton } from "@/src/game/ui";
import { colors } from "@/src/theme";

export default function Team() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save, setSave, flush } = useGame();
  const [msg, setMsg] = useState("");
  if (!save) return <Redirect href="/" />;

  const giveItem = (i: number, id: ItemId) => {
    if ((save.items[id] ?? 0) <= 0) return setMsg(`Hai finito: ${ITEMS[id].name}. Passa in bottega!`);
    const copy = { ...save.party[i] };
    const r = applyItem(copy, id);
    setMsg(r.msg);
    if (!r.ok) return;
    hap("success");
    sfx("heal");
    setSave((s) => ({
      ...s,
      items: { ...s.items, [id]: (s.items[id] ?? 0) - 1 },
      party: s.party.map((p, j) => (j === i ? copy : p)),
    }));
    setTimeout(flush, 300);
  };
  const lead = (i: number) => {
    hap("selection");
    setMsg(`${monName(save.party[i])} ora guida la squadra.`);
    setSave((s) => {
      const party = [...s.party];
      const [m] = party.splice(i, 1);
      return { ...s, party: [m, ...party] };
    });
  };
  const toBox = (i: number) => {
    if (save.party.length <= 1) return;
    if (save.party[i].hp > 0 && save.party.filter((p) => p.hp > 0).length <= 1) return setMsg("Non puoi lasciare la squadra senza mostrelli in forze!");
    setMsg(`${monName(save.party[i])} scende in Cantina.`);
    setSave((s) => ({ ...s, box: [...s.box, s.party[i]], party: s.party.filter((_, j) => j !== i) }));
  };
  const fromBox = (i: number) => {
    if (save.party.length >= 6) return setMsg("Squadra piena (max 6). Manda prima qualcuno in Cantina.");
    setMsg(`${monName(save.box[i])} torna in squadra.`);
    setSave((s) => ({ ...s, party: [...s.party, s.box[i]], box: s.box.filter((_, j) => j !== i) }));
  };

  return (
    <View style={styles.root} testID="team-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="team-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Torna</PixelText>
        </Pressable>
        <PixelText style={styles.title}>SQUADRA</PixelText>
        <PixelText style={styles.meta} testID="team-items">{save.items.vasetto ?? 0} vasetti · {save.items.brodino ?? 0} brodini · {save.items.tortellini ?? 0} tortellini · {save.items.caffe ?? 0} caffè · {save.items.digestivo ?? 0} digestivi · {save.items.gelato ?? 0} gelati · {save.money} €</PixelText>
        <PixelText style={styles.meta}>Digestivo e Gelato: usabili solo in lotta.</PixelText>
      </View>
      {!!msg && <PixelText testID="team-msg" style={styles.msg}>{msg}</PixelText>}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>
        {save.party.map((m, i) => (
          <Animated.View key={m.uid} entering={FadeInDown.delay(i * 60)}>
            <MonCard m={m} i={i}>
              <View style={styles.actions}>
                {m.hp > 0 ? (
                  <>
                    <RetroButton small variant="success" testID={`team-brodino-${i}`} label={`Brodino ${save.items.brodino ?? 0}`} onPress={() => giveItem(i, "brodino")} style={{ flex: 1 }} />
                    <RetroButton small variant="success" testID={`team-tortellini-${i}`} label={`Tortell. ${save.items.tortellini ?? 0}`} onPress={() => giveItem(i, "tortellini")} style={{ flex: 1 }} />
                  </>
                ) : (
                  <RetroButton small variant="primary" testID={`team-caffe-${i}`} label={`Caffè ${save.items.caffe ?? 0}`} onPress={() => giveItem(i, "caffe")} style={{ flex: 1 }} />
                )}
              </View>
              {(save.items.caramella ?? 0) > 0 && (
                <View style={styles.actions}>
                  <RetroButton small variant="secondary" testID={`team-caramella-${i}`} label={`Caramella Rara ${save.items.caramella}`} onPress={() => giveItem(i, "caramella")} style={{ flex: 1 }} />
                </View>
              )}
              <View style={styles.actions}>
                {i > 0 && <RetroButton small variant="secondary" testID={`team-lead-${i}`} label="In testa" onPress={() => lead(i)} style={{ flex: 1 }} />}
                {save.party.length > 1 && <RetroButton small variant="ghost" testID={`team-tobox-${i}`} label="Cantina" onPress={() => toBox(i)} style={{ flex: 1 }} />}
              </View>
            </MonCard>
          </Animated.View>
        ))}
        <PixelText style={styles.section}>CANTINA ({save.box.length})</PixelText>
        {save.box.length === 0 && <PixelText style={styles.meta}>Vuota. Qui finiscono i mostrelli quando la squadra è piena.</PixelText>}
        {save.box.map((m, i) => (
          <MonCard key={m.uid} m={m} i={100 + i}>
            <RetroButton small variant="secondary" testID={`box-take-${i}`} label="Porta in squadra" onPress={() => fromBox(i)} />
          </MonCard>
        ))}
      </ScrollView>
    </View>
  );
}

function MonCard({ m, i, children }: { m: Mon; i: number; children: React.ReactNode }) {
  const sp = SPECIES[m.s];
  const st = stats(m);
  const nextXp = (m.lv + 1) ** 3;
  return (
    <View style={styles.card} testID={`team-card-${i}`}>
      <View style={styles.cardTop}>
        <PixelSprite name={m.s} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <PixelText style={styles.name}>{sp.name} <PixelText style={styles.meta}>Lv{m.lv}</PixelText></PixelText>
          <PixelText style={[styles.meta, { color: TYPES[sp.type].color }]}>{TYPES[sp.type].name}</PixelText>
          <HpBar hp={m.hp} max={st.hp} />
          <PixelText style={styles.meta}>{m.hp}/{st.hp} PV · ATT {st.atk} · DIF {st.def} · VEL {st.spd}</PixelText>
          <PixelText style={styles.meta}>Esp. {m.xp}/{nextXp}</PixelText>
        </View>
      </View>
      <PixelText style={styles.moves}>{knownMoves(m).map((mv) => MOVES[mv].name).join(" · ")}</PixelText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: colors.border },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  title: { fontSize: 22 },
  meta: { fontSize: 11, color: colors.muted },
  msg: { color: colors.brandSecondary, paddingHorizontal: 16, paddingTop: 12, fontSize: 13 },
  card: { backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border, padding: 12, gap: 8 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  name: { fontSize: 16 },
  moves: { fontSize: 11, color: colors.onSurfaceSecondary },
  actions: { flexDirection: "row", gap: 8 },
  section: { marginTop: 16, color: colors.brandSecondary },
});
