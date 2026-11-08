import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Battle, BattleResult, BattleSetup } from "@/src/game/Battle";
import { X_TRAINER_PRIZES } from "@/src/game/expansion";
import { BgmName, initAudio, isMuted, playBgm, setMuted, sfx } from "@/src/game/audio";
import { ALL_BADGES, BLOCKING, ENCOUNTER_TILES, ITEMS, ItemId, MAPS, Npc } from "@/src/game/data";
import { healAll, makeMon, monName, rollWild, stats } from "@/src/game/engine";
import { Save, useGame } from "@/src/game/GameContext";
import { HealFx } from "@/src/game/BattleFx";
import { TileMap } from "@/src/game/TileMap";
import { hap, HpBar, PixelText, RetroButton } from "@/src/game/ui";
import { colors } from "@/src/theme";

type Dir = Save["dir"];
type Dialog = { speaker: string; lines: string[]; idx: number; onDone?: () => void };
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const COLS = 9;
const ENCOUNTER = 0.1;
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
  const busyRef = useRef(false);
  busyRef.current = !!dialog || !!battle || menu || shop;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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

  useEffect(() => () => { if (holdTimer.current) clearInterval(holdTimer.current); }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!user || !save) return <Redirect href="/" />;
  const map = MAPS[save.map];
  const lead = save.party.find((m) => m.hp > 0) ?? save.party[0];

  const say = (speaker: string, lines: string[], onDone?: () => void) => setDialog({ speaker, lines, idx: 0, onDone });

  const step = (dir: Dir) => {
    const s = saveRef.current;
    if (!s || busyRef.current) return;
    hap("light");
    const m = MAPS[s.map];
    const [dx, dy] = DELTA[dir];
    const nx = s.x + dx, ny = s.y + dy;
    const ch = m.tiles[ny]?.[nx];
    const exit = m.exits.find((e) => e.x === nx && e.y === ny);
    const blocked = !exit && (!ch || BLOCKING.has(ch) || m.npcs.some((n) => n.x === nx && n.y === ny));
    if (blocked) {
      if (s.dir !== dir) setSave((p) => ({ ...p, dir }));
      return;
    }
    if (exit) {
      busyRef.current = true;
      setSave((p) => ({ ...p, map: exit.to, x: exit.tx, y: exit.ty, dir }));
      setToast(MAPS[exit.to].name);
      setTimeout(() => (busyRef.current = false), 300);
      return;
    }
    setSave((p) => ({ ...p, x: nx, y: ny, dir }));
    sfx("step", 0.25);
    const pk = m.pickups?.find((q) => q.x === nx && q.y === ny && !(s.picked ?? []).includes(q.id));
    if (pk) return collect(pk.id, pk.item);
    if (ENCOUNTER_TILES.has(ch) && Math.random() < ENCOUNTER && s.party.some((p) => p.hp > 0)) {
      stopHold();
      busyRef.current = true;
      hap("heavy");
      sfx("encounter");
      setFlash(true);
      const enemy = rollWild(s.map);
      setTimeout(() => {
        setFlash(false);
        setBattle({ kind: "wild", enemies: [enemy], field: s.map === "riviera" ? "beach" : "grass" });
      }, 550);
    }
  };

  const startHold = (dir: Dir) => {
    step(dir);
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = setInterval(() => step(dir), runRef.current ? 110 : 170);
  };
  const stopHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
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
    const npc = map.npcs.find((n) => n.x === tx && n.y === ty);
    const sign = map.signs[`${tx},${ty}`];
    const pk = map.pickups?.find((q) => q.x === tx && q.y === ty && !(save.picked ?? []).includes(q.id));
    if (pk) return collect(pk.id, pk.item);
    if (sign) return say("Cartello", [sign]);
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
    if ((npc.kind === "trainer" || npc.kind === "boss") && !beaten) {
      if (!save.party.some((p) => p.hp > 0)) return say(npc.name, ["La tua squadra è a pezzi! Vai prima a mangiare qualcosa, poi ne riparliamo."]);
      return say(npc.name, npc.lines, () => {
        hap("heavy");
        sfx("encounter");
        setBattle({ kind: "trainer", trainerName: npc.name, npc, field: save.map === "riviera" ? "beach" : "grass", enemies: (npc.team ?? []).map(([s, l]) => makeMon(s, l)) });
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
        if (total === ALL_BADGES.length) lines.push(`Hai tutti e ${ALL_BADGES.length} i Sigilli! Sei il CAMPIONE DELL'EMILIA! Il Dottor Balanzone lo racconterà a tutti. Per anni. Ogni giorno.`);
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
          <PixelText style={styles.meta} testID="game-money">{save.money} € · Sigilli {save.badges.length}/{ALL_BADGES.length}</PixelText>
        </View>
        <View style={styles.leadBox} testID="game-lead-info">
          <PixelText style={styles.leadName} numberOfLines={1}>{monName(lead)} Lv{lead.lv}</PixelText>
          <HpBar hp={lead.hp} max={stats(lead).hp} />
        </View>
      </View>

      <View style={styles.mapArea} onLayout={onLayout}>
        {size > 0 && (
          <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
            <TileMap map={map} px={save.x} py={save.y} dir={save.dir} cols={COLS} rows={rows} size={size} defeated={save.defeated} picked={save.picked ?? EMPTY} stepMs={run ? 110 : 170} />
          </View>
        )}
        {!!healK && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <HealFx key={healK} label="Squadra in forma!" />
          </View>
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
            <PixelText style={styles.speaker}>{dialog.speaker}</PixelText>
            <PixelText style={styles.dialogTxt} testID="dialog-text">{dialog.lines[dialog.idx]}</PixelText>
            <PixelText style={styles.next}>▼</PixelText>
          </Pressable>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dpad}>
          <View style={styles.dRow}><DBtn dir="up" onIn={startHold} onOut={stopHold} /></View>
          <View style={styles.dRow}>
            <DBtn dir="left" onIn={startHold} onOut={stopHold} />
            <View style={styles.dCenter} />
            <DBtn dir="right" onIn={startHold} onOut={stopHold} />
          </View>
          <View style={styles.dRow}><DBtn dir="down" onIn={startHold} onOut={stopHold} /></View>
        </View>
        <Pressable testID="btn-menu-center" delayPressIn={0} onPress={() => { hap("selection"); if (!busyRef.current) setMenu(true); }} style={({ pressed }) => [styles.menuPill, pressed && styles.pressed]}>
          <MaterialDesignIcons name="menu" size={18} color={colors.onSurface} />
          <PixelText style={styles.menuPillTxt}>MENU</PixelText>
        </Pressable>
        <View style={styles.right}>
          <View style={styles.ab}>
            <Pressable testID="btn-b-run" delayPressIn={0} onPress={() => { hap("selection"); if (dialog) advanceDialog(); else { setRun(!run); setToast(run ? "Cammini" : "Corri!"); } }} style={({ pressed }) => [styles.round, styles.bBtn, run && styles.bOn, pressed && styles.pressed]}>
              <PixelText style={styles.abTxt}>B</PixelText>
            </Pressable>
            <Pressable testID="btn-a-interact" delayPressIn={0} onPress={dialog ? advanceDialog : interact} style={({ pressed }) => [styles.round, styles.aBtn, pressed && styles.pressed]}>
              <PixelText style={styles.abTxt}>A</PixelText>
            </Pressable>
          </View>
          <PixelText style={styles.hint}>A parla · B {run ? "cammina" : "corri"}</PixelText>
        </View>
      </View>

      {flash && <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(200)} style={styles.flash} pointerEvents="none" testID="encounter-flash" />}
      {battle && <Battle setup={battle} party={save.party} items={save.items} onEnd={onBattleEnd} />}

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.scrim} onPress={() => setMenu(false)} testID="menu-scrim">
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: "88%" }]}>
            <PixelText style={styles.sheetTitle}>MENU · {save.name}</PixelText>
            <ScrollView contentContainerStyle={{ gap: 6 }} showsVerticalScrollIndicator={false}>
            <MenuItem icon="map" label="Mappa del Mondo" testID="menu-worldmap" onPress={() => { setMenu(false); router.push("/mappa"); }} />
            <MenuItem icon="account-multiple" label="Stanze Online (sfida, co-op, scambi)" testID="menu-rooms" onPress={() => { setMenu(false); router.push("/diretta"); }} />
            <MenuItem icon="sword-cross" label="Sfida tra Amici" testID="menu-duel" onPress={() => { setMenu(false); router.push("/sfida"); }} />
            <MenuItem icon="account-group" label="Squadra" testID="menu-team" onPress={() => { setMenu(false); router.push("/team"); }} />
            <MenuItem icon="book-open-variant" label="Mostrario" testID="menu-mostrario" onPress={() => { setMenu(false); router.push("/mostrario"); }} />
            <MenuItem icon="bag-personal" label={`Zaino: ${save.items.vasetto ?? 0} vasetti · ${save.items.brodino ?? 0} brodini · ${save.items.tortellini ?? 0} tortellini · ${save.items.caffe ?? 0} caffè · ${save.items.caramella ?? 0} caramelle rare`} testID="menu-bag" onPress={() => { setMenu(false); router.push("/team"); }} />
            <MenuItem icon="medal" label={`Sigilli: ${save.badges.length ? save.badges.join(", ") : "nessuno"}`} testID="menu-badges" onPress={() => {}} />
            <MenuItem icon="content-save" label={sync === "saving" ? "Salvataggio..." : sync === "error" ? "Salva (errore, riprova)" : "Salva ora"} testID="menu-save" onPress={async () => { await flush(); setToast("Partita salvata!"); setMenu(false); }} />
            <MenuItem icon={muted ? "volume-off" : "volume-high"} label={muted ? "Audio: spento" : "Audio: acceso"} testID="menu-audio" onPress={() => { setMuted(!muted); setMutedState(!muted); }} />
            <MenuItem icon="home" label="Schermata iniziale" testID="menu-title" onPress={async () => { setMenu(false); await flush(); router.dismissTo("/"); }} />
            </ScrollView>
          </Animated.View>
        </Pressable>
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

function DBtn({ dir, onIn, onOut }: { dir: Dir; onIn: (d: Dir) => void; onOut: () => void }) {
  return (
    <Pressable testID={`dpad-${dir}`} delayPressIn={0} onPressIn={() => onIn(dir)} onPressOut={onOut} style={({ pressed }) => [styles.dBtn, pressed && styles.pressed]}>
      <MaterialDesignIcons name={ARROW[dir]} size={32} color={colors.onSurface} />
    </Pressable>
  );
}

function MenuItem({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={() => { hap("selection"); onPress(); }} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.surfaceTertiary }]}>
      <MaterialDesignIcons name={icon} size={22} color={colors.brandSecondary} />
      <PixelText style={{ flex: 1 }} numberOfLines={2}>{label}</PixelText>
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
  toast: { position: "absolute", top: 12, alignSelf: "center", backgroundColor: colors.brandSecondary, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: colors.onSurfaceInverse },
  dialog: { position: "absolute", left: 8, right: 8, bottom: 8, minHeight: 120, backgroundColor: colors.surfaceSecondary, borderWidth: 4, borderColor: colors.onSurface, borderRadius: 6, padding: 14, paddingTop: 18, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 0, shadowOffset: { width: 4, height: 4 }, elevation: 6 },
  speaker: { position: "absolute", top: -14, left: 12, color: colors.onBrandSecondary, backgroundColor: colors.brandSecondary, fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 2, borderColor: colors.onSurface, overflow: "hidden" },
  dialogTxt: { fontSize: 15, lineHeight: 22 },
  next: { alignSelf: "flex-end", color: colors.brandSecondary, marginTop: 4 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingTop: 16, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  dpad: { gap: 0 },
  dRow: { flexDirection: "row", justifyContent: "center" },
  dBtn: { width: 50, height: 50, backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  dCenter: { width: 50, height: 50, backgroundColor: colors.surfaceTertiary },
  pressed: { backgroundColor: colors.borderStrong, transform: [{ scale: 0.95 }] },
  right: { alignItems: "center", gap: 12 },
  ab: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  round: { width: 58, height: 58, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.onSurface },
  aBtn: { backgroundColor: colors.brandTertiary, marginBottom: 24 },
  bBtn: { backgroundColor: colors.brandPrimary },
  bOn: { borderColor: colors.brandSecondary, borderWidth: 4 },
  menuPill: { alignItems: "center", justifyContent: "center", gap: 2, width: 54, height: 48, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceTertiary, borderRadius: 999, marginTop: 64 },
  menuPillTxt: { fontSize: 10, color: colors.onSurface },
  abTxt: { fontSize: 22, color: colors.onBrandPrimary },
  hint: { fontSize: 11, color: colors.muted },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopWidth: 4, borderTopColor: colors.brandPrimary, borderLeftWidth: 4, borderRightWidth: 4, borderColor: colors.onSurface, borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: 16, gap: 6 },
  sheetTitle: { color: colors.onBrandPrimary, backgroundColor: colors.brandPrimary, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: colors.onSurface, marginBottom: 8, fontSize: 15 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 10, backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border, borderBottomWidth: 4, borderRadius: 4 },
  shopRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
});
