import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Battle, BattleResult, BattleSetup, weatherFor } from "@/src/game/Battle";
import { X_TRAINER_PRIZES } from "@/src/game/expansion";
import { BgmName, initAudio, isMuted, playBgm, setMuted, sfx } from "@/src/game/audio";
import { ALL_BADGES, BLOCKING, ENCOUNTER_TILES, ITEMS, ItemId, MAPS, Npc } from "@/src/game/data";
import { healAll, makeMon, monName, rollWild, stats } from "@/src/game/engine";
import { Save, useGame } from "@/src/game/GameContext";
import { HealFx } from "@/src/game/BattleFx";
import { OtherPlayer, TileMap } from "@/src/game/TileMap";
import { PixelSprite } from "@/src/game/PixelSprite";
import { dayKey, todaySagra } from "@/src/game/events";
import { newlyEarned, prizeText, TROPHIES } from "@/src/game/trophies";
import { CHAPTERS, chapterNow, npcVisible, STORY_END } from "@/src/game/story";
import { GameMap, MOVES, SPECIES, TYPES } from "@/src/game/data";
import { CLEARED_AS, FIELD, fieldUser, Obstacle, OBSTACLES } from "@/src/game/secrets";
import { ACC, ACCESSORIES, dressed, shirtLook, Slot } from "@/src/game/outfits";

// Tiles where the player lands when entering a map: locals never stand on them.
const arrivalsCache = new Map<string, Set<string>>();
function arrivalsOf(id: string) {
  let a = arrivalsCache.get(id);
  if (!a) { a = new Set(); for (const m of Object.values(MAPS)) for (const e of m.exits) if (e.to === id) a.add(`${e.tx},${e.ty}`); arrivalsCache.set(id, a); }
  return a;
}

// The map as the player sees it: gang members only during their chapter. Cached so the map
// drawing is not rebuilt on every step.
// Also: obstacles already cleared become open ground, special Mostrelli already met disappear.
const viewCache = new Map<string, GameMap>();
function mapView(m: GameMap, story: number, cleared: string[] = [], defeated: string[] = []): GameMap {
  const mine = cleared.filter((c) => c.startsWith(`${m.id}:`));
  const gone = m.npcs.filter((n) => n.kind === "wild" && defeated.includes(n.id)).map((n) => n.id);
  if (!m.npcs.some((n) => n.story !== undefined) && !mine.length && !gone.length) return m;
  const key = `${m.id}:${story}:${mine.join(";")}:${gone.join(";")}`;
  let v = viewCache.get(key);
  if (!v) {
    const rows = m.tiles.map((r) => r.split(""));
    for (const c of mine) { const [x, y] = c.split(":")[1].split(",").map(Number); const ch = rows[y]?.[x] as Obstacle; if (CLEARED_AS[ch]) rows[y][x] = CLEARED_AS[ch]; }
    v = { ...m, tiles: rows.map((r) => r.join("")), npcs: m.npcs.filter((n) => npcVisible(n, { story }) && !gone.includes(n.id)) };
    viewCache.set(key, v);
  }
  return v;
}
import { hap, HpBar, PixelText, RetroButton } from "@/src/game/ui";
import { colors } from "@/src/theme";

type Dir = Save["dir"];
type Dialog = { speaker: string; lines: string[]; idx: number; onDone?: () => void };
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
// Tiles across the screen: 11 shows more of the map with smaller tiles.
const COLS = 11;
const ENCOUNTER = 0.1;
// Walking speed (ms per tile): a little slower than before, easier to control. No running.
const WALK_MS = 215;
const EMPTY: string[] = [];

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { save, setSave, flush, sync, duel, setDuel } = useGame();
  const [run, setRun] = useState(false);
  const runRef = useRef(false);
  runRef.current = run;
  const [healK, setHealK] = useState(0);
  const [duelCode, setDuelCode] = useState<string | null>(null);
  useEffect(() => {
    if (!duel) return;
    setDuel(null);
    setDuelCode(duel.code);
    setBattle({ kind: "trainer", trainerName: `${duel.name} (sfida)`, field: "grass", duel: true, enemies: duel.party.map((m) => ({ ...m, uid: Math.random().toString(36).slice(2, 10), hp: stats(m).hp })) });
  }, [duel, setDuel]);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [battle, setBattle] = useState<(BattleSetup & { npc?: Npc }) | null>(null);
  const [menu, setMenu] = useState(false);
  const [shop, setShop] = useState(false);
  const [toast, setToast] = useState("");
  const saveRef = useRef(save);
  saveRef.current = save;
  // Where the player really is right now (ahead of the next render when steps come quickly).
  const posRef = useRef<{ map: string; x: number; y: number } | null>(null);
  if (save) posRef.current = { map: save.map, x: save.x, y: save.y };
  const busyRef = useRef(false);
  busyRef.current = !!dialog || !!battle || menu || shop;
  const heldRef = useRef<Dir | null>(null);
  const [bump, setBump] = useState(0);
  // Clothes: the boutique of a town (map id) and the wardrobe.
  const [boutique, setBoutique] = useState<string | null>(null);
  const [wardrobe, setWardrobe] = useState(false);
  const { width: winW } = useWindowDimensions();
  // Locals stroll around: every so often one of them takes a step, staying near home.
  const [npcPos, setNpcPos] = useState<Record<string, [number, number]>>({});
  const npcPosRef = useRef(npcPos);
  npcPosRef.current = npcPos;
  const npcXY = (n: Npc): [number, number] => npcPosRef.current[n.id] ?? [n.x, n.y];
  const calmRef = useRef(true);
  useEffect(() => { setNpcPos({}); }, [save?.map]);
  useEffect(() => {
    const t = setInterval(() => {
      const s = saveRef.current;
      if (!s || busyRef.current || !calmRef.current) return;
      const m = MAPS[s.map];
      const walkers = m.npcs.filter((n) => n.kind === "talk" && npcVisible(n, s) && !BLOCKING.has(m.tiles[n.y]?.[n.x] ?? ""));
      if (!walkers.length) return;
      const n = walkers[Math.floor(Math.random() * walkers.length)];
      const pos = npcPosRef.current;
      const [cx, cy] = pos[n.id] ?? [n.x, n.y];
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      const nx = cx + dx, ny = cy + dy;
      if (Math.abs(nx - n.x) + Math.abs(ny - n.y) > 2) return;
      const ch = m.tiles[ny]?.[nx];
      if (!ch || BLOCKING.has(ch) || ENCOUNTER_TILES.has(ch)) return;
      if (m.exits.some((e) => e.x === nx && e.y === ny) || arrivalsOf(m.id).has(`${nx},${ny}`)) return;
      const me = posRef.current;
      if (me && Math.abs(me.x - nx) + Math.abs(me.y - ny) <= 1) return;
      if (m.npcs.some((o) => o !== n && npcVisible(o, s) && (pos[o.id]?.[0] ?? o.x) === nx && (pos[o.id]?.[1] ?? o.y) === ny)) return;
      if ((m.pickups ?? []).some((p) => p.x === nx && p.y === ny && !(s.picked ?? []).includes(p.id))) return;
      setNpcPos({ ...pos, [n.id]: [nx, ny] });
    }, 1400);
    return () => clearInterval(t);
  }, []);
  // Trophies: collected automatically as soon as a goal is reached, with a banner.
  const [trophyPop, setTrophyPop] = useState<{ icon: string; name: string; prize: string } | null>(null);
  const earned = save ? newlyEarned(save) : [];
  const earnedKey = earned.map((t) => t.id).join(",");
  useEffect(() => {
    if (!earnedKey) return;
    const list = TROPHIES.filter((t) => earnedKey.split(",").includes(t.id));
    setSave((p) => {
      const n = { ...p, items: { ...p.items }, money: p.money, trophies: [...(p.trophies ?? [])] };
      for (const t of list) {
        if (n.trophies.includes(t.id)) continue;
        n.trophies.push(t.id);
        n.money += t.prize.money ?? 0;
        for (const [k, v] of Object.entries(t.prize.items ?? {})) n.items[k] = (n.items[k] ?? 0) + (v ?? 0);
      }
      return n;
    });
    const t = list[0];
    setTrophyPop({ icon: t.icon, name: list.length > 1 ? `${t.name} e altri ${list.length - 1}` : t.name, prize: prizeText(t) });
    hap("success");
    sfx("levelup");
    const timer = setTimeout(() => setTrophyPop(null), 3800);
    return () => clearTimeout(timer);
  }, [earnedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real clock in the corner (the map lighting follows it too).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);

  // Main story: when the current chapter's goal is reached, show its scene and give the reward.
  const chapter = save ? chapterNow(save) : 0;
  const chapterDone = !!save && chapter < STORY_END && CHAPTERS[chapter].done(save);
  useEffect(() => {
    if (!chapterDone || dialog || battle) return;
    const c = CHAPTERS[chapter];
    setSave((p) => {
      if (chapterNow(p) !== chapter) return p;
      return { ...p, story: chapter + 1, money: p.money + (c.reward?.money ?? 0), items: { ...p.items, caramella: (p.items.caramella ?? 0) + (c.reward?.caramella ?? 0) } };
    });
    hap("success");
    sfx("levelup");
    const next = CHAPTERS[chapter + 1];
    setDialog({ speaker: c.after.speaker, lines: [...c.after.lines, next ? `📜 Nuovo obiettivo: ${next.goal}.` : "🏆 Hai completato la storia! Grazie per aver salvato il Ricettario."], idx: 0 });
  }, [chapterDone, chapter, !!dialog, !!battle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Today's feast: the first visit of the day gives a gift.
  const sagra = todaySagra();
  const today = dayKey();
  const atSagra = save?.map === sagra.map;
  const sagraDone = (save?.sagraDays ?? []).includes(today);
  useEffect(() => {
    if (!atSagra || sagraDone) return;
    const [item, qty] = sagra.gift;
    setSave((p) => ({ ...p, sagraDays: [...(p.sagraDays ?? []).slice(-30), today], stats: { ...(p.stats ?? {}), sagre: (p.stats?.sagre ?? 0) + 1 }, items: { ...p.items, [item]: (p.items[item] ?? 0) + qty } }));
    hap("success");
    sfx("heal");
    setTimeout(() => setDialog({ speaker: `🎉 ${sagra.name}`, lines: [sagra.line, `Ricevi ${qty}× ${ITEMS[item].name}! Oggi qui i Mostrelli ${sagra.type === "sugo" ? "Sugo" : sagra.type === "campi" ? "Campi" : sagra.type === "terme" ? "Terme" : sagra.type === "motore" ? "Motore" : sagra.type === "nebbia" ? "Nebbia" : "Chiacchiera"} sono ovunque, e i cromatici escono 5 volte più spesso!`], idx: 0 }), 500);
  }, [atSagra, sagraDone]); // eslint-disable-line react-hooks/exhaustive-deps
  // Keyboard on computers: arrows/WASD walk, Z/Enter/Space = A, X/Shift = B (run), Esc/M = menu.
  const keys = useRef<{ down: (d: Dir) => void; up: (d: Dir) => void; a: () => void; b: () => void; menu: () => void } | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const DIRS: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
    const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement | null; return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA"); };
    const onDown = (e: KeyboardEvent) => {
      const k = keys.current;
      if (!k || typing(e)) return;
      const d = DIRS[e.key];
      if (d) { e.preventDefault(); if (!e.repeat) k.down(d); return; }
      if (e.repeat) return;
      if (["z", "Z", "Enter", " "].includes(e.key)) { e.preventDefault(); k.a(); }
      else if (["x", "X", "Shift"].includes(e.key)) k.b();
      else if (["Escape", "m", "M"].includes(e.key)) k.menu();
    };
    const onUp = (e: KeyboardEvent) => { const d = DIRS[e.key]; if (d && keys.current) keys.current.up(d); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);
  // Online presence: other players on this map, and challenges sent to us.
  const [others, setOthers] = useState<OtherPlayer[]>([]);
  const [invite, setInvite] = useState<{ id: string; from: string; code: string } | null>(null);
  const seenInvites = useRef(new Set<string>());
  const visible = save?.online !== false;
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const beat = async () => {
      const s = saveRef.current;
      if (!s) return;
      try {
        const r = await api<{ players: OtherPlayer[]; invites: { id: string; from: string; code: string }[] }>("/presence", {
          method: "POST", body: JSON.stringify({ map: s.map, x: s.x, y: s.y, dir: s.dir, name: s.name, visible: s.online !== false }),
        });
        if (!alive) return;
        setOthers(r.players);
        const fresh = r.invites.find((i) => !seenInvites.current.has(i.id));
        if (fresh) { seenInvites.current.add(fresh.id); setInvite(fresh); hap("medium"); sfx("encounter", 0.4); }
      } catch {}
    };
    beat();
    const t = setInterval(beat, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [user, visible]);
  const [curtain, setCurtain] = useState(false);
  const [flash, setFlash] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const mapId = save?.map;
  const inBattle = !!battle;
  useEffect(() => {
    initAudio().then(() => {
      setMutedState(isMuted());
      if (!mapId) return;
      playBgm(inBattle ? "battle" : ((MAPS[mapId].music ?? "town") as BgmName));
    });
  }, [mapId, inBattle]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!user || !save) return <Redirect href="/" />;
  const map = mapView(MAPS[save.map], chapterNow(save), save.cleared, save.defeated);
  const lead = save.party.find((m) => m.hp > 0) ?? save.party[0];

  const say = (speaker: string, lines: string[], onDone?: () => void) => setDialog({ speaker, lines, idx: 0, onDone });

  const step = (dir: Dir): boolean => {
    const s = saveRef.current;
    if (!s || busyRef.current) return false;
    const pos = posRef.current && posRef.current.map === s.map ? posRef.current : { map: s.map, x: s.x, y: s.y };
    const m = mapView(MAPS[s.map], chapterNow(s), s.cleared, s.defeated);
    const [dx, dy] = DELTA[dir];
    const nx = pos.x + dx, ny = pos.y + dy;
    const ch = m.tiles[ny]?.[nx];
    const exit = m.exits.find((e) => e.x === nx && e.y === ny);
    const blocked = !exit && (!ch || BLOCKING.has(ch) || m.npcs.some((n) => npcXY(n)[0] === nx && npcXY(n)[1] === ny && npcVisible(n, s)));
    if (blocked) {
      if (s.dir !== dir) setSave((p) => ({ ...p, dir }));
      setBump((b) => b + 1);
      return false;
    }
    if (exit) {
      // Quick fade to black, swap the map, and the new map fades back in.
      busyRef.current = true;
      setCurtain(true);
      setTimeout(() => {
        setSave((p) => ({ ...p, map: exit.to, x: exit.tx, y: exit.ty, dir, visited: (p.visited ?? []).includes(exit.to) ? p.visited : [...(p.visited ?? []), exit.to] }));
        setCurtain(false);
        setToast(MAPS[exit.to].name);
      }, 160);
      setTimeout(() => (busyRef.current = false), 420);
      return true;
    }
    posRef.current = { map: s.map, x: nx, y: ny };
    drive.current?.go(nx, ny); // the map starts gliding now, the render follows
    setSave((p) => ({ ...p, x: nx, y: ny, dir }));
    if (Platform.OS !== "web") sfx("step", 0.2);
    const pk = m.pickups?.find((q) => q.x === nx && q.y === ny && !(s.picked ?? []).includes(q.id));
    if (pk) { collect(pk.id, pk.item); return true; }
    if (ENCOUNTER_TILES.has(ch) && Math.random() < ENCOUNTER && s.party.some((p) => p.hp > 0)) {
      stopHold();
      busyRef.current = true;
      hap("heavy");
      sfx("encounter");
      setFlash(true);
      // After the story, wild Mostrelli grow stronger (up to +25 levels) to train toward level 100.
      const post = chapterNow(s) >= STORY_END ? Math.min(25, 5 + Math.floor((s.party[0]?.lv ?? 0) / 4)) : 0;
      const enemy = rollWild(s.map, post);
      setTimeout(() => {
        setFlash(false);
        setBattle({ kind: "wild", enemies: [enemy], field: MAPS[s.map].field ?? "grass", weather: weatherFor(s.map) });
      }, 550);
    }
    return true;
  };

  // Walking: the map glides at a constant speed and asks for the next step when the player is
  // almost on the target tile (onNear). No timer, so steps and animation never drift apart.
  const movingRef = useRef(false);
  const drive = useRef<{ go: (x: number, y: number) => void } | null>(null);
  const lastStepAt = useRef(0);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tryStep = () => {
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    const d = heldRef.current;
    if (!d) return;
    if (step(d)) { movingRef.current = true; lastStepAt.current = Date.now(); return; }
    // Blocked (wall, dialog...): try again shortly while the button is held.
    retry.current = setTimeout(tryStep, WALK_MS);
  };
  const startHold = (dir: Dir) => {
    heldRef.current = dir;
    // Already gliding: the new direction is taken at the next tile, keeping the grid.
    // (Safety: if the "stopped" signal never came, don't stay stuck.)
    if (!movingRef.current || Date.now() - lastStepAt.current > 600) tryStep();
  };
  const stopHold = (dir?: Dir) => {
    if (dir && heldRef.current !== dir) return;
    heldRef.current = null;
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
  };
  const onNear = () => tryStep();
  const onIdle = () => { movingRef.current = false; if (heldRef.current && !retry.current) tryStep(); };


  // Face another player and press A: open a room and send them the invite.
  const challenge = (o: OtherPlayer) => {
    if (!save.party.some((p) => p.hp > 0)) return say(o.name, ["Prima cura la tua squadra, poi sfidami!"]);
    say(o.name, [`Sfidi ${o.name} a una lotta in diretta? Gli mando l'invito.`], async () => {
      try {
        await flush();
        const room = await api<{ code: string }>("/live", { method: "POST", body: JSON.stringify({ name: save.name, party: save.party }) });
        await api("/invite", { method: "POST", body: JSON.stringify({ to: o.id, code: room.code }) });
        router.push({ pathname: "/diretta", params: { code: room.code } });
      } catch (e: any) {
        setToast(e.message ?? "Invito non riuscito");
      }
    });
  };

  // Nobody strolls away while you talk, fight or look at the menu.
  calmRef.current = !dialog && !battle && !menu && !shop;
  keys.current = {
    down: (d) => startHold(d),
    up: (d) => stopHold(d),
    a: () => { if (battle || menu || shop) return; if (dialog) advanceDialog(); else interact(); },
    b: () => { if (dialog) advanceDialog(); },
    menu: () => { if (battle || dialog || shop) return; setMenu((m) => !m); },
  };

  const collect = (id: string, item: ItemId) => {
    stopHold();
    hap("success");
    sfx("heal");
    setSave((p) => ({ ...p, picked: [...(p.picked ?? []), id], items: { ...p.items, [item]: (p.items[item] ?? 0) + 1 } }));
    say("Hai trovato qualcosa!", [`Raccogli: ${ITEMS[item].name}! ${ITEMS[item].desc}`]);
    setTimeout(flush, 300);
  };

  const interact = () => {
    if (busyRef.current) return;
    hap("medium");
    const [dx, dy] = DELTA[save.dir];
    const tx = save.x + dx, ty = save.y + dy;
    // An obstacle in front: clear it with the right field move.
    const och = map.tiles[ty]?.[tx];
    if (och && OBSTACLES.has(och)) {
      const f = FIELD[och as Obstacle];
      const who = fieldUser(save.party, f.move, SPECIES);
      const mv = MOVES[f.move].name;
      if (!who) return say("...", [f.what, `Ci vorrebbe un Mostrello che conosca ${mv} (tipo ${TYPES[f.type].name}). Lo imparano tutti quelli di quel tipo al livello 8.`]);
      return say(monName(who), [f.what, `${monName(who)} usa ${mv}!`, f.done], () => {
        hap("heavy");
        sfx("hit");
        setSave((p) => ({ ...p, cleared: [...(p.cleared ?? []), `${p.map}:${tx},${ty}`] }));
      });
    }
    const npc = map.npcs.find((n) => npcXY(n)[0] === tx && npcXY(n)[1] === ty);
    const sign = map.signs[`${tx},${ty}`];
    const pk = map.pickups?.find((q) => q.x === tx && q.y === ty && !(save.picked ?? []).includes(q.id));
    if (pk) return collect(pk.id, pk.item);
    if (sign) return say("Cartello", [sign]);
    const friend = others.find((o) => o.x === tx && o.y === ty);
    if (!npc && friend) return challenge(friend);
    if (!npc) return;
    const beaten = save.defeated.includes(npc.id);
    if (npc.kind === "heal") {
      return say(npc.name, npc.lines, () => {
        setSave((p) => ({ ...p, party: healAll(p.party), lastHeal: { map: p.map, ...MAPS[p.map].heal } }));
        hap("success");
        sfx("heal");
        setHealK(Date.now());
        setToast("Squadra curata!");
      });
    }
    if (npc.kind === "shop") return say(npc.name, npc.lines, () => setShop(true));
    if (npc.kind === "outfit") return say(npc.name, npc.lines, () => setBoutique(save.map));
    if (npc.kind === "gift" && npc.mon) {
      // A Mostrello given away (once).
      if (save.defeated.includes(npc.id)) return say(npc.name, npc.after ?? ["Trattalo bene!"]);
      const gift = makeMon(npc.mon.s, npc.mon.lv);
      return say(npc.name, npc.lines, () => {
        setSave((p) => {
          const n = { ...p, defeated: [...p.defeated, npc.id], caught: Array.from(new Set([...p.caught, gift.s])), seen: Array.from(new Set([...p.seen, gift.s])) };
          if (n.party.length < 6) n.party = [...n.party, gift]; else n.box = [...n.box, gift];
          return n;
        });
        hap("success");
        sfx("catch");
        setTimeout(() => say(npc.name, [`Hai ricevuto ${monName(gift)}!${save.party.length >= 6 ? " È finito in Cantina." : ""}`]), 250);
      });
    }
    if (npc.kind === "wild" && npc.mon) {
      // A special Mostrello in a secret corner: fight it, and catch it if you can.
      const sp = npc.mon;
      return say(npc.name, [`${sp.shiny ? "✨ Un " + SPECIES[sp.s].name + " CROMATICO" : "Un " + SPECIES[sp.s].name + " raro"} ti fissa dal suo nascondiglio...`, "Si prepara a lottare!"], () => {
        const enemy = { ...makeMon(sp.s, sp.lv), shiny: sp.shiny, rare: true };
        setBattle({ kind: "wild", enemies: [enemy], field: MAPS[save.map].field ?? "grass", weather: weatherFor(save.map), spot: npc.id });
      });
    }
    if (npc.kind === "gym" && npc.gym) {
      // The doorman lets you into the gym hall.
      const hall = npc.gym;
      return say(npc.name, npc.lines, () => {
        busyRef.current = true;
        setCurtain(true);
        setTimeout(() => {
          setSave((p) => ({ ...p, map: hall, x: 7, y: 14, dir: "up" }));
          setCurtain(false);
          setToast(MAPS[hall].name);
        }, 160);
        setTimeout(() => (busyRef.current = false), 420);
      });
    }
    if (npc.kind === "quest" && npc.quest) {
      // Side quest: accept on first talk, reward when the goal is met.
      const q = npc.quest;
      const st = save.quests?.[q.id];
      if (st?.s === "done") return say(npc.name, [q.thanks]);
      if (!st) {
        setSave((p) => ({ ...p, quests: { ...(p.quests ?? {}), [q.id]: { s: "on", b: p.stats?.wins ?? 0 } } }));
        return say(npc.name, [...q.ask, "📋 Missione aggiunta! La trovi nella schermata Trofei."]);
      }
      const ok = q.kind === "catch" ? save.caught.includes(String(q.target)) : q.kind === "visit" ? (save.visited ?? []).includes(String(q.target)) : (save.stats?.wins ?? 0) - (st.b ?? 0) >= Number(q.target);
      if (!ok) return say(npc.name, [q.remind]);
      const [it, qty] = q.reward.item ?? ["brodino", 0];
      setSave((p) => ({ ...p, money: p.money + q.reward.money, items: { ...p.items, [it]: (p.items[it] ?? 0) + qty }, quests: { ...(p.quests ?? {}), [q.id]: { s: "done" } } }));
      hap("success");
      sfx("levelup");
      return say(npc.name, [q.thanks, `Ricevi ${q.reward.money} €${qty ? ` e ${qty}× ${ITEMS[it as ItemId].name}` : ""}!`]);
    }
    if ((npc.kind === "trainer" || npc.kind === "boss") && !beaten) {
      if (!save.party.some((p) => p.hp > 0)) return say(npc.name, ["La tua squadra è a pezzi! Vai prima a mangiare qualcosa, poi ne riparliamo."]);
      return say(npc.name, npc.lines, () => {
        hap("heavy");
        sfx("encounter");
        setBattle({ kind: "trainer", trainerName: npc.name, npc, field: MAPS[save.map].field ?? "grass", weather: weatherFor(save.map), enemies: (npc.team ?? []).map(([s, l]) => makeMon(s, l)) });
      });
    }
    say(npc.name, npc.after ? [npc.after[npc.after.length - 1]] : npc.lines);
  };

  const onBattleEnd = (r: BattleResult) => {
    if (duelCode) {
      const won = r.outcome === "win";
      api(`/duel/${duelCode}/result`, { method: "POST", body: JSON.stringify({ won }) }).catch(() => {});
      setDuelCode(null);
      setBattle(null);
      say("Sfida tra Amici", [won ? "Hai vinto la sfida! Il tuo amico lo scoprirà presto... e non sarà contento." : "Hai perso la sfida. Nessun problema: la tua squadra non ha subito danni. Rivincita?"]);
      return;
    }
    const npc = battle?.npc;
    // Every win against a trainer pays an item too; bosses always give Caramelle Rare.
    const prize: [string, number] = npc?.prize ?? (npc?.kind === "boss" ? ["caramella", 1] : X_TRAINER_PRIZES[(npc?.id.length ?? 0) % X_TRAINER_PRIZES.length]);
    const wildPay = 10 + (battle?.enemies[0]?.lv ?? 1) * 8;
    let after: { speaker: string; lines: string[] } | null = null;
    setSave((s) => {
      const n: Save = { ...s, party: r.party, seen: Array.from(new Set([...s.seen, ...r.seen])), items: { ...s.items } };
      for (const [k, v] of Object.entries(r.itemsUsed)) n.items[k] = (n.items[k] ?? 0) - (v ?? 0);
      if (r.caught) {
        const c = { ...r.caught, uid: Math.random().toString(36).slice(2, 10) };
        n.caught = Array.from(new Set([...n.caught, c.s]));
        if (n.party.length < 6) n.party = [...n.party, c];
        else n.box = [...n.box, c];
      }
      if (r.outcome === "win" && npc) {
        n.defeated = Array.from(new Set([...n.defeated, npc.id]));
        n.money += (npc.reward ?? 0) * 2;
        n.items[prize[0]] = (n.items[prize[0]] ?? 0) + prize[1];
        if (npc.badge) n.badges = Array.from(new Set([...n.badges, npc.badge]));
      }
      if (r.outcome === "win" && !npc) n.money += wildPay;
      // A special Mostrello leaves its corner once beaten or caught.
      if (battle?.spot && (r.outcome === "win" || r.caught)) n.defeated = Array.from(new Set([...n.defeated, battle.spot]));
      const st = { ...(n.stats ?? {}) };
      if (r.outcome === "win") st.wins = (st.wins ?? 0) + 1;
      if (r.caught) { st.catches = (st.catches ?? 0) + 1; if (r.caught.shiny) st.shinies = (st.shinies ?? 0) + 1; }
      n.stats = st;
      for (const m of n.party) {
        if (!n.caught.includes(m.s)) n.caught = [...n.caught, m.s];
        if (!n.seen.includes(m.s)) n.seen = [...n.seen, m.s];
      }
      if (r.outcome === "lose") {
        n.party = healAll(n.party);
        n.map = s.lastHeal.map;
        n.x = s.lastHeal.x;
        n.y = s.lastHeal.y;
        n.money = Math.floor(s.money * 0.75);
      }
      return n;
    });
    if (r.outcome === "win" && npc) {
      const lines = [...(npc.after ?? []), `Hai ricevuto ${(npc.reward ?? 0) * 2} € e ${prize[1]}x ${ITEMS[prize[0] as ItemId].name}!`];
      if (npc.badge) {
        lines.push(`Ottieni il ${npc.badge}!`);
        const total = new Set([...save.badges, npc.badge]).size;
        if (total === ALL_BADGES.length) lines.push(`Hai tutti e ${ALL_BADGES.length} i Sigilli! Sei il CAMPIONE DELL'EMILIA-ROMAGNA! Il Prof. Albe lo racconterà a tutti. Per anni. Ogni giorno.`);
      }
      after = { speaker: npc.name, lines };
    } else if (r.outcome === "lose") {
      after = { speaker: "...", lines: ["Ti risvegli dove hai mangiato l'ultima volta. Hai perso un quarto dei soldi, ma la squadra è rimessa a nuovo."] };
    } else if (r.caught) {
      after = { speaker: "Vasetto", lines: [`${monName(r.caught)} è stato registrato nel Mostrario!${save.party.length >= 6 ? " La squadra è piena: è finito in Cantina." : ""}`] };
    }
    if (r.outcome === "win" && !npc) setToast(`+${wildPay} €`);
    setBattle(null);
    if (after) say(after.speaker, after.lines);
    setTimeout(flush, 100);
  };

  const buy = (id: ItemId) => {
    const price = ITEMS[id].price;
    if (save.money < price) {
      hap("error");
      setToast("Non hai abbastanza soldi!");
      return;
    }
    hap("success");
    setSave((p) => ({ ...p, money: p.money - price, items: { ...p.items, [id]: (p.items[id] ?? 0) + 1 } }));
    setTimeout(flush, 300);
  };

  function advanceDialog() {
    if (!dialog) return;
    hap("selection");
    if (dialog.idx < dialog.lines.length - 1) setDialog({ ...dialog, idx: dialog.idx + 1 });
    else {
      const done = dialog.onDone;
      setDialog(null);
      done?.();
    }
  }

  const onLayout = (e: LayoutChangeEvent) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const size = area.w ? Math.floor(area.w / COLS) : 0;
  let rows = size ? Math.floor(area.h / size) : 0;
  if (rows % 2 === 0) rows = Math.max(1, rows - 1);

  return (
    <View style={styles.root} testID="game-screen">
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <PixelText style={styles.town} testID="game-town-name">{map.name}</PixelText>
          <PixelText style={styles.meta} testID="game-money">{save.money} € · Sigilli {save.badges.length}/{ALL_BADGES.length} · {now.getHours() >= 21 || now.getHours() < 6 ? "🌙" : now.getHours() >= 18 ? "🌇" : now.getHours() < 8 ? "🌅" : "☀️"} {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}</PixelText>
          {chapter < STORY_END && (
            <Pressable testID="story-goal" onPress={() => router.push("/trofei")}>
              <PixelText style={styles.goal} numberOfLines={1}>📜 {CHAPTERS[chapter].goal}</PixelText>
            </Pressable>
          )}
          <Pressable testID="sagra-banner" onPress={() => router.push("/mappa")}>
            <PixelText style={styles.sagra} numberOfLines={1}>🎉 {atSagra ? `Sei alla ${sagra.name}!` : `Oggi: ${sagra.name} a ${MAPS[sagra.map].name}`}</PixelText>
          </Pressable>
        </View>
        <View style={styles.leadBox} testID="game-lead-info">
          <PixelText style={styles.leadName} numberOfLines={1}>{monName(lead)} Lv{lead.lv}</PixelText>
          <HpBar hp={lead.hp} max={stats(lead).hp} />
        </View>
      </View>

      <View style={styles.mapArea} onLayout={onLayout}>
        {size > 0 && (
          <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
            <TileMap map={map} px={save.x} py={save.y} dir={save.dir} cols={COLS} rows={rows} size={size} defeated={save.defeated} picked={save.picked ?? EMPTY} stepMs={WALK_MS} onNear={onNear} onIdle={onIdle} npcPos={npcPos} outfit={save.outfit} drive={drive} follower={save.party.find((m) => m.hp > 0) ? { s: save.party.find((m) => m.hp > 0)!.s, shiny: save.party.find((m) => m.hp > 0)!.shiny } : null} running={false} bump={bump} others={others} gender={save.gender} />
            {curtain && <Animated.View pointerEvents="none" entering={FadeIn.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: "#000000" }]} />}
          </View>
        )}
        {!!healK && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <HealFx key={healK} label="Squadra in forma!" />
          </View>
        )}
        {trophyPop && (
          <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.trophy} testID="trophy-banner" pointerEvents="none">
            <PixelText style={styles.trophyIcon}>{trophyPop.icon}</PixelText>
            <View style={{ flex: 1 }}>
              <PixelText style={styles.trophyTitle}>TROFEO SBLOCCATO</PixelText>
              <PixelText style={styles.trophyName}>{trophyPop.name}</PixelText>
              <PixelText style={styles.trophyPrize}>Premio: {trophyPop.prize}</PixelText>
            </View>
          </Animated.View>
        )}
        {invite && !battle && (
          <Animated.View entering={FadeInDown} style={styles.invite} testID="invite-banner">
            <PixelText style={styles.inviteTxt}>{invite.from} ti sfida a una lotta in diretta!</PixelText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <RetroButton testID="invite-accept" small label="Accetta" onPress={() => { const c = invite.code; setInvite(null); router.push({ pathname: "/diretta", params: { join: c } }); }} />
              <RetroButton testID="invite-decline" small variant="secondary" label="No grazie" onPress={() => { api(`/invite/${invite.id}`, { method: "DELETE" }).catch(() => {}); setInvite(null); }} />
            </View>
          </Animated.View>
        )}
        {!!toast && (
          <Animated.View entering={FadeIn} style={styles.toast} testID="game-toast">
            <PixelText style={{ color: colors.onBrandSecondary }}>{toast}</PixelText>
          </Animated.View>
        )}
        {dialog && (
          <Pressable
            testID="dialog-box"
            style={styles.dialog}
            onPress={advanceDialog}
          >
            {dialog.speaker === "Prof. Albe" && <View style={styles.portrait}><PixelSprite name="prof_albe" size={44} /></View>}
            <PixelText style={styles.speaker}>{dialog.speaker}</PixelText>
            <PixelText style={styles.dialogTxt} testID="dialog-text">{dialog.lines[dialog.idx]}</PixelText>
            <PixelText style={styles.next}>▼</PixelText>
          </Pressable>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <DPad onDir={startHold} onEnd={() => stopHold()} />
        <Pressable testID="btn-menu-center" delayPressIn={0} onPress={() => { hap("selection"); if (!busyRef.current) setMenu(true); }} style={({ pressed }) => [styles.menuPill, pressed && styles.pressed]}>
          <MaterialDesignIcons name="menu" size={18} color={colors.onSurface} />
          <PixelText style={styles.menuPillTxt}>MENU</PixelText>
        </Pressable>
        <View style={styles.right}>
          <View style={styles.ab}>
            <Pressable testID="btn-b-run" delayPressIn={0} onPress={() => { hap("selection"); if (dialog) advanceDialog(); }} style={({ pressed }) => [styles.round, styles.bBtn, pressed && styles.pressed]}>
              <PixelText style={styles.abTxt}>B</PixelText>
            </Pressable>
            <Pressable testID="btn-a-interact" delayPressIn={0} onPress={dialog ? advanceDialog : interact} style={({ pressed }) => [styles.round, styles.aBtn, pressed && styles.pressed]}>
              <PixelText style={styles.abTxt}>A</PixelText>
            </Pressable>
          </View>
          <PixelText style={styles.hint}>A parla · B chiudi</PixelText>
          {Platform.OS === "web" && winW >= 700 && <PixelText style={styles.hint}>Tastiera: frecce · Z · X · Esc</PixelText>}
        </View>
      </View>

      {flash && <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(200)} style={styles.flash} pointerEvents="none" testID="encounter-flash" />}
      {battle && <Battle setup={battle} party={save.party} items={save.items} onEnd={onBattleEnd} />}

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.scrim} onPress={() => setMenu(false)} testID="menu-scrim">
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: "88%" }]}>
            <View style={styles.handle} />
            <PixelText style={styles.sheetTitle}>Ciao, {save.name}!</PixelText>
            <ScrollView contentContainerStyle={styles.menuGrid} showsVerticalScrollIndicator={false}>
            <MenuItem icon="hanger" label="Guardaroba" testID="menu-wardrobe" onPress={() => { setMenu(false); setWardrobe(true); }} />
            <MenuItem icon="trophy" label={`Trofei: ${(save.trophies ?? []).length}/${TROPHIES.length}`} testID="menu-trophies" onPress={() => { setMenu(false); router.push("/trofei"); }} />
            <MenuItem icon="map" label="Mappa del Mondo" testID="menu-worldmap" onPress={() => { setMenu(false); router.push("/mappa"); }} />
            <MenuItem icon="account-multiple" label="Stanze Online (sfida, co-op, scambi)" testID="menu-rooms" onPress={() => { setMenu(false); router.push("/diretta"); }} />
            <MenuItem icon="sword-cross" label="Sfida tra Amici" testID="menu-duel" onPress={() => { setMenu(false); router.push("/sfida"); }} />
            <MenuItem icon="account-group" label="Squadra" testID="menu-team" onPress={() => { setMenu(false); router.push("/team"); }} />
            <MenuItem icon="book-open-variant" label="Mostrario" testID="menu-mostrario" onPress={() => { setMenu(false); router.push("/mostrario"); }} />
            <MenuItem icon="bag-personal" label={`Zaino: ${save.items.vasetto ?? 0} vasetti · ${save.items.brodino ?? 0} brodini · ${save.items.tortellini ?? 0} tortellini · ${save.items.caffe ?? 0} caffè · ${save.items.caramella ?? 0} caramelle rare`} testID="menu-bag" onPress={() => { setMenu(false); router.push("/team"); }} />
            <MenuItem icon="medal" label={`Sigilli: ${save.badges.length ? save.badges.join(", ") : "nessuno"}`} testID="menu-badges" onPress={() => {}} />
            <MenuItem icon="content-save" label={sync === "saving" ? "Salvataggio..." : sync === "error" ? "Salva (errore, riprova)" : "Salva ora"} testID="menu-save" onPress={async () => { await flush(); setToast("Partita salvata!"); setMenu(false); }} />
            <MenuItem icon={visible ? "account-eye" : "account-off"} label={visible ? `Visibile online: sì${others.length ? ` (${others.length} qui vicino)` : ""}` : "Visibile online: no"} testID="menu-online" onPress={() => setSave((p) => ({ ...p, online: p.online === false }))} />
            <MenuItem icon={muted ? "volume-off" : "volume-high"} label={muted ? "Audio: spento" : "Audio: acceso"} testID="menu-audio" onPress={() => { setMuted(!muted); setMutedState(!muted); }} />
            <MenuItem icon="home" label="Schermata iniziale" testID="menu-title" onPress={async () => { setMenu(false); await flush(); router.dismissTo("/"); }} />
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Boutique: things you can only buy in this town */}
      <Modal visible={!!boutique} transparent animationType="fade" onRequestClose={() => setBoutique(null)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="boutique-modal">
            <View style={styles.handle} />
            <PixelText style={styles.sheetTitle}>Boutique · {save.money} €</PixelText>
            <View style={styles.dressRow}><Dressed outfit={save.outfit ?? {}} gender={save.gender} /></View>
            {ACCESSORIES.filter((a) => a.town === boutique).map((a) => {
              const own = (save.wardrobe ?? []).includes(a.id);
              const on = save.outfit?.[a.slot] === a.id;
              return (
                <View key={a.id} style={styles.shopRow}>
                  <Dressed outfit={{ ...(save.outfit ?? {}), [a.slot]: a.id }} gender={save.gender} size={52} />
                  <View style={{ flex: 1 }}>
                    <PixelText>{a.name}</PixelText>
                    <PixelText style={styles.meta}>{a.desc}</PixelText>
                  </View>
                  <RetroButton small variant={own ? "ghost" : "secondary"} testID={`boutique-buy-${a.id}`} label={!own ? `${a.price}€` : on ? "Togli" : "Indossa"} onPress={() => {
                    if (!own) {
                      if (save.money < a.price) return setToast("Non hai abbastanza soldi");
                      hap("success");
                      setSave((p) => ({ ...p, money: p.money - a.price, wardrobe: [...(p.wardrobe ?? []), a.id], outfit: { ...(p.outfit ?? {}), [a.slot]: a.id } }));
                    } else {
                      hap("selection");
                      setSave((p) => ({ ...p, outfit: { ...(p.outfit ?? {}), [a.slot]: on ? undefined : a.id } }));
                    }
                  }} />
                </View>
              );
            })}
            <RetroButton testID="boutique-close-btn" variant="ghost" label="Grazie, arrivederci" onPress={() => setBoutique(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      {/* Wardrobe: wear what you bought */}
      <Modal visible={wardrobe} transparent animationType="fade" onRequestClose={() => setWardrobe(false)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: "86%" }]} testID="wardrobe-modal">
            <View style={styles.handle} />
            <PixelText style={styles.sheetTitle}>Guardaroba</PixelText>
            <View style={styles.dressRow}>
              <Dressed outfit={save.outfit ?? {}} gender={save.gender} />
              <Dressed outfit={save.outfit ?? {}} gender={save.gender} dir="side" />
              <Dressed outfit={save.outfit ?? {}} gender={save.gender} dir="back" />
            </View>
            <ScrollView contentContainerStyle={{ gap: 6 }}>
              {(["hat", "glasses", "neck", "shirt"] as Slot[]).map((slot) => {
                const mine = (save.wardrobe ?? []).filter((id) => ACC[id]?.slot === slot);
                return (
                  <View key={slot} style={{ gap: 6 }}>
                    <PixelText style={styles.meta}>{slot === "hat" ? "Cappelli" : slot === "glasses" ? "Occhiali e maschere" : slot === "neck" ? "Sciarpe" : "Magliette"}</PixelText>
                    {mine.length === 0 ? (
                      <PixelText style={styles.meta}>Ancora niente: cercali nelle boutique delle città.</PixelText>
                    ) : (
                      <View style={styles.chips}>
                        {mine.map((id) => {
                          const on = save.outfit?.[slot] === id;
                          return (
                            <Pressable key={id} testID={`wardrobe-${id}`} onPress={() => { hap("selection"); setSave((p) => ({ ...p, outfit: { ...(p.outfit ?? {}), [slot]: on ? undefined : id } })); }} style={[styles.chip, on && styles.chipOn]}>
                              <PixelText style={{ fontSize: 12 }}>{on ? "✓ " : ""}{ACC[id].name}</PixelText>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
              <PixelText style={styles.meta}>Boutique in: {Array.from(new Set(ACCESSORIES.map((a) => MAPS[a.town]?.name).filter(Boolean))).join(", ")}.</PixelText>
            </ScrollView>
            <RetroButton testID="wardrobe-close-btn" variant="ghost" label="Chiudi" onPress={() => setWardrobe(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={shop} transparent animationType="fade" onRequestClose={() => setShop(false)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="shop-modal">
            <PixelText style={styles.sheetTitle}>BOTTEGA · {save.money} €</PixelText>
            {(Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].price > 0).map((id) => (
              <View key={id} style={styles.shopRow}>
                <View style={{ flex: 1 }}>
                  <PixelText>{ITEMS[id].name} ({save.items[id] ?? 0})</PixelText>
                  <PixelText style={styles.meta}>{ITEMS[id].desc}</PixelText>
                </View>
                <RetroButton small variant="secondary" testID={`shop-buy-${id}`} label={`${ITEMS[id].price}€`} onPress={() => buy(id)} />
              </View>
            ))}
            <RetroButton testID="shop-close-btn" variant="ghost" label="Grazie, arrivederci" onPress={() => setShop(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ARROW: Record<Dir, "chevron-up" | "chevron-down" | "chevron-left" | "chevron-right"> = { up: "chevron-up", down: "chevron-down", left: "chevron-left", right: "chevron-right" };

// The player as they look with an outfit on (for the boutique and the wardrobe).
function Dressed({ outfit, gender, size = 76, dir = "front" }: { outfit: Record<string, string | undefined>; gender?: "m" | "f"; size?: number; dir?: "front" | "side" | "back" }) {
  const base = (dir === "back" ? "person_back" : dir === "side" ? "person_side" : "person") + (gender === "f" ? "_f" : "");
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}>
      <PixelSprite name={dressed(base, outfit)} size={size * 0.82} look={shirtLook(outfit)} />
    </View>
  );
}

// One big cross: touch anywhere on an arm (or slide the thumb across) to walk that way.
const PAD = 186;
const ARM = 64;
function DPad({ onDir, onEnd }: { onDir: (d: Dir) => void; onEnd: () => void }) {
  const [cur, setCur] = useState<Dir | null>(null);
  const curRef = useRef<Dir | null>(null);
  const pick = (x: number, y: number) => {
    const dx = x - PAD / 2, dy = y - PAD / 2;
    if (dx * dx + dy * dy < 14 * 14) return curRef.current; // tiny dead zone in the middle
    const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    return d;
  };
  const go = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    const d = pick(locationX, locationY);
    if (!d || d === curRef.current) return;
    curRef.current = d;
    setCur(d);
    hap("light");
    onDir(d);
  };
  const end = () => { curRef.current = null; setCur(null); onEnd(); };
  const arm = (d: Dir, style: object) => (
    <View pointerEvents="none" style={[styles.arm, style, cur === d && styles.armOn]}>
      <MaterialDesignIcons name={ARROW[d]} size={34} color={cur === d ? colors.onBrandSecondary : colors.onSurface} />
    </View>
  );
  return (
    <View
      testID="dpad"
      style={styles.pad}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={go}
      onResponderMove={go}
      onResponderRelease={end}
      onResponderTerminate={end}
    >
      {arm("up", { left: (PAD - ARM) / 2, top: 0 })}
      {arm("down", { left: (PAD - ARM) / 2, bottom: 0 })}
      {arm("left", { top: (PAD - ARM) / 2, left: 0 })}
      {arm("right", { top: (PAD - ARM) / 2, right: 0 })}
      <View pointerEvents="none" style={styles.padHub} />
      {/* invisible per-direction targets, kept for the automated tests */}
      {(["up", "down", "left", "right"] as Dir[]).map((d) => <View key={d} testID={`dpad-${d}`} pointerEvents="none" />)}
    </View>
  );
}

function DBtn({ dir, onIn, onOut }: { dir: Dir; onIn: (d: Dir) => void; onOut: (d: Dir) => void }) {
  return (
    <Pressable testID={`dpad-${dir}`} delayPressIn={0} onPressIn={() => onIn(dir)} onPressOut={() => onOut(dir)} style={({ pressed }) => [styles.dBtn, pressed && styles.pressed]}>
      <MaterialDesignIcons name={ARROW[dir]} size={32} color={colors.onSurface} />
    </Pressable>
  );
}

const ICON_COLORS: Record<string, string> = { hanger: "#ff6fb5", vibrate: "#ff8a3d", trophy: "#ffcc1a", map: "#3fa9ff", "account-multiple": "#17c964", "sword-cross": "#ff3b5c", "account-group": "#b06bff", "book-open-variant": "#ff8a3d", "bag-personal": "#2ec4b6", medal: "#ffcc1a", "content-save": "#3fa9ff", home: "#9e9e9e" };
function MenuItem({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID: string }) {
  const c = ICON_COLORS[icon] ?? "#7a68f0";
  const wide = label.length > 34;
  return (
    <Pressable testID={testID} onPress={() => { hap("selection"); onPress(); }} style={({ pressed }) => [styles.menuItem, wide && styles.menuItemWide, pressed && { backgroundColor: colors.surfaceTertiary, transform: [{ scale: 0.98 }] }]}>
      <View style={[styles.menuIcon, { backgroundColor: c + "33" }]}><MaterialDesignIcons name={icon} size={22} color={c} /></View>
      <PixelText style={[styles.menuLabel, wide && { flex: 1 }]} numberOfLines={3}>{label}</PixelText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.onSurface },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, gap: 12, borderBottomWidth: 2, borderBottomColor: colors.border },
  town: { fontSize: 18, color: colors.brandSecondary },
  meta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  leadBox: { width: 150, gap: 4 },
  leadName: { fontSize: 12 },
  mapArea: { flex: 1, backgroundColor: "#0b0b0b", overflow: "hidden" },
  sagra: { fontSize: 11, color: colors.brandSecondary, marginTop: 2 },
  goal: { fontSize: 11, color: colors.onSurface, marginTop: 2 },
  portrait: { position: "absolute", right: 10, top: -50, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: colors.brandSecondary },
  trophy: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, borderWidth: 3, borderColor: colors.brandSecondary, backgroundColor: colors.surfaceTertiary },
  trophyIcon: { fontSize: 34 },
  trophyTitle: { fontSize: 10, color: colors.brandSecondary, letterSpacing: 2 },
  trophyName: { fontSize: 15 },
  trophyPrize: { fontSize: 11, color: colors.muted },
  invite: { position: "absolute", top: 56, left: 12, right: 12, gap: 8, padding: 10, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary },
  inviteTxt: { fontSize: 13 },
  toast: { position: "absolute", top: 12, alignSelf: "center", backgroundColor: colors.brandSecondary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  dialog: { position: "absolute", left: 8, right: 8, bottom: 8, minHeight: 120, backgroundColor: colors.surfaceSecondary, borderWidth: 3, borderColor: colors.borderStrong, borderRadius: 18, padding: 14, paddingTop: 18, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 0, shadowOffset: { width: 4, height: 4 }, elevation: 6 },
  speaker: { position: "absolute", top: -14, left: 12, color: colors.onBrandSecondary, backgroundColor: colors.brandSecondary, fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, overflow: "hidden" },
  dialogTxt: { fontSize: 15, lineHeight: 22 },
  next: { alignSelf: "flex-end", color: colors.brandSecondary, marginTop: 4 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingTop: 16, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  dpad: { gap: 0 },
  pad: { width: PAD, height: PAD },
  arm: { position: "absolute", width: ARM, height: ARM, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, borderRadius: 16, borderBottomWidth: 4, borderColor: "rgba(0,0,0,0.3)" },
  armOn: { backgroundColor: colors.brandSecondary, transform: [{ scale: 0.95 }] },
  padHub: { position: "absolute", left: (PAD - ARM) / 2, top: (PAD - ARM) / 2, width: ARM, height: ARM, backgroundColor: colors.surfaceTertiary, borderRadius: 12 },
  dRow: { flexDirection: "row", justifyContent: "center" },
  dBtn: { width: 50, height: 50, backgroundColor: colors.surfaceTertiary, borderRadius: 12, borderWidth: 0, borderBottomWidth: 3, borderColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  dCenter: { width: 50, height: 50, backgroundColor: colors.surfaceTertiary },
  pressed: { backgroundColor: colors.borderStrong, transform: [{ scale: 0.95 }] },
  right: { alignItems: "center", gap: 12 },
  ab: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  round: { width: 60, height: 60, borderRadius: 999, alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderColor: "rgba(0,0,0,0.3)", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  aBtn: { backgroundColor: colors.brandTertiary, marginBottom: 24 },
  bBtn: { backgroundColor: colors.brandPrimary },
  bOn: { borderColor: colors.brandSecondary, borderRadius: 14, borderWidth: 4 },
  menuPill: { alignItems: "center", justifyContent: "center", gap: 2, width: 54, height: 48, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceTertiary, borderRadius: 999, marginTop: 64 },
  menuPillTxt: { fontSize: 10, color: colors.onSurface },
  abTxt: { fontSize: 22, color: colors.onBrandPrimary },
  hint: { fontSize: 11, color: colors.muted },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingTop: 10, gap: 8 },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 8 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sheetTitle: { color: colors.onSurface, fontSize: 18, marginBottom: 4 },
  menuItem: { width: "48%", minHeight: 84, padding: 12, gap: 8, borderRadius: 18, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  menuItemWide: { width: "100%", minHeight: 0, flexDirection: "row", alignItems: "center" },
  menuIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 12, lineHeight: 16 },
  dressRow: { flexDirection: "row", justifyContent: "center", gap: 18, paddingVertical: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { minHeight: 40, paddingHorizontal: 10, justifyContent: "center", borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  chipOn: { borderColor: colors.brandSecondary, backgroundColor: colors.surfaceTertiary },
  shopRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
});
