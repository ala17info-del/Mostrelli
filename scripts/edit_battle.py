p = '/app/frontend/src/game/Battle.tsx'
s = open(p).read()
R = [
('''import React, { useRef, useState } from "react";''', '''import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";'''),
('''import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";''', '''import Animated, { FadeIn, SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";'''),
('''import { MOVES, SPECIES, TYPES } from "./data";
import { attack, catchChance, gainXp, knownMoves, Mon, monName, stats, xpReward } from "./engine";''', '''import { sfx, SfxName } from "./audio";
import { ITEMS, ItemId, MOVES, SPECIES, TYPES } from "./data";
import { applyItem, attack, catchChance, gainXp, knownMoves, Mon, monName, stats, xpReward } from "./engine";'''),
('''export type BattleSetup = { kind: "wild" | "trainer"; enemies: Mon[]; trainerName?: string };''', '''export type BattleSetup = { kind: "wild" | "trainer"; enemies: Mon[]; trainerName?: string; field?: "grass" | "beach" };'''),
('''  vasettiUsed: number;
};''', '''  itemsUsed: Partial<Record<ItemId, number>>;
};

function sfxFor(text: string): SfxName | null {
  if (/ usa /.test(text)) return "hit";
  if (/si sta evolvendo|è diventato/.test(text)) return "evolve";
  if (/sale al livello/.test(text)) return "levelup";
  if (/^Preso!/.test(text)) return "catch";
  if (/uscito dal vasetto/.test(text)) return "fail";
  if (/recupera|riprende i sensi/.test(text)) return "heal";
  return null;
}'''),
('''type Phase = "msg" | "menu" | "moves" | "switch" | "forceSwitch";''', '''type Phase = "msg" | "menu" | "moves" | "switch" | "forceSwitch" | "bag" | "itemTarget";'''),
('''export function Battle({ setup, party: initialParty, vasetti, onEnd }: { setup: BattleSetup; party: Mon[]; vasetti: number; onEnd: (r: BattleResult) => void }) {''', '''export function Battle({ setup, party: initialParty, items, onEnd }: { setup: BattleSetup; party: Mon[]; items: Partial<Record<ItemId, number>>; onEnd: (r: BattleResult) => void }) {'''),
('''  const used = useRef(0);''', '''  const used = useRef<Partial<Record<ItemId, number>>>({});
  const left = (id: ItemId) => (items[id] ?? 0) - (used.current[id] ?? 0);
  const [pending, setPending] = useState<ItemId | null>(null);
  const shake = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [bob]);
  const sceneStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const bobFoe = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value * -4 }] }));
  const bobMe = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - bob.value) * -4 }] }));'''),
('''vasettiUsed: used.current });''', '''itemsUsed: used.current });'''),
('''  const advance = () => {''', '''  const cur = phase === "msg" ? steps[si]?.text : null;
  useEffect(() => {
    if (!cur) return;
    const k = sfxFor(cur);
    if (k) sfx(k);
    if (k === "hit") shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-4, { duration: 50 }), withTiming(0, { duration: 50 }));
  }, [cur, si, shake]);

  const advance = () => {'''),
('''    if (vasetti - used.current <= 0) {''', '''    if (left("vasetto") <= 0) {'''),
('''    used.current += 1;''', '''    used.current.vasetto = (used.current.vasetto ?? 0) + 1;'''),
('''  const switchTo = (i: number, forced: boolean) => {''', '''  const pickItem = (id: ItemId) => {
    hap("selection");
    if (left(id) <= 0) return;
    if (id === "vasetto") return tryCatch();
    setPending(id);
    setPhase("itemTarget");
  };

  const applyOn = (i: number) => {
    if (!pending) return;
    const r = applyItem(P.current[i], pending);
    if (!r.ok) {
      play([{ text: r.msg, php: me.hp, ehp: foe.hp }], () => setPhase("bag"));
      return;
    }
    used.current[pending] = (used.current[pending] ?? 0) + 1;
    const list: Step[] = [];
    snap(list, `Usi ${ITEMS[pending].name}! ${r.msg}`);
    setPending(null);
    enemyTurn(list, act);
    resolve(list, act, ei);
  };

  const switchTo = (i: number, forced: boolean) => {'''),
('''      <View style={styles.scene}>''', '''      <Animated.View style={[styles.scene, sceneStyle]}>
        <LinearGradient
          colors={setup.field === "beach" ? ["#7fc8e0", "#bfe6ef", "#f0d9a0"] : ["#9fd0a0", "#5f9a4e", "#2f5d34"]}
          style={StyleSheet.absoluteFill}
        />'''),
('''            <View style={styles.ground} />
            <PixelSprite name={foe.s} size={112} testID="battle-enemy-sprite" />''', '''            <View style={[styles.ground, setup.field === "beach" && styles.groundBeach]} />
            <Animated.View style={bobFoe}>
              <PixelSprite name={foe.s} size={112} testID="battle-enemy-sprite" />
            </Animated.View>'''),
('''            <View style={styles.ground} />
            <PixelSprite name={me.s} size={120} flip testID="battle-player-sprite" />''', '''            <View style={[styles.ground, setup.field === "beach" && styles.groundBeach]} />
            <Animated.View style={bobMe}>
              <PixelSprite name={me.s} size={120} flip testID="battle-player-sprite" />
            </Animated.View>'''),
('''        </View>
      </View>

      <View style={[styles.panel''', '''        </View>
      </Animated.View>

      <View style={[styles.panel'''),
('''              <Cmd label={`Cattura (${vasetti - used.current})`} color={colors.brandSecondary} fg={colors.onBrandSecondary} testID="battle-cmd-catch" onPress={tryCatch} />''', '''              <Cmd label="Zaino" color={colors.brandSecondary} fg={colors.onBrandSecondary} testID="battle-cmd-bag" onPress={() => setPhase("bag")} />'''),
('''        {(phase === "switch" || phase === "forceSwitch") && (''', '''        {phase === "bag" && (
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
        {(phase === "switch" || phase === "forceSwitch") && ('''),
('''  scene: { flex: 1, justifyContent: "space-around", paddingHorizontal: 16, backgroundColor: "#2f5d34" },''', '''  scene: { flex: 1, justifyContent: "space-around", paddingHorizontal: 16, overflow: "hidden" },
  groundBeach: { backgroundColor: "#d9bf86" },'''),
]
for a, b in R:
    assert a in s, a[:70]
    s = s.replace(a, b)
open(p, 'w').write(s)
print("battle ok")
