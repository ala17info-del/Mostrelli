def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

F = '/app/frontend/src/game/'
A = '/app/frontend/app/'

# ---------------- data
edit(F + 'data.ts', [
('''  ombra: { name: "Ombra di Prima Fila"''', '''  tagliatella: { name: "Frusta di Tagliatella", type: "sugo", power: 55, acc: 95, fx: { k: "atkDown", p: 20 } },
  bollicine: { name: "Bollicine Frizzanti", type: "terme", power: 50, acc: 100, fx: { k: "confuse", p: 20 } },
  clacson: { name: "Clacson Insistente", type: "motore", power: 55, acc: 95, fx: { k: "spdDown", p: 30 } },
  zucca: { name: "Zucca Rotolante", type: "campi", power: 60, acc: 95 },
  pettegolezzo: { name: "Pettegolezzo di Paese", type: "chiacchiera", power: 50, acc: 100, fx: { k: "defDown", p: 50 } },
  nebbiafitta: { name: "Nebbia Fitta", type: "nebbia", power: 60, acc: 95, fx: { k: "selfDefUp", p: 30 } },
  ombra: { name: "Ombra di Prima Fila"'''),
('''];
export const SPECIES: Record''', '''  sp({ id: "crescentino", num: 27, name: "Crescentino", type: "sugo", hp: 55, atk: 55, def: 55, spd: 50, catchRate: 0.6, moves: [["sberla", 1], ["ragu", 1], ["tagliatella", 12], ["brodo", 18]], desc: "Crescentina fritta e gonfia d'orgoglio. Senza mortadella accanto si sente nuda." }),
  sp({ id: "lambruschino", num: 28, name: "Lambruschino", type: "terme", hp: 50, atk: 55, def: 50, spd: 65, catchRate: 0.5, moves: [["fango", 1], ["bollicine", 8], ["vapore", 14], ["onda", 22]], desc: "Goccia frizzante dei colli. Dopo un bicchiere diventa amico di tutti." }),
  sp({ id: "canalino", num: 29, name: "Canalino", type: "terme", hp: 50, atk: 60, def: 55, spd: 60, catchRate: 0.4, moves: [["fango", 1], ["bollicine", 1], ["onda", 18], ["nebbiafitta", 22]], desc: "Anguilla dei canali nascosti di Bologna. Spunta dalla finestrella e ti spaventa." }),
  sp({ id: "scooterone", num: 30, name: "Scooterone", type: "motore", hp: 55, atk: 65, def: 55, spd: 75, catchRate: 0.45, moves: [["rombo", 1], ["clacson", 10], ["sgommata", 16], ["girovel", 22]], desc: "Motorino da lungomare. Due persone sopra, tre borse frigo e nessun casco." }),
  sp({ id: "cappellaccio", num: 31, name: "Cappellaccio", type: "campi", hp: 60, atk: 55, def: 60, spd: 45, catchRate: 0.45, moves: [["grappolo", 1], ["zucca", 10], ["vendemmia", 16], ["trattore", 22]], desc: "Pasta ripiena di zucca ferrarese. Guai a chiamarla tortello: si offende." }),
  sp({ id: "zuppone", num: 32, name: "Zuppone", type: "chiacchiera", hp: 65, atk: 50, def: 60, spd: 40, catchRate: 0.5, moves: [["sberla", 1], ["pettegolezzo", 8], ["chiacchierata", 14], ["lamentela", 20]], desc: "Zuppa inglese a strati. Sa tutti i fatti del paese, e li racconta tutti." }),
];
export const SPECIES: Record'''),
('''  caffe: { name: "Caffè Ristretto",''', '''  digestivo: { name: "Digestivo della Casa", price: 10, kind: "cureConf", amount: 0, desc: "Cura la confusione. Solo in lotta. Fatto dallo zio, non chiedere cosa c'è dentro." },
  gelato: { name: "Gelato Artigianale", price: 10, kind: "cureBurn", amount: 0, desc: "Cura le scottature. Solo in lotta. Gusto crema, il più serio." },
  caffe: { name: "Caffè Ristretto",'''),
('''["portichino", 6, 6, 1]]''', '''["portichino", 6, 6, 1], ["crescentino", 3, 5, 2], ["canalino", 5, 5, 1]]'''),
('''["piadinone", 6, 6, 1]]''', '''["piadinone", 6, 6, 1], ["crescentino", 5, 7, 2], ["zuppone", 6, 7, 2]]'''),
('''["passatellone", 9, 9, 2]]''', '''["passatellone", 9, 9, 2], ["lambruschino", 8, 10, 2], ["zuppone", 8, 10, 2]]'''),
('''["biciclone", 12, 13, 1]]''', '''["biciclone", 12, 13, 1], ["lambruschino", 11, 13, 2], ["scooterone", 12, 13, 1]]'''),
('''["biciclone", 14, 16, 2]]''', '''["biciclone", 14, 16, 2], ["cappellaccio", 14, 16, 2], ["canalino", 14, 16, 1]]'''),
('''["ombrellone", 19, 22, 2]]''', '''["ombrellone", 19, 22, 2], ["scooterone", 18, 21, 2]]'''),
])

# ---------------- sprites
edit(F + 'sprites.ts', [
('''  person_back: [''', '''  crescentino: ["............", "..kkkkkkkk..", ".keeoeeoeek.", "keeeeeeeeeek", "kewnkeekwnek", "keeeeeeeeeek", "keeerrrreeek", "keoeeeeeeoek", ".keeeeeeeek.", "..kkkkkkkk..", "............", "............"],
  lambruschino: [".....kk.....", "....kmmk....", "...kmmmmk...", "..kmmwmmmk..", ".kmmmmmmmmk.", ".kmwnmmwnmk.", "kmmmmmmmmmmk", "kmmmPPPPmmmk", "kmwmmmmmmwmk", ".kmmmmmmmmk.", "..kkkkkkkk..", "c..c....c..c"],
  canalino: ["............", "......kkkk..", ".....kggggk.", "....kgwngggk", "...kggggkkk.", "..kgggk.....", ".kgggk......", ".kgggk......", "..kgggkk....", "...kggggkk..", "cccccccccccc", ".cccccccccc."],
  scooterone: ["............", "........kk..", ".......kSk..", "..kkkkkkSk..", ".krrrrrrrk..", "krrwrrrrrrk.", "krrnrrrrrrrk", "kkkkkkkkkkkk", ".kSk....kSk.", "kSnSk..kSnSk", ".kSk....kSk.", "............"],
  cappellaccio: ["............", "....kkkk....", "...kooook...", "..kooyyook..", ".kooooooook.", "koownoownook", "kooooooooook", "kooorrrroook", ".kooooooook.", "..kkkkkkkk..", "....gg......", "............"],
  zuppone: ["............", "...kkkkkk...", "..kppppppk..", ".kppwppwppk.", ".kppnppnppk.", ".keeeeeeeek.", ".kyyyyyyyyk.", ".kPPPPPPPPk.", ".kppkkkkppk.", ".kppppppppk.", "..kkkkkkkk..", "............"],
  vasetto: ["............", "...kkkkkk...", "...kSSSSk...", "..kkkkkkkk..", "..kcwcccck..", ".kcwcccccck.", ".kcwcccccck.", ".kcccccccck.", ".kcccccccck.", "..kccccck...", "...kkkkkk...", "............"],
  person_back: ['''),
])

# ---------------- engine
edit(F + 'engine.ts', [
('''  return { ok: false, msg: "Non si può usare qui." };''', '''  if (it.kind === "cureConf" || it.kind === "cureBurn") return { ok: false, msg: `${it.name} si usa solo durante le lotte.` };
  return { ok: false, msg: "Non si può usare qui." };'''),
])

# ---------------- BattleFx: heal effect
s = open(F + 'BattleFx.tsx').read()
s += '''
function Spark({ i }: { i: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 900 + (i % 4) * 120, easing: Easing.out(Easing.quad) });
  }, [p, i]);
  const x = ((i * 37) % 80) - 40;
  const st = useAnimatedStyle(() => ({
    opacity: p.value < 0.7 ? 1 : (1 - p.value) * 3.3,
    transform: [{ translateX: x + Math.sin(p.value * 6 + i) * 6 }, { translateY: 30 - 90 * p.value }, { rotate: "45deg" }],
  }));
  return <Animated.View style={[styles.particle, { width: i % 3 ? 6 : 10, height: i % 3 ? 6 : 10, backgroundColor: ["#66bb6a", "#ffffff", "#b9f6ca", "#fbc02d"][i % 4] }, st]} />;
}

export function HealFx({ label }: { label?: string }) {
  const g = useSharedValue(0);
  useEffect(() => {
    g.value = withTiming(1, { duration: 1100 });
  }, [g]);
  const glow = useAnimatedStyle(() => ({ opacity: g.value < 0.3 ? g.value * 2 : (1 - g.value) * 0.85, transform: [{ scale: 0.6 + g.value * 0.8 }] }));
  return (
    <View pointerEvents="none" style={styles.wrap} testID="heal-fx">
      <Animated.View style={[styles.glow, glow]} />
      {Array.from({ length: 16 }).map((_, i) => (
        <Spark key={i} i={i} />
      ))}
      {!!label && <Animated.Text style={[styles.dmg, { color: "#b9f6ca" }, glow]}>{label}</Animated.Text>}
    </View>
  );
}
'''
s = s.replace('''  particle: { position: "absolute" },''', '''  particle: { position: "absolute" },
  glow: { position: "absolute", width: 110, height: 110, borderRadius: 999, backgroundColor: "#66bb6a" },''')
open(F + 'BattleFx.tsx', 'w').write(s)

# ---------------- Battle
edit(F + 'Battle.tsx', [
('''type Step = { text: string; php: number; ehp: number; fx?: Fx; conds?: CondSnap };''', '''type Step = { text: string; php: number; ehp: number; fx?: Fx; conds?: CondSnap; anim?: "throw" | "caught" | "fail" | "heal" };'''),
('''import { HitFx } from "./BattleFx";''', '''import { HealFx, HitFx } from "./BattleFx";'''),
('''withRepeat, withSequence, withTiming } from "react-native-reanimated";''', '''withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";'''),
('''  const flashO = useSharedValue(0);''', '''  const flashO = useSharedValue(0);
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
  }));'''),
('''  const bobFoe = useAnimatedStyle(() => ({ opacity: foeO.value, transform: [''', '''  const bobFoe = useAnimatedStyle(() => ({ opacity: foeO.value, transform: [{ scale: foeScale.value }, '''),
('''    if (!curFx) {
      setFxShow(null);
      return;
    }''', '''    const an = steps[si]?.anim;
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
    }'''),
('''    snap(list, "Lanci un Vasetto di Vetro...");''', '''    snap(list, "Lanci un Vasetto di Vetro...");
    list[list.length - 1].anim = "throw";'''),
('''      snap(list, `Preso! ${monName(foe)} è nel vasetto. Chiudi bene il coperchio!`);''', '''      snap(list, `Preso! ${monName(foe)} è nel vasetto. Chiudi bene il coperchio!`);
      list[list.length - 1].anim = "caught";'''),
('''    snap(list, `Accidenti! ${monName(foe)} è uscito dal vasetto!`);''', '''    snap(list, `Accidenti! ${monName(foe)} è uscito dal vasetto!`);
    list[list.length - 1].anim = "fail";'''),
('''    if (!pending) return;
    const r = applyItem(P.current[i], pending);''', '''    if (!pending) return;
    const kind = ITEMS[pending].kind;
    const c = cnd(P.current[i].uid);
    const r =
      kind === "cureConf"
        ? c.conf > 0 ? ((c.conf = 0), { ok: true, msg: `${monName(P.current[i])} non è più confuso! Recupera la lucidità.` }) : { ok: false, msg: `${monName(P.current[i])} non è confuso.` }
        : kind === "cureBurn"
          ? c.burn ? ((c.burn = false), { ok: true, msg: `${monName(P.current[i])} si rinfresca col gelato! Recupera dalla scottatura.` }) : { ok: false, msg: `${monName(P.current[i])} non è scottato.` }
          : applyItem(P.current[i], pending);'''),
('''    snap(list, `Usi ${ITEMS[pending].name}! ${r.msg}`);''', '''    snap(list, `Usi ${ITEMS[pending].name}! ${r.msg}`);
    if (i === act) list[list.length - 1].anim = "heal";'''),
('''      <Animated.View style={[styles.scene, sceneStyle]}>''', '''      <Animated.View style={[styles.scene, sceneStyle]} onLayout={(e) => setScene({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>'''),
('''        <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />''', '''        {jar && (
          <Animated.View pointerEvents="none" style={[styles.jar, jarStyle]} testID="battle-jar">
            <PixelSprite name="vasetto" size={44} />
          </Animated.View>
        )}
        {!!healK && (
          <View pointerEvents="none" style={styles.healSpot}>
            <HealFx key={healK} label="+PV" />
          </View>
        )}
        <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />'''),
('''  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff8e1" },''', '''  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff8e1" },
  jar: { position: "absolute", left: 0, top: 0 },
  healSpot: { position: "absolute", left: 0, bottom: 20, width: 180, height: 180 },'''),
])

# ---------------- TileMap smooth walking
edit(F + 'TileMap.tsx', [
('''import React, { useEffect, useState } from "react";''', '''import React, { useEffect, useRef, useState } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";'''),
('''  defeated: string[];
};''', '''  defeated: string[];
  stepMs?: number;
};'''),
('''export function TileMap({ map, px, py, dir, cols, rows, size, defeated }: Props) {''', '''export function TileMap({ map, px, py, dir, cols, rows, size, defeated, stepMs = 170 }: Props) {'''),
('''  const npcAt: Record''', '''  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const plX = useSharedValue((px - cx + hx) * size);
  const plY = useSharedValue((py - cy + hy) * size);
  const prev = useRef({ cx, cy, px, py, id: map.id });
  useEffect(() => {
    const p = prev.current;
    const jump = p.id !== map.id || Math.abs(px - p.px) + Math.abs(py - p.py) > 1;
    const dx = cx - p.cx, dy = cy - p.cy;
    prev.current = { cx, cy, px, py, id: map.id };
    const ease = { duration: stepMs, easing: Easing.linear };
    const tx = (px - cx + hx) * size, ty = (py - cy + hy) * size;
    if (jump) {
      camX.value = 0;
      camY.value = 0;
      plX.value = tx;
      plY.value = ty;
      return;
    }
    if (dx || dy) {
      camX.value = dx * size;
      camY.value = dy * size;
      camX.value = withTiming(0, ease);
      camY.value = withTiming(0, ease);
    }
    plX.value = withTiming(tx, ease);
    plY.value = withTiming(ty, ease);
  }, [cx, cy, px, py, map.id, size, hx, hy, stepMs, camX, camY, plX, plY]);
  const camStyle = useAnimatedStyle(() => ({ transform: [{ translateX: camX.value }, { translateY: camY.value }] }));
  const plStyle = useAnimatedStyle(() => ({ transform: [{ translateX: plX.value }, { translateY: plY.value }] }));
  const npcAt: Record'''),
('''  for (let r = 0; r < rows; r++) {''', '''  for (let r = -1; r <= rows; r++) {'''),
('''    for (let c = 0; c < cols; c++) {''', '''    for (let c = -1; c <= cols; c++) {'''),
('''      const isMe = x === px && y === py;
''', ''''''),
('''{(npc || isMe) && <View style={[st.shadow''', '''{npc && <View style={[st.shadow'''),
('''          {isMe && (
            <View style={st.actor} testID="player-sprite">
              <PixelSprite name={playerSprite} size={size} flip={dir === "left"} />
            </View>
          )}''', ''''''),
('''  return <View testID="tile-map">{out}</View>;''', '''  return (
    <View testID="tile-map" style={{ width: cols * size, height: rows * size, overflow: "hidden" }}>
      <Animated.View style={[{ position: "absolute", left: -size, top: -size }, camStyle]}>{out}</Animated.View>
      <Animated.View style={[st.actor, plStyle]} testID="player-sprite">
        <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />
        <PixelSprite name={playerSprite} size={size} flip={dir === "left"} />
      </Animated.View>
    </View>
  );'''),
])

# ---------------- GameContext pending duel
edit(F + 'GameContext.tsx', [
('''  loadError: boolean;
  reload: () => void;
};''', '''  loadError: boolean;
  reload: () => void;
  duel: Duel | null;
  setDuel: (d: Duel | null) => void;
};
export type Duel = { code: string; name: string; party: Mon[] };'''),
('''  const [loadError, setLoadError] = useState(false);''', '''  const [loadError, setLoadError] = useState(false);
  const [duel, setDuel] = useState<Duel | null>(null);'''),
('''reset, loadError, reload: load }}''', '''reset, loadError, reload: load, duel, setDuel }}'''),
])
print("ok")
