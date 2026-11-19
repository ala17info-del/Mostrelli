import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ALL_BADGES, BLOCKING, MAPS } from "@/src/game/data";
import { todaySagra } from "@/src/game/events";
import { useGame } from "@/src/game/GameContext";
import { CHAPTERS, chapterNow, STORY_END } from "@/src/game/story";
import { hap, PixelText } from "@/src/game/ui";
import { PROVINCES } from "@/src/game/world";
import { route, SIDE_NAME, Side, worldLayout } from "@/src/game/worldLayout";
import { GEO, GEO_H, GEO_W, project, regionImage } from "@/src/game/geo";
import { gymIdOf } from "@/src/game/gyms";

// Flying: in the test version every place is open; in the official one only places already visited.
const FREE_TRAVEL = process.env.EXPO_PUBLIC_DEMO === "1";

/** Where you land when you fly to a place: its healer spot, or the free tile nearest the middle. */
function landing(id: string): [number, number] {
  const m = MAPS[id];
  const free = (x: number, y: number) => { const c = m.tiles[y]?.[x]; return !!c && !BLOCKING.has(c) && !m.npcs.some((n) => n.x === x && n.y === y) && !m.exits.some((e) => e.x === x && e.y === y); };
  if (free(m.heal.x, m.heal.y)) return [m.heal.x, m.heal.y];
  for (let r = 0; r < 8; r++) for (let y = 7 - r; y <= 8 + r; y++) for (let x = 7 - r; x <= 8 + r; x++) if (free(x, y)) return [x, y];
  return [m.heal.x, m.heal.y];
}

/** The capopalestra of a place, also when waiting inside the gym hall. */
const bossOf = (id: string) => MAPS[id]?.npcs.find((n) => n.kind === "boss") ?? MAPS[gymIdOf(id)]?.npcs.find((n) => n.kind === "boss");
import { Image } from "react-native";
import { colors, FONT } from "@/src/theme";

// The world map: places laid out the way the exits connect them (east on the map = leave by the east
// exit), coloured by province. You are the pulsing marker, the story goal has a flag; tap a place to
// see the way there drawn in gold, with directions.
const CELL = 24;
const PAD = 40;
const ZMIN = 0.32, ZMAX = 4.5;
// Level of detail: far away only provinces, then the main towns, close up every village.
const Z_TOWNS = 0.9, Z_ALL = 1.9;
const PROV_COLOR: Record<string, string> = { PC: "#e76f51", PR: "#f4a261", RE: "#e9c46a", MO: "#8ac926", BO: "#2a9d8f", FE: "#3a6ea5", RA: "#4cc9f0", FC: "#a855f7", RN: "#ef476f" };

function Pulse() {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withRepeat(withTiming(1, { duration: 1100 }), -1); }, [t]);
  const st = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ scale: 1 + t.value * 1.6 }] }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, st]} />;
}

/** Directions, grouped: "3 volte Est fino a Imola, poi Sud fino a ...". */
function directions(steps: { id: string; side?: Side }[]) {
  const out: string[] = [];
  let i = 0;
  while (i < steps.length - 1) {
    const side = steps[i].side!;
    let j = i;
    while (j < steps.length - 1 && steps[j].side === side) j++;
    const n = j - i;
    out.push(`Esci ${n > 1 ? `${n} volte ` : ""}a ${SIDE_NAME[side]} fino a ${MAPS[steps[j].id].name}`);
    i = j;
  }
  return out;
}

export default function WorldMap() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save, setSave } = useGame();
  const [flying, setFlying] = useState(false);
  const L = useMemo(() => worldLayout(), []);
  const [sel, setSel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState({ w: 0, h: 0 });
  // Zoom Z is the committed level (the map is laid out for it); while pinching, a quick scale on top.
  const [Z, setZ] = useState(1.4);
  const tx = useSharedValue(0), ty = useSharedValue(0), live = useSharedValue(1);
  const zRef = useRef(1.4);
  zRef.current = Z;
  // The map you are on may be a building: show the town it belongs to.
  const here = useMemo(() => {
    if (!save) return "bologna";
    let id = save.map;
    if (MAPS[id]?.interior) id = MAPS[id].exits[0]?.to ?? id; // buildings and gyms count as their town
    return L.nodes[id] ? id : "bologna";
  }, [save, L]);
  const goal = save && chapterNow(save) < STORY_END ? CHAPTERS[chapterNow(save)].target : undefined;
  const sagra = todaySagra().map;
  const visited = new Set([...(save?.visited ?? []), here, "bologna"]);
  const path = useMemo(() => (sel ? route(here, sel) : null), [sel, here]);
  const onPath = useMemo(() => new Set((path ?? []).map((p) => p.id)), [path]);

  const pad = PAD * Z;
  const gp = useMemo(() => {
    const out: Record<string, [number, number]> = {};
    for (const id of Object.keys(L.nodes)) if (GEO[id]) out[id] = project(GEO[id][0], GEO[id][1]);
    for (let k = 0; k < 4; k++) for (const id of Object.keys(L.nodes)) {
      if (out[id]) continue;
      const nb = L.links.filter((l) => l.a === id || l.b === id).map((l) => out[l.a === id ? l.b : l.a]).filter(Boolean);
      if (nb.length) out[id] = [nb.reduce((a, p) => a + p[0], 0) / nb.length + 6, nb.reduce((a, p) => a + p[1], 0) / nb.length + 6];
    }
    return out;
  }, [L]);
  const px = (id: string) => pad + (gp[id]?.[0] ?? 0) * Z;
  const py = (id: string) => pad + (gp[id]?.[1] ?? 0) * Z;
  const W = (GEO_W + PAD * 2) * Z, H = (GEO_H + PAD * 2) * Z;
  const bg = useMemo(() => regionImage(), []);
  const clampPan = useCallback((x: number, y: number, z: number) => {
    const w = (GEO_W + PAD * 2) * z, h = (GEO_H + PAD * 2) * z;
    const minX = Math.min(0, view.w - w) - 80, minY = Math.min(0, view.h - h) - 80;
    return [Math.max(minX, Math.min(80, x)), Math.max(minY, Math.min(80, y))];
  }, [L, view]);
  const center = (id: string, z = Z) => {
    if (!L.nodes[id] || !view.w) return;
    const [x, y] = clampPan(view.w / 2 - (PAD + (gp[id]?.[0] ?? 0)) * z, view.h / 2.3 - (PAD + (gp[id]?.[1] ?? 0)) * z, z);
    tx.value = withTiming(x, { duration: 300 });
    ty.value = withTiming(y, { duration: 300 });
  };
  useEffect(() => { center(here); }, [view.w]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom keeping the point (fx, fy) of the screen still.
  const zoomTo = (nz: number, fx: number, fy: number) => {
    const z = zRef.current;
    nz = Math.max(ZMIN, Math.min(ZMAX, nz));
    const k = nz / z;
    const [x, y] = clampPan(fx - (fx - tx.value) * k, fy - (fy - ty.value) * k, nz);
    tx.value = x;
    ty.value = y;
    live.value = 1;
    setZ(nz);
  };

  // Gestures: one finger pans, two fingers pinch. Taps still reach the places (the map only takes
  // over once the finger moves).
  const g = useRef<{ mode: "pan" | "pinch" | null; x: number; y: number; tx: number; ty: number; d: number; mx: number; my: number }>({ mode: null, x: 0, y: 0, tx: 0, ty: 0, d: 1, mx: 0, my: 0 });
  const down = useRef({ x: 0, y: 0 });
  const org = useRef({ x: 0, y: 0 });
  const begin = (e: any) => {
    const t = e.nativeEvent.touches;
    if (t && t.length >= 2) {
      const [a1, b1] = [t[0], t[1]];
      g.current = { mode: "pinch", x: 0, y: 0, tx: tx.value, ty: ty.value, d: Math.hypot(a1.pageX - b1.pageX, a1.pageY - b1.pageY) || 1, mx: (a1.pageX + b1.pageX) / 2 - org.current.x, my: (a1.pageY + b1.pageY) / 2 - org.current.y };
    } else {
      g.current = { mode: "pan", x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, tx: tx.value, ty: ty.value, d: 1, mx: 0, my: 0 };
    }
  };
  const move = (e: any) => {
    const t = e.nativeEvent.touches;
    if (t && t.length >= 2 && g.current.mode !== "pinch") begin(e);
    const s0 = g.current;
    if (s0.mode === "pinch" && t && t.length >= 2) {
      const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
      const sc = Math.max(ZMIN / zRef.current, Math.min(ZMAX / zRef.current, d / s0.d));
      live.value = sc;
      tx.value = s0.mx - (s0.mx - s0.tx) * sc;
      ty.value = s0.my - (s0.my - s0.ty) * sc;
    } else if (s0.mode === "pan") {
      const [x, y] = clampPan(s0.tx + e.nativeEvent.pageX - s0.x, s0.ty + e.nativeEvent.pageY - s0.y, zRef.current);
      tx.value = x;
      ty.value = y;
    }
  };
  const lastPan = useRef(0);
  const end = () => {
    if (g.current.mode) lastPan.current = Date.now();
    if (g.current.mode === "pinch" && live.value !== 1) {
      // Commit the pinch: lay the map out again at the new zoom (labels stay sharp and readable).
      const nz = Math.max(ZMIN, Math.min(ZMAX, zRef.current * live.value));
      const [x, y] = clampPan(tx.value, ty.value, nz);
      tx.value = x; ty.value = y; live.value = 1;
      setZ(nz);
    }
    g.current.mode = null;
  };
  // Mouse wheel on computers.
  const wrapRef = useRef<any>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (Platform.OS !== "web" || !el?.addEventListener) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const r = el.getBoundingClientRect();
      zoomTo(zRef.current * (ev.deltaY < 0 ? 1.15 : 1 / 1.15), ev.clientX - r.left, ev.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const canvasStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: live.value }] }));

  // Labels that fit: most important first, skipped when they would touch one already placed.
  const labels = useMemo(() => {
    const ids = Object.keys(L.nodes);
    const prio = (id: string) => (id === here ? 0 : id === sel ? 1 : id === goal ? 2 : path && (id === path[path.length - 1]?.id) ? 3 : !MAPS[id].terrain ? 4 : MAPS[id].npcs.some((n) => n.kind === "heal") ? 5 : 6);
    const want = ids.filter((id) => {
      const p = prio(id);
      // Far away the provinces speak: no town names (the pulsing marker still shows where you are).
      if (Z < Z_TOWNS) return p >= 1 && p <= 3;
      if (p <= 3) return true;
      if (Z < Z_ALL) return p <= 5;
      return true;
    }).sort((a, b) => prio(a) - prio(b));
    const boxes: [number, number, number, number][] = [];
    const out = new Set<string>();
    for (const id of want) {
      const name = id === here ? `Sei qui · ${MAPS[id].name}` : MAPS[id].name;
      const w = name.length * 5.6 + 12, h = 15;
      const x = px(id) - w / 2, y = py(id) + 11;
      if (prio(id) > 3 && boxes.some(([bx, by, bw, bh]) => x < bx + bw && x + w > bx && y < by + bh && y + h > by)) continue;
      boxes.push([x, y, w, h]);
      out.add(id);
    }
    return out;
  }, [L, Z, here, sel, goal, path]); // eslint-disable-line react-hooks/exhaustive-deps
  // Province names at the middle of their places (shown when zoomed out).
  const provLabels = useMemo(() => {
    const acc: Record<string, { x: number; y: number; n: number }> = {};
    for (const id of Object.keys(L.nodes)) { const p = MAPS[id].prov ?? "BO"; const a = (acc[p] ??= { x: 0, y: 0, n: 0 }); a.x += gp[id]?.[0] ?? 0; a.y += gp[id]?.[1] ?? 0; a.n++; }
    const raw = Object.entries(acc).map(([p, a]) => ({ p, x: a.x / a.n, y: a.y / a.n }));
    const fs = Z < Z_TOWNS ? 14 : 12;
    const boxes: [number, number, number, number][] = [];
    return raw.map((r) => {
      const w = PROVINCES[r.p].length * fs * 0.78 + 16, h = fs + 6;
      const cx = pad + r.x * Z, cy = pad + r.y * Z;
      for (const dy of [0, -h, h, -2 * h, 2 * h, -3 * h, 3 * h]) {
        const box: [number, number, number, number] = [cx - w / 2, cy + dy - h / 2, w, h];
        if (!boxes.some(([bx, by, bw, bh]) => box[0] < bx + bw && box[0] + w > bx && box[1] < by + bh && box[1] + h > by)) {
          boxes.push(box);
          return { ...r, left: box[0], top: box[1], w, fs };
        }
      }
      return { ...r, left: cx - w / 2, top: cy - h / 2, w, fs };
    });
  }, [L, Z, pad, gp]);

  if (!save) return <Redirect href="/" />;

  const pick = (id: string) => { if (Date.now() - lastPan.current < 300) return; setSel(id); center(id); };
  const search = (q: string) => {
    setQuery(q);
    const s = q.trim().toLowerCase();
    if (s.length < 2) return;
    const hit = Object.keys(L.nodes).find((id) => MAPS[id].name.toLowerCase().startsWith(s)) ?? Object.keys(L.nodes).find((id) => MAPS[id].name.toLowerCase().includes(s));
    if (hit) pick(hit);
  };

  const m = sel ? MAPS[sel] : null;
  const lv = m?.wild.map((w) => w[1]) ?? [];
  const boss = sel ? bossOf(sel) : undefined;

  return (
    <View style={styles.root} testID="worldmap-screen">
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable testID="worldmap-back-btn" onPress={() => router.back()} style={styles.back}>
          <MaterialDesignIcons name="chevron-left" size={26} color={colors.brandSecondary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <PixelText style={styles.title}>Emilia-Romagna</PixelText>
          <PixelText style={styles.meta}>Sigilli {save.badges.length}/{ALL_BADGES.length} · visitati {Object.keys(L.nodes).filter((id) => visited.has(id)).length}/{Object.keys(L.nodes).length}</PixelText>
        </View>
      </View>
      <View style={styles.tools}>
        <TextInput testID="worldmap-search" value={query} onChangeText={search} placeholder="Cerca un paese…" placeholderTextColor={colors.muted} style={styles.search} autoCorrect={false} />
        <Pressable testID="worldmap-me" onPress={() => { setSel(null); center(here); }} style={styles.tool}><MaterialDesignIcons name="crosshairs-gps" size={20} color={colors.onSurface} /></Pressable>
        {goal && <Pressable testID="worldmap-goal" onPress={() => pick(goal)} style={styles.tool}><MaterialDesignIcons name="flag" size={20} color="#ff3b5c" /></Pressable>}
      </View>

      <View style={{ flex: 1 }} onLayout={(e) => setView({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <View
          ref={wrapRef}
          style={styles.viewport}
          onStartShouldSetResponder={() => true}
          onStartShouldSetResponderCapture={(e) => { down.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; return false; }}
          onMoveShouldSetResponderCapture={(e) => (e.nativeEvent.touches?.length ?? 0) >= 2 || Math.hypot(e.nativeEvent.pageX - down.current.x, e.nativeEvent.pageY - down.current.y) > 8}
          onLayout={() => wrapRef.current?.measureInWindow?.((x: number, y: number) => { org.current = { x, y }; })}
          onResponderTerminationRequest={() => false}
          onResponderGrant={begin}
          onResponderMove={move}
          onResponderRelease={end}
          onResponderTerminate={end}
        >
            <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: W, height: H, backgroundColor: "#e9e3cf", borderRadius: 18, transformOrigin: "0px 0px" } as any, canvasStyle]} testID="worldmap-canvas">
              {bg ? <Image source={{ uri: bg }} style={{ position: "absolute", left: pad, top: pad, width: GEO_W * Z, height: GEO_H * Z }} /> : <View style={{ position: "absolute", left: pad, top: pad, width: GEO_W * Z, height: GEO_H * Z, backgroundColor: "#d6eaa4", borderRadius: 30 }} />}
              {/* roads */}
              {L.links.map((l, k) => {
                const x1 = px(l.a), y1 = py(l.a), x2 = px(l.b), y2 = py(l.b);
                const len = Math.hypot(x2 - x1, y2 - y1), ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
                const lit = onPath.has(l.a) && onPath.has(l.b) && path && Math.abs(path.findIndex((p) => p.id === l.a) - path.findIndex((p) => p.id === l.b)) === 1;
                const th = (lit ? 7 : 4) * Math.min(1, 0.55 + Z * 0.45);
                return <View key={k} pointerEvents="none" style={{ position: "absolute", left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - th / 2, width: len, height: th, borderRadius: th, backgroundColor: lit ? "#ffcc1a" : "rgba(120,90,50,0.55)", transform: [{ rotate: `${ang}deg` }] }} />;
              })}
              {/* places */}
              {Object.keys(L.nodes).map((id) => {
                const mp = MAPS[id];
                const big = mp.npcs.some((n) => n.kind === "heal") || !mp.terrain;
                const r = (big ? 9 : 6) * Math.min(1.15, Math.max(0.55, Z));
                const known = visited.has(id);
                const showName = labels.has(id);
                return (
                  <Pressable key={id} testID={`worldmap-town-${id}`} onPress={() => pick(id)} hitSlop={8} style={{ position: "absolute", left: px(id) - 14, top: py(id) - 14, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                    {id === here && <Pulse />}
                    <View style={{ width: r * 2, height: r * 2, borderRadius: r, backgroundColor: known ? PROV_COLOR[mp.prov ?? "BO"] : "#f2f2f2", borderWidth: id === sel ? 3 : 2, borderColor: id === sel ? "#ffcc1a" : known ? "#24324a" : PROV_COLOR[mp.prov ?? "BO"] }} />
                    {id === here && <View style={styles.youDot} />}
                    {id === goal && <PixelText style={styles.flag}>🚩</PixelText>}
                    {id === sagra && <PixelText style={styles.party}>🎉</PixelText>}
                    {Z >= Z_TOWNS && bossOf(id) && !save.defeated.includes(bossOf(id)!.id) && <PixelText style={styles.crown}>👑</PixelText>}
                    {showName && (
                      <View pointerEvents="none" style={[styles.label, id === here && styles.labelHere]}>
                        <PixelText style={[styles.labelTxt, id === here && { color: "#1a1342" }]} numberOfLines={1}>{id === here ? `Sei qui · ${mp.name}` : mp.name}</PixelText>
                      </View>
                    )}
                  </Pressable>
                );
              })}
              {provLabels.map(({ p, left, top, w, fs }) => (
                <View key={p} pointerEvents="none" style={[styles.provBox, { left, top, width: w, opacity: Z < Z_TOWNS ? 1 : Z < Z_ALL ? 0.4 : 0 }]}>
                  <PixelText style={[styles.prov, { color: PROV_COLOR[p], fontSize: fs }]} numberOfLines={1}>{PROVINCES[p].toUpperCase()}</PixelText>
                </View>
              ))}
            </Animated.View>

        </View>
        {/* zoom buttons */}
        <View style={styles.zoomBox}>
          <Pressable testID="worldmap-zoom-in" onPress={() => zoomTo(Z * 1.4, view.w / 2, view.h / 2)} style={styles.zoomBtn}><MaterialDesignIcons name="plus" size={22} color={colors.onSurface} /></Pressable>
          <Pressable testID="worldmap-zoom-out" onPress={() => zoomTo(Z / 1.4, view.w / 2, view.h / 2)} style={styles.zoomBtn}><MaterialDesignIcons name="minus" size={22} color={colors.onSurface} /></Pressable>
        </View>
        {/* legend */}
        <View pointerEvents="none" style={styles.legend}>
          {Object.entries(PROV_COLOR).map(([k, c]) => (
            <View key={k} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: c }]} /><PixelText style={styles.legendTxt}>{k}</PixelText></View>
          ))}
        </View>
      </View>

      {/* the selected place and the way there */}
      <View style={[styles.card, { paddingBottom: insets.bottom + 12 }]} testID="worldmap-card">
        {!m ? (
          <PixelText style={styles.meta}>Tocca un paese per vedere come arrivarci. 🚩 obiettivo della storia · 🎉 sagra di oggi · 👑 capopalestra da battere</PixelText>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[styles.legendDot, { width: 14, height: 14, backgroundColor: PROV_COLOR[m.prov ?? "BO"] }]} />
              <PixelText style={styles.cardTitle} numberOfLines={1}>{m.name}</PixelText>
              <Pressable onPress={() => setSel(null)} hitSlop={10}><MaterialDesignIcons name="close" size={20} color={colors.muted} /></Pressable>
            </View>
            <PixelText style={styles.meta}>
              {m.fraz ? `Frazione di ${m.fraz} · ` : ""}{PROVINCES[m.prov ?? "BO"]} · {lv.length ? `Mostrelli Lv ${Math.min(...lv)}-${Math.max(...m.wild.map((w) => w[2]))}` : ""}
              {m.npcs.some((n) => n.kind === "heal") ? " · cura" : ""}{m.npcs.some((n) => n.kind === "shop") ? " · bottega" : ""}
              {boss ? ` · 👑 ${boss.name}${save.defeated.includes(boss.id) ? " (battuto)" : ""}` : ""}
            </PixelText>
            {sel !== here && (FREE_TRAVEL || visited.has(sel!)) && (
              <Pressable testID="worldmap-fly" disabled={flying} onPress={() => {
                // Fly: the marker zooms to the place, then the game opens there.
                hap("success");
                setFlying(true);
                center(sel!);
                setTimeout(() => {
                  const [x, y] = landing(sel!);
                  setSave((p) => ({ ...p, map: sel!, x, y, dir: "down", visited: (p.visited ?? []).includes(sel!) ? p.visited : [...(p.visited ?? []), sel!] }));
                  router.back();
                }, 450);
              }} style={({ pressed }) => [styles.fly, (pressed || flying) && { opacity: 0.7 }]}>
                <PixelText style={styles.flyTxt}>✈️ {flying ? "In volo…" : `Vola a ${m.name}`}</PixelText>
                {FREE_TRAVEL && <PixelText style={styles.flySub}>versione di prova: tutti i paesi sbloccati</PixelText>}
              </Pressable>
            )}
            {sel !== here && !FREE_TRAVEL && !visited.has(sel!) && <PixelText style={styles.step}>🔒 Visitalo almeno una volta per sbloccare il volo.</PixelText>}
            {sel === here ? (
              <PixelText style={styles.way}>📍 Sei già qui!</PixelText>
            ) : path ? (
              <>
                <PixelText style={styles.way}>🧭 {path.length - 1} {path.length - 1 === 1 ? "passaggio" : "passaggi"} da {MAPS[here].name}:</PixelText>
                {directions(path).slice(0, 4).map((d, i) => <PixelText key={i} style={styles.step}>{i + 1}. {d}</PixelText>)}
                {directions(path).length > 4 && <PixelText style={styles.step}>… e poi segui la strada dorata sulla mappa.</PixelText>}
              </>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  title: { fontSize: 18 },
  meta: { fontSize: 11, color: colors.muted, lineHeight: 16 },
  tools: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  search: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: 2, borderColor: colors.border, paddingHorizontal: 12, color: colors.onSurface, backgroundColor: colors.surfaceSecondary, fontFamily: FONT },
  tool: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border },
  viewport: { flex: 1, overflow: "hidden" },
  zoomBox: { position: "absolute", right: 10, bottom: 10, gap: 8 },
  zoomBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border },
  provBox: { position: "absolute", alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "rgba(26,19,66,0.82)", paddingVertical: 2 },
  prov: { letterSpacing: 1 },
  pulse: { position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,59,92,0.55)" },
  youDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#ffffff" },
  flag: { position: "absolute", top: -14, left: 14, fontSize: 16 },
  party: { position: "absolute", top: -12, right: 16, fontSize: 13 },
  crown: { position: "absolute", top: -11, fontSize: 11 },
  label: { position: "absolute", top: 24, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, backgroundColor: "rgba(26,19,66,0.85)", maxWidth: 140 },
  labelHere: { backgroundColor: "#ffcc1a" },
  labelTxt: { fontSize: 9, color: "#ffffff" },
  legend: { position: "absolute", left: 8, bottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 4, maxWidth: 220, padding: 6, borderRadius: 10, backgroundColor: "rgba(26,19,66,0.75)" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: "#24324a" },
  legendTxt: { fontSize: 9, color: "#ffffff" },
  card: { paddingHorizontal: 16, paddingTop: 12, gap: 4, minHeight: 120, backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  cardTitle: { fontSize: 16, flex: 1 },
  fly: { marginTop: 6, minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSecondary, borderBottomWidth: 4, borderColor: "rgba(0,0,0,0.25)" },
  flyTxt: { fontSize: 14, color: colors.onBrandSecondary },
  flySub: { fontSize: 9, color: colors.onBrandSecondary, opacity: 0.8 },
  way: { fontSize: 12, color: colors.brandSecondary, marginTop: 4 },
  step: { fontSize: 11, color: colors.onSurfaceSecondary },
});
