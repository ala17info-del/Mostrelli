// Deterministic resolution of one live-duel turn. Both clients run the same code with the
// same seed from the server, so they reach the same result without the server knowing the rules.
import { ITEMS, ItemId, MOVES, TypeId } from "./data";
import { applyItem, attack, knownMoves, Mon, monName, stageMult, stats } from "./engine";

export type Side = "host" | "guest";
export type LiveAct = { kind: "move" | "switch" | "item"; move?: string; idx?: number; item?: ItemId };
export type TurnEntry = { turn: number; host: LiveAct; guest: LiveAct; seed: number };
type Cond = { atk: number; def: number; spd: number; conf: number; burn: boolean };
export type DuelState = { P: Record<Side, Mon[]>; act: Record<Side, number>; cond: Record<string, Cond>; winner: Side | "draw" | null };
export type DLine = { text: string; hp: Record<Side, number>; act: Record<Side, number>; fx?: { target: Side; type: TypeId; dmg: number; crit: boolean; eff: number }; heal?: Side; used?: { side: Side; item: ItemId } };

export const other = (s: Side): Side => (s === "host" ? "guest" : "host");
const SIDES: Side[] = ["host", "guest"];

export function initDuel(host: Mon[], guest: Mon[]): DuelState {
  const full = (p: Mon[]) => p.map((m) => ({ ...m, hp: stats(m).hp }));
  return { P: { host: full(host), guest: full(guest) }, act: { host: 0, guest: 0 }, cond: {}, winner: null };
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveTurn(st: DuelState, e: TurnEntry, names: Record<Side, string>): DLine[] {
  const real = Math.random;
  Math.random = mulberry32(e.seed);
  try {
    return run(st, e, names);
  } finally {
    Math.random = real;
  }
}

function run(st: DuelState, e: TurnEntry, names: Record<Side, string>): DLine[] {
  const out: DLine[] = [];
  const cur = (s: Side) => st.P[s][st.act[s]];
  const cnd = (s: Side, m: Mon) => st.cond[`${s}:${m.uid}`] ?? (st.cond[`${s}:${m.uid}`] = { atk: 0, def: 0, spd: 0, conf: 0, burn: false });
  const clear = (s: Side) => delete st.cond[`${s}:${cur(s).uid}`];
  const push = (text: string, extra: Partial<DLine> = {}) => out.push({ text, hp: { host: cur("host").hp, guest: cur("guest").hp }, act: { ...st.act }, ...extra });
  const nm = (s: Side, m = cur(s)) => `${monName(m)} di ${names[s]}`;

  // 1. Switches and items happen before attacks.
  for (const s of SIDES) {
    const a = e[s];
    if (a.kind === "switch") {
      const i = a.idx ?? -1;
      const m = st.P[s][i];
      if (!m || m.hp <= 0 || i === st.act[s]) continue;
      const old = monName(cur(s));
      clear(s);
      st.act[s] = i;
      push(`${names[s]} richiama ${old} e manda in campo ${monName(m)}!`);
    }
    if (a.kind === "item" && a.item) {
      const m = st.P[s][a.idx ?? -1];
      if (!m) continue;
      const kind = ITEMS[a.item].kind;
      const c = cnd(s, m);
      const r =
        kind === "cureConf" ? (c.conf > 0 ? ((c.conf = 0), { ok: true, msg: `${monName(m)} non è più confuso!` }) : { ok: false, msg: `${monName(m)} non era confuso.` })
        : kind === "cureBurn" ? (c.burn ? ((c.burn = false), { ok: true, msg: `${monName(m)} si rinfresca col gelato!` }) : { ok: false, msg: `${monName(m)} non era scottato.` })
        : applyItem(m, a.item);
      push(`${names[s]} usa ${ITEMS[a.item].name}! ${r.msg}`, r.ok ? { used: { side: s, item: a.item }, ...(m === cur(s) ? { heal: s } : {}) } : {});
    }
  }

  // 2. Attacks, fastest first.
  const spd = (s: Side) => stats(cur(s)).spd * stageMult(cnd(s, cur(s)).spd);
  const movers = SIDES.filter((s) => e[s].kind === "move");
  if (movers.length === 2 && (spd("guest") > spd("host") || (spd("guest") === spd("host") && Math.random() < 0.5))) movers.reverse();
  for (const s of movers) {
    const att = cur(s), def = cur(other(s));
    if (att.hp <= 0 || def.hp <= 0) continue;
    const known = knownMoves(att);
    const mv = known.includes(e[s].move ?? "") ? e[s].move! : known[0];
    hit(s, att, def, mv);
  }

  function hit(s: Side, att: Mon, def: Mon, mv: string) {
    const o = other(s);
    const ca = cnd(s, att), cd = cnd(o, def);
    if (ca.conf > 0) {
      ca.conf -= 1;
      push(`${nm(s)} è confuso...`);
      if (Math.random() < 0.33) {
        att.hp = Math.max(0, att.hp - Math.max(1, Math.floor(stats(att).hp / 10)));
        push("Si colpisce da solo per la confusione!");
        burnTick(s, att);
        return;
      }
      if (ca.conf === 0) push(`${monName(att)} si è ripreso dalla confusione!`);
    }
    const before = def.hp;
    const lines = attack(att, def, mv, `${names[s]} · `, ca.atk, cd.def);
    const dmg = before - def.hp;
    lines.forEach((t, i) => {
      const fx = i === 0 && dmg > 0
        ? { target: o, type: MOVES[mv].type, dmg, crit: lines.includes("Colpo critico!"), eff: lines.includes("È superefficace!") ? 2 : lines.includes("Non è molto efficace...") ? 0.5 : 1 }
        : undefined;
      push(t, fx ? { fx } : {});
    });
    const fx = MOVES[mv].fx;
    if (fx && !lines.some((l) => l.includes("manca")) && Math.random() * 100 < fx.p) {
      const self = fx.k.startsWith("self");
      const ws = self ? s : o;
      const who = self ? att : def;
      const c = self ? ca : cd;
      if (who.hp > 0) {
        const bump = (key: "atk" | "def" | "spd", d: number, label: string) => {
          if ((d < 0 && c[key] <= -3) || (d > 0 && c[key] >= 3)) push(`${label} di ${nm(ws, who)} non può cambiare oltre!`);
          else {
            c[key] += d;
            push(`${label} di ${nm(ws, who)} ${d < 0 ? "cala!" : "aumenta!"}`);
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
          push(`${nm(ws, who)} è confuso da tutte quelle chiacchiere!`);
        }
        if (fx.k === "burn" && !c.burn) {
          c.burn = true;
          push(`${nm(ws, who)} si scotta! Perderà PV ogni turno.`);
        }
      }
    }
    burnTick(s, att);
  }

  function burnTick(s: Side, m: Mon) {
    if (!cnd(s, m).burn || m.hp <= 0) return;
    m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(stats(m).hp / 12)));
    push(`${monName(m)} si scotta ancora... che bruciore!`);
  }

  // 3. Fainted monsters are replaced automatically by the next one still standing.
  const lost: Side[] = [];
  for (const s of SIDES) {
    if (cur(s).hp > 0) continue;
    push(`${nm(s)} è esausto!`);
    const next = st.P[s].findIndex((m) => m.hp > 0);
    if (next < 0) lost.push(s);
    else {
      clear(s);
      st.act[s] = next;
      push(`${names[s]} manda in campo ${monName(cur(s))}!`);
    }
  }
  if (lost.length === 2) {
    st.winner = "draw";
    push("Entrambe le squadre sono esauste: pareggio! Si offre da bere a tutti.");
  } else if (lost.length === 1) {
    st.winner = other(lost[0]);
    push(`${names[st.winner]} vince la sfida in diretta!`);
  }
  return out;
}
