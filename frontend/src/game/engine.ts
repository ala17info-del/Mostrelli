import { EFF, ITEMS, ItemId, MAPS, MOVES, SPECIES } from "./data";

export type Mon = { uid: string; s: string; lv: number; xp: number; hp: number };

export const uid = () => Math.random().toString(36).slice(2, 10);

export function stats(m: { s: string; lv: number }) {
  const b = SPECIES[m.s];
  const f = (v: number) => Math.floor((v * 2 * m.lv) / 100) + 5;
  return { hp: Math.floor((b.hp * 2 * m.lv) / 100) + m.lv + 10, atk: f(b.atk), def: f(b.def), spd: f(b.spd) };
}

export function makeMon(s: string, lv: number): Mon {
  const m: Mon = { uid: uid(), s, lv, xp: lv ** 3, hp: 0 };
  m.hp = stats(m).hp;
  return m;
}

export function knownMoves(m: Mon): string[] {
  return SPECIES[m.s].moves.filter(([, l]) => l <= m.lv).map(([id]) => id).slice(-4);
}

export function effectiveness(moveType: string, defType: string): number {
  return (EFF as any)[moveType]?.[defType] ?? 1;
}

export const monName = (m: Mon) => SPECIES[m.s].name;

// Mutates def.hp; returns message lines.
export const stageMult = (st: number) => (st >= 0 ? (2 + st) / 2 : 2 / (2 - st));

export function attack(att: Mon, def: Mon, moveId: string, prefix = "", atkStage = 0, defStage = 0): string[] {
  const mv = MOVES[moveId];
  const lines = [`${prefix}${monName(att)} usa ${mv.name}!`];
  if (Math.random() * 100 > mv.acc) return [...lines, "Ma lo manca clamorosamente!"];
  const A0 = stats(att), D0 = stats(def);
  const A = { ...A0, atk: A0.atk * stageMult(atkStage) }, D = { ...D0, def: D0.def * stageMult(defStage) };
  const atkType = SPECIES[att.s].type, defType = SPECIES[def.s].type;
  const eff = effectiveness(mv.type, defType);
  const crit = Math.random() < 1 / 16 ? 1.5 : 1;
  const stab = mv.type === atkType ? 1.5 : 1;
  const base = Math.floor((Math.floor((2 * att.lv) / 5 + 2) * mv.power * A.atk) / D.def / 50) + 2;
  const dmg = Math.max(1, Math.floor(base * stab * eff * crit * (0.85 + Math.random() * 0.15)));
  def.hp = Math.max(0, def.hp - dmg);
  if (crit > 1) lines.push("Colpo critico!");
  if (eff > 1) lines.push("È superefficace!");
  if (eff < 1) lines.push("Non è molto efficace...");
  return lines;
}

export function xpReward(enemy: Mon, trainer: boolean) {
  return Math.floor((60 * enemy.lv) / 6 * (trainer ? 1.5 : 1));
}

// Mutates m; returns messages.
export function gainXp(m: Mon, amount: number): string[] {
  const out = [`${monName(m)} guadagna ${amount} punti esperienza!`];
  m.xp += amount;
  while (m.lv < 50 && m.xp >= (m.lv + 1) ** 3) {
    const before = knownMoves(m);
    const oldMax = stats(m).hp;
    m.lv += 1;
    m.hp = Math.min(stats(m).hp, m.hp + (stats(m).hp - oldMax));
    out.push(`${monName(m)} sale al livello ${m.lv}!`);
    for (const mv of knownMoves(m)) if (!before.includes(mv)) out.push(`${monName(m)} impara ${MOVES[mv].name}!`);
  }
  const evo = SPECIES[m.s].evo;
  if (evo && m.lv >= evo.lv) {
    const oldName = monName(m);
    const oldMax = stats(m).hp;
    out.push(`Cosa? ${oldName} si sta evolvendo!`);
    m.s = evo.to;
    m.hp = Math.min(stats(m).hp, m.hp + (stats(m).hp - oldMax));
    out.push(`Incredibile! ${oldName} è diventato ${monName(m)}!`);
  }
  return out;
}

export function catchChance(m: Mon) {
  const ratio = m.hp / stats(m).hp;
  return Math.min(0.95, SPECIES[m.s].catchRate * (1.1 - 0.8 * ratio) + 0.05);
}

export function healAll(party: Mon[]): Mon[] {
  return party.map((m) => ({ ...m, hp: stats(m).hp }));
}

export function rollWild(mapId: string): Mon {
  const table = MAPS[mapId].wild;
  const total = table.reduce((a, t) => a + t[3], 0);
  let r = Math.random() * total;
  for (const [s, min, max, w] of table) {
    if ((r -= w) <= 0) return makeMon(s, min + Math.floor(Math.random() * (max - min + 1)));
  }
  const [s, min] = table[0];
  return makeMon(s, min);
}

// Mutates m when the item can be used; returns { ok, msg }.
export function applyItem(m: Mon, id: ItemId): { ok: boolean; msg: string } {
  const it = ITEMS[id];
  const max = stats(m).hp;
  if (it.kind === "heal") {
    if (m.hp <= 0) return { ok: false, msg: `${monName(m)} è esausto: serve un Caffè Ristretto o un'osteria.` };
    if (m.hp >= max) return { ok: false, msg: `${monName(m)} è già sazio.` };
    const before = m.hp;
    m.hp = Math.min(max, m.hp + it.amount);
    return { ok: true, msg: `${monName(m)} mangia ${it.name} e recupera ${m.hp - before} PV!` };
  }
  if (it.kind === "revive") {
    if (m.hp > 0) return { ok: false, msg: `${monName(m)} è già sveglio, non esagerare col caffè.` };
    m.hp = Math.floor(max * it.amount);
    return { ok: true, msg: `${monName(m)} beve il Caffè Ristretto e riprende i sensi!` };
  }
  if (it.kind === "level") {
    if (m.lv >= 50) return { ok: false, msg: `${monName(m)} è già al livello massimo.` };
    const lines = gainXp(m, (m.lv + 1) ** 3 - m.xp);
    return { ok: true, msg: `${monName(m)} mangia la Caramella Rara! ${lines.join(" ")}` };
  }
  if (it.kind === "cureConf" || it.kind === "cureBurn") return { ok: false, msg: `${it.name} si usa solo durante le lotte.` };
  return { ok: false, msg: "Non si può usare qui." };
}
