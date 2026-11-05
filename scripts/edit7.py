def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

A = '/app/frontend/app/'
edit(A + 'auth.tsx', [
('''import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";''', '''import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";'''),
('''  const { login, register } = useAuth();''', '''  const { login, register, loginApple } = useAuth();
  const [appleOk, setAppleOk] = useState(false);
  useEffect(() => {
    if (Platform.OS === "ios") AppleAuthentication.isAvailableAsync().then(setAppleOk).catch(() => setAppleOk(false));
  }, []);
  const apple = async () => {
    setError("");
    try {
      const c = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!c.identityToken) throw new Error("Apple non ha restituito il token");
      const name = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(" ") || null;
      setBusy(true);
      await loginApple(c.identityToken, c.email ?? null, name);
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e: any) {
      if (e?.code !== "ERR_REQUEST_CANCELED") setError(e?.message ?? "Accesso con Apple non riuscito");
    } finally {
      setBusy(false);
    }
  };'''),
('''        <RetroButton testID="auth-submit-btn"''', '''        {appleOk && (
          <View style={{ marginTop: 20 }}>
            <AppleAuthentication.AppleAuthenticationButton
              testID="auth-apple-btn"
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={2}
              style={{ height: 52, width: "100%" }}
              onPress={apple}
            />
            <PixelText style={styles.or}>oppure con email</PixelText>
          </View>
        )}
        <RetroButton testID="auth-submit-btn"'''),
('''  error: { color: colors.error, marginTop: 12, fontSize: 13 },''', '''  error: { color: colors.error, marginTop: 12, fontSize: 13 },
  or: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 12 },'''),
])

G = A + 'game.tsx'
edit(G, [
('''import { TileMap } from "@/src/game/TileMap";''', '''import { HealFx } from "@/src/game/BattleFx";
import { TileMap } from "@/src/game/TileMap";'''),
('''  const { save, setSave, flush, sync } = useGame();''', '''  const { save, setSave, flush, sync, duel, setDuel } = useGame();
  const [run, setRun] = useState(false);
  const runRef = useRef(false);
  runRef.current = run;
  const [healK, setHealK] = useState(0);
  const [duelCode, setDuelCode] = useState<string | null>(null);
  useEffect(() => {
    if (!duel) return;
    setDuel(null);
    setDuelCode(duel.code);
    setBattle({ kind: "trainer", trainerName: `${duel.name} (sfida)`, field: "grass", enemies: duel.party.map((m) => ({ ...m, uid: Math.random().toString(36).slice(2, 10), hp: stats(m).hp })) });
  }, [duel, setDuel]);'''),
('''    holdTimer.current = setInterval(() => step(dir), 170);''', '''    holdTimer.current = setInterval(() => step(dir), runRef.current ? 110 : 170);'''),
('''        sfx("heal");
        setToast("Squadra curata!");''', '''        sfx("heal");
        setHealK(Date.now());
        setToast("Squadra curata!");'''),
('''  const onBattleEnd = (r: BattleResult) => {''', '''  const onBattleEnd = (r: BattleResult) => {
    if (duelCode) {
      const won = r.outcome === "win";
      api(`/duel/${duelCode}/result`, { method: "POST", body: JSON.stringify({ won }) }).catch(() => {});
      setDuelCode(null);
      setBattle(null);
      say("Sfida tra Amici", [won ? "Hai vinto la sfida! Il tuo amico lo scoprirà presto... e non sarà contento." : "Hai perso la sfida. Nessun problema: la tua squadra non ha subito danni. Rivincita?"]);
      return;
    }'''),
('''<TileMap map={map} px={save.x} py={save.y} dir={save.dir} cols={COLS} rows={rows} size={size} defeated={save.defeated} />''', '''<TileMap map={map} px={save.x} py={save.y} dir={save.dir} cols={COLS} rows={rows} size={size} defeated={save.defeated} stepMs={run ? 110 : 170} />'''),
('''        {!!toast && (''', '''        {!!healK && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <HealFx key={healK} label="Squadra in forma!" />
          </View>
        )}
        {!!toast && ('''),
('''        <View style={styles.right}>
          <View style={styles.ab}>
            <Pressable testID="btn-b-menu" onPress={() => { hap("selection"); if (!busyRef.current) setMenu(true); }} style={({ pressed }) => [styles.round, styles.bBtn, pressed && styles.pressed]}>
              <PixelText style={styles.abTxt}>B</PixelText>
            </Pressable>''', '''        <Pressable testID="btn-menu-center" onPress={() => { hap("selection"); if (!busyRef.current) setMenu(true); }} style={({ pressed }) => [styles.menuPill, pressed && styles.pressed]}>
          <MaterialDesignIcons name="menu" size={18} color={colors.onSurface} />
          <PixelText style={styles.menuPillTxt}>MENU</PixelText>
        </Pressable>
        <View style={styles.right}>
          <View style={styles.ab}>
            <Pressable testID="btn-b-run" onPress={() => { hap("selection"); if (dialog) advanceDialog(); else { setRun(!run); setToast(run ? "Cammini" : "Corri!"); } }} style={({ pressed }) => [styles.round, styles.bBtn, run && styles.bOn, pressed && styles.pressed]}>
              <PixelText style={styles.abTxt}>B</PixelText>
            </Pressable>'''),
('''<PixelText style={styles.hint}>A parla · B menu</PixelText>''', '''<PixelText style={styles.hint}>A parla · B {run ? "cammina" : "corri"}</PixelText>'''),
('''            <MenuItem icon="account-group" label="Squadra"''', '''            <MenuItem icon="map" label="Mappa del Mondo" testID="menu-worldmap" onPress={() => { setMenu(false); router.push("/mappa"); }} />
            <MenuItem icon="sword-cross" label="Sfida tra Amici" testID="menu-duel" onPress={() => { setMenu(false); router.push("/sfida"); }} />
            <MenuItem icon="account-group" label="Squadra"'''),
('''  aBtn: { backgroundColor: colors.brandPrimary, marginBottom: 24 },
  bBtn: { backgroundColor: colors.brandTertiary },''', '''  aBtn: { backgroundColor: colors.brandTertiary, marginBottom: 24 },
  bBtn: { backgroundColor: colors.brandPrimary },
  bOn: { borderColor: colors.brandSecondary, borderWidth: 4 },
  menuPill: { alignItems: "center", justifyContent: "center", gap: 2, width: 64, height: 48, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceTertiary, borderRadius: 999, marginTop: 64 },
  menuPillTxt: { fontSize: 10, color: colors.onSurface },'''),
('''import { useAuth } from "@/src/auth";''', '''import { api } from "@/src/api";
import { useAuth } from "@/src/auth";'''),
])
print("ok")
