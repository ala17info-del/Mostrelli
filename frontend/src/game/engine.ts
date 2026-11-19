import { SHINY_CHANCE, SHINY_FEAST_MULT, todaySagra } from "./events";
import { EFF, ITEMS, ItemId, MAPS, MOVES, SPECIES } from "./data";

/** shiny: a "cromatico", same Mostrello in rare colours. rare: met in its evolved form in the wild. */
export type Mon = { uid: string; s: string; lv: number; xp: number; hp: number; shiny?: boolean; rare?: boolean };

/** Highest level a Mostrello can reach. */
export const MAX_LV = 100;
/** Total experience needed for a level: the classic cube up to 50, then a gentler curve to 100
 *  (each level after 50 costs 1000 + 30 per level above 50), so level 100 is reachable. */
export function xpFor(lv: number) {
  if (lv <= 50) return lv ** 3;
  const k = lv - 50;
  return 125000 + 1000 * k + 15 * k * (k + 1);
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function stats(m: { s: string; lv: number }) {
  const b = SPECIES[m.s];
  const f = (v: number) => Math.floor((v * 2 * m.lv) / 100) + 5;
  return { hp: Math.floor((b.hp * 2 * m.lv) / 100) + m.lv + 10, atk: f(b.atk), def: f(b.def), spd: f(b.spd) };
}

export function makeMon(s: string, lv: number): Mon {
  const m: Mon = { uid: uid(), s, lv, xp: xpFor(lv), hp: 0 };
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
/** Name with a sparkle for cromatici. */
export const monLabel = (m: Mon) => `${m.shiny ? "✨" : ""}${SPECIES[m.s].name}`;

// Mutates def.hp; returns message lines.
export const stageMult = (st: number) => (st >= 0 ? (2 + st) / 2 : 2 / (2 - st));

/** Timed commands: how well a player struck or guarded. */
export type Grade = "perfetto" | "buono" | "mancato";
export const ATK_MULT: Record<Grade, number> = { perfetto: 1.35, buono: 1.15, mancato: 1 };
export const GUARD_MULT: Record<Grade, number> = { perfetto: 0.5, buono: 0.75, mancato: 1 };

/** Extra battle modifiers: timing bonus or guard (mult), weather (accMod), the special move (sure, critBoost). */
export type AttackOpts = { mult?: number; accMod?: number; sure?: boolean; critBoost?: number };

export function attack(att: Mon, def: Mon, moveId: string, prefix = "", atkStage = 0, defStage = 0, opts: AttackOpts = {}): string[] {
  const mv = MOVES[moveId];
  const lines = [`${prefix}${monName(att)} usa ${mv.name}!`];
  if (!opts.sure && Math.random() * 100 > mv.acc + (opts.accMod ?? 0)) return [...lines, "Ma lo manca clamorosamente!"];
  const A0 = stats(att), D0 = stats(def);
  const A = { ...A0, atk: A0.atk * stageMult(atkStage) }, D = { ...D0, def: D0.def * stageMult(defStage) };
  const atkType = SPECIES[att.s].type, defType = SPECIES[def.s].type;
  const eff = effectiveness(mv.type, defType);
  const crit = Math.random() < 1 / 16 + (opts.critBoost ?? 0) ? 1.5 : 1;
  const stab = mv.type === atkType ? 1.5 : 1;
  const base = Math.floor((Math.floor((2 * att.lv) / 5 + 2) * mv.power * A.atk) / D.def / 50) + 2;
  const dmg = Math.max(1, Math.floor(base * stab * eff * crit * (opts.mult ?? 1) * (0.85 + Math.random() * 0.15)));
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
  while (m.lv < MAX_LV && m.xp >= xpFor(m.lv + 1)) {
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

/** boost: extra levels for wild Mostrelli (after the story they grow stronger). */
export function rollWild(mapId: string, boost = 0): Mon {
  const sagra = todaySagra();
  const feast = sagra.map === mapId;
  let table = MAPS[mapId].wild;
  // At the feast, Mostrelli of the feast type come out more often.
  if (feast) table = table.map(([s, a, b, w]) => [s, a, b, SPECIES[s].type === sagra.type ? w * 3 : w] as [string, number, number, number]);
  const h = new Date().getHours();
  if (h >= 21 || h < 6) table = table.map(([s, a, b, w]) => [s, a, b, ["nebbia", "chiacchiera"].includes(SPECIES[s].type) ? w * 2 : w] as [string, number, number, number]);
  const total = table.reduce((a, t) => a + t[3], 0);
  let r = Math.random() * total;
  let pick: [string, number] = [table[0][0], table[0][1]];
  for (const [s, min, max, w] of table) {
    if ((r -= w) <= 0) { pick = [s, min + Math.floor(Math.random() * (max - min + 1))]; break; }
  }
  let [sp, lv] = pick;
  let rare = false;
  // Rare: 3% of the time the evolved form shows up already (a little stronger).
  const evo = SPECIES[sp].evo;
  if (evo && SPECIES[evo.to] && Math.random() < 0.03) { sp = evo.to; lv += 2; rare = true; }
  const m = makeMon(sp, Math.min(MAX_LV, lv + boost));
  if (Math.random() < SHINY_CHANCE * (feast ? SHINY_FEAST_MULT : 1)) m.shiny = true;
  if (rare) m.rare = true;
  return m;
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
    if (m.lv >= MAX_LV) return { ok: false, msg: `${monName(m)} è già al livello massimo.` };
    const lines = gainXp(m, xpFor(m.lv + 1) - m.xp);
    return { ok: true, msg: `${monName(m)} mangia la Caramella Rara! ${lines.join(" ")}` };
  }
  if (it.kind === "cureConf" || it.kind === "cureBurn") return { ok: false, msg: `${it.name} si usa solo durante le lotte.` };
  return { ok: false, msg: "Non si può usare qui." };
}
