import React, { memo } from "react";
import { View } from "react-native";

import { PAL, SPRITES } from "./sprites";

type Props = {
  name: string;
  size: number;
  look?: Record<string, string>;
  silhouette?: boolean;
  flip?: boolean;
  testID?: string;
};

// Renders a 12x12 grid, merging horizontal runs of equal color into one View.
function PixelSpriteBase({ name, size, look, silhouette, flip, testID }: Props) {
  const grid = SPRITES[name] ?? SPRITES.person;
  const px = size / grid.length;
  return (
    <View testID={testID} style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }}>
      {grid.map((row, ri) => {
        const runs: { ch: string; len: number }[] = [];
        for (const ch of row) {
          const last = runs[runs.length - 1];
          if (last && last.ch === ch) last.len++;
          else runs.push({ ch, len: 1 });
        }
        return (
          <View key={ri} style={{ flexDirection: "row", height: px }}>
            {runs.map((r, i) => {
              const color = r.ch === "." ? "transparent" : silhouette ? "#000000" : look?.[r.ch] ?? PAL[r.ch];
              return <View key={i} style={{ width: px * r.len, height: px, backgroundColor: color }} />;
            })}
          </View>
        );
      })}
    </View>
  );
}

export const PixelSprite = memo(PixelSpriteBase);
