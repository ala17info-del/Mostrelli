import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { colors, FONT } from "@/src/theme";

import { sfx } from "./audio";
import { HealFx, HitFx } from "./BattleFx";
import { FX_LABEL, ITEMS, ItemId, MAPS, MOVES, Npc, SPECIES, TYPES } from "./data";
import { DLine, initDuel, LiveAct, other, resolveTurn, Side, TurnEntry } from "./duelEngine";
import { knownMoves, makeMon, Mon, monName, stats } from "./engine";
import { useGame } from "./GameContext";
import { Breathe } from "./Alive";
import { battleSize, PixelSprite } from "./PixelSprite";
import { hap, HpBar, PixelText, RetroButton } from "./ui";

export type Live = {
  code: string; side: Side; status: "waiting" | "active" | "done"; turn: number;
  host: { name: string; party: Mon[] }; guest: { name: string; party: Mon[] } | null;
  log: TurnEntry[]; my_action: boolean; their_action: boolean; winner: Side | "draw" | null;
  mode: "pvp" | "coop" | "trade"; boss: string | null;
  offers: Partial<Record<Side, Mon>>; confirms: Partial<Record<Side, boolean>>; trade_done: boolean;
};
export const ROOM_BOSSES: Npc[] = Object.values(MAPS).flatMap((m) => m.npcs.filter((n) => n.kind === "boss"));
const bossTeam = (id: string | null) => {
  const n = ROOM_BOSSES.find((b) => b.id === id);
  // Two players at once: the opponent gets +3 levels to stay a real challenge.
  return { npc: n, team: (n?.team ?? []).map(([sp, lv], i) => ({ ...makeMon(sp, Math.min(50, lv + 3)), uid: `b${i}` })) };
};
type Phase = "msg" | "menu" | "moves" | "bag" | "itemTarget" | "switch" | "wait" | "over";

export function LiveBattle({ live, setLive, onExit }: { live: Live; setLive: (l: Live) => void; onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const { save, setSave } = useGame();
  const coop = live.mode === "coop";
  const side = live.side, foeSide: Side = coop ? "boss" : other(side);
  const boss = useMemo(() => bossTeam(live.boss), [live.boss]);
  const names = useMemo(() => ({ host: live.host.name, guest: live.guest?.name ?? "Sfidante", boss: boss.npc?.name ?? "Capo" }), [live.host.name, live.guest?.name, boss]);

  const sim = useMemo(() => {
    const st = initDuel(live.host.party, live.guest!.party, coop ? boss.team : undefined);
    const per = live.log.map((e) => resolveTurn(st, e, names));
    return { st, per };
  }, [live.log, live.host.party, live.guest, names, coop, boss]);
  const { st } = sim;

  const lineNow = (text: string): DLine => ({ text, hp: { host: st.P.host[st.act.host].hp, guest: st.P.guest[st.act.guest].hp, boss: st.P.boss[st.act.boss]?.hp ?? 0 }, act: { ...st.act } });
  const shown = useRef(live.log.length);
  const [queue, setQueue] = useState<DLine[]>(() =>
    live.log.length === 0
      ? [lineNow(coop ? `${names.host} e ${names.guest} sfidano insieme ${names.boss}!` : `Sfida in diretta contro ${names[foeSide]}!`), lineNow(`${names[foeSide]} manda in campo ${monName(st.P[foeSide][0])}. Vai, ${monName(st.P[side][0])}!`)]
      : [lineNow(`Bentornato nella sfida contro ${names[foeSide]}!`)],
  );
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<Phase>("msg");
  const [pending, setPending] = useState<ItemId | null>(null);
  const [err, setErr] = useState("");
  const [fx, setFx] = useState<{ k: number; line: DLine } | null>(null);
  const ended = useRef(false);
  // Re-entering a finished room must not pay the coop reward again.
  const finishedAtMount = useRef(live.status === "done");

  // New sealed turns arrived: play their messages.
  useEffect(() => {
    if (sim.per.length <= shown.current) return;
    const lines = sim.per.slice(shown.current).flat();
    shown.current = sim.per.length;
    // Items are used up only when they actually worked in a sealed turn.
    const spent = lines.filter((l) => l.used?.side === side).map((l) => l.used!.item);
    if (spent.length) setSave((s) => {
      const items = { ...s.items };
      spent.forEach((id) => (items[id] = Math.max(0, (items[id] ?? 0) - 1)));
      return { ...s, items };
    });
    setQueue(lines);
    setQi(0);
    setPhase("msg");
  }, [sim.per, side, setSave]);

  // Opponent surrendered while we were choosing or waiting.
  useEffect(() => {
    if (live.status === "done" && !st.winner && phase !== "msg") setPhase("over");
  }, [live.status, st.winner, phase]);

  const winner = st.winner ?? live.winner;
  useEffect(() => {
    if (phase !== "over" || ended.current) return;
    ended.current = true;
    hap(winner === side ? "success" : "error");
    if (coop && st.winner === "host" && boss.npc && !finishedAtMount.current) setSave((s) => ({ ...s, money: s.money + (boss.npc!.reward ?? 0), items: { ...s.items, caramella: (s.items.caramella ?? 0) + 1 } }));
    if (st.winner && live.status === "active") api<Live>(`/live/${live.code}/end`, { method: "POST", body: JSON.stringify({ winner: st.winner }) }).then(setLive).catch(() => {});
  }, [phase, winner, side, st.winner, live.status, live.code, setLive, coop, boss, setSave]);

  const showing = phase === "msg" ? queue[qi] : null;
  useEffect(() => {
    if (!showing) return;
    if (/ usa /.test(showing.text) && !/ usa (Brodino|Tortellini|Digestivo|Gelato|Caffè)/.test(showing.text)) sfx("hit");
    if (/recupera|riprende i sensi|rinfresca|non è più confuso/.test(showing.text)) sfx("heal");
    if (/cala!|è confuso|si scotta|si colpisce/.test(showing.text)) sfx("fail");
    if (/aumenta!|vince la sfida/.test(showing.text)) sfx("levelup");
    if (showing.fx || showing.heal) setFx({ k: Date.now(), line: showing });
    else setFx(null);
  }, [showing]);

  const advance = () => {
    hap("selection");
    if (qi < queue.length - 1) return setQi(qi + 1);
    if (st.winner || live.status === "done") return setPhase("over");
    if (live.my_action) return setPhase("wait");
    // In coop a player with no Mostrelli left just passes while the friend keeps fighting.
    if (st.out[side]) return send({ kind: "pass" });
    setPhase("menu");
  };

  const send = async (a: LiveAct) => {
    hap("heavy");
    setErr("");
    setPhase("wait");
    try {
      setLive(await api<Live>(`/live/${live.code}/action`, { method: "POST", body: JSON.stringify({ turn: live.turn, ...a }) }));
    } catch (e: any) {
      setErr(e.message);
      setPhase("menu");
    }
  };

  // A second tap in the same screen confirms the surrender.
  const [quitAt, setQuitAt] = useState<Phase | null>(null);
  const sureQuit = quitAt === phase;
  const forfeit = async () => {
    hap("error");
    if (!sureQuit) return setQuitAt(phase);
    setQuitAt(null);
    try {
      setLive(await api<Live>(`/live/${live.code}/action`, { method: "POST", body: JSON.stringify({ turn: live.turn, kind: "forfeit" }) }));
      setPhase("over");
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const act = showing?.act ?? st.act;
  const me = st.P[side][act[side]];
  const foe = st.P[foeSide][act[foeSide]];
  const php = showing ? showing.hp[side] : me.hp;
  const ehp = showing ? showing.hp[foeSide] : foe.hp;
  const myParty = st.P[side];
  const bag = (Object.keys(ITEMS) as ItemId[]).filter((id) => id !== "vasetto" && (save?.items[id] ?? 0) > 0);
  const resultText = coop
    ? (winner === "host" ? `Vittoria di squadra contro ${names.boss}! Ricevete ${boss.npc?.reward ?? 0} € e una Caramella Rara.` : winner === "boss" ? `${names.boss} vi ha battuti. Riprovate insieme!` : `${names[other(side)]} ha lasciato la stanza.`)
    : winner === "draw" ? "Pareggio! Nessuno vince, ma tutti mangiano." :
    winner === side ? (live.status === "done" && !st.winner ? `${names[foeSide]} si è arreso. Hai vinto!` : "Hai vinto la sfida in diretta! Il tuo amico offrirà il caffè.") :
    st.winner ? `Ha vinto ${names[foeSide]}. Rivincita?` : "Ti sei arreso. Sarà per la prossima!";

  const fxOn = (target: Side) => fx?.line.fx?.target === target ? <HitFx key={fx.k} type={fx.line.fx.type} dmg={fx.line.fx.dmg} crit={fx.line.fx.crit} eff={fx.line.fx.eff} /> : fx?.line.heal === target ? <HealFx key={fx.k} label="+PV" /> : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]} testID="live-battle">
      <View style={styles.scene}>
        <LinearGradient colors={["#c9a7e0", "#8f6fb8", "#3f2d63"]} style={StyleSheet.absoluteFill} />
        <View style={styles.row}>
          <Info mon={foe} hp={ehp} owner={names[foeSide]} testID="live-foe-info" />
          <View style={styles.spriteWrap}>
            <View style={styles.ground} />
            <Breathe size={battleSize(foe.s, 104)}><PixelSprite name={foe.s} size={battleSize(foe.s, 104)} testID="live-foe-sprite" /></Breathe>
            {fxOn(foeSide)}
          </View>
        </View>
        {coop && (() => {
          const ally = other(side), am = st.P[ally][act[ally]];
          return (
            <View style={styles.ally} testID="live-ally-info">
              <PixelSprite name={am.s} size={28} />
              <PixelText style={styles.meta} numberOfLines={1}>Alleato {names[ally]}: {monName(am)} {st.out[ally] ? "· fuori" : `${showing ? showing.hp[ally] : am.hp}/${stats(am).hp} PV`}</PixelText>
            </View>
          );
        })()}
        <View style={styles.row}>
          <View style={styles.spriteWrap}>
            <View style={styles.ground} />
            <Breathe size={battleSize(me.s, 112)} delay={550}><PixelSprite name={me.s} size={battleSize(me.s, 112)} flip testID="live-me-sprite" /></Breathe>
            {fxOn(side)}
          </View>
          <Info mon={me} hp={php} owner="Tu" showHp testID="live-me-info" />
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        {!!err && <PixelText style={styles.err} testID="live-error">{err}</PixelText>}
        {phase === "msg" && showing && (
          <Pressable testID="live-message-box" onPress={advance} style={styles.msgBox}>
            <PixelText style={styles.msg}>{showing.text}</PixelText>
            <PixelText style={styles.next}>▼</PixelText>
          </Pressable>
        )}
        {phase === "wait" && (
          <View style={styles.msgBox} testID="live-waiting">
            <PixelText style={styles.msg}>In attesa di {names[foeSide]}...</PixelText>
            <PixelText style={styles.meta}>{live.their_action ? `${names[foeSide]} ha già scelto!` : "Sta ancora decidendo. Nessuna fretta, siamo in Emilia."}</PixelText>
            <RetroButton testID="live-wait-forfeit" variant="secondary" small label={sureQuit ? "Sicuro? Tocca per arrenderti" : "Arrenditi"} onPress={forfeit} />
          </View>
        )}
        {phase === "over" && (
          <View style={styles.msgBox} testID="live-over">
            <PixelText style={styles.msg} testID="live-result">{resultText}</PixelText>
            <RetroButton testID="live-exit-btn" label="Torna al gioco" onPress={onExit} />
          </View>
        )}
        {phase === "menu" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <PixelText style={styles.prompt}>Turno {live.turn + 1} · Cosa fa {monName(me)}?</PixelText>
            <View style={styles.grid}>
              <Cmd label="Lotta" color={colors.brandPrimary} fg={colors.onBrandPrimary} testID="live-cmd-fight" onPress={() => { setQuitAt(null); setPhase("moves"); }} />
              <Cmd label="Zaino" color={colors.brandSecondary} fg={colors.onBrandSecondary} testID="live-cmd-bag" onPress={() => { setQuitAt(null); setPhase("bag"); }} />
              <Cmd label="Mostrelli" color={colors.brandTertiary} fg={colors.onBrandTertiary} testID="live-cmd-switch" onPress={() => { setQuitAt(null); setPhase("switch"); }} />
              <Cmd label={sureQuit ? "Sicuro?" : "Arrenditi"} color={sureQuit ? colors.brandPrimary : colors.surfaceTertiary} fg={colors.onSurface} testID="live-cmd-forfeit" onPress={forfeit} />
            </View>
          </Animated.View>
        )}
        {phase === "moves" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <View style={styles.grid}>
              {knownMoves(me).map((mv) => {
                const m = MOVES[mv];
                return (
                  <Pressable key={mv} testID={`live-move-${mv}`} onPress={() => send({ kind: "move", move: mv })} style={({ pressed }) => [styles.move, { borderLeftColor: TYPES[m.type].color, opacity: pressed ? 0.7 : 1 }]}>
                    <PixelText style={styles.moveName} numberOfLines={2}>{m.name}</PixelText>
                    <PixelText style={[styles.moveMeta, { color: TYPES[m.type].color }]}>{TYPES[m.type].name} · {m.power}</PixelText>
                    {m.fx && <PixelText style={styles.meta}>{m.fx.p}% {FX_LABEL[m.fx.k]}</PixelText>}
                  </Pressable>
                );
              })}
            </View>
            <Back testID="live-moves-back" onPress={() => setPhase("menu")} />
          </Animated.View>
        )}
        {phase === "bag" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <PixelText style={styles.prompt}>Zaino · gli strumenti usati si consumano</PixelText>
            {bag.length === 0 && <PixelText style={styles.meta}>Lo zaino è vuoto. Passa in bottega dopo la sfida.</PixelText>}
            <View style={styles.grid}>
              {bag.map((id) => (
                <Pressable key={id} testID={`live-item-${id}`} onPress={() => { hap("selection"); setPending(id); setPhase("itemTarget"); }} style={({ pressed }) => [styles.move, { borderLeftColor: colors.brandSecondary, opacity: pressed ? 0.7 : 1 }]}>
                  <PixelText style={styles.moveName} numberOfLines={2}>{ITEMS[id].name}</PixelText>
                  <PixelText style={[styles.moveMeta, { color: colors.brandSecondary }]}>x{save?.items[id] ?? 0}</PixelText>
                </Pressable>
              ))}
            </View>
            <Back testID="live-bag-back" onPress={() => setPhase("menu")} />
          </Animated.View>
        )}
        {(phase === "itemTarget" || phase === "switch") && (
          <Animated.View entering={SlideInDown.duration(180)} style={{ maxHeight: 260 }}>
            <PixelText style={styles.prompt}>{phase === "switch" ? "Chi mandi in campo?" : `Su chi usi ${ITEMS[pending!].name}?`}</PixelText>
            <ScrollView>
              {myParty.map((m, i) => {
                const off = phase === "switch" && (m.hp <= 0 || i === st.act[side]);
                return (
                  <Pressable
                    key={m.uid}
                    testID={`live-${phase === "switch" ? "switch" : "item-target"}-${i}`}
                    disabled={off}
                    onPress={() => (phase === "switch" ? send({ kind: "switch", idx: i }) : send({ kind: "item", item: pending!, idx: i }))}
                    style={[styles.swRow, off && { opacity: 0.4 }]}
                  >
                    <PixelSprite name={m.s} size={36} />
                    <View style={{ flex: 1 }}>
                      <PixelText style={styles.moveName}>{monName(m)} Lv{m.lv}</PixelText>
                      <HpBar hp={m.hp} max={stats(m).hp} />
                    </View>
                    <PixelText style={styles.meta}>{m.hp}/{stats(m).hp}</PixelText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Back testID="live-list-back" onPress={() => setPhase(phase === "switch" ? "menu" : "bag")} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function Info({ mon, hp, owner, showHp, testID }: { mon: Mon; hp: number; owner: string; showHp?: boolean; testID: string }) {
  const max = stats(mon).hp;
  return (
    <View style={styles.infoBox} testID={testID}>
      <PixelText style={styles.monName} numberOfLines={1}>{monName(mon)}</PixelText>
      <PixelText style={styles.meta}>Lv{mon.lv} · {TYPES[SPECIES[mon.s].type].name} · {owner}</PixelText>
      <HpBar hp={hp} max={max} testID={`${testID}-hp`} />
      {showHp && <PixelText style={styles.hpText}>{hp}/{max} PV</PixelText>}
    </View>
  );
}

function Back({ onPress, testID }: { onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.back}>
      <PixelText style={{ color: colors.brandSecondary }}>‹ Indietro</PixelText>
    </Pressable>
  );
}

function Cmd({ label, color, fg, onPress, testID }: { label: string; color: string; fg: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={() => { hap("medium"); onPress(); }} style={({ pressed }) => [styles.cmd, { backgroundColor: color, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
      <PixelText style={[styles.cmdTxt, { color: fg }]}>{label}</PixelText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  ally: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.onSurface, paddingHorizontal: 6, paddingVertical: 2, maxWidth: "90%" },
  scene: { flex: 1, justifyContent: "space-around", paddingHorizontal: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoBox: { width: "48%", backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.onSurface, padding: 8, gap: 4 },
  monName: { fontSize: 15, color: colors.onSurface },
  meta: { fontSize: 11, color: colors.muted },
  hpText: { fontSize: 12, color: colors.onSurfaceSecondary, textAlign: "right" },
  spriteWrap: { alignItems: "center", justifyContent: "flex-end" },
  ground: { position: "absolute", bottom: -6, width: 130, height: 22, borderRadius: 999, backgroundColor: "#2a1d42" },
  panel: { backgroundColor: colors.surface, borderTopWidth: 4, borderTopColor: colors.onSurface, padding: 12, minHeight: 200, gap: 6 },
  err: { color: colors.brandPrimary, fontSize: 12 },
  msgBox: { minHeight: 150, borderWidth: 2, borderColor: colors.onSurface, backgroundColor: colors.surfaceSecondary, padding: 16, justifyContent: "space-between", gap: 10 },
  msg: { fontSize: 16, lineHeight: 24 },
  next: { alignSelf: "flex-end", color: colors.brandSecondary },
  prompt: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cmd: { width: "48.5%", height: 64, borderWidth: 2, borderColor: colors.onSurface, borderBottomWidth: 4, alignItems: "center", justifyContent: "center", borderRadius: 2 },
  cmdTxt: { fontSize: 15, textTransform: "uppercase", letterSpacing: 1 },
  move: { width: "48.5%", minHeight: 64, borderWidth: 2, borderColor: colors.borderStrong, borderLeftWidth: 8, backgroundColor: colors.surfaceSecondary, padding: 8, justifyContent: "center" },
  moveName: { fontSize: 13, fontFamily: FONT },
  moveMeta: { fontSize: 11, marginTop: 2 },
  back: { marginTop: 8, minHeight: 44, justifyContent: "center" },
  swRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 6, backgroundColor: colors.surfaceSecondary },
});
