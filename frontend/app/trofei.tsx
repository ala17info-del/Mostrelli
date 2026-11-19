import { Redirect, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dayKey, SAGRE, todaySagra } from "@/src/game/events";
import { MAPS } from "@/src/game/data";
import { useGame } from "@/src/game/GameContext";
import { prizeText, TROPHIES } from "@/src/game/trophies";
import { CHAPTERS, chapterNow, STORY_END } from "@/src/game/story";
import { PixelText } from "@/src/game/ui";
import { colors } from "@/src/theme";

export default function Trophies() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save } = useGame();
  if (!save) return <Redirect href="/" />;
  const got = new Set(save.trophies ?? []);
  const shinies = [...save.party, ...save.box].filter((m) => m.shiny).length;
  const sagra = todaySagra();
  // Next feasts, so there is always something to come back for.
  const next = [1, 2, 3].map((d) => { const t = new Date(); t.setDate(t.getDate() + d); return { d, s: todaySagra(t) }; });

  return (
    <View style={styles.root} testID="trophies-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="trophies-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Torna</PixelText>
        </Pressable>
        <PixelText style={styles.title}>TROFEI {got.size}/{TROPHIES.length}</PixelText>
        <PixelText style={styles.meta}>Vittorie {save.stats?.wins ?? 0} · Catture {save.stats?.catches ?? 0} · Cromatici ✨ {shinies} · Sagre {save.stats?.sagre ?? 0}</PixelText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 10 }}>
        <View style={styles.sagraCard} testID="trophies-sagra">
          <PixelText style={styles.sagraTitle}>🎉 OGGI: {sagra.name.toUpperCase()}</PixelText>
          <PixelText style={styles.meta}>a {MAPS[sagra.map].name} · {(save.sagraDays ?? []).includes(dayKey()) ? "regalo già ritirato" : "vai a ritirare il regalo!"} · cromatici ×5</PixelText>
          {next.map(({ d, s }) => (
            <PixelText key={d} style={styles.small}>{d === 1 ? "Domani" : d === 2 ? "Dopodomani" : "Fra 3 giorni"}: {s.name} a {MAPS[s.map].name}</PixelText>
          ))}
          <PixelText style={styles.small}>{SAGRE.length} sagre diverse in tutta la regione, una al giorno.</PixelText>
        </View>
        <View style={styles.sagraCard} testID="trophies-story">
          <PixelText style={styles.sagraTitle}>📜 STORIA: IL RICETTARIO RUBATO</PixelText>
          {chapterNow(save) < STORY_END ? (
            <>
              <PixelText style={styles.name}>{CHAPTERS[chapterNow(save)].title}</PixelText>
              <PixelText style={styles.meta}>Obiettivo: {CHAPTERS[chapterNow(save)].goal}</PixelText>
            </>
          ) : <PixelText style={styles.name}>Storia completata! Il Ricettario è salvo.</PixelText>}
          <PixelText style={styles.small}>Capitolo {Math.min(chapterNow(save) + 1, STORY_END)} di {STORY_END}</PixelText>
        </View>
        <View style={styles.sagraCard} testID="trophies-quests">
          <PixelText style={styles.sagraTitle}>📋 MISSIONI SECONDARIE</PixelText>
          {(() => {
            const all = Object.values(MAPS).flatMap((m) => m.npcs.filter((n) => n.quest).map((n) => ({ n, town: MAPS[m.exits[0]?.to]?.name ?? m.name })));
            const on = all.filter(({ n }) => save.quests?.[n.quest!.id]?.s === "on");
            const done = all.filter(({ n }) => save.quests?.[n.quest!.id]?.s === "done").length;
            return (
              <>
                {on.length === 0 && <PixelText style={styles.meta}>Nessuna missione attiva: entra nelle case e parla con la gente!</PixelText>}
                {on.map(({ n, town }) => (
                  <PixelText key={n.id} style={styles.meta}>• {town}: {n.quest!.ask[1]}</PixelText>
                ))}
                <PixelText style={styles.small}>Completate {done} di {all.length}</PixelText>
              </>
            );
          })()}
        </View>
        {TROPHIES.map((t, i) => {
          const v = Math.min(t.goal, t.value(save));
          const done = got.has(t.id);
          return (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 30)} style={[styles.card, done && styles.cardDone]} testID={`trophy-${t.id}`}>
              <PixelText style={[styles.icon, !done && { opacity: 0.35 }]}>{t.icon}</PixelText>
              <View style={{ flex: 1, gap: 4 }}>
                <PixelText style={styles.name}>{t.name}</PixelText>
                <PixelText style={styles.meta}>{t.desc}</PixelText>
                <View style={styles.bar}><View style={[styles.fill, { width: `${(v / t.goal) * 100}%` }, done && { backgroundColor: colors.brandTertiary }]} /></View>
                <PixelText style={styles.small}>{done ? "Ottenuto! " : `${v}/${t.goal} · `}Premio: {prizeText(t)}</PixelText>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: colors.border },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  title: { fontSize: 22, color: colors.brandSecondary },
  meta: { fontSize: 11, color: colors.muted },
  small: { fontSize: 10, color: colors.onSurfaceSecondary },
  sagraCard: { borderRadius: 14, borderWidth: 3, borderColor: colors.brandPrimary, backgroundColor: colors.surfaceTertiary, padding: 12, gap: 4 },
  sagraTitle: { fontSize: 14, color: colors.brandSecondary },
  card: { flexDirection: "row", gap: 12, alignItems: "center", borderRadius: 14, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 10 },
  cardDone: { borderColor: colors.brandSecondary },
  icon: { fontSize: 30, width: 40, textAlign: "center" },
  name: { fontSize: 14 },
  bar: { height: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  fill: { height: "100%", backgroundColor: colors.brandSecondary },
});
