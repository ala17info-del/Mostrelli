import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

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
      <Text style={[styles.label, { color: fg }, small && { fontSize: 12 }]}>{label}</Text>
    </Pressable>
  );
}

export function HpBar({ hp, max, testID }: { hp: number; max: number; testID?: string }) {
  const r = Math.max(0, Math.min(1, hp / max));
  const c = r > 0.5 ? colors.success : r > 0.2 ? colors.warning : colors.error;
  return (
    <View testID={testID} style={styles.hpOuter}>
      <View style={{ width: `${r * 100}%`, height: "100%", backgroundColor: c }} />
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
  label: { fontFamily: FONT, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" },
  hpOuter: { height: 8, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.borderStrong, overflow: "hidden" },
});
