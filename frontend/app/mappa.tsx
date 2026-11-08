import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Redirect, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ALL_BADGES, MAPS } from "@/src/game/data";
import { useGame } from "@/src/game/GameContext";
import { PixelText } from "@/src/game/ui";
import { colors } from "@/src/theme";

// Route order along the map, north to south-east.
const ORDER = ["ferrara", "altedo", "maggiore", "parma", "modena", "acetaia", "bologna", "mercato", "osteria", "csp", "imola", "riviera", "ravenna"];

export default function WorldMap() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save } = useGame();
  if (!save) return <Redirect href="/" />;

  return (
    <View style={styles.root} testID="worldmap-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="worldmap-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Torna</PixelText>
        </Pressable>
        <PixelText style={styles.title}>MAPPA DEL MONDO</PixelText>
        <PixelText style={styles.meta}>Sigilli {save.badges.length}/{ALL_BADGES.length} · Sei a {MAPS[save.map].name}</PixelText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {ORDER.map((id, i) => {
          const m = MAPS[id];
          const here = save.map === id;
          const heal = m.npcs.find((n) => n.kind === "heal");
          const shop = m.npcs.find((n) => n.kind === "shop");
          const boss = m.npcs.find((n) => n.kind === "boss");
          const trainers = m.npcs.filter((n) => n.kind === "trainer");
          const left = trainers.filter((t) => !save.defeated.includes(t.id)).length;
          const bossDone = boss ? save.defeated.includes(boss.id) : true;
          const lv = m.wild.map((w) => w[1]);
          return (
            <Animated.View key={id} entering={FadeInDown.delay(i * 70)}>
              {i > 0 && <View style={styles.road} />}
              <View style={[styles.card, here && styles.cardHere]} testID={`worldmap-town-${id}`}>
                <View style={styles.row}>
                  <MaterialDesignIcons name={here ? "map-marker-radius" : "map-marker"} size={22} color={here ? colors.brandSecondary : colors.muted} />
                  <PixelText style={styles.town}>{m.name}</PixelText>
                  {here && <PixelText style={styles.here}>SEI QUI</PixelText>}
                </View>
                <PixelText style={styles.meta}>Mostrelli selvatici Lv {Math.min(...lv)}-{Math.max(...m.wild.map((w) => w[2]))}</PixelText>
                <View style={styles.tags}>
                  {heal && (
                    <View style={[styles.tag, { backgroundColor: colors.brandTertiary }]}>
                      <MaterialDesignIcons name="heart-plus" size={12} color={colors.onBrandTertiary} />
                      <PixelText style={[styles.tagTxt, { color: colors.onBrandTertiary }]}>CURA: {heal.name}</PixelText>
                    </View>
                  )}
                  {shop && (
                    <View style={[styles.tag, { backgroundColor: colors.brandSecondary }]}>
                      <MaterialDesignIcons name="cart" size={12} color={colors.onBrandSecondary} />
                      <PixelText style={[styles.tagTxt, { color: colors.onBrandSecondary }]}>MARKET: {shop.name}</PixelText>
                    </View>
                  )}
                </View>
                {boss && (
                  <View style={styles.row} testID={`worldmap-boss-${id}`}>
                    <MaterialDesignIcons name={bossDone ? "check-decagram" : "crown"} size={16} color={bossDone ? colors.success : colors.brandPrimary} />
                    <PixelText style={styles.boss}>{boss.name} · {bossDone ? "battuto" : `da sfidare (${boss.badge})`}</PixelText>
                  </View>
                )}
                <PixelText style={styles.meta}>Allenatori rimasti: {left}/{trainers.length}</PixelText>
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
  title: { fontSize: 22 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  road: { width: 6, height: 20, alignSelf: "center", backgroundColor: colors.borderStrong },
  card: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, padding: 12, gap: 6 },
  cardHere: { borderColor: colors.brandSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  town: { fontSize: 16, flex: 1 },
  here: { fontSize: 10, color: colors.brandSecondary },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3 },
  tagTxt: { fontSize: 10 },
  boss: { fontSize: 12, flex: 1 },
});
