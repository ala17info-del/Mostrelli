import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { PixelText, RetroButton } from "@/src/game/ui";
import { colors, FONT } from "@/src/theme";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, register, loginApple } = useAuth();
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
  };
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Inserisci un'email valida e una password di almeno 6 caratteri.");
      return;
    }
    setBusy(true);
    try {
      await (mode === "login" ? login(email, password) : register(email, password));
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <Pressable testID="auth-back-btn" onPress={() => router.back()} style={styles.back}>
          <PixelText style={{ color: colors.brandSecondary }}>‹ Indietro</PixelText>
        </Pressable>
        <PixelText style={styles.title}>{mode === "login" ? "ACCEDI" : "NUOVO ALLENATORE"}</PixelText>
        <PixelText style={styles.sub}>I tuoi mostrelli restano al sicuro nel cloud, anche se cambi telefono.</PixelText>
        <View style={styles.tabs}>
          {(["login", "register"] as const).map((m) => (
            <Pressable key={m} testID={`auth-tab-${m}`} onPress={() => setMode(m)} style={[styles.tab, mode === m && styles.tabOn]}>
              <PixelText style={{ color: mode === m ? colors.onBrandSecondary : colors.onSurface, fontSize: 13 }}>{m === "login" ? "Accedi" : "Registrati"}</PixelText>
            </Pressable>
          ))}
        </View>
        <PixelText style={styles.label}>Email</PixelText>
        <TextInput testID="auth-email-input" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="tu@esempio.it" placeholderTextColor={colors.muted} />
        <PixelText style={styles.label}>Password</PixelText>
        <TextInput testID="auth-password-input" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="almeno 6 caratteri" placeholderTextColor={colors.muted} onSubmitEditing={submit} returnKeyType="go" />
        {!!error && <PixelText testID="auth-error" style={styles.error}>{error}</PixelText>}
        {appleOk && (
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
        <RetroButton testID="auth-submit-btn" label={busy ? "Attendi..." : mode === "login" ? "Entra" : "Crea account"} disabled={busy} onPress={submit} style={{ marginTop: 24 }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  title: { fontSize: 24, marginTop: 16 },
  sub: { color: colors.muted, marginTop: 8, fontSize: 13, lineHeight: 20 },
  tabs: { flexDirection: "row", marginTop: 24, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong },
  tab: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: colors.brandSecondary },
  label: { marginTop: 16, marginBottom: 6, color: colors.onSurfaceSecondary, fontSize: 12 },
  input: { height: 52, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, color: colors.onSurface, paddingHorizontal: 12, fontFamily: FONT, fontSize: 15, borderRadius: 2 },
  error: { color: colors.error, marginTop: 12, fontSize: 13 },
  or: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 12 },
});
