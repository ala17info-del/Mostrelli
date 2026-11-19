import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { colors, FONT } from "@/src/theme";

// Web vibration. Android: the Vibration API. iPhone (Safari, iOS 18 and later): there is no vibration
// API, but toggling a "switch" checkbox makes a light tap. A hidden one is added, clicked and removed
// each time, the same way the libraries known to work on iPhone do it.
function webTap(ms: number) {
  try {
    const nav = navigator as any;
    if (typeof nav.vibrate === "function" && nav.vibrate(ms)) return;
    if (typeof document === "undefined") return;
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
  } catch {}
}

export function hap(kind: "light" | "medium" | "heavy" | "success" | "error" | "selection") {
  if (Platform.OS === "web") return webTap(kind === "heavy" || kind === "error" ? 25 : kind === "medium" || kind === "success" ? 15 : 8);
  if (kind === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else if (kind === "selection") Haptics.selectionAsync();
  else Haptics.impactAsync(kind === "light" ? Haptics.ImpactFeedbackStyle.Light : kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
}

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "success";
  testID: string;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
};

export function RetroButton({ label, onPress, variant = "primary", testID, disabled, style, small }: BtnProps) {
  const bg = variant === "primary" ? colors.brandPrimary : variant === "secondary" ? colors.brandSecondary : variant === "success" ? colors.brandTertiary : colors.surfaceTertiary;
  const fg = variant === "primary" ? colors.onBrandPrimary : variant === "secondary" ? colors.onBrandSecondary : variant === "success" ? colors.onBrandTertiary : colors.onSurface;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => {
        hap("medium");
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.shine} />
      <Text style={[styles.label, { color: fg }, small && { fontSize: 12 }]}>{label}</Text>
    </Pressable>
  );
}

// Game logo: gold letters with a thick dark outline and a red drop shadow, plus a ribbon.
// One letter of the logo: outline, red drop shadow and gold face; hops in a wave with the others.
function LogoLetter({ ch, i, base, o }: { ch: string; i: number; base: object; o: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(i * 110, withRepeat(withSequence(withTiming(-o * 3, { duration: 260, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 1600 })), -1));
  }, [y, i, o]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const ring: [number, number][] = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]];
  return (
    <Animated.View style={st}>
      <Text style={[base, { position: "absolute", left: o * 1.5, top: o * 1.5, color: "#c0392b" }]}>{ch}</Text>
      {ring.map(([x, yy], k) => <Text key={k} style={[base, { position: "absolute", left: x, top: yy, color: "#1a0f08" }]}>{ch}</Text>)}
      <Text style={[base, { color: "#ffd54f" }]}>{ch}</Text>
    </Animated.View>
  );
}

export function Logo({ size = 44, ribbon }: { size?: number; ribbon?: string }) {
  const t = "MOSTRELLI";
  const o = Math.max(2, Math.round(size / 14));
  const base = { fontFamily: FONT, fontSize: size, lineHeight: size * 1.2, letterSpacing: 2 };
  return (
    <View style={{ alignSelf: "flex-start" }}>
      <View testID="title-text" style={{ flexDirection: "row" }} accessibilityLabel={t}>
        {t.split("").map((ch, i) => <LogoLetter key={i} ch={ch} i={i} base={base} o={o} />)}
      </View>
      {ribbon && (
        <View style={styles.ribbon}>
          <Text style={styles.ribbonTxt}>{ribbon}</Text>
        </View>
      )}
    </View>
  );
}

export function HpBar({ hp, max, testID }: { hp: number; max: number; testID?: string }) {
  const r = Math.max(0, Math.min(1, hp / max));
  const c = r > 0.5 ? colors.success : r > 0.2 ? colors.warning : colors.error;
  const w = useSharedValue(r);
  React.useEffect(() => {
    w.value = withTiming(r, { duration: 450 });
  }, [r, w]);
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View testID={testID} style={styles.hpOuter}>
      <Animated.View style={[{ height: "100%", backgroundColor: c }, st]} />
    </View>
  );
}

export function PixelText({ children, style, testID, numberOfLines }: { children: React.ReactNode; style?: any; testID?: string; numberOfLines?: number }) {
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[{ fontFamily: FONT, color: colors.onSurface, fontSize: 14 }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0,0,0,0.28)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  small: { minHeight: 44, paddingHorizontal: 12 },
  shine: { position: "absolute", left: 10, right: 10, top: 5, height: 4, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.28)" },
  ribbon: { marginTop: 6, alignSelf: "flex-start", backgroundColor: "#c0392b", borderWidth: 2, borderColor: "#1a0f08", paddingHorizontal: 10, paddingVertical: 3, transform: [{ rotate: "-2deg" }] },
  ribbonTxt: { fontFamily: FONT, fontSize: 11, color: "#ffffff", letterSpacing: 2 },
  label: { fontFamily: FONT, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" },
  hpOuter: { height: 8, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.borderStrong, overflow: "hidden" },
});
