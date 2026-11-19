import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, FONT } from "@/src/theme";

import { sfx, SfxName } from "./audio";
import { FX_LABEL, ITEMS, ItemId, MOVES, SPECIES, TypeId, TYPES } from "./data";
import { EvolveScene, HealFx, HitFx } from "./BattleFx";
import { applyItem, attack, AttackOpts, stageMult, catchChance, gainXp, knownMoves, Mon, monName, stats, xpReward } from "./engine";
import { Breathe } from "./Alive";
import { battleSize, PixelSprite } from "./PixelSprite";
import { hap, HpBar, PixelText } from "./ui";
import { ATK_MULT, ChargeGauge, Grade, GUARD_MULT, TimedCommand } from "./BattleQte";
import { Weather, WEATHER, WeatherLayer, weatherMult } from "./Weather";

export { weatherFor } from "./Weather";

// Timed commands are off: attacks start as soon as you pick the move.
let QTE_ON = false;
const CHARGE_MAX = 3;

export type BattleSetup = { kind: "wild" | "trainer"; enemies: Mon[]; trainerName?: string; field?: "grass" | "beach"; duel?: boolean; weather?: Weather; spot?: string };
export type BattleResult = {
  outcome: "win" | "lose" | "flee" | "caught";
  party: Mon[];
  caught?: Mon;
  seen: string[];
  itemsUsed: Partial<Record<ItemId, number>>;
};

function sfxFor(text: string): SfxName | null {
  if (/ usa /.test(text)) return "hit";
  if (/si sta evolvendo|è diventato/.test(text)) return "evolve";
  if (/sale al livello/.test(text)) return "levelup";
  if (/^Preso!/.test(text)) return "catch";
  if (/uscito dal vasetto/.test(text)) return "fail";
  if (/recupera|riprende i sensi/.test(text)) return "heal";
  if (/cala!|è confuso|si scotta|si colpisce da solo/.test(text)) return "fail";
  if (/aumenta!/.test(text)) return "levelup";
  return null;
}

type Fx = { target: "foe" | "me"; type: TypeId; dmg: number; crit: boolean; eff: number };
type CondSnap = Record<string, { atk: number; def: number; spd: number; conf: number; burn: boolean }>;
type Step = { text: string; php: number; ehp: number; ps?: string; fx?: Fx; conds?: CondSnap; anim?: "throw" | "caught" | "fail" | "heal" };
type Phase = "msg" | "menu" | "moves" | "switch" | "forceSwitch" | "bag" | "itemTarget" | "qte";

export function Battle({ setup, party: initialParty, items, onEnd }: { setup: BattleSetup; party: Mon[]; items: Partial<Record<ItemId, number>>; onEnd: (r: BattleResult) => void }) {
  const insets = useSafeAreaInsets();
  const P = useRef<Mon[]>(initialParty.map((m) => ({ ...m })));
  const E = useRef<Mon[]>(setup.enemies.map((m) => ({ ...m })));
  const seen = useRef<string[]>([setup.enemies[0].s]);
  const used = useRef<Partial<Record<ItemId, number>>>({});
  type Cond = { atk: number; def: number; spd: number; conf: number; burn: boolean };
  const cond = useRef<Record<string, Cond>>({});
  const cnd = (uid: string) => cond.current[uid] ?? (cond.current[uid] = { atk: 0, def: 0, spd: 0, conf: 0, burn: false });
  const chips = (m: Mon, tid: string, snapC?: CondSnap) => {
    const c = (snapC ?? cond.current)[m.uid];
    if (!c) return null;
    const out: { t: string; bad: boolean }[] = [];
    if (c.burn) out.push({ t: "SCOT", bad: true });
    if (c.conf > 0) out.push({ t: "CONF", bad: true });
    (["atk", "def", "spd"] as const).forEach((k) => {
      if (c[k] !== 0) out.push({ t: `${k === "atk" ? "ATT" : k === "def" ? "DIF" : "VEL"}${c[k] > 0 ? "↑" : "↓"}${Math.abs(c[k]) > 1 ? Math.abs(c[k]) : ""}`, bad: c[k] < 0 });
    });
    if (!out.length) return null;
    return (
      <View style={styles.chips} testID={tid}>
        {out.map((o) => (
          <View key={o.t} style={[styles.chip, { backgroundColor: o.bad ? colors.brandPrimary : colors.brandTertiary }]}>
            <PixelText style={styles.chipTxt}>{o.t}</PixelText>
          </View>
        ))}
      </View>
    );
  };
  const left = (id: ItemId) => (items[id] ?? 0) - (used.current[id] ?? 0);
  const [pending, setPending] = useState<ItemId | null>(null);
  const shake = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [bob]);
  const sceneStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const foeX = useSharedValue(0);
  const meX = useSharedValue(0);
  const foeO = useSharedValue(1);
  const meO = useSharedValue(1);
  const flashO = useSharedValue(0);
  const foeScale = useSharedValue(1);
  const jarP = useSharedValue(0);
  const jarRot = useSharedValue(0);
  const [jar, setJar] = useState(false);
  const [healK, setHealK] = useState(0);
  const [scene, setScene] = useState({ w: 390, h: 400 });
  const jarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: scene.w * (0.12 + 0.6 * jarP.value) },
      { translateY: scene.h * (0.7 - 0.5 * jarP.value) - 110 * Math.sin(Math.PI * jarP.value) },
      { rotate: `${jarP.value * 720 + jarRot.value}deg` },
    ],
  }));
  const [fxShow, setFxShow] = useState<(Fx & { k: number }) | null>(null);
  const bobFoe = useAnimatedStyle(() => ({ opacity: foeO.value, transform: [{ scale: foeScale.value }, { translateY: bob.value * -4 }, { translateX: foeX.value }, { translateY: -Math.abs(foeX.value) * 0.6 }] }));
  // A cromatico appears with a golden flash and sparkles.
  useEffect(() => {
    if (!E.current[0].shiny) return;
    flashO.value = withDelay(350, withSequence(withTiming(0.8, { duration: 120 }), withTiming(0, { duration: 600 })));
    sfx("evolve");
    hap("success");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const bobMe = useAnimatedStyle(() => ({ opacity: meO.value, transform: [{ translateY: (1 - bob.value) * -4 }, { translateX: meX.value }, { translateY: -Math.abs(meX.value) * 0.6 }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashO.value }));
  const [act, setAct] = useState(() => Math.max(0, P.current.findIndex((m) => m.hp > 0)));
  const [ei, setEi] = useState(0);
  const [phase, setPhase] = useState<Phase>("msg");
  const [steps, setSteps] = useState<Step[]>(() => {
    const e = E.current[0];
    const first = setup.kind === "wild"
      ? e.shiny ? `✨ Incredibile! Un ${monName(e)} CROMATICO! Non fartelo scappare!` : e.rare ? `Un ${monName(e)} raro, già evoluto! Che fortuna!` : `Salta fuori un ${monName(e)} selvatico!`
      : `${setup.trainerName} ti sfida! Manda in campo ${monName(e)}!`;
    const me = P.current[Math.max(0, P.current.findIndex((m) => m.hp > 0))];
    const intro = [{ text: first, php: me.hp, ehp: e.hp }];
    if (setup.weather) intro.push({ text: WEATHER[setup.weather].intro, php: me.hp, ehp: e.hp });
    return [...intro, { text: `Vai, ${monName(me)}!`, php: me.hp, ehp: e.hp }];
  });
  const [si, setSi] = useState(0);
  const afterMsgs = useRef<() => void>(() => setPhase("menu"));
  const charge = useRef(0);
  const [qte, setQte] = useState<{ mv: string; special: boolean } | null>(null);
  const [qteOn, setQteOn] = useState(QTE_ON);
  const wx = setup.weather;
  // Weather and timing turn into attack modifiers.
  const optsFor = (mv: string, mult = 1, extra: AttackOpts = {}): AttackOpts => ({
    mult: mult * weatherMult(wx, MOVES[mv].type), accMod: wx ? WEATHER[wx].accMod : 0, ...extra,
  });
  const [, force] = useState(0);

  const me = P.current[act];
  const foe = E.current[ei];
  const meMax = stats(me).hp;
  const foeMax = stats(foe).hp;
  const showing = phase === "msg" ? steps[si] : null;
  const php = showing ? showing.php : me.hp;
  const ehp = showing ? showing.ehp : foe.hp;

  const finish = (outcome: BattleResult["outcome"], caught?: Mon) =>
    onEnd({ outcome, party: P.current, caught, seen: seen.current, itemsUsed: used.current });

  const play = (list: Step[], then: () => void) => {
    setSteps(list);
    setSi(0);
    setPhase("msg");
    afterMsgs.current = then;
  };

  const cur = phase === "msg" ? steps[si]?.text : null;
  // Evolution: the scene starts on "si sta evolvendo" and stays for the "è diventato" line.
  const [evo, setEvo] = useState<{ from: string; to: string; k: number } | null>(null);
  useEffect(() => {
    if (cur && /si sta evolvendo/.test(cur)) {
      const to = steps.slice(si + 1).find((x) => /è diventato/.test(x.text))?.ps;
      const from = steps[si]?.ps ?? P.current[act].s;
      if (to && to !== from) setEvo({ from, to, k: Date.now() });
    } else if (!cur || !/è diventato/.test(cur)) setEvo(null);
  }, [cur, si]); // eslint-disable-line react-hooks/exhaustive-deps
  const curFx = phase === "msg" ? steps[si]?.fx : undefined;
  useEffect(() => {
    if (!cur) return;
    const k = sfxFor(cur);
    if (k) sfx(k);
    if (/superefficace|Colpo critico/.test(cur)) {
      flashO.value = withSequence(withTiming(0.55, { duration: 60 }), withTiming(0, { duration: 260 }));
      shake.value = withSequence(withTiming(-14, { duration: 40 }), withTiming(14, { duration: 40 }), withTiming(-8, { duration: 40 }), withTiming(8, { duration: 40 }), withTiming(0, { duration: 40 }));
    }
    const an = steps[si]?.anim;
    if (/si sta evolvendo/.test(cur)) {
      meO.value = withSequence(...Array.from({ length: 6 }, (_, k) => withTiming(k % 2 ? 1 : 0.15, { duration: 140 })));
      flashO.value = withDelay(800, withSequence(withTiming(0.9, { duration: 120 }), withTiming(0, { duration: 500 })));
    }
    if (an === "throw") {
      setJar(true);
      jarRot.value = 0;
      jarP.value = 0;
      jarP.value = withTiming(1, { duration: 600 });
      foeScale.value = withDelay(560, withTiming(0, { duration: 220 }));
    }
    if (an === "caught") jarRot.value = withSequence(withTiming(-25, { duration: 120 }), withTiming(25, { duration: 160 }), withTiming(-15, { duration: 140 }), withTiming(0, { duration: 120 }));
    if (an === "fail") {
      jarRot.value = withSequence(withTiming(-25, { duration: 120 }), withTiming(25, { duration: 160 }), withTiming(0, { duration: 100 }));
      foeScale.value = withDelay(380, withSequence(withTiming(1.25, { duration: 160 }), withTiming(1, { duration: 120 })));
      setTimeout(() => setJar(false), 420);
    }
    if (an === "heal") setHealK(Date.now());
    if (!curFx) {
      setFxShow(null);
      return;
    }
    const lungeAtt = curFx.target === "foe" ? meX : foeX;
    const blink = curFx.target === "foe" ? foeO : meO;
    lungeAtt.value = withSequence(withTiming(curFx.target === "foe" ? 28 : -28, { duration: 90 }), withTiming(0, { duration: 180 }));
    blink.value = withSequence(withTiming(1, { duration: 110 }), withTiming(0.1, { duration: 60 }), withTiming(1, { duration: 60 }), withTiming(0.1, { duration: 60 }), withTiming(1, { duration: 60 }));
    shake.value = withSequence(withTiming(-6, { duration: 50 }), withTiming(6, { duration: 50 }), withTiming(0, { duration: 50 }));
    setFxShow({ ...curFx, k: Date.now() });
  }, [cur, si, curFx, shake, flashO, meX, foeX, foeO, meO]);

  const advance = () => {
    hap("selection");
    if (si < steps.length - 1) setSi(si + 1);
    else afterMsgs.current();
  };
  // Keyboard on computers: Z / Enter / Space moves the battle text on.
  const advRef = useRef<(() => void) | null>(null);
  advRef.current = phase === "msg" ? advance : null;
  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) return;
    const on = (e: KeyboardEvent) => { if (!e.repeat && ["z", "Z", "Enter", " "].includes(e.key) && advRef.current) { e.preventDefault(); advRef.current(); } };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  // Build steps of one attack while tracking HP snapshots.
  const snap = (list: Step[], text: string, a = act, e = ei) =>
    list.push({ text, php: P.current[a].hp, ehp: E.current[e].hp, conds: JSON.parse(JSON.stringify(cond.current)) });

  const hit = (list: Step[], att: Mon, def: Mon, mv: string, target: "foe" | "me", a: number, prefix = "", opts: AttackOpts = {}) => {
    const ca = cnd(att.uid), cd = cnd(def.uid);
    if (ca.conf > 0) {
      ca.conf -= 1;
      snap(list, `${prefix}${monName(att)} è confuso...`, a);
      if (Math.random() < 0.33) {
        att.hp = Math.max(0, att.hp - Math.max(1, Math.floor(stats(att).hp / 10)));
        snap(list, `Si colpisce da solo per la confusione!`, a);
        if (ca.conf === 0) snap(list, `${monName(att)} si è ripreso dalla confusione!`, a);
        burnTick(list, att, a);
        return;
      }
      if (ca.conf === 0) snap(list, `${monName(att)} si è ripreso dalla confusione!`, a);
    }
    const before = def.hp;
    const lines = attack(att, def, mv, prefix, ca.atk, cd.def, opts);
    const dmg = before - def.hp;
    lines.forEach((t, i) => {
      snap(list, t, a);
      if (i === 0 && dmg > 0) {
        list[list.length - 1].fx = {
          target, type: MOVES[mv].type, dmg,
          crit: lines.includes("Colpo critico!"),
          eff: lines.includes("È superefficace!") ? 2 : lines.includes("Non è molto efficace...") ? 0.5 : 1,
        };
      }
    });
    const fx = MOVES[mv].fx;
    const missed = lines.some((l) => l.includes("manca"));
    if (fx && !missed && Math.random() * 100 < fx.p) {
      const self = fx.k.startsWith("self");
      const who = self ? att : def;
      const c = self ? ca : cd;
      if (who.hp > 0) {
        const n = `${monName(who)} ${E.current.includes(who) ? "nemico" : "(tuo)"}`;
        const bump = (key: "atk" | "def" | "spd", d: number, label: string) => {
          if ((d < 0 && c[key] <= -3) || (d > 0 && c[key] >= 3)) snap(list, `${label} di ${n} non può cambiare oltre!`, a);
          else {
            c[key] += d;
            snap(list, `${label} di ${n} ${d < 0 ? "cala!" : "aumenta!"}`, a);
          }
        };
        if (fx.k === "atkDown") bump("atk", -1, "L'attacco");
        if (fx.k === "defDown") bump("def", -1, "La difesa");
        if (fx.k === "spdDown") bump("spd", -1, "La velocità");
        if (fx.k === "selfAtkUp") bump("atk", 1, "L'attacco");
        if (fx.k === "selfDefUp") bump("def", 1, "La difesa");
        if (fx.k === "selfSpdUp") bump("spd", 1, "La velocità");
        if (fx.k === "confuse" && c.conf === 0) {
          c.conf = 2 + Math.floor(Math.random() * 3);
          snap(list, `${n} è confuso da tutte quelle chiacchiere!`, a);
        }
        if (fx.k === "burn" && !c.burn) {
          c.burn = true;
          snap(list, `${n} si scotta! Perderà PV ogni turno.`, a);
        }
      }
    }
    burnTick(list, att, a);
  };

  const burnTick = (list: Step[], m: Mon, a: number) => {
    if (!cnd(m.uid).burn || m.hp <= 0) return;
    m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(stats(m).hp / 12)));
    snap(list, `${monName(m)} si scotta ancora... che bruciore!`, a);
  };

  const effSpd = (m: Mon) => stats(m).spd * stageMult(cnd(m.uid).spd);

  const resolve = (list: Step[], a: number, e: number) => {
    const foeNow = E.current[e];
    const meNow = P.current[a];
    if (foeNow.hp <= 0) {
      snap(list, `${monName(foeNow)} ${setup.kind === "wild" ? "selvatico" : "nemico"} è esausto!`, a, e);
      if (!setup.duel) {
        const oldS = meNow.s;
        let evolved = false;
        for (const t of gainXp(meNow, xpReward(foeNow, setup.kind === "trainer"))) {
          if (t.includes("è diventato")) evolved = true;
          snap(list, t, a, e);
          list[list.length - 1].ps = evolved ? meNow.s : oldS;
        }
      }
      const next = E.current.findIndex((m) => m.hp > 0);
      const meDown = meNow.hp <= 0;
      if (meDown) snap(list, `Anche ${monName(meNow)} è esausto!`, a, e);
      const anyAlive = P.current.some((m) => m.hp > 0);
      if (next >= 0 && meDown && !anyAlive) {
        snap(list, "Non hai più mostrelli in grado di lottare... Ti gira la testa e svieni.", a, e);
        play(list, () => finish("lose"));
        return;
      }
      if (next >= 0) {
        if (!seen.current.includes(E.current[next].s)) seen.current.push(E.current[next].s);
        play(list, () => {
          setEi(next);
          play([{ text: `${setup.trainerName} manda in campo ${monName(E.current[next])}!`, php: meNow.hp, ehp: E.current[next].hp }], () => setPhase(meDown ? "forceSwitch" : "menu"));
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
        snap(list, "Non hai più mostrelli in grado di lottare... Ti gira la testa e svieni.", a, e);
        play(list, () => finish("lose"));
      }
      return;
    }
    play(list, () => setPhase("menu"));
  };

  const enemyTurn = (list: Step[], a: number, guard: Grade = "mancato") => {
    const foeNow = E.current[ei];
    const moves = knownMoves(foeNow);
    const mv = moves[Math.floor(Math.random() * moves.length)];
    if (guard === "perfetto") snap(list, `Parata perfetta! ${monName(P.current[a])} attutisce il colpo.`, a);
    if (guard === "buono") snap(list, `${monName(P.current[a])} para in parte il colpo.`, a);
    hit(list, foeNow, P.current[a], mv, "me", a, setup.kind === "wild" ? "Selvatico · " : "Nemico · ", optsFor(mv, GUARD_MULT[guard]));
  };

  // The strongest move this Mostrello knows: used by the special attack.
  const bestMove = (m: Mon) => knownMoves(m).reduce((b, x) => (MOVES[x].power > MOVES[b].power ? x : b));

  const doMove = (mv: string, special = false) => {
    hap("heavy");
    if (qteOn) {
      setQte({ mv, special });
      setPhase("qte");
      return;
    }
    runMove(mv, "mancato", "mancato", special);
  };

  const runMove = (mv: string, atk: Grade, guard: Grade, special: boolean) => {
    setQte(null);
    const list: Step[] = [];
    if (special) charge.current = 0;
    const mine = () => {
      const before = foe.hp;
      if (special) snap(list, `${monName(me)} scatena il COLPO EMILIANO!`);
      else if (atk === "perfetto") snap(list, "Tempismo perfetto!");
      else if (atk === "buono") snap(list, "Buon tempismo!");
      hit(list, me, foe, mv, "foe", act, "", optsFor(mv, ATK_MULT[atk] * (special ? 1.8 : 1), {
        sure: special, critBoost: special ? 0.5 : atk === "perfetto" ? 0.15 : 0,
      }));
      // Charge fills by itself: one point per hit that lands, two for a big hit.
      const dealt = before - foe.hp;
      if (!special && dealt > 0) charge.current = Math.min(CHARGE_MAX, charge.current + 1 + (dealt >= foeMax * 0.3 ? 1 : 0));
    };
    const meFirst = special || effSpd(me) >= effSpd(foe);
    if (meFirst) {
      mine();
      if (foe.hp > 0 && me.hp > 0) enemyTurn(list, act, guard);
    } else {
      enemyTurn(list, act, guard);
      if (me.hp > 0 && foe.hp > 0) mine();
    }
    resolve(list, act, ei);
  };

  const tryCatch = () => {
    const list: Step[] = [];
    if (setup.kind === "trainer") {
      play([{ text: "Non si rubano i mostrelli degli altri! Qui siamo gente onesta (quasi).", php: me.hp, ehp: foe.hp }], () => setPhase("menu"));
      return;
    }
    if (left("vasetto") <= 0) {
      play([{ text: "Non hai più Vasetti di Vetro! Passa in bottega.", php: me.hp, ehp: foe.hp }], () => setPhase("menu"));
      return;
    }
    used.current.vasetto = (used.current.vasetto ?? 0) + 1;
    snap(list, "Lanci un Vasetto di Vetro...");
    list[list.length - 1].anim = "throw";
    if (Math.random() < catchChance(foe)) {
      hap("success");
      snap(list, `Preso! ${monName(foe)} è nel vasetto. Chiudi bene il coperchio!`);
      list[list.length - 1].anim = "caught";
      const caught = { ...foe };
      play(list, () => finish("caught", caught));
      return;
    }
    hap("error");
    snap(list, `Accidenti! ${monName(foe)} è uscito dal vasetto!`);
    list[list.length - 1].anim = "fail";
    enemyTurn(list, act);
    resolve(list, act, ei);
  };

  const flee = () => {
    if (setup.kind === "trainer") {
      play([{ text: "Non si scappa da un emiliano che ti ha sfidato! Sarebbe un disonore per tre generazioni.", php: me.hp, ehp: foe.hp }], () => setPhase("menu"));
      return;
    }
    if (effSpd(me) >= effSpd(foe) || Math.random() < 0.7) {
      play([{ text: "Te la sei svignata. Con eleganza, più o meno.", php: me.hp, ehp: foe.hp }], () => finish("flee"));
      return;
    }
    const list: Step[] = [];
    snap(list, "Non riesci a scappare!");
    enemyTurn(list, act);
    resolve(list, act, ei);
  };

  const pickItem = (id: ItemId) => {
    hap("selection");
    if (left(id) <= 0) return;
    if (id === "vasetto") return tryCatch();
    setPending(id);
    setPhase("itemTarget");
  };

  const applyOn = (i: number) => {
    if (!pending) return;
    const kind = ITEMS[pending].kind;
    const c = cnd(P.current[i].uid);
    const r =
      kind === "cureConf"
        ? c.conf > 0 ? ((c.conf = 0), { ok: true, msg: `${monName(P.current[i])} non è più confuso! Recupera la lucidità.` }) : { ok: false, msg: `${monName(P.current[i])} non è confuso.` }
        : kind === "cureBurn"
          ? c.burn ? ((c.burn = false), { ok: true, msg: `${monName(P.current[i])} si rinfresca col gelato! Recupera dalla scottatura.` }) : { ok: false, msg: `${monName(P.current[i])} non è scottato.` }
          : applyItem(P.current[i], pending);
    if (!r.ok) {
      play([{ text: r.msg, php: me.hp, ehp: foe.hp }], () => setPhase("bag"));
      return;
    }
    used.current[pending] = (used.current[pending] ?? 0) + 1;
    const list: Step[] = [];
    snap(list, `Usi ${ITEMS[pending].name}! ${r.msg}`);
    if (i === act) list[list.length - 1].anim = "heal";
    setPending(null);
    enemyTurn(list, act);
    resolve(list, act, ei);
  };

  const switchTo = (i: number, forced: boolean) => {
    hap("selection");
    cond.current[P.current[act].uid] = { atk: 0, def: 0, spd: 0, conf: 0, burn: false };
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
      <Animated.View style={[styles.scene, sceneStyle]} onLayout={(e) => setScene({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <LinearGradient
          colors={setup.field === "beach" ? ["#1fb2ff", "#8fe6ff", "#ffe27a"] : ["#3cc3ff", "#a8f07a", "#22a94a"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.foeRow}>
          <View style={styles.infoBox} testID="battle-enemy-info">
            <PixelText style={styles.monName} numberOfLines={1}>{foe.shiny ? "✨" : ""}{monName(foe)}</PixelText>
            <PixelText style={styles.lv}>Lv{foe.lv} · {TYPES[SPECIES[foe.s].type].name}</PixelText>
            <HpBar hp={ehp} max={foeMax} testID="battle-enemy-hp" />
            {chips(foe, "battle-enemy-status", showing?.conds)}
          </View>
          <View style={styles.spriteWrap}>
            <View style={[styles.ground, setup.field === "beach" && styles.groundBeach]} />
            <Animated.View style={bobFoe}>
              <Breathe size={battleSize(foe.s, 112)}><PixelSprite name={foe.s} size={battleSize(foe.s, 112)} shiny={foe.shiny} testID="battle-enemy-sprite" /></Breathe>
            </Animated.View>
            {fxShow?.target === "foe" && <HitFx key={fxShow.k} type={fxShow.type} dmg={fxShow.dmg} crit={fxShow.crit} eff={fxShow.eff} />}
          </View>
        </View>
        <View style={styles.meRow}>
          <View style={styles.spriteWrap}>
            <View style={[styles.ground, setup.field === "beach" && styles.groundBeach]} />
            <Animated.View style={bobMe}>
              <Breathe size={battleSize(showing?.ps ?? me.s, 120)} delay={550}><PixelSprite name={showing?.ps ?? me.s} size={battleSize(showing?.ps ?? me.s, 120)} shiny={me.shiny} flip testID="battle-player-sprite" /></Breathe>
            </Animated.View>
            {fxShow?.target === "me" && <HitFx key={fxShow.k} type={fxShow.type} dmg={fxShow.dmg} crit={fxShow.crit} eff={fxShow.eff} />}
          </View>
          <View style={styles.infoBox} testID="battle-player-info">
            <PixelText style={styles.monName} numberOfLines={1}>{monName({ ...me, s: showing?.ps ?? me.s })}</PixelText>
            <PixelText style={styles.lv}>Lv{me.lv}</PixelText>
            <HpBar hp={php} max={meMax} testID="battle-player-hp" />
            {chips(me, "battle-player-status", showing?.conds)}
            <PixelText style={styles.hpText} testID="battle-player-hp-text">{php}/{meMax} PV</PixelText>
          </View>
        </View>
        {jar && (
          <Animated.View pointerEvents="none" style={[styles.jar, jarStyle]} testID="battle-jar">
            <PixelSprite name="vasetto" size={44} />
          </Animated.View>
        )}
        {!!healK && (
          <View pointerEvents="none" style={styles.healSpot}>
            <HealFx key={healK} label="+PV" />
          </View>
        )}
        <WeatherLayer weather={wx} w={scene.w} h={scene.h} />
        {wx && (
          <View pointerEvents="none" style={styles.wxTag} testID="battle-weather-tag">
            <PixelText style={styles.wxTxt}>{WEATHER[wx].label}</PixelText>
          </View>
        )}
        <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
        {evo && <EvolveScene key={evo.k} from={evo.from} to={evo.to} size={140} Sprite={(p) => <PixelSprite name={p.name} size={p.size} silhouette={p.silhouette} />} />}
      </Animated.View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
        {phase === "msg" && showing && (
          <Pressable testID="battle-message-box" onPress={advance} style={styles.msgBox}>
            <PixelText style={styles.msg}>{showing.text}</PixelText>
            <PixelText style={styles.next}>▼</PixelText>
          </Pressable>
        )}
        {phase === "qte" && qte && (
          <TimedCommand
            key={`${qte.mv}-${steps.length}-${si}`}
            moveName={qte.special ? "COLPO EMILIANO" : MOVES[qte.mv].name}
            guard
            onDone={(a, g) => runMove(qte.mv, a, g, qte.special)}
          />
        )}
        {phase === "menu" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <View style={styles.promptRow}>
              <PixelText style={[styles.prompt, { flex: 1 }]}>Cosa deve fare {monName(me)}?</PixelText>
            </View>
            <ChargeGauge value={charge.current} max={CHARGE_MAX} />
            <View style={styles.grid}>
              <Cmd label="Lotta" color={colors.brandPrimary} fg={colors.onBrandPrimary} testID="battle-cmd-fight" onPress={() => setPhase("moves")} />
              <Cmd label="Zaino" color={colors.brandSecondary} fg={colors.onBrandSecondary} testID="battle-cmd-bag" onPress={() => setPhase("bag")} />
              <Cmd label="Mostrelli" color={colors.brandTertiary} fg={colors.onBrandTertiary} testID="battle-cmd-switch" onPress={() => setPhase("switch")} />
              <Cmd label="Fuga" color={colors.surfaceTertiary} fg={colors.onSurface} testID="battle-cmd-flee" onPress={flee} />
            </View>
          </Animated.View>
        )}
        {phase === "moves" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            {charge.current >= CHARGE_MAX && (
              <Pressable testID="battle-special" onPress={() => doMove(bestMove(me), true)} style={({ pressed }) => [styles.special, pressed && { opacity: 0.8 }]}>
                <PixelText style={styles.specialTxt}>★ COLPO EMILIANO ★</PixelText>
                <PixelText style={styles.specialSub}>{MOVES[bestMove(me)].name} potenziata, colpisce sempre</PixelText>
              </Pressable>
            )}
            <View style={styles.grid}>
              {knownMoves(me).map((mv) => {
                const m = MOVES[mv];
                return (
                  <Pressable key={mv} testID={`battle-move-${mv}`} onPress={() => doMove(mv)} style={({ pressed }) => [styles.move, { borderLeftColor: TYPES[m.type].color, opacity: pressed ? 0.7 : 1 }]}>
                    <PixelText style={styles.moveName} numberOfLines={2}>{m.name}</PixelText>
                    <PixelText style={[styles.moveMeta, { color: TYPES[m.type].color }]}>{TYPES[m.type].name} · {m.power}</PixelText>
                    {m.fx && <PixelText style={styles.fxHint}>{m.fx.p}% {FX_LABEL[m.fx.k]}</PixelText>}
                  </Pressable>
                );
              })}
            </View>
            <Pressable testID="battle-moves-back" onPress={() => setPhase("menu")} style={styles.back}>
              <PixelText style={styles.backTxt}>‹ Indietro</PixelText>
            </Pressable>
          </Animated.View>
        )}
        {phase === "bag" && (
          <Animated.View entering={SlideInDown.duration(180)}>
            <PixelText style={styles.prompt}>Zaino</PixelText>
            <View style={styles.grid}>
              {(Object.keys(ITEMS) as ItemId[]).map((id) => (
                <Pressable key={id} testID={`battle-item-${id}`} disabled={left(id) <= 0} onPress={() => pickItem(id)} style={({ pressed }) => [styles.move, { borderLeftColor: colors.brandSecondary, opacity: left(id) <= 0 ? 0.4 : pressed ? 0.7 : 1 }]}>
                  <PixelText style={styles.moveName} numberOfLines={2}>{ITEMS[id].name}</PixelText>
                  <PixelText style={[styles.moveMeta, { color: colors.brandSecondary }]}>x{left(id)}</PixelText>
                </Pressable>
              ))}
            </View>
            <Pressable testID="battle-bag-back" onPress={() => setPhase("menu")} style={styles.back}>
              <PixelText style={styles.backTxt}>‹ Indietro</PixelText>
            </Pressable>
          </Animated.View>
        )}
        {phase === "itemTarget" && pending && (
          <Animated.View entering={SlideInDown.duration(180)} style={{ maxHeight: 260 }}>
            <PixelText style={styles.prompt}>Su chi usi {ITEMS[pending].name}?</PixelText>
            <ScrollView>
              {P.current.map((m, i) => (
                <Pressable key={m.uid} testID={`battle-item-target-${i}`} onPress={() => applyOn(i)} style={styles.swRow}>
                  <PixelSprite name={m.s} size={36} />
                  <View style={{ flex: 1 }}>
                    <PixelText style={styles.moveName}>{monName(m)} Lv{m.lv}</PixelText>
                    <HpBar hp={m.hp} max={stats(m).hp} />
                  </View>
                  <PixelText style={styles.lv}>{m.hp}/{stats(m).hp}</PixelText>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable testID="battle-item-target-back" onPress={() => { setPending(null); setPhase("bag"); }} style={styles.back}>
              <PixelText style={styles.backTxt}>‹ Indietro</PixelText>
            </Pressable>
          </Animated.View>
        )}
        {(phase === "switch" || phase === "forceSwitch") && (
          <Animated.View entering={SlideInDown.duration(180)} style={{ maxHeight: 260 }}>
            <PixelText style={styles.prompt}>{phase === "forceSwitch" ? "Chi mandi in campo?" : "Cambia mostrello"}</PixelText>
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
  scene: { flex: 1, justifyContent: "space-around", paddingHorizontal: 16, overflow: "hidden" },
  groundBeach: { backgroundColor: "#f2bd52", borderColor: "#c98f22" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong },
  chipTxt: { fontSize: 11, color: colors.onBrandPrimary },
  fxHint: { fontSize: 11, color: colors.muted, marginTop: 2 },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff8e1" },
  jar: { position: "absolute", left: 0, top: 0 },
  healSpot: { position: "absolute", left: 0, bottom: 20, width: 180, height: 180 },
  foeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoBox: { width: "48%", backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, padding: 10, gap: 4, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  monName: { fontSize: 15, color: colors.onSurface },
  lv: { fontSize: 12, color: colors.muted },
  hpText: { fontSize: 12, color: colors.onSurfaceSecondary, textAlign: "right" },
  spriteWrap: { alignItems: "center", justifyContent: "flex-end" },
  ground: { position: "absolute", bottom: -6, width: 130, height: 22, borderRadius: 999, backgroundColor: "#167a34", borderWidth: 2, borderColor: "#0f5a25" },
  panel: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 14, minHeight: 200 },
  msgBox: { minHeight: 150, borderRadius: 18, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, padding: 16, justifyContent: "space-between" },
  msg: { fontSize: 16, lineHeight: 24 },
  next: { alignSelf: "flex-end", color: colors.brandSecondary },
  prompt: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cmd: { width: "48.5%", height: 64, borderBottomWidth: 4, borderColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center", borderRadius: 18 },
  cmdTxt: { fontSize: 15, textTransform: "uppercase", letterSpacing: 1 },
  move: { width: "48.5%", minHeight: 64, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 6, backgroundColor: colors.surfaceSecondary, padding: 10, justifyContent: "center" },
  moveName: { fontSize: 13, fontFamily: FONT },
  moveMeta: { fontSize: 11, marginTop: 2 },
  back: { marginTop: 8, minHeight: 44, justifyContent: "center" },
  promptRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qteToggle: { minHeight: 32, paddingHorizontal: 8, justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  qteToggleTxt: { fontSize: 11, color: colors.brandSecondary },
  special: { minHeight: 56, marginBottom: 8, borderRadius: 14, borderWidth: 2, borderColor: colors.borderStrong, borderBottomWidth: 4, backgroundColor: "#f2c94c", alignItems: "center", justifyContent: "center", padding: 6 },
  specialTxt: { fontSize: 15, color: "#1a1a1a", letterSpacing: 1 },
  specialSub: { fontSize: 10, color: "#1a1a1a" },
  wxTag: { position: "absolute", top: 4, alignSelf: "center", paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "rgba(0,0,0,0.45)" },
  wxTxt: { fontSize: 11, color: "#ffffff" },
  backTxt: { color: colors.brandSecondary },
  swRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 6, backgroundColor: colors.surfaceSecondary },
});
