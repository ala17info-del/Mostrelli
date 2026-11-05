def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

F = '/app/frontend/src/game/'

# ---------- data: move effects
FX = {
    "chiacchierata": ("confuse", 30), "lamentela": ("defDown", 40), "ragu": ("burn", 20), "brodo": ("burn", 30),
    "forno": ("burn", 20), "fango": ("spdDown", 40), "vapore": ("defDown", 30), "sauna": ("atkDown", 30),
    "grappolo": ("atkDown", 30), "vendemmia": ("selfAtkUp", 30), "trattore": ("defDown", 30), "rombo": ("selfSpdUp", 40),
    "sgommata": ("spdDown", 30), "girovel": ("selfSpdUp", 30), "foschia": ("spdDown", 50), "nebbione": ("confuse", 30),
    "puntura": ("defDown", 30), "onda": ("spdDown", 30), "musica": ("confuse", 30), "furto": ("atkDown", 30), "ombra": ("selfDefUp", 40),
}
p = F + 'data.ts'
s = open(p).read()
s = s.replace('export type Move = { name: string; type: TypeId; power: number; acc: number };', '''export type FxKind = "atkDown" | "defDown" | "spdDown" | "confuse" | "burn" | "selfAtkUp" | "selfDefUp" | "selfSpdUp";
export type Move = { name: string; type: TypeId; power: number; acc: number; fx?: { k: FxKind; p: number } };
export const FX_LABEL: Record<FxKind, string> = {
  atkDown: "ATT nemico giù", defDown: "DIF nemica giù", spdDown: "VEL nemica giù", confuse: "Confonde",
  burn: "Scotta", selfAtkUp: "Tuo ATT su", selfDefUp: "Tua DIF su", selfSpdUp: "Tua VEL su",
};''')
import re
for k, (kind, pr) in FX.items():
    pat = re.compile(r'(\n  ' + k + r': \{[^\n]*?acc: \d+) \},')
    assert pat.search(s), k
    s = pat.sub(lambda m: m.group(1) + f', fx: {{ k: "{kind}", p: {pr} }} }},', s, count=1)
open(p, 'w').write(s)

# ---------- engine: stat stage modifiers
edit(F + 'engine.ts', [
('''export function attack(att: Mon, def: Mon, moveId: string, prefix = ""): string[] {''', '''export const stageMult = (st: number) => (st >= 0 ? (2 + st) / 2 : 2 / (2 - st));

export function attack(att: Mon, def: Mon, moveId: string, prefix = "", atkStage = 0, defStage = 0): string[] {'''),
('''  const A = stats(att), D = stats(def);''', '''  const A0 = stats(att), D0 = stats(def);
  const A = { ...A0, atk: A0.atk * stageMult(atkStage) }, D = { ...D0, def: D0.def * stageMult(defStage) };'''),
])

# ---------- Battle: conditions
edit(F + 'Battle.tsx', [
('''import { ITEMS, ItemId, MOVES, SPECIES, TypeId, TYPES } from "./data";''', '''import { FX_LABEL, ITEMS, ItemId, MOVES, SPECIES, TypeId, TYPES } from "./data";'''),
('''import { applyItem, attack, catchChance,''', '''import { applyItem, attack, stageMult, catchChance,'''),
('''  if (/recupera|riprende i sensi/.test(text)) return "heal";''', '''  if (/recupera|riprende i sensi/.test(text)) return "heal";
  if (/cala!|è confuso|si scotta|si colpisce da solo/.test(text)) return "fail";
  if (/aumenta!/.test(text)) return "levelup";'''),
('''  const hit = (list: Step[], att: Mon, def: Mon, mv: string, target: "foe" | "me", a: number, prefix = "") => {
    const before = def.hp;
    const lines = attack(att, def, mv, prefix);''', '''  const hit = (list: Step[], att: Mon, def: Mon, mv: string, target: "foe" | "me", a: number, prefix = "") => {
    const ca = cnd(att.uid), cd = cnd(def.uid);
    if (ca.conf > 0) {
      ca.conf -= 1;
      snap(list, `${prefix}${monName(att)} è confuso...`, a);
      if (Math.random() < 0.33) {
        att.hp = Math.max(0, att.hp - Math.max(1, Math.floor(stats(att).hp / 10)));
        snap(list, `Si colpisce da solo per la confusione!`, a);
        burnTick(list, att, a);
        return;
      }
      if (ca.conf === 0) snap(list, `${monName(att)} si è ripreso dalla confusione!`, a);
    }
    const before = def.hp;
    const lines = attack(att, def, mv, prefix, ca.atk, cd.def);'''),
('''          eff: lines.includes("È superefficace!") ? 2 : lines.includes("Non è molto efficace...") ? 0.5 : 1,
        };
      }
    });
  };''', '''          eff: lines.includes("È superefficace!") ? 2 : lines.includes("Non è molto efficace...") ? 0.5 : 1,
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
        const n = monName(who);
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

  const effSpd = (m: Mon) => stats(m).spd * stageMult(cnd(m.uid).spd);'''),
('''    const meFirst = stats(me).spd >= stats(foe).spd;''', '''    const meFirst = effSpd(me) >= effSpd(foe);'''),
('''    if (meFirst) {
      hit(list, me, foe, mv, "foe", act);
      if (foe.hp > 0) enemyTurn(list, act);
    } else {
      enemyTurn(list, act);
      if (me.hp > 0) hit(list, me, foe, mv, "foe", act);
    }''', '''    if (meFirst) {
      hit(list, me, foe, mv, "foe", act);
      if (foe.hp > 0 && me.hp > 0) enemyTurn(list, act);
    } else {
      enemyTurn(list, act);
      if (me.hp > 0 && foe.hp > 0) hit(list, me, foe, mv, "foe", act);
    }'''),
('''    hap("selection");
    setAct(i);''', '''    hap("selection");
    cond.current[P.current[act].uid] = { atk: 0, def: 0, spd: 0, conf: 0, burn: false };
    setAct(i);'''),
('''  const used = useRef<Partial<Record<ItemId, number>>>({});''', '''  const used = useRef<Partial<Record<ItemId, number>>>({});
  type Cond = { atk: number; def: number; spd: number; conf: number; burn: boolean };
  const cond = useRef<Record<string, Cond>>({});
  const cnd = (uid: string) => cond.current[uid] ?? (cond.current[uid] = { atk: 0, def: 0, spd: 0, conf: 0, burn: false });
  const chips = (m: Mon, tid: string) => {
    const c = cond.current[m.uid];
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
  };'''),
('''            <HpBar hp={ehp} max={foeMax} testID="battle-enemy-hp" />''', '''            <HpBar hp={ehp} max={foeMax} testID="battle-enemy-hp" />
            {chips(foe, "battle-enemy-status")}'''),
('''            <HpBar hp={php} max={meMax} testID="battle-player-hp" />''', '''            <HpBar hp={php} max={meMax} testID="battle-player-hp" />
            {chips(me, "battle-player-status")}'''),
('''                    <PixelText style={[styles.moveMeta, { color: TYPES[m.type].color }]}>{TYPES[m.type].name} · {m.power}</PixelText>''', '''                    <PixelText style={[styles.moveMeta, { color: TYPES[m.type].color }]}>{TYPES[m.type].name} · {m.power}</PixelText>
                    {m.fx && <PixelText style={styles.fxHint}>{m.fx.p}% {FX_LABEL[m.fx.k]}</PixelText>}'''),
('''  groundBeach: { backgroundColor: "#d9bf86" },''', '''  groundBeach: { backgroundColor: "#d9bf86" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: colors.onSurface },
  chipTxt: { fontSize: 9, color: colors.onBrandPrimary },
  fxHint: { fontSize: 9, color: colors.muted, marginTop: 2 },'''),
])
print("ok")
