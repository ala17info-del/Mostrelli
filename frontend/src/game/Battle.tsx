import React, { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, FONT } from "@/src/theme";

import { MOVES, SPECIES, TYPES } from "./data";
import { attack, catchChance, gainXp, knownMoves, Mon, monName, stats, xpReward } from "./engine";
import { PixelSprite } from "./PixelSprite";
import { hap, HpBar, PixelText } from "./ui";

export type BattleSetup = { kind: "wild" | "trainer"; enemies: Mon[]; trainerName?: string };
export type BattleResult = {
  outcome: "win" | "lose" | "flee" | "caught";
  party: Mon[];
  caught?: Mon;
  seen: string[];
  vasettiUsed: number;
};

type Step = { text: string; php: number; ehp: number };
type Phase = "msg" | "menu" | "moves" | "switch" | "forceSwitch";

export function Battle({ setup, party: initialParty, vasetti, onEnd }: { setup: BattleSetup; party: Mon[]; vasetti: number; onEnd: (r: BattleResult) => void }) {
  const insets = useSafeAreaInsets();
  const P = useRef<Mon[]>(initialParty.map((m) => ({ ...m })));
  const E = useRef<Mon[]>(setup.enemies.map((m) => ({ ...m })));
  const seen = useRef<string[]>([setup.enemies[0].s]);
  const used = useRef(0);
  const [act, setAct] = useState(() => Math.max(0, P.current.findIndex((m) => m.hp > 0)));
  const [ei, setEi] = useState(0);
  const [phase, setPhase] = useState<Phase>("msg");
  const [steps, setSteps] = useState<Step[]>(() => {
    const e = E.current[0];
    const first = setup.kind === "wild" ? `Salta fuori un ${monName(e)} selvatico!` : `${setup.trainerName} ti sfida! Manda in campo ${monName(e)}!`;
    const me = P.current[Math.max(0, P.current.findIndex((m) => m.hp > 0))];
    return [{ text: first, php: me.hp, ehp: e.hp }, { text: `Vai, ${monName(me)}!`, php: me.hp, ehp: e.hp }];
  });
  const [si, setSi] = useState(0);
  const afterMsgs = useRef<() => void>(() => setPhase("menu"));
  const [, force] = useState(0);

  const me = P.current[act];
  const foe = E.current[ei];
  const meMax = stats(me).hp;
  const foeMax = stats(foe).hp;
  const showing = phase === "msg" ? steps[si] : null;
  const php = showing ? showing.php : me.hp;
  const ehp = showing ? showing.ehp : foe.hp;

  const finish = (outcome: BattleResult["outcome"], caught?: Mon) =>
    onEnd({ outcome, party: P.current, caught, seen: seen.current, vasettiUsed: used.current });

  const play = (list: Step[], then: () => void) => {
    setSteps(list);
    setSi(0);
    setPhase("msg");
    afterMsgs.current = then;
  };

  const advance = () => {
    hap("selection");
    if (si < steps.length - 1) setSi(si + 1);
    else afterMsgs.current();
  };

  // Build steps of one attack while tracking HP snapshots.
  const snap = (list: Step[], text: string, a = act, e = ei) => list.push({ text, php: P.current[a].hp, ehp: E.current[e].hp });

  const resolve = (list: Step[], a: number, e: number) => {
    const foeNow = E.current[e];
    const meNow = P.current[a];
    if (foeNow.hp <= 0) {
      snap(list, `${monName(foeNow)} ${setup.kind === "wild" ? "selvatico" : "nemico"} è esausto!`, a, e);
      for (const t of gainXp(meNow, xpReward(foeNow, setup.kind === "trainer"))) snap(list, t, a, e);
      const next = E.current.findIndex((m) => m.hp > 0);
      if (next >= 0) {
        if (!seen.current.includes(E.current[next].s)) seen.current.push(E.current[next].s);
        play(list, () => {
          setEi(next);
          play([{ text: `${setup.trainerName} manda in campo ${monName(E.current[next])}!`, php: meNow.hp, ehp: E.current[next].hp }], () => setPhase("menu"));
        });
      } else {
        if (setup.kind === "trainer") snap(list, `Hai sconfitto ${setup.trainerName}!`, a, e);
        play(list, () => finish("win"));
      }
      return;
    }
    if (meNow.hp <= 0) {
      snap(list, `${monName(meNow)} è esausto!`, a, e);
      const alive = P.current.some((m) => m.hp > 0);
      if (alive) play(list, () => setPhase("forceSwitch"));
      else {
        snap(list, "Non hai più mostri in grado di lottare... Ti gira la testa e svieni.", a, e);
        play(list, () => finish("lose"));
      }
      return;
    }
    play(list, () => setPhase("menu"));
  };

  const enemyTurn = (list: Step[], a: number) => {
    const foeNow = E.current[ei];
    const moves = knownMoves(foeNow);
    const mv = moves[Math.floor(Math.random() * moves.length)];
    for (const t of attack(foeNow, P.current[a], mv, setup.kind === "wild" ? "Selvatico · " : "Nemico · ")) snap(list, t, a);
  };

  const doMove = (mv: string) => {
    hap("heavy");
    const list: Step[] = [];
    const meFirst = stats(me).spd >= stats(foe).spd;
    if (meFirst) {
      for (const t of attack(me, foe, mv)) snap(list, t);
      if (foe.hp > 0) enemyTurn(list, act);
    } else {
      enemyTurn(list, act);
      if (me.hp > 0) for (const t of attack(me, foe, mv)) snap(list, t);
    }
    resolve(list, act, ei);
  };

  const tryCatch = () => {
    const list: Step[] = [];
    if (setup.kind === "trainer") {
      play([{ text: "Non si rubano i mostri degli altri! Qui siamo gente onesta (quasi).", php: me.hp, ehp: foe.hp }], () => setPhase("menu"));
      return;
    }
    if (vasetti - used.current <= 0) {
      play([{ text: "Non hai più Vasetti di Vetro! Passa in bottega.", php: me.hp, ehp: foe.hp }], () => setPhase("menu"));
      return;
    }
    used.current += 1;
    snap(list, "Lanci un Vasetto di Vetro...");
    if (Math.random() < catchChance(foe)) {
      hap("success");
      snap(list, `Preso! ${monName(foe)} è nel vasetto. Chiudi bene il coperchio!`);
      const caught = { ...foe };
      play(list, () => finish("caught", caught));
      return;
    }
    hap("error");
    snap(list, `Accidenti! ${monName(foe)} è uscito dal vasetto!`);
    enemyTurn(list, act);
    resolve(list, act, ei);
  };

  const flee = () => {
    if (setup.kind === "trainer") {
      play([{ text: "Non si scappa da un emiliano che ti ha sfidato! Sarebbe un disonore per tre generazioni.", php: me.hp, ehp: foe.hp }], () => setPhase("menu"));
      return;
    }
    if (stats(me).spd >= stats(foe).spd || Math.random() < 0.7) {
      play([{ text: "Te la sei svignata. Con eleganza, più o meno.", php: me.hp, ehp: foe.hp }], () => finish("flee"));
      return;
    }
    const list: Step[] = [];
    snap(list, "Non riesci a scappare!");
    enemyTurn(list, act);
    resolve(list, act, ei);
  };

  const switchTo = (i: number, forced: boolean) => {
    hap("selection");
    setAct(i);
    const list: Step[] = [{ text: `Vai, ${monName(P.current[i])}!`, php: P.current[i].hp, ehp: foe.hp }];
    if (forced) {
      play(list, () => setPhase("menu"));
      return;
    }
    enemyTurn(list, i);
    resolve(list, i, ei);
    force((n) => n + 1);
  };

  return (
    <Animated.View entering={FadeIn.duration(250)} style={[styles.root, { paddingTop: insets.top + 8 }]} testID="battle-screen">
      <View style={styles.scene}>
        <View style={styles.foeRow}>
          <View style={styles.infoBox} testID="battle-enemy-info">
            <PixelText style={styles.monName} numberOfLines={1}>{monName(foe)}</PixelText>
            <PixelText style={styles.lv}>Lv{foe.lv} · {TYPES[SPECIES[foe.s].type].name}</PixelText>
            <HpBar hp={ehp} max={foeMax} testID="battle-enemy-hp" />
          </View>
          <View style={styles.spriteWrap}>
            <View style={styles.ground} />
            <PixelSprite name={foe.s} size={112} testID="battle-enemy-sprite" />
          </View>
        </View>
        <View style={styles.meRow}>
          <View style={styles.spriteWrap}>
            <View style={styles.ground} />
            <PixelSprite name={me.s} size={120} flip testID="battle-player-sprite" />
          </View>
          <View style={styles.infoBox} testID="battle-player-info">
            <PixelText style={styles.monName} numberOfLines={1}>{monName(me)}</PixelText>
            <PixelText style={styles.lv}>Lv{me.lv}</PixelText>
            <HpBar hp={php} max={meMax} testID="battle-player-hp" />
            <PixelText style={styles.hpText} testID="battle-player-hp-text">{php}/{meMax} PV</PixelText>
          </View>
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        {phase === "msg" && showing && (
          <Pressable testID="battle-message-box" onPress={advance} style={styles.msgBox}>
            <PixelText style={styles.msg}>{showing.text}</PixelText>
            <PixelText style={styles.next}>▼</PixelText>
          </Pressable>
        )}
        {phase === "menu" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <PixelText style={styles.prompt}>Cosa deve fare {monName(me)}?</PixelText>
            <View style={styles.grid}>
              <Cmd label="Lotta" color={colors.brandPrimary} fg={colors.onBrandPrimary} testID="battle-cmd-fight" onPress={() => setPhase("moves")} />
              <Cmd label={`Cattura (${vasetti - used.current})`} color={colors.brandSecondary} fg={colors.onBrandSecondary} testID="battle-cmd-catch" onPress={tryCatch} />
              <Cmd label="Mostri" color={colors.brandTertiary} fg={colors.onBrandTertiary} testID="battle-cmd-switch" onPress={() => setPhase("switch")} />
              <Cmd label="Fuga" color={colors.surfaceTertiary} fg={colors.onSurface} testID="battle-cmd-flee" onPress={flee} />
            </View>
          </Animated.View>
        )}
        {phase === "moves" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <View style={styles.grid}>
              {knownMoves(me).map((mv) => {
                const m = MOVES[mv];
                return (
                  <Pressable key={mv} testID={`battle-move-${mv}`} onPress={() => doMove(mv)} style={({ pressed }) => [styles.move, { borderLeftColor: TYPES[m.type].color, opacity: pressed ? 0.7 : 1 }]}>
                    <PixelText style={styles.moveName} numberOfLines={2}>{m.name}</PixelText>
                    <PixelText style={[styles.moveMeta, { color: TYPES[m.type].color }]}>{TYPES[m.type].name} · {m.power}</PixelText>
                  </Pressable>
                );
              })}
            </View>
            <Pressable testID="battle-moves-back" onPress={() => setPhase("menu")} style={styles.back}>
              <PixelText style={styles.backTxt}>‹ Indietro</PixelText>
            </Pressable>
          </Animated.View>
        )}
        {(phase === "switch" || phase === "forceSwitch") && (
          <Animated.View entering={SlideInDown.duration(180)} style={{ maxHeight: 260 }}>
            <PixelText style={styles.prompt}>{phase === "forceSwitch" ? "Chi mandi in campo?" : "Cambia mostro"}</PixelText>
            <ScrollView>
              {P.current.map((m, i) => (
                <Pressable
                  key={m.uid}
                  testID={`battle-switch-${i}`}
                  disabled={m.hp <= 0 || i === act}
                  onPress={() => switchTo(i, phase === "forceSwitch")}
                  style={[styles.swRow, (m.hp <= 0 || i === act) && { opacity: 0.4 }]}
                >
                  <PixelSprite name={m.s} size={36} />
                  <View style={{ flex: 1 }}>
                    <PixelText style={styles.moveName}>{monName(m)} Lv{m.lv}</PixelText>
                    <HpBar hp={m.hp} max={stats(m).hp} />
                  </View>
                  <PixelText style={styles.lv}>{m.hp}/{stats(m).hp}</PixelText>
                </Pressable>
              ))}
            </ScrollView>
            {phase === "switch" && (
              <Pressable testID="battle-switch-back" onPress={() => setPhase("menu")} style={styles.back}>
                <PixelText style={styles.backTxt}>‹ Indietro</PixelText>
              </Pressable>
            )}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

function Cmd({ label, color, fg, onPress, testID }: { label: string; color: string; fg: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        hap("medium");
        onPress();
      }}
      style={({ pressed }) => [styles.cmd, { backgroundColor: color, transform: [{ translateY: pressed ? 2 : 0 }] }]}
    >
      <PixelText style={[styles.cmdTxt, { color: fg }]}>{label}</PixelText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surface },
  scene: { flex: 1, justifyContent: "space-around", paddingHorizontal: 16, backgroundColor: "#2f5d34" },
  foeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoBox: { width: "48%", backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.onSurface, padding: 8, gap: 4 },
  monName: { fontSize: 15, color: colors.onSurface },
  lv: { fontSize: 12, color: colors.muted },
  hpText: { fontSize: 12, color: colors.onSurfaceSecondary, textAlign: "right" },
  spriteWrap: { alignItems: "center", justifyContent: "flex-end" },
  ground: { position: "absolute", bottom: -6, width: 130, height: 22, borderRadius: 999, backgroundColor: "#24482a" },
  panel: { backgroundColor: colors.surface, borderTopWidth: 4, borderTopColor: colors.onSurface, padding: 12, minHeight: 200 },
  msgBox: { minHeight: 150, borderWidth: 2, borderColor: colors.onSurface, backgroundColor: colors.surfaceSecondary, padding: 16, justifyContent: "space-between" },
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
  backTxt: { color: colors.brandSecondary },
  swRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 6, backgroundColor: colors.surfaceSecondary },
});
