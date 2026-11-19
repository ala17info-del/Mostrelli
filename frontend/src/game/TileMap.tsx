import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

import { GameMap, ITEMS } from "./data";
import { NPC_SPRITES } from "./expansion";
import { Breathe, DayNightOverlay, useDayPhase } from "./Alive";
import { PixelSprite } from "./PixelSprite";
import { ANIMATED_TILES, neighbours, TileArt } from "./TileArt";
import { mapImage } from "./mapImage";
import { dressed, Outfit, shirtLook } from "./outfits";
import { PixelText } from "./ui";

type Dir = "up" | "down" | "left" | "right";
type Props = {
  map: GameMap;
  px: number;
  py: number;
  dir: string;
  cols: number;
  rows: number;
  size: number;
  defeated: string[];
  picked: string[];
  /** How long the slide to the next tile lasts. */
  stepMs?: number;
  /** Running: dust puffs under the feet. */
  running?: boolean;
  /** Goes up by one each time the player walks into something solid. */
  bump?: number;
  /** "f": the female player drawing. */
  gender?: "m" | "f";
  /** Clothes worn by the player. */
  outfit?: Outfit;
  /** The glide is almost at the target tile: time for the next step. */
  onNear?: () => void;
  /** The player has stopped. */
  onIdle?: () => void;
  /** Filled by the map: drive.current.go(x, y) starts the glide at once, without waiting for a render. */
  drive?: React.MutableRefObject<{ go: (x: number, y: number) => void } | null>;
  /** Where strolling locals are now (by NPC id). */
  npcPos?: Record<string, [number, number]>;
  /** Lead Mostrello walking behind the player. */
  follower?: { s: string; shiny?: boolean } | null;
  /** Other players online on this map. */
  others?: OtherPlayer[];
};
export type OtherPlayer = { id: string; name: string; x: number; y: number; dir: string };

// Performance notes
// - The map is drawn ONCE per map (Ground). Animated tiles (grass, water) have their second frame drawn
//   once in a separate layer (AnimLayer) whose opacity flips: the animation never re-renders a tile.
// - The player's poses are all mounted and switched with opacity, so a step never rebuilds a sprite.
// - Camera and player move with native transforms (CSS transitions on web).
const WEB = Platform.OS === "web";
const INDOOR = new Set(["acetaia", "mercato"]);
const TALL = new Set(["T", "R", "H", "B", "D", "N", "K", "M", "I", "=", "%", "&", "^", "!"]);
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Web: the whole map is one picture (see mapImage.ts) instead of thousands of <div>s.
const MapPicture = memo(function MapPicture({ map, size, phase }: { map: GameMap; size: number; phase: 0 | 1 }) {
  const uri = useMemo(() => mapImage(map, size, phase), [map, size, phase]);
  if (!uri) return null;
  const W = map.tiles[0].length, H = map.tiles.length;
  return <Image source={{ uri }} style={{ position: "absolute", left: 0, top: 0, width: W * size, height: H * size }} fadeDuration={0} />;
});

const Ground = memo(function Ground({ map, size }: { map: GameMap; size: number }) {
  if (WEB && typeof document !== "undefined") return <MapPicture map={map} size={size} phase={0} />;
  return (
    <>
      {map.tiles.map((row, y) => (
        <View key={y} style={st.row}>
          {row.split("").map((ch, x) => (
            <View key={x} style={{ width: size, height: size }}>
              <TileArt ch={ch} size={size} x={x} y={y} phase={0} nb={neighbours(map.tiles, x, y)} shadow={!TALL.has(ch) && TALL.has(map.tiles[y - 1]?.[x] ?? "")} />
            </View>
          ))}
        </View>
      ))}
    </>
  );
});

// Second animation frame of grass and water, drawn once, shown every other beat.
const AnimTiles = memo(function AnimTiles({ map, size }: { map: GameMap; size: number }) {
  const cells: React.ReactNode[] = [];
  map.tiles.forEach((row, y) =>
    row.split("").forEach((ch, x) => {
      if (!ANIMATED_TILES.has(ch)) return;
      cells.push(
        <View key={`${x},${y}`} style={[st.actor, { left: x * size, top: y * size, width: size, height: size }]}>
          <TileArt ch={ch} size={size} x={x} y={y} phase={1} nb={neighbours(map.tiles, x, y)} shadow={!TALL.has(ch) && TALL.has(map.tiles[y - 1]?.[x] ?? "")} />
        </View>,
      );
    }),
  );
  return <>{cells}</>;
});

function AnimLayer({ map, size }: { map: GameMap; size: number }) {
  const beat = useSharedValue(0);
  useEffect(() => {
    beat.value = withRepeat(withSequence(withDelay(900, withTiming(1, { duration: 0 })), withDelay(900, withTiming(0, { duration: 0 }))), -1);
    return () => cancelAnimation(beat);
  }, [beat]);
  const s = useAnimatedStyle(() => ({ opacity: beat.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s]}>
      {WEB && typeof document !== "undefined" ? <MapPicture map={map} size={size} phase={1} /> : <AnimTiles map={map} size={size} />}
    </Animated.View>
  );
}

// Soft cloud shadows drifting over outdoor maps in daytime.
function Clouds({ w, h, size }: { w: number; h: number; size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 46000, easing: Easing.linear }), -1);
    return () => cancelAnimation(t);
  }, [t]);
  const cw = size * 5;
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: -cw + t.value * (w + cw * 2) }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ translateX: -cw + ((t.value + 0.55) % 1) * (w + cw * 2) }] }));
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      <Animated.View style={[st.cloud, { top: h * 0.12, width: cw, height: size * 2.2, borderRadius: size * 1.1 }, a]} />
      <Animated.View style={[st.cloud, { top: h * 0.58, width: cw * 0.8, height: size * 1.8, borderRadius: size }, b]} />
    </View>
  );
}

// Warm light from doors after dark, drawn above the night tint so it stays bright.
const NightLights = memo(function NightLights({ map, size }: { map: GameMap; size: number }) {
  const glows: React.ReactNode[] = [];
  map.tiles.forEach((row, y) =>
    row.split("").forEach((ch, x) => {
      if (ch === "I") {
        // Street lamp: a wide warm pool of light on the ground and a bright lantern.
        const R = size * 2.6;
        glows.push(<View key={`l${x},${y}`} style={[st.glow, { left: x * size + size / 2 - R / 2, top: y * size + size * 0.5 - R / 2, width: R, height: R, borderRadius: R / 2, backgroundColor: "rgba(255,200,90,0.26)" }]} />);
        glows.push(<View key={`lc${x},${y}`} style={[st.glowCore, { left: x * size + size * 0.34, top: y * size + size * 0.16, width: size * 0.32, height: size * 0.2, backgroundColor: "rgba(255,236,150,0.95)" }]} />);
        return;
      }
      if (ch !== "D") return;
      const r = size * 1.5;
      glows.push(<View key={`${x},${y}`} style={[st.glow, { left: x * size + size / 2 - r / 2, top: y * size + size * 0.55 - r / 2, width: r, height: r, borderRadius: r / 2 }]} />);
      glows.push(<View key={`c${x},${y}`} style={[st.glowCore, { left: x * size + size * 0.3, top: y * size + size * 0.35, width: size * 0.4, height: size * 0.45 }]} />);
    }),
  );
  return <>{glows}</>;
});

const Actors = memo(function Actors({ map, size, defeated, picked, npcPos }: { map: GameMap; size: number; defeated: string[]; picked: string[]; npcPos?: Record<string, [number, number]> }) {
  return (
    <>
      {(map.pickups ?? []).filter((p) => !picked.includes(p.id)).map((p) => (
        <View key={p.id} style={[st.actor, { left: p.x * size, top: p.y * size }]} testID={`pickup-${p.id}`}>
          <Bob size={size}>
            <View style={[st.sparkle, { width: size * 0.5, height: size * 0.5, left: size * 0.25, top: size * 0.25 }]} />
            <PixelSprite name={ITEMS[p.item].kind === "level" ? "caramella" : "vasetto"} size={size * 0.8} />
          </Bob>
        </View>
      ))}
      {map.npcs.map((npc) => {
        const beaten = defeated.includes(npc.id);
        return (
          <Stroll key={npc.id} x={npcPos?.[npc.id]?.[0] ?? npc.x} y={npcPos?.[npc.id]?.[1] ?? npc.y} size={size} testID={`npc-${npc.id}`}>
            {npc.kind === "wild" && npc.mon ? (
              <Bob size={size}>
                <View style={[st.sparkle, { width: size * 0.7, height: size * 0.7, left: size * 0.15, top: size * 0.15, opacity: npc.mon.shiny ? 1 : 0.4 }]} />
                <PixelSprite name={npc.mon.s} size={size * 0.9} shiny={npc.mon.shiny} />
              </Bob>
            ) : map.tiles[npc.y]?.[npc.x] === "=" ? (
              // On a balcony: seen from the waist up, standing behind the railing (drawn again on top).
              <>
                <View style={{ position: "absolute", left: size * 0.08, top: -size * 0.3, width: size * 0.84, height: size * 0.84 }}>
                  <PixelSprite name={NPC_SPRITES[npc.id] ?? "person"} size={size * 0.84} look={npc.look} />
                </View>
                <View style={[st.actor, { left: 0, top: size * 0.425, width: size, height: size * 0.05, backgroundColor: "#5a5248" }]} />
                {[0.05, 0.275, 0.5, 0.725, 0.9].map((x, k) => <View key={k} style={[st.actor, { left: size * x, top: size * 0.45, width: size * 0.0625, height: size * 0.19, backgroundColor: "#5a5248" }]} />)}
                <View style={[st.actor, { left: 0, top: size * 0.625, width: size, height: size * 0.15, backgroundColor: "#b8b2a2" }]} />
              </>
            ) : (
              <>
            <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
              <Breathe size={size} hop={false} amount={0.6} delay={((npc.x * 7 + npc.y * 3) % 10) * 110}>
                <PixelSprite name={NPC_SPRITES[npc.id] ?? "person"} size={size} look={npc.look} />
              </Breathe>
              </>
            )}
            {(npc.kind === "heal" || npc.kind === "shop") && (
              <View style={[st.badge, { top: -size * 0.42, backgroundColor: npc.kind === "heal" ? "#2e7d32" : "#fbc02d" }]} testID={`marker-${npc.kind}-${npc.id}`}>
                <MaterialDesignIcons name={npc.kind === "heal" ? "heart-plus" : "cart"} size={11} color={npc.kind === "heal" ? "#ffffff" : "#1a1a1a"} />
                <PixelText style={[st.badgeTxt, { color: npc.kind === "heal" ? "#ffffff" : "#1a1a1a" }]}>{npc.kind === "heal" ? "CURA" : "MARKET"}</PixelText>
              </View>
            )}
            {npc.kind === "gym" && (
              <View style={[st.badge, { top: -size * 0.42, backgroundColor: "#c0392b" }]} testID={`marker-gym-${npc.id}`}>
                <MaterialDesignIcons name="crown" size={11} color="#ffffff" />
                <PixelText style={[st.badgeTxt, { color: "#ffffff" }]}>PALESTRA</PixelText>
              </View>
            )}
            {(npc.kind === "trainer" || npc.kind === "boss") && (
              <View style={[st.badge, { top: -size * 0.42, backgroundColor: beaten ? "#2e7d32" : npc.kind === "boss" ? "#c0392b" : "#424242", opacity: beaten ? 0.7 : 1 }]} testID={`marker-${npc.kind}-${npc.id}`}>
                <MaterialDesignIcons name={beaten ? "check-bold" : npc.kind === "boss" ? "crown" : "sword-cross"} size={11} color="#ffffff" />
              </View>
            )}
          </Stroll>
        );
      })}
    </>
  );
});

// A person who glides to a new tile when they take a step.
function Stroll({ x, y, size, testID, children }: { x: number; y: number; size: number; testID?: string; children: React.ReactNode }) {
  const sx = useSharedValue(x * size), sy = useSharedValue(y * size);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; sx.value = x * size; sy.value = y * size; return; }
    sx.value = withTiming(x * size, { duration: 420, easing: Easing.linear });
    sy.value = withTiming(y * size, { duration: 420, easing: Easing.linear });
  }, [x, y, size, sx, sy]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: sx.value }, { translateY: sy.value }] }));
  return <Animated.View style={[st.actor, { width: size, height: size }, s]} testID={testID}>{children}</Animated.View>;
}

function Bob({ size, children }: { size: number; children: React.ReactNode }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-size * 0.08, { duration: 500 }), withTiming(0, { duration: 500 })), -1);
    return () => cancelAnimation(y);
  }, [size, y]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ alignItems: "center", justifyContent: "center", width: size, height: size }, s]}>{children}</Animated.View>;
}

// One pose layer: visible only while `pose` equals `k`.
function Pose({ pose, k, children }: { pose: SharedValue<number>; k: number; children: React.ReactNode }) {
  const s = useAnimatedStyle(() => ({ opacity: pose.value === k ? 1 : 0 }));
  return <Animated.View style={[StyleSheet.absoluteFill, s]}>{children}</Animated.View>;
}

// All three poses of the current direction stay mounted: standing (0), left foot (1), right foot (2).
// Up/down use the mirrored walk drawing for the other foot, so the legs really alternate.
const Player = memo(function Player({ dir, size, pose, female, outfit }: { dir: string; size: number; pose: SharedValue<number>; female?: boolean; outfit?: Outfit }) {
  const side = dir === "left" || dir === "right";
  const f = female ? "_f" : "";
  const stand = dressed((dir === "up" ? "person_back" : dir === "down" ? "person" : "person_side") + f, outfit ?? {});
  const walk = dressed((dir === "up" ? "person_back_walk" : dir === "down" ? "person_walk" : "person_side_walk") + f, outfit ?? {});
  const look = shirtLook(outfit);
  const flip = dir === "left";
  return (
    <>
      <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
      <Pose pose={pose} k={0}><PixelSprite name={stand} size={size} flip={flip} look={look} /></Pose>
      <Pose pose={pose} k={1}><PixelSprite name={walk} size={size} flip={flip} look={look} /></Pose>
      <Pose pose={pose} k={2}><PixelSprite name={walk} size={size} flip={side ? flip : !flip} look={look} /></Pose>
    </>
  );
});

// Blades of tall grass drawn in front of the player's legs.
function GrassFront({ size, show }: { size: number; show: SharedValue<number> }) {
  const s = useAnimatedStyle(() => ({ opacity: show.value }));
  const u = size / 8;
  return (
    <Animated.View pointerEvents="none" style={[st.actor, { width: size, height: size }, s]}>
      {[0.6, 2.4, 4.2, 6].map((lx, i) => (
        <React.Fragment key={i}>
          <View style={[st.actor, { left: lx * u, top: u * (i % 2 ? 5.2 : 4.8), width: u * 1.3, height: u * 3.2, backgroundColor: "#245e24" }]} />
          <View style={[st.actor, { left: lx * u, top: u * (i % 2 ? 5.2 : 4.8), width: u * 1.3, height: u, backgroundColor: "#6fbf4a" }]} />
        </React.Fragment>
      ))}
      <View style={[st.actor, { left: 0, top: u * 7, width: size, height: u, backgroundColor: "#2f7a2c" }]} />
    </Animated.View>
  );
}

// Another player: glides to each new position it reports, with a name tag above.
function Ghost({ p, size }: { p: OtherPlayer; size: number }) {
  const gx = useSharedValue(p.x * size);
  const gy = useSharedValue(p.y * size);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const d = Math.min(1200, (Math.abs(gx.value / size - p.x) + Math.abs(gy.value / size - p.y)) * 180 + 120);
    gx.value = withTiming(p.x * size, { duration: d, easing: Easing.linear });
    gy.value = withTiming(p.y * size, { duration: d, easing: Easing.linear });
  }, [p.x, p.y, size, gx, gy]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: gx.value }, { translateY: gy.value }] }));
  const name = p.dir === "up" ? "person_back" : p.dir === "down" ? "person" : "person_side";
  return (
    <Animated.View pointerEvents="none" style={[st.actor, { width: size, height: size, opacity: 0.92 }, s]} testID={`other-${p.id}`}>
      <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
      <PixelSprite name={name} size={size} flip={p.dir === "left"} look={{ A: "#5e35b1", C: "#00897b" }} />
      <View style={[st.tag, { top: -size * 0.38 }]}>
        <PixelText style={st.tagTxt} numberOfLines={1}>{p.name}</PixelText>
      </View>
    </Animated.View>
  );
}

// Little burst under the feet: leaves in tall grass, dust when running.
type Burst = { k: number; x: number; y: number; kind: "leaf" | "dust" };
const BURST_DIRS: [number, number][] = [[-1, -0.6], [1, -0.7], [-0.6, -1.1], [0.7, -1]];
function StepBurst({ b, size }: { b: Burst; size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: b.kind === "leaf" ? 420 : 300, easing: Easing.out(Easing.quad) });
  }, [t, b.kind]);
  const colors = b.kind === "leaf" ? ["#6fbf4a", "#245e24", "#9ccc5a", "#3f8f3a"] : ["#e8d8b0", "#d7c39a", "#f4ead0", "#cdb98e"];
  const dot = size * (b.kind === "leaf" ? 0.14 : 0.18);
  return (
    <View pointerEvents="none" style={[st.actor, { left: b.x * size, top: b.y * size, width: size, height: size }]}>
      {BURST_DIRS.map(([dx, dy], i) => (
        <Particle key={i} t={t} dx={dx * size * 0.45} dy={dy * size * (b.kind === "leaf" ? 0.5 : 0.25)} left={size / 2 - dot / 2} top={size * 0.75} d={dot} c={colors[i]} round={b.kind === "dust"} />
      ))}
    </View>
  );
}
function Particle({ t, dx, dy, left, top, d, c, round }: { t: SharedValue<number>; dx: number; dy: number; left: number; top: number; d: number; c: string; round: boolean }) {
  const s = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: dx * t.value }, { translateY: dy * t.value + (round ? 0 : t.value * t.value * d * 3) }, { scale: round ? 0.6 + t.value * 0.8 : 1 }],
  }));
  return <Animated.View style={[st.actor, { left, top, width: d, height: d, backgroundColor: c, borderRadius: round ? d / 2 : 0 }, s]} />;
}

// Movement: the player glides at a constant speed, computed every screen frame (requestAnimationFrame).
// When the glide is about to reach the target tile, onNear asks the game for the next step, so the
// next target arrives before the player stops: steps and animation can never drift apart. On the web
// the position is written straight to the page (no React re-render per frame).


export function TileMap({ map, px, py, dir, cols, rows, size, defeated, picked, stepMs = 170, running = false, bump = 0, others, gender, onNear, onIdle, drive, follower, npcPos, outfit }: Props) {
  const night = useDayPhase() === "notte";
  const outdoor = !INDOOR.has(map.id) && !map.interior;
  const hx = Math.floor(cols / 2);
  const hy = Math.floor(rows / 2);
  const W = map.tiles[0].length, Hh = map.tiles.length;
  const clamp = (v: number, h: number, n: number, len: number) => (len >= n ? Math.max(h, Math.min(len - 1 - (n - 1 - h), v)) : Math.floor(len / 2));
  const camX = useSharedValue(-(clamp(px, hx, cols, W) - hx) * size);
  const camY = useSharedValue(-(clamp(py, hy, rows, Hh) - hy) * size);
  const plX = useSharedValue(px * size);
  const plY = useSharedValue(py * size);
  const nudgeX = useSharedValue(0);
  const nudgeY = useSharedValue(0);
  const pose = useSharedValue(0);
  const grass = useSharedValue(map.tiles[py]?.[px] === "G" ? 1 : 0);
  const fade = useSharedValue(1);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstK = useRef(0);

  const vis = useRef({ x: px, y: py });
  const tgt = useRef({ x: px, y: py, map: map.id, size });
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const nearSent = useRef(true);
  const steps = useRef(0);
  const poseNow = useRef(0);
  // The follower starts on the player's own tile (never inside a wall or a fountain) and then trails behind.
  const trail = useRef<[number, number][]>([[px, py], [px, py]]);
  const folNode = useRef<any>(null);
  const folX = useSharedValue(px * size), folY = useSharedValue((py + 1) * size);
  const [folFlip, setFolFlip] = useState(false);
  const camNode = useRef<any>(null);
  const camNode2 = useRef<any>(null);
  const plNode = useRef<any>(null);
  const cfg = useRef({ stepMs, size, cols, rows, W, Hh, hx, hy, onNear, onIdle });
  cfg.current = { stepMs, size, cols, rows, W, Hh, hx, hy, onNear, onIdle };

  const apply = () => {
    const c = cfg.current, v = vis.current;
    const cx = Math.round(-(clamp(v.x, c.hx, c.cols, c.W) - c.hx) * c.size);
    const cy = Math.round(-(clamp(v.y, c.hy, c.rows, c.Hh) - c.hy) * c.size);
    const pxp = Math.round(v.x * c.size), pyp = Math.round(v.y * c.size);
    // Follower: one tile behind, on the path the player walked.
    const g2 = tgt.current;
    const rem = Math.min(1, Math.abs(g2.x - v.x) + Math.abs(g2.y - v.y));
    const [a, b] = trail.current;
    const f = 1 - rem;
    const fx = (a[0] + (b[0] - a[0]) * f) * c.size, fy = (a[1] + (b[1] - a[1]) * f) * c.size - Math.sin(f * Math.PI) * c.size * 0.06;
    if (WEB) {
      const t = `translate3d(${cx}px, ${cy}px, 0)`;
      if (camNode.current?.style) camNode.current.style.transform = t;
      if (camNode2.current?.style) camNode2.current.style.transform = t;
      if (plNode.current?.style) plNode.current.style.transform = `translate3d(${pxp}px, ${pyp}px, 0)`;
      if (folNode.current?.style) folNode.current.style.transform = `translate3d(${Math.round(fx)}px, ${Math.round(fy)}px, 0)`;
    } else {
      camX.value = cx; camY.value = cy; plX.value = pxp; plY.value = pyp; folX.value = fx; folY.value = fy;
    }
  };

  // Moves the player by `budget` tiles toward the target. On arrival the game is asked right away
  // (still inside this frame) whether to continue, and the unused part of the frame is spent on the
  // next tile: no pause between tiles, and the next step is decided only on arrival, like classic
  // handheld games (release the button and the player stops on that tile).
  const glide = (budget: number) => {
    const v = vis.current;
    for (let i = 0; i < 3 && budget > 0; i++) {
      const g = tgt.current;
      const mx = Math.sign(g.x - v.x) * Math.min(Math.abs(g.x - v.x), budget);
      v.x += mx;
      budget -= Math.abs(mx);
      const my = Math.sign(g.y - v.y) * Math.min(Math.abs(g.y - v.y), budget);
      v.y += my;
      budget -= Math.abs(my);
      if (Math.abs(g.x - v.x) + Math.abs(g.y - v.y) > 0.0001) break;
      if (!nearSent.current) { nearSent.current = true; cfg.current.onNear?.(); }
      if (tgt.current === g) break; // nobody asked for another tile: stop here
    }
  };

  const frame = (t: number) => {
    raf.current = null;
    const dt = last.current ? Math.min(50, t - last.current) : 16;
    last.current = t;
    glide(dt / Math.max(40, cfg.current.stepMs));
    const v = vis.current, g = tgt.current;
    const rem = Math.abs(g.x - v.x) + Math.abs(g.y - v.y);
    // Legs: a foot forward in the first half of every tile, standing in the second half.
    const want = rem > 0.001 && rem % 1 > 0.5 ? (steps.current % 2 ? 1 : 2) : 0;
    if (poseNow.current !== want) { poseNow.current = want; pose.value = want; }
    apply();
    if (rem > 0.0001) raf.current = requestAnimationFrame(frame);
    else { last.current = 0; cfg.current.onIdle?.(); }
  };
  const run = () => { if (raf.current == null) { last.current = 0; raf.current = requestAnimationFrame(frame); } };
  useEffect(() => () => { if (raf.current != null) cancelAnimationFrame(raf.current); }, []);

  // Entering a new tile: legs, tall grass, little bursts, and the glide starts.
  const enter = (x: number, y: number) => {
    const from = tgt.current;
    if (x === from.x && y === from.y) return;
    trail.current = [trail.current[1], [from.x, from.y]];
    if (x !== from.x) setFolFlip(x < from.x);
    tgt.current = { ...from, x, y };
    steps.current++;
    nearSent.current = false;
    const onGrass = map.tiles[y]?.[x] === "G";
    grass.value = onGrass ? withDelay(stepMs * 0.45, withTiming(1, { duration: 0 })) : withTiming(0, { duration: 0 });
    if (onGrass || running) {
      const k = ++burstK.current;
      setBursts((b) => [...b.slice(-2), { k, x: onGrass ? x : from.x, y: onGrass ? y : from.y, kind: onGrass ? "leaf" : "dust" }]);
    }
    run();
  };
  const enterRef = useRef(enter);
  enterRef.current = enter;
  useEffect(() => {
    if (!drive) return;
    drive.current = { go: (x, y) => { if (Math.abs(x - tgt.current.x) + Math.abs(y - tgt.current.y) === 1) enterRef.current(x, y); } };
    return () => { drive.current = null; };
  }, [drive]);

  // A new target tile from the game state (or a new map).
  useEffect(() => {
    const g = tgt.current;
    const newMap = g.map !== map.id;
    const jump = newMap || g.size !== size || Math.abs(px - vis.current.x) + Math.abs(py - vis.current.y) > 2.5;
    const onGrass = map.tiles[py]?.[px] === "G";
    if (jump) {
      tgt.current = { x: px, y: py, map: map.id, size };
      if (raf.current != null) { cancelAnimationFrame(raf.current); raf.current = null; }
      vis.current = { x: px, y: py };
      // New map: the follower appears right behind the player.
      const [bx, by] = DELTA[(dir as Dir)] ?? [0, 1];
      const behind: [number, number] = [px - bx, py - by];
      const ok = !!map.tiles[behind[1]]?.[behind[0]] && !"TWRHDBSOUXKMNJI".includes(map.tiles[behind[1]][behind[0]]);
      trail.current = ok ? [behind, behind] : [[px, py], [px, py]];
      nearSent.current = true;
      poseNow.current = 0;
      pose.value = 0;
      grass.value = onGrass ? 1 : 0;
      apply();
      if (newMap) {
        fade.value = 1;
        fade.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) });
        setBursts([]);
      }
      setTimeout(() => cfg.current.onIdle?.(), 0);
      return;
    }
    // Usually the glide already knows this tile (drive.go); otherwise start it now.
    enter(px, py);
  }, [px, py, map.id, size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the position on screen after every render (and after layout changes).
  useLayoutEffect(() => { apply(); });

  // First appearance: fade in from black.
  useEffect(() => {
    fade.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) });
  }, [fade]);

  // Walking into something solid: a small push and back.
  useEffect(() => {
    if (!bump) return;
    const [dx, dy] = DELTA[(dir as Dir)] ?? [0, 0];
    const d = size * 0.12;
    nudgeX.value = withSequence(withTiming(dx * d, { duration: 60 }), withTiming(0, { duration: 110 }));
    nudgeY.value = withSequence(withTiming(dy * d, { duration: 60 }), withTiming(0, { duration: 110 }));
  }, [bump]); // eslint-disable-line react-hooks/exhaustive-deps

  const camStyle = useAnimatedStyle(() => ({ transform: [{ translateX: camX.value }, { translateY: camY.value }] }));
  const plStyle = useAnimatedStyle(() => ({ transform: [{ translateX: plX.value }, { translateY: plY.value }] }));
  const folStyle = useAnimatedStyle(() => ({ transform: [{ translateX: folX.value }, { translateY: folY.value }] }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudgeX.value }, { translateY: nudgeY.value }] }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const offX = W < cols ? Math.floor((cols - W) / 2) * size : 0;
  const offY = Hh < rows ? Math.floor((rows - Hh) / 2) * size : 0;
  const layer = useMemo(() => ({ position: "absolute" as const, left: offX, top: offY, width: W * size, height: Hh * size }), [offX, offY, W, Hh, size]);
  const Mover: any = WEB ? View : Animated.View;

  return (
    <View testID="tile-map" style={{ width: cols * size, height: rows * size, overflow: "hidden", backgroundColor: "#0b0b0b" }}>
      <Mover ref={camNode} style={[layer, WEB ? st.gpu : camStyle]}>
        <Ground map={map} size={size} />
        <AnimLayer map={map} size={size} />
        {bursts.map((b) => <StepBurst key={b.k} b={b} size={size} />)}
        <Actors map={map} size={size} defeated={defeated} picked={picked} npcPos={npcPos} />
        {others?.map((o) => <Ghost key={o.id} p={o} size={size} />)}
        {follower && (
          <Mover ref={folNode} pointerEvents="none" style={[st.actor, { width: size, height: size }, WEB ? st.gpu : folStyle]} testID="follower-sprite">
            <View style={[st.shadow, { width: size * 0.6, height: size * 0.16, left: size * 0.2, top: size * 0.84 }]} />
            <View style={{ position: "absolute", left: size * 0.08, top: size * 0.1 }}>
              <PixelSprite name={follower.s} size={size * 0.84} shiny={follower.shiny} flip={folFlip} />
            </View>
          </Mover>
        )}
        <Mover ref={plNode} style={[st.actor, { width: size, height: size }, WEB ? st.gpu : plStyle]} testID="player-sprite">
          <Animated.View style={[{ width: size, height: size }, innerStyle]}>
            <Player dir={dir} size={size} pose={pose} female={gender === "f"} outfit={outfit} />
          </Animated.View>
          <GrassFront size={size} show={grass} />
        </Mover>
        {outdoor && !night && <Clouds w={W * size} h={Hh * size} size={size} />}
      </Mover>
      {outdoor && <DayNightOverlay />}
      {outdoor && night && (
        <Mover ref={camNode2} pointerEvents="none" style={[layer, WEB ? st.gpu : camStyle]}>
          <NightLights map={map} size={size} />
        </Mover>
      )}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, st.black, fadeStyle]} />
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row" },
  actor: { position: "absolute", left: 0, top: 0 },
  shadow: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" },
  sparkle: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,241,150,0.55)" },
  cloud: { position: "absolute", left: 0, backgroundColor: "rgba(10,30,40,0.10)" },
  glow: { position: "absolute", backgroundColor: "rgba(255,190,90,0.22)" },
  glowCore: { position: "absolute", backgroundColor: "rgba(255,214,120,0.55)" },
  black: { backgroundColor: "#000000" },
  gpu: { willChange: "transform" } as any,
  badge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 1, borderColor: "#1a1a1a" },
  badgeTxt: { fontSize: 8, lineHeight: 11 },
  tag: { position: "absolute", alignSelf: "center", maxWidth: 90, paddingHorizontal: 3, backgroundColor: "rgba(94,53,177,0.9)", borderWidth: 1, borderColor: "#1a1a1a" },
  tagTxt: { fontSize: 8, lineHeight: 11, color: "#ffffff" },
});
