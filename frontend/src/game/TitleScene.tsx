import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

// Original pixel-art panorama of a generic Emilia-Romagna: Apennine hills with vineyards,
// a medieval tower and porticoes in the plain, a bell tower in the fog and the Adriatic beach.
// Colours are fixed scene art (same in every theme).
const B = (l: number, t: number, w: number, h: number, c: string, extra?: ViewStyle) => ({ position: "absolute" as const, left: `${l}%` as const, top: `${t}%` as const, width: `${w}%` as const, height: `${h}%` as const, backgroundColor: c, ...extra });

const HILLS: [number, number, number, number, string][] = [
  [-20, 34, 70, 40, "#5d7f9a"], [30, 30, 90, 44, "#6d8fa8"], // far Apennines
  [-30, 44, 80, 40, "#6f9a3a"], [35, 42, 85, 42, "#7fae44"], // green hills
];

export const TitleScene = memo(function TitleScene() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="title-scene">
      <LinearGradient colors={["#2b1d4e", "#c8507a", "#f4a259", "#fde2a6"]} locations={[0, 0.35, 0.55, 0.7]} style={StyleSheet.absoluteFill} />
      <View style={B(76, 34, 12, 6, "#ffe9a8", { borderRadius: 999 })} />
      {[[10, 10], [24, 6], [52, 12], [86, 8], [40, 4]].map(([l, t], i) => <View key={i} style={B(l, t, 0.8, 0.4, "#fff6d8")} />)}
      {HILLS.map(([l, t, w, h, c], i) => <View key={i} style={B(l, t, w, h, c, { borderTopLeftRadius: 999, borderTopRightRadius: 999 })} />)}
      {/* vineyard rows on the hills */}
      {Array.from({ length: 7 }).map((_, i) => <View key={`v${i}`} style={B(42 + i * 6, 47 + (i % 2), 3, 9, "#4f7a28", { borderRadius: 2 })} />)}
      {Array.from({ length: 6 }).map((_, i) => <View key={`w${i}`} style={B(2 + i * 6, 50, 3, 7, "#5a8a2e", { borderRadius: 2 })} />)}
      {/* plain with fog */}
      <View style={B(0, 58, 100, 42, "#9ab85a")} />
      <View style={B(0, 58, 100, 4, "rgba(255,255,255,0.45)")} />
      {/* poplars along the plain */}
      {[6, 14, 22, 88, 94].map((l, i) => <View key={`p${i}`} style={B(l, 50, 2.4, 10, "#3f6b2a", { borderRadius: 999 })} />)}
      {/* medieval town: tower, porticoes, red roofs */}
      <View style={B(30, 42, 6, 20, "#b5562f")} />
      <View style={B(29, 40, 8, 3, "#7a2519")} />
      <View style={B(31.5, 45, 3, 3, "#3e2a20")} />
      <View style={B(18, 52, 40, 9, "#d07a4c")} />
      <View style={B(16, 49, 44, 4, "#a83a2a")} />
      {Array.from({ length: 8 }).map((_, i) => <View key={`a${i}`} style={B(19 + i * 4.8, 56, 3, 5, "#5e2414", { borderTopLeftRadius: 99, borderTopRightRadius: 99 })} />)}
      <View style={B(48, 42, 4, 12, "#c96a40")} />
      <View style={B(47.5, 40, 5, 3, "#7a2519", { borderTopLeftRadius: 99, borderTopRightRadius: 99 })} />
      {/* beach and Adriatic on the right */}
      <View style={B(62, 60, 38, 40, "#f0d9a0")} />
      <View style={B(80, 58, 20, 42, "#2878c0")} />
      <View style={B(80, 58, 20, 1.2, "#c8f0ff")} />
      {[[66, 61, "#c0392b"], [72, 63, "#fbc02d"], [67, 67, "#1565c0"]].map(([l, t, c], i) => (
        <React.Fragment key={`u${i}`}>
          <View style={B(l as number, t as number, 5, 2.5, c as string, { borderTopLeftRadius: 99, borderTopRightRadius: 99 })} />
          <View style={B((l as number) + 2.3, (t as number) + 2.5, 0.6, 3, "#4e342e")} />
        </React.Fragment>
      ))}
    </View>
  );
});
