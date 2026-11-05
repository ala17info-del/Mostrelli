// Design tokens for Bologna Monstri. Dark-only retro palette from design_guidelines.json.
import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#121212",
  onSurface: "#f5f5f5",
  surfaceSecondary: "#1e1e1e",
  onSurfaceSecondary: "#e0e0e0",
  surfaceTertiary: "#2a2a2a",
  onSurfaceTertiary: "#d4d4d4",
  surfaceInverse: "#e0e0e0",
  onSurfaceInverse: "#121212",
  muted: "#9e9e9e",

  brand: "#d32f2f",
  onBrand: "#ffffff",
  brandPrimary: "#d32f2f",
  onBrandPrimary: "#ffffff",
  brandSecondary: "#fbc02d",
  onBrandSecondary: "#121212",
  brandTertiary: "#388e3c",
  onBrandTertiary: "#ffffff",

  success: "#388e3c",
  onSuccess: "#ffffff",
  warning: "#fbc02d",
  onWarning: "#121212",
  error: "#d32f2f",
  onError: "#ffffff",
  info: "#757575",
  onInfo: "#ffffff",

  border: "#333333",
  borderStrong: "#555555",
  divider: "#262626",
  scrim: "rgba(0,0,0,0.75)",
};

export type ThemeColors = typeof dark;
export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light: dark, dark };
export const colors = dark;
export const FONT = "SpaceMono";

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}
setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  return { scheme: "dark", colors: dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors: c } = useTheme();
    return useMemo(() => StyleSheet.create(factory(c)), [c]);
  };
}
