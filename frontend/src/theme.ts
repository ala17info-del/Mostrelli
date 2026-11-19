// Design tokens for Bologna Monstri. Dark-only retro palette from design_guidelines.json.
import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

// Vivid palette: deep indigo night instead of grey, bright candy accents.
const dark = {
  surface: "#1a1342",
  onSurface: "#ffffff",
  surfaceSecondary: "#271d63",
  onSurfaceSecondary: "#f1edff",
  surfaceTertiary: "#372a86",
  onSurfaceTertiary: "#e6e0ff",
  surfaceInverse: "#f1edff",
  onSurfaceInverse: "#1a1342",
  muted: "#b4a9ff",

  brand: "#ff3b5c",
  onBrand: "#ffffff",
  brandPrimary: "#ff3b5c",
  onBrandPrimary: "#ffffff",
  brandSecondary: "#ffcc1a",
  onBrandSecondary: "#1a1342",
  brandTertiary: "#17c964",
  onBrandTertiary: "#06281a",

  success: "#17c964",
  onSuccess: "#06281a",
  warning: "#ffcc1a",
  onWarning: "#1a1342",
  error: "#ff3b5c",
  onError: "#ffffff",
  info: "#3fa9ff",
  onInfo: "#ffffff",

  border: "#4b3cae",
  borderStrong: "#7a68f0",
  divider: "#2c2170",
  scrim: "rgba(10,6,40,0.78)",
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

/** Makes a colour more saturated and a touch brighter (greys, black and white stay as they are). */
const vividCache = new Map<string, string>();
export function vivid(hex: string): string {
  if (!hex || hex[0] !== "#" || hex.length !== 7) return hex;
  const hit = vividCache.get(hex);
  if (hit) return hit;
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, sat = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d > 0) {
    sat = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  let out = hex;
  if (sat > 0.08) {
    const s2 = Math.min(1, sat * 1.35 + 0.06);
    const l2 = l < 0.2 ? l : Math.min(0.9, l * 1.05);
    const c = (1 - Math.abs(2 * l2 - 1)) * s2, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l2 - c / 2;
    const [r2, g2, b2] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    out = "#" + [r2, g2, b2].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
  }
  vividCache.set(hex, out);
  return out;
}
