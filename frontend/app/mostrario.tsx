import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SPECIES_LIST, TYPES } from "@/src/game/data";
import { useGame } from "@/src/game/GameContext";
import { PixelSprite } from "@/src/game/PixelSprite";
import { hap, PixelText } from "@/src/game/ui";
import { colors } from "@/src/theme";

const FILTERS = [
  { id: "all", label: "Tutti" },
  { id: "caught", label: "Catturati" },
  { id: "seen", label: "Visti" },
  { id: "missing", label: "Mancanti" },
] as const;

export default function Mostrario() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save } = useGame();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<string | null>(null);
  if (!save) return <Redirect href="/" />;

  const data = SPECIES_LIST.filter((s) => {
    if (filter === "caught") return save.caught.includes(s.id);
    if (filter === "seen") return save.seen.includes(s.id);
    if (filter === "missing") return !save.caught.includes(s.id);
    return true;
  });

  return (
    <View style={styles.root} testID="mostrario-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="mostrario-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Torna</PixelText>
        </Pressable>
        <PixelText style={styles.title}>MOSTRARIO</PixelText>
        <PixelText style={styles.meta} testID="mostrario-count">Visti {save.seen.length} · Catturati {save.caught.length} / {SPECIES_LIST.length}</PixelText>
      </View>
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} testID={`mostrario-filter-${f.id}`} onPress={() => { hap("selection"); setFilter(f.id); }} style={[styles.chip, filter === f.id && styles.chipOn]}>
              <PixelText style={{ fontSize: 12, color: filter === f.id ? colors.onBrandSecondary : colors.onSurface }}>{f.label}</PixelText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={<PixelText style={[styles.meta, { textAlign: "center", marginTop: 32 }]} testID="mostrario-empty">{"Nessun mostrello qui. Esplora l'Emilia-Romagna!"}</PixelText>}
        renderItem={({ item: s }) => {
          const caught = save.caught.includes(s.id);
          const seen = save.seen.includes(s.id);
          const shiny = [...save.party, ...save.box].some((m) => m.s === s.id && m.shiny);
          const expanded = open === s.id;
          return (
            <Pressable testID={`mostrario-card-${s.id}`} onPress={() => seen && setOpen(expanded ? null : s.id)} style={styles.card}>
              <PixelText style={styles.num}>#{String(s.num).padStart(3, "0")}</PixelText>
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <PixelSprite name={s.id} size={72} silhouette={!seen} shiny={shiny} />
              </View>
              <PixelText style={styles.name} numberOfLines={1}>{seen ? s.name : "???"}</PixelText>
              {seen && <PixelText style={[styles.meta, { color: TYPES[s.type].color }]}>{TYPES[s.type].name}{caught ? " · ✓" : ""}{shiny ? " · ✨" : ""}</PixelText>}
              {expanded && <PixelText style={styles.desc}>{caught ? s.desc : "Avvistato, ma non ancora catturato. Ci vuole un vasetto!"}</PixelText>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  title: { fontSize: 22 },
  meta: { fontSize: 11, color: colors.muted },
  chipRow: { height: 56, borderBottomWidth: 2, borderBottomColor: colors.border, justifyContent: "center" },
  chips: { gap: 8, paddingHorizontal: 16, alignItems: "center" },
  chip: { height: 36, paddingHorizontal: 14, justifyContent: "center", borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, flexShrink: 0 },
  chipOn: { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary },
  card: { flex: 1, maxWidth: "48.5%", backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  num: { fontSize: 11, color: colors.muted },
  name: { fontSize: 14 },
  desc: { fontSize: 11, color: colors.onSurfaceSecondary, marginTop: 6, lineHeight: 16 },
});
