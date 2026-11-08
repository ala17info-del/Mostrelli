import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, FONT } from "@/src/theme";

export function hap(kind: "light" | "medium" | "heavy" | "success" | "error" | "selection") {
  if (Platform.OS === "web") return;
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
export function Logo({ size = 44, ribbon }: { size?: number; ribbon?: string }) {
  const t = "MOSTRELLI";
  const o = Math.max(2, Math.round(size / 14));
  const base = { fontFamily: FONT, fontSize: size, lineHeight: size * 1.2, letterSpacing: 2 };
  const ring: [number, number][] = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]];
  return (
    <View style={{ alignSelf: "flex-start" }}>
      <View>
        <Text style={[base, { position: "absolute", left: o * 1.5, top: o * 1.5, color: "#c0392b" }]}>{t}</Text>
        {ring.map(([x, y], i) => (
          <Text key={i} style={[base, { position: "absolute", left: x, top: y, color: "#1a0f08" }]}>{t}</Text>
        ))}
        <Text testID="title-text" style={[base, { color: "#ffd54f" }]}>{t}</Text>
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
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.onSurface,
    borderRadius: 2,
    borderBottomWidth: 4,
  },
  small: { minHeight: 44, paddingHorizontal: 12 },
  shine: { position: "absolute", left: 2, right: 2, top: 2, height: 3, backgroundColor: "rgba(255,255,255,0.35)" },
  ribbon: { marginTop: 6, alignSelf: "flex-start", backgroundColor: "#c0392b", borderWidth: 2, borderColor: "#1a0f08", paddingHorizontal: 10, paddingVertical: 3, transform: [{ rotate: "-2deg" }] },
  ribbonTxt: { fontFamily: FONT, fontSize: 11, color: "#ffffff", letterSpacing: 2 },
  label: { fontFamily: FONT, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" },
  hpOuter: { height: 8, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.borderStrong, overflow: "hidden" },
});
