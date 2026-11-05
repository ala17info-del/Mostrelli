def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

F = '/app/frontend/src/game/'
A = '/app/frontend/app/'

# ---------- Battle: dynamic effects
edit(F + 'Battle.tsx', [
('''import { applyItem,''', '''import { HitFx } from "./BattleFx";
import { applyItem,'''),
('''type Step = { text: string; php: number; ehp: number };''', '''type Fx = { target: "foe" | "me"; type: TypeId; dmg: number; crit: boolean; eff: number };
type Step = { text: string; php: number; ehp: number; fx?: Fx };'''),
('''import { ITEMS, ItemId, MOVES, SPECIES, TYPES } from "./data";''', '''import { ITEMS, ItemId, MOVES, SPECIES, TypeId, TYPES } from "./data";'''),
('''  const bobFoe = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value * -4 }] }));
  const bobMe = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - bob.value) * -4 }] }));''', '''  const foeX = useSharedValue(0);
  const meX = useSharedValue(0);
  const foeO = useSharedValue(1);
  const meO = useSharedValue(1);
  const flashO = useSharedValue(0);
  const [fxShow, setFxShow] = useState<(Fx & { k: number }) | null>(null);
  const bobFoe = useAnimatedStyle(() => ({ opacity: foeO.value, transform: [{ translateY: bob.value * -4 }, { translateX: foeX.value }, { translateY: -Math.abs(foeX.value) * 0.6 }] }));
  const bobMe = useAnimatedStyle(() => ({ opacity: meO.value, transform: [{ translateY: (1 - bob.value) * -4 }, { translateX: meX.value }, { translateY: -Math.abs(meX.value) * 0.6 }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashO.value }));'''),
('''  const cur = phase === "msg" ? steps[si]?.text : null;
  useEffect(() => {
    if (!cur) return;
    const k = sfxFor(cur);
    if (k) sfx(k);
    if (k === "hit") shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-4, { duration: 50 }), withTiming(0, { duration: 50 }));
  }, [cur, si, shake]);''', '''  const cur = phase === "msg" ? steps[si]?.text : null;
  const curFx = phase === "msg" ? steps[si]?.fx : undefined;
  useEffect(() => {
    if (!cur) return;
    const k = sfxFor(cur);
    if (k) sfx(k);
    if (/superefficace|Colpo critico/.test(cur)) {
      flashO.value = withSequence(withTiming(0.55, { duration: 60 }), withTiming(0, { duration: 260 }));
      shake.value = withSequence(withTiming(-14, { duration: 40 }), withTiming(14, { duration: 40 }), withTiming(-8, { duration: 40 }), withTiming(8, { duration: 40 }), withTiming(0, { duration: 40 }));
    }
    if (!curFx) return;
    const lungeAtt = curFx.target === "foe" ? meX : foeX;
    const blink = curFx.target === "foe" ? foeO : meO;
    lungeAtt.value = withSequence(withTiming(curFx.target === "foe" ? 28 : -28, { duration: 90 }), withTiming(0, { duration: 180 }));
    blink.value = withSequence(withTiming(1, { duration: 110 }), withTiming(0.1, { duration: 60 }), withTiming(1, { duration: 60 }), withTiming(0.1, { duration: 60 }), withTiming(1, { duration: 60 }));
    shake.value = withSequence(withTiming(-6, { duration: 50 }), withTiming(6, { duration: 50 }), withTiming(0, { duration: 50 }));
    setFxShow({ ...curFx, k: Date.now() });
  }, [cur, si, curFx, shake, flashO, meX, foeX, foeO, meO]);'''),
('''  const snap = (list: Step[], text: string, a = act, e = ei) => list.push({ text, php: P.current[a].hp, ehp: E.current[e].hp });''', '''  const snap = (list: Step[], text: string, a = act, e = ei) => list.push({ text, php: P.current[a].hp, ehp: E.current[e].hp });

  const hit = (list: Step[], att: Mon, def: Mon, mv: string, target: "foe" | "me", a: number, prefix = "") => {
    const before = def.hp;
    const lines = attack(att, def, mv, prefix);
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
  };'''),
('''    for (const t of attack(foeNow, P.current[a], mv, setup.kind === "wild" ? "Selvatico · " : "Nemico · ")) snap(list, t, a);''', '''    hit(list, foeNow, P.current[a], mv, "me", a, setup.kind === "wild" ? "Selvatico · " : "Nemico · ");'''),
('''      for (const t of attack(me, foe, mv)) snap(list, t);
      if (foe.hp > 0) enemyTurn(list, act);''', '''      hit(list, me, foe, mv, "foe", act);
      if (foe.hp > 0) enemyTurn(list, act);'''),
('''      if (me.hp > 0) for (const t of attack(me, foe, mv)) snap(list, t);''', '''      if (me.hp > 0) hit(list, me, foe, mv, "foe", act);'''),
('''              <PixelSprite name={foe.s} size={112} testID="battle-enemy-sprite" />
            </Animated.View>''', '''              <PixelSprite name={foe.s} size={112} testID="battle-enemy-sprite" />
            </Animated.View>
            {fxShow?.target === "foe" && <HitFx key={fxShow.k} type={fxShow.type} dmg={fxShow.dmg} crit={fxShow.crit} eff={fxShow.eff} />}'''),
('''              <PixelSprite name={me.s} size={120} flip testID="battle-player-sprite" />
            </Animated.View>''', '''              <PixelSprite name={me.s} size={120} flip testID="battle-player-sprite" />
            </Animated.View>
            {fxShow?.target === "me" && <HitFx key={fxShow.k} type={fxShow.type} dmg={fxShow.dmg} crit={fxShow.crit} eff={fxShow.eff} />}'''),
('''        </View>
      </Animated.View>

      <View style={[styles.panel''', '''        </View>
        <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
      </Animated.View>

      <View style={[styles.panel'''),
('''  groundBeach: { backgroundColor: "#d9bf86" },''', '''  groundBeach: { backgroundColor: "#d9bf86" },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff8e1" },'''),
])

# ---------- animated HP bar
edit(F + 'ui.tsx', [
('''import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";''', '''import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";'''),
('''  const c = r > 0.5 ? colors.success : r > 0.2 ? colors.warning : colors.error;
  return (
    <View testID={testID} style={styles.hpOuter}>
      <View style={{ width: `${r * 100}%`, height: "100%", backgroundColor: c }} />
    </View>
  );''', '''  const c = r > 0.5 ? colors.success : r > 0.2 ? colors.warning : colors.error;
  const w = useSharedValue(r);
  React.useEffect(() => {
    w.value = withTiming(r, { duration: 450 });
  }, [r, w]);
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View testID={testID} style={styles.hpOuter}>
      <Animated.View style={[{ height: "100%", backgroundColor: c }, st]} />
    </View>
  );'''),
])

# ---------- data: prices, Tonello
edit(F + 'data.ts', [
('name: "Vasetto di Vetro", price: 20,', 'name: "Vasetto di Vetro", price: 8,'),
('name: "Brodino Caldo", price: 15,', 'name: "Brodino Caldo", price: 5,'),
('name: "Tortellini in Brodo", price: 40,', 'name: "Tortellini in Brodo", price: 15,'),
('name: "Caffè Ristretto", price: 60,', 'name: "Caffè Ristretto", price: 25,'),
('''      { id: "og_loris",''', '''      { id: "og_tonello", x: 3, y: 3, name: "Tonello", look: L("#7b4a2a", "#fbc02d"), kind: "trainer", lines: ["Sono Tonello, campione di briscola del bar di Osteria Grande dal 1983! Al bar mi temono tutti, anche il barista.", "Tu hai la faccia di uno che ha appena finito di perdere a carte. Vediamo se coi mostri vai meglio!"], team: [["mortazzone", 8], ["cinghialotto", 8], ["passatellone", 9]], reward: 120, after: ["Mi hai battuto come un due di picche. Torno al bar a dire che ho vinto io, tanto nessuno controlla."] },
      { id: "og_loris",'''),
])

# ---------- game: money, dialogs, A button, caught evo, flush, money
edit(A + 'game.tsx', [
('''        n.money += npc.reward ?? 0;''', '''        n.money += (npc.reward ?? 0) * 2;'''),
('''      if (r.outcome === "lose") {''', '''      if (r.outcome === "win" && !npc) n.money += wildPay;
      for (const m of n.party) {
        if (!n.caught.includes(m.s)) n.caught = [...n.caught, m.s];
        if (!n.seen.includes(m.s)) n.seen = [...n.seen, m.s];
      }
      if (r.outcome === "lose") {'''),
('''        n.money = Math.floor(s.money / 2);''', '''        n.money = Math.floor(s.money * 0.75);'''),
('''    const npc = battle?.npc;''', '''    const npc = battle?.npc;
    const wildPay = 10 + (battle?.enemies[0]?.lv ?? 1) * 8;'''),
('''`Hai ricevuto ${npc.reward} €.`''', '''`Hai ricevuto ${(npc.reward ?? 0) * 2} €.`'''),
('''Hai perso metà dei soldi, ma la squadra è rimessa a nuovo.''', '''Hai perso un quarto dei soldi, ma la squadra è rimessa a nuovo.'''),
('''    setBattle(null);
    if (after) say(after.speaker, after.lines);''', '''    if (r.outcome === "win" && !npc) setToast(`+${wildPay} €`);
    setBattle(null);
    if (after) say(after.speaker, after.lines);'''),
('''    say(npc.name, npc.after ?? npc.lines);''', '''    say(npc.name, npc.after ? [npc.after[npc.after.length - 1]] : npc.lines);'''),
('''    setSave((p) => ({ ...p, money: p.money - price, items: { ...p.items, [id]: (p.items[id] ?? 0) + 1 } }));''', '''    setSave((p) => ({ ...p, money: p.money - price, items: { ...p.items, [id]: (p.items[id] ?? 0) + 1 } }));
    setTimeout(flush, 300);'''),
('''onPress={dialog ? undefined : interact}''', '''onPress={dialog ? advanceDialog : interact}'''),
('''            onPress={() => {
              hap("selection");
              if (dialog.idx < dialog.lines.length - 1) setDialog({ ...dialog, idx: dialog.idx + 1 });
              else {
                const done = dialog.onDone;
                setDialog(null);
                done?.();
              }
            }}''', '''            onPress={advanceDialog}'''),
('''  const onLayout = (e: LayoutChangeEvent)''', '''  function advanceDialog() {
    if (!dialog) return;
    hap("selection");
    if (dialog.idx < dialog.lines.length - 1) setDialog({ ...dialog, idx: dialog.idx + 1 });
    else {
      const done = dialog.onDone;
      setDialog(null);
      done?.();
    }
  }

  const onLayout = (e: LayoutChangeEvent)'''),
])

# ---------- team: flush after item
edit(A + 'team.tsx', [
('const { save, setSave } = useGame();', 'const { save, setSave, flush } = useGame();'),
('''      party: s.party.map((p, j) => (j === i ? copy : p)),
    }));''', '''      party: s.party.map((p, j) => (j === i ? copy : p)),
    }));
    setTimeout(flush, 300);'''),
])

# ---------- auth: skip /me without token
edit('/app/frontend/src/auth.tsx', [
('''  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => storage.secureRemove(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);''', '''  useEffect(() => {
    storage.secureGet<string | null>(TOKEN_KEY, null).then((t) => {
      if (!t) return setLoading(false);
      api<User>("/auth/me")
        .then(setUser)
        .catch(() => storage.secureRemove(TOKEN_KEY))
        .finally(() => setLoading(false));
    });
  }, []);'''),
])

# ---------- PixelSprite: Scale2x for finer pixels + cache
edit(F + 'PixelSprite.tsx', [
('''// Renders a pixel grid''', '''// Scale2x: doubles resolution with smoothed diagonals -> smaller, more detailed pixels.
function scale2x(g: string[]): string[] {
  const out: string[] = [];
  for (let y = 0; y < g.length; y++) {
    const row = g[y];
    let r1 = "", r2 = "";
    for (let x = 0; x < row.length; x++) {
      const E = row[x];
      const B = g[y - 1]?.[x] ?? E, H = g[y + 1]?.[x] ?? E, D = row[x - 1] ?? E, Fc = row[x + 1] ?? E;
      let e0 = E, e1 = E, e2 = E, e3 = E;
      if (B !== H && D !== Fc) {
        e0 = D === B ? D : E;
        e1 = B === Fc ? Fc : E;
        e2 = D === H ? D : E;
        e3 = H === Fc ? Fc : E;
      }
      r1 += e0 + e1;
      r2 += e2 + e3;
    }
    out.push(r1, r2);
  }
  return out;
}

const scaled = new Map<string, string[]>();
function gridFor(name: string, hi: boolean) {
  const g = SPRITES[name] ?? SPRITES.person;
  if (!hi) return g;
  let s = scaled.get(name);
  if (!s) {
    s = scale2x(g);
    scaled.set(name, s);
  }
  return s;
}

// Renders a pixel grid'''),
('''  const grid = SPRITES[name] ?? SPRITES.person;''', '''  const grid = gridFor(name, size >= 40);'''),
])

# ---------- TileMap: CURA / MARKET badges + shadows
edit(F + 'TileMap.tsx', [
('''import { PixelSprite } from "./PixelSprite";''', '''import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

import { PixelSprite } from "./PixelSprite";
import { PixelText } from "./ui";'''),
('''          {npc && (
            <View style={st.actor} testID={`npc-${npc.id}`}>
              <PixelSprite name="person" size={size} look={npc.look} />
            </View>
          )}''', '''          {(npc || isMe) && <View style={[st.shadow, { width: size * 0.7, height: size * 0.18, left: size * 0.15, top: size * 0.82 }]} />}
          {npc && (
            <View style={st.actor} testID={`npc-${npc.id}`}>
              <PixelSprite name="person" size={size} look={npc.look} />
            </View>
          )}
          {npc && (npc.kind === "heal" || npc.kind === "shop") && (
            <View style={[st.badge, { top: -size * 0.42, backgroundColor: npc.kind === "heal" ? "#2e7d32" : "#fbc02d" }]} testID={`marker-${npc.kind}-${npc.id}`}>
              <MaterialDesignIcons name={npc.kind === "heal" ? "heart-plus" : "cart"} size={11} color={npc.kind === "heal" ? "#ffffff" : "#1a1a1a"} />
              <PixelText style={[st.badgeTxt, { color: npc.kind === "heal" ? "#ffffff" : "#1a1a1a" }]}>{npc.kind === "heal" ? "CURA" : "MARKET"}</PixelText>
            </View>
          )}
          {npc && (npc.kind === "trainer" || npc.kind === "boss") && (
            <View style={[st.badge, { top: -size * 0.42, backgroundColor: npc.kind === "boss" ? "#c0392b" : "#424242" }]}>
              <MaterialDesignIcons name={npc.kind === "boss" ? "crown" : "sword-cross"} size={11} color="#ffffff" />
            </View>
          )}'''),
('''  actor: { position: "absolute", left: 0, top: 0 },''', '''  actor: { position: "absolute", left: 0, top: 0 },
  shadow: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.25)" },
  badge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 3, paddingVertical: 1, borderWidth: 1, borderColor: "#1a1a1a" },
  badgeTxt: { fontSize: 8, lineHeight: 11 },'''),
])

# ---------- TileArt: finer detail
edit(F + 'TileArt.tsx', [
('''function Grass({ s, hv }: { s: number; hv: number }) {
  const u = s / 8;
  return (
    <>''', '''function Grass({ s, hv }: { s: number; hv: number }) {
  const u = s / 8;
  const f = s / 16;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const v = (hv >> (i * 5)) & 1023;
        return (
          <React.Fragment key={i}>
            <Px l={((v % 13) + 1) * f} t={(((v >> 4) % 12) + 2) * f} w={f} h={f} c="#4e8a26" />
            <Px l={((v % 13) + 2) * f} t={(((v >> 4) % 12) + 1) * f} w={f} h={f} c="#5f9a2e" />
          </React.Fragment>
        );
      })}
      <Px l={((hv >> 13) % 14) * f} t={((hv >> 17) % 14) * f} w={f} h={f} c="#b6dd78" />'''),
('''    case ".":
      inner = (
        <>''', '''    case ".":
      inner = (
        <>
          {[0, 1, 2].map((i) => {
            const v = (hv >> (i * 6)) & 1023;
            return (
              <React.Fragment key={i}>
                <Px l={((v % 13) + 1) * (s / 16)} t={(((v >> 4) % 13) + 1) * (s / 16)} w={s / 16} h={s / 16} c="#b89464" />
                <Px l={((v % 13) + 1) * (s / 16)} t={(((v >> 4) % 13) + 2) * (s / 16)} w={s / 16} h={s / 16} c="#f0dcb4" />
              </React.Fragment>
            );
          })}'''),
('''          <Px l={u * 2.2} t={u * 1.5} w={u} h={u * 0.8} c="#56b04f" />''', '''          <Px l={u * 2.2} t={u * 1.5} w={u} h={u * 0.8} c="#56b04f" />
          <Px l={u * 4.6} t={u * 1.4} w={u * 0.5} h={u * 0.5} c="#2e8b3a" />
          <Px l={u * 5.4} t={u * 2.6} w={u * 0.5} h={u * 0.5} c="#17502a" />
          <Px l={u * 2.6} t={u * 3.6} w={u * 0.5} h={u * 0.5} c="#17502a" />
          <Px l={u * 4.2} t={u * 3.9} w={u * 0.5} h={u * 0.5} c="#17502a" />
          <Px l={u * 1.4} t={u * 2.8} w={u * 0.5} h={u * 0.5} c="#3a9a44" />'''),
('''          {ch === "O" && hv % 4 === 0 && <Px l={u * 6} t={u} w={u * 0.8} h={u * 0.8} c="#ffffff" />}''', '''          {ch === "O" && hv % 4 === 0 && <Px l={u * 6} t={u} w={u * 0.8} h={u * 0.8} c="#ffffff" />}
          <Px l={u * 2 + off / 2} t={u * 3.8} w={u * 0.5} h={u * 0.5} c="#b8ecef" />
          <Px l={u * 6 - off / 2} t={u * 7} w={u * 0.5} h={u * 0.5} c="#b8ecef" />'''),
])
print("ok")
