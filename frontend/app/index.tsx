import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { useGame } from "@/src/game/GameContext";
import { PixelSprite } from "@/src/game/PixelSprite";
import { PixelText, RetroButton } from "@/src/game/ui";
import { colors } from "@/src/theme";

const BG = "https://images.unsplash.com/photo-1635469019177-7264fc1e013c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Title() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { save, loading: gameLoading, reset, loadError, reload } = useGame();
  const [confirm, setConfirm] = useState(false);
  const busy = loading || gameLoading;

  return (
    <View style={styles.root} testID="title-screen">
      <Image source={{ uri: BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={["rgba(18,18,18,0.35)", "rgba(18,18,18,0.85)", colors.surface]} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        <Animated.View entering={FadeInUp.duration(500)}>
          <PixelText style={styles.kicker}>— EMILIA EDITION —</PixelText>
          <PixelText style={styles.title} testID="title-text">BOLOGNA{"\n"}MONSTRI</PixelText>
          <PixelText style={styles.sub}>Tortellini, nebbia e mostri selvatici tra Bologna, Osteria Grande, Castel San Pietro, Imola e Ferrara.</PixelText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.sprites}>
          <PixelSprite name="tortellotto" size={72} />
          <PixelSprite name="fanghino" size={72} />
          <PixelSprite name="grappolino" size={72} />
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        {busy ? (
          <ActivityIndicator color={colors.brandSecondary} testID="title-loading" />
        ) : !user ? (
          <>
            <RetroButton testID="title-login-btn" label="Accedi / Registrati" onPress={() => router.push("/auth")} />
            <PixelText style={styles.note}>Serve un account: i progressi si salvano online.</PixelText>
          </>
        ) : loadError ? (
          <>
            <PixelText testID="title-load-error" style={styles.warn}>Impossibile caricare il salvataggio. Controlla la connessione.</PixelText>
            <RetroButton testID="title-retry-btn" label="Riprova" onPress={reload} />
          </>
        ) : save ? (
          <>
            <RetroButton testID="title-continue-btn" label={`Continua · ${save.name}`} onPress={() => router.push("/game")} />
            {confirm ? (
              <View style={styles.row}>
                <RetroButton testID="title-confirm-new-btn" small variant="primary" label="Sì, cancella" style={{ flex: 1 }} onPress={async () => { await reset(); setConfirm(false); router.push("/intro"); }} />
                <RetroButton testID="title-cancel-new-btn" small variant="ghost" label="Annulla" style={{ flex: 1 }} onPress={() => setConfirm(false)} />
              </View>
            ) : (
              <RetroButton testID="title-new-game-btn" variant="ghost" label="Nuova partita" onPress={() => setConfirm(true)} />
            )}
            {confirm && <PixelText style={styles.warn}>Il salvataggio attuale verrà perso per sempre.</PixelText>}
          </>
        ) : (
          <RetroButton testID="title-start-btn" label="Inizia Avventura" onPress={() => router.push("/intro")} />
        )}
        {user && !busy && (
          <Pressable testID="title-logout-btn" onPress={logout} style={styles.logout}>
            <PixelText style={styles.logoutTxt}>Esci ({user.email})</PixelText>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: 24 },
  kicker: { color: colors.brandSecondary, fontSize: 12, letterSpacing: 2 },
  title: { fontSize: 44, lineHeight: 52, color: colors.onSurface, marginTop: 8, textShadowColor: colors.brandPrimary, textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 },
  sub: { marginTop: 16, color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 22 },
  sprites: { flexDirection: "row", gap: 16, marginTop: 32 },
  actions: { paddingHorizontal: 24, gap: 12 },
  row: { flexDirection: "row", gap: 8 },
  note: { color: colors.muted, fontSize: 12, textAlign: "center" },
  warn: { color: colors.warning, fontSize: 12, textAlign: "center" },
  logout: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  logoutTxt: { color: colors.muted, fontSize: 12 },
});
