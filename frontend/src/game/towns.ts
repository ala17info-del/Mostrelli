// Life in town: every door leads inside (house, osteria, shop or bar) with local people to talk to,
// each town has a side quest, and street lamps line the roads (they light up at night).
import type { GameMap, ItemId, Npc, Species } from "./data";
import { N_HOME } from "./bestiary";
import { localHello, localTalk } from "./dialects";

export type Quest = {
  id: string;
  kind: "catch" | "visit" | "wins";
  target: string | number;
  reward: { money: number; item?: [ItemId, number] };
  ask: string[];
  remind: string;
  thanks: string;
};

const BLOCK = new Set(["T", "W", "R", "H", "D", "B", "S", "O", "U", "X", "K", "M", "N", "J", "I", "=", "%", "&", "^", "!"]);
const ROAD = new Set([".", "C", "A", "P"]);
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Tiles where the player lands when entering each map (from any other map). */
let arrivals: Record<string, Set<string>> = {};
export function computeArrivals(maps: Record<string, GameMap>) {
  arrivals = {};
  for (const m of Object.values(maps)) for (const e of m.exits) (arrivals[e.to] ??= new Set()).add(`${e.tx},${e.ty}`);
}

/** Tiles reachable from the first exit (exits count as open). */
// Crowds, hedges and boulders can be cleared later: for lamps they count as open ground, so a lamp is
// never planted in front of a secret corner. (findSpot keeps people out of those corners.)
const CLEARABLE = new Set(["%", "&", "^"]);
function reachable(m: GameMap, rows: string[][], throughObstacles = true) {
  const occ = new Set(m.npcs.map((n) => `${n.x},${n.y}`));
  const ex = new Set(m.exits.map((e) => `${e.x},${e.y}`));
  const H = rows.length, W = rows[0].length;
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && (ex.has(`${x},${y}`) || ((!BLOCK.has(rows[y][x]) || (throughObstacles && CLEARABLE.has(rows[y][x]))) && !occ.has(`${x},${y}`)));
  const start = m.exits[0];
  const seen = new Set<string>();
  if (!start) return seen;
  const q = [[start.x, start.y]];
  seen.add(`${start.x},${start.y}`);
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of D4) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && open(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
    }
  }
  return seen;
}

/** Everything that must stay reachable: exits, NPC fronts, signs, pickups. */
function keyPoints(m: GameMap): string[][] {
  const pts: string[][] = [];
  for (const e of m.exits) pts.push([`${e.x},${e.y}`]);
  for (const n of m.npcs) pts.push(D4.map(([dx, dy]) => `${n.x + dx},${n.y + dy}`));
  for (const k of Object.keys(m.signs)) { const [x, y] = k.split(",").map(Number); pts.push(D4.map(([dx, dy]) => `${x + dx},${y + dy}`)); }
  for (const p of m.pickups ?? []) pts.push([`${p.x},${p.y}`]);
  for (const a of arrivals[m.id] ?? []) pts.push([a]);
  return pts;
}

/** Would putting something solid on (x, y) keep every important spot reachable? */
export function canBlock(m: GameMap, x: number, y: number, extraNpc = false): boolean {
  const rows = m.tiles.map((r) => r.split(""));
  if (BLOCK.has(rows[y][x]) || m.exits.some((e) => e.x === x && e.y === y) || arrivals[m.id]?.has(`${x},${y}`)) return false;
  if (m.npcs.some((n) => n.x === x && n.y === y) || (m.pickups ?? []).some((p) => p.x === x && p.y === y)) return false;
  // Keep the arrival tile of every door into this map free too.
  const before = reachable(m, rows);
  rows[y][x] = extraNpc ? rows[y][x] : "I";
  const probe: GameMap = extraNpc ? { ...m, npcs: [...m.npcs, { id: "_", x, y } as Npc] } : m;
  const after = reachable(probe, rows);
  return keyPoints(probe).every((alts) => !alts.some((k) => before.has(k)) || alts.some((k) => after.has(k)));
}

/** A free spot for a person near the middle of the map that blocks nothing important. */
export function findSpot(m: GameMap, avoid: string[] = []): [number, number] | null {
  const H = m.tiles.length, W = m.tiles[0].length;
  const cells: [number, number][] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) cells.push([x, y]);
  cells.sort((a, b) => Math.abs(a[0] - 7.5) + Math.abs(a[1] - 7.5) - (Math.abs(b[0] - 7.5) + Math.abs(b[1] - 7.5)));
  const open = reachable(m, m.tiles.map((r) => r.split("")), false);
  for (const [x, y] of cells) {
    if (avoid.includes(`${x},${y}`) || ROAD.has(m.tiles[y][x]) || !open.has(`${x},${y}`)) continue;
    if (canBlock(m, x, y, true)) return [x, y];
  }
  return null;
}

/** Street lamps on grass next to roads, a few per map, never closing a path. */
function placeLamps(m: GameMap) {
  const H = m.tiles.length, W = m.tiles[0].length;
  const lamps: [number, number][] = [];
  const seed = hashStr(m.id);
  for (let y = 1; y < H - 1 && lamps.length < 6; y++) {
    for (let x = 1; x < W - 1 && lamps.length < 6; x++) {
      if (m.tiles[y][x] !== ",") continue;
      if (!D4.some(([dx, dy]) => ROAD.has(m.tiles[y + dy]?.[x + dx] ?? ""))) continue;
      if ((x * 3 + y * 5 + seed) % 4 !== 0) continue;
      if (lamps.some(([lx, ly]) => Math.abs(lx - x) + Math.abs(ly - y) < 4)) continue;
      if (!canBlock(m, x, y)) continue;
      m.tiles[y] = m.tiles[y].slice(0, x) + "I" + m.tiles[y].slice(x + 1);
      lamps.push([x, y]);
    }
  }
}

type Kind = "casa" | "osteria" | "bottega" | "bar";
const KIND_NAME: Record<Kind, string> = { casa: "Casa", osteria: "Osteria", bottega: "Bottega", bar: "Bar della Piazza" };
const LOOKS: [string, string][] = [["#c0392b", "#1565c0"], ["#2e7d32", "#fbc02d"], ["#7b4a2a", "#ffffff"], ["#1a1a1a", "#e0913a"], ["#8e24aa", "#4caf50"], ["#616161", "#c0392b"], ["#fbc02d", "#2e7d32"], ["#cfd8dc", "#7b1f3a"]];
const PEOPLE = ["Nonna", "Nonno", "Zia", "Zio", "Signora", "Signor", "Ragazza", "Ragazzo"];
const HER = ["Iolanda", "Loredana", "Marisa", "Graziella", "Vanda", "Rosanna", "Liliana", "Nives", "Ornella", "Gianna"];
const HIM = ["Gino", "Ivano", "Ermes", "Learco", "Oriano", "Tonino", "Secondo", "Dino", "Romeo", "Valter"];
/** "Nonna Iolanda", "Zio Ermes"...: the first name always matches the title. */
function personName(k: number) {
  const title = PEOPLE[k % PEOPLE.length];
  const female = ["Nonna", "Zia", "Signora", "Ragazza"].includes(title);
  const list = female ? HER : HIM;
  return `${title} ${list[Math.floor(k / 8) % list.length]}`;
}

function interiorTiles(kind: Kind, n: number): string[] {
  const rows = Array.from({ length: 16 }, (_, y) => (y < 2 || y === 15 ? "N".repeat(16) : "N" + "L".repeat(14) + "N").split(""));
  rows[15][7] = "L";
  for (let y = 9; y < 15; y++) rows[y][7] = "V";
  const put = (x: number, y: number, c: string) => { rows[y][x] = c; };
  if (kind === "osteria" || kind === "bar") { [2, 3, 12, 13].forEach((x) => put(x, 2, "K")); put(2, 12, "K"); put(13, 12, "K"); }
  if (kind === "bottega") { [3, 4, 5, 10, 11, 12].forEach((x) => put(x, 4, "M")); put(2, 13, "K"); put(13, 13, "K"); }
  if (kind === "casa") { put(2, 2, "K"); put(13, 2, "K"); if (n % 2) { put(3, 11, "V"); put(4, 11, "V"); put(11, 11, "V"); put(12, 11, "V"); } }
  return rows.map((r) => r.join(""));
}

export function buildTowns(maps: Record<string, GameMap>, species: Species[]) {
  const byProv: Record<string, string[]> = {};
  for (const m of Object.values(maps)) if (m.terrain && !m.fraz) (byProv[m.prov ?? "BO"] ??= []).push(m.id);
  const evoTargets = new Set(species.map((s) => s.evo?.to).filter(Boolean) as string[]);
  const outdoor = Object.values(maps).filter((m) => !m.interior && m.id !== "acetaia" && m.id !== "mercato");

  for (const m of outdoor) {
    const prov = m.prov ?? "BO";
    const seed = hashStr(m.id);
    const hasHeal = m.npcs.some((n) => n.kind === "heal");
    const hasShop = m.npcs.some((n) => n.kind === "shop");
    let doorNo = 0;
    const made: { id: string; kind: Kind; n: number }[] = [];
    for (let y = 0; y < m.tiles.length; y++) {
      for (let x = 0; x < m.tiles[0].length; x++) {
        if (m.tiles[y][x] !== "D" || m.exits.some((e) => e.x === x && e.y === y)) continue;
        const below = m.tiles[y + 1]?.[x];
        if (!below || BLOCK.has(below) || m.npcs.some((n) => n.x === x && n.y === y + 1)) continue;
        const n = seed + doorNo * 97;
        // Small places get the osteria (healer) and the bottega (shop) they lack outside.
        const kind: Kind = doorNo === 0 ? (hasHeal ? "casa" : "osteria") : doorNo === 1 ? (hasShop ? (n % 3 ? "casa" : "bar") : "bottega") : n % 4 === 0 ? "bar" : "casa";
        const id = `${m.id}__${x}_${y}`;
        const npcs: Npc[] = [];
        const look = (k: number) => ({ A: LOOKS[k % LOOKS.length][0], C: LOOKS[k % LOOKS.length][1] });
        const person = personName;
        if (kind === "osteria") npcs.push({ id: `${id}_oste`, x: 7, y: 4, name: `Oste di ${m.name}`, look: look(n), kind: "heal", lines: [localHello(prov, n), "Siediti, che ti porto un piatto caldo. La tua squadra sembra stanca morta.", "Ecco fatto: tutti in forma. Torna quando vuoi!"] });
        if (kind === "bottega") npcs.push({ id: `${id}_bottega`, x: 7, y: 5, name: `Bottegaio di ${m.name}`, look: look(n + 1), kind: "shop", lines: [localHello(prov, n + 1), "Vasetti, brodini, tortellini: qui c'è tutto quello che serve per il viaggio."] });
        // Locals to chat with.
        const talkers = kind === "casa" ? 2 : 1;
        for (let t = 0; t < talkers; t++) {
          const k = n + t * 31;
          npcs.push({ id: `${id}_p${t}`, x: t === 0 ? 4 : 11, y: kind === "bottega" ? 8 : 7, name: person(k), look: look(k), kind: "talk", lines: localTalk(prov, k) });
        }
        made.push({ id, kind, n });
        maps[id] = {
          id, name: `${KIND_NAME[kind]}${kind === "casa" ? ` a ${m.name}` : kind === "bar" ? ` · ${m.name}` : ` di ${m.name}`}`,
          tiles: interiorTiles(kind, n), exits: [{ x: 7, y: 15, to: m.id, tx: x, ty: y + 1 }], heal: { x: 7, y: 13 }, wild: [],
          music: m.music, npcs, signs: {}, prov, interior: true,
        };
        m.exits.push({ x, y, to: id, tx: 7, ty: 14 });
        doorNo++;
      }
    }
    // One side quest per place with buildings: in a house or bar if there is one, else anywhere inside.
    const host = made.find((d) => d.kind === "casa" || d.kind === "bar") ?? made[0];
    if (host) {
      const q = makeQuest(m, prov, host.n, maps, byProv, species, evoTargets);
      const k = host.n + 5;
      if (q) maps[host.id].npcs.push({ id: `${host.id}_quest`, x: 10, y: 11, name: personName(k), look: { A: LOOKS[k % LOOKS.length][0], C: LOOKS[k % LOOKS.length][1] }, kind: "quest", lines: q.ask, quest: q });
    }
  }
  computeArrivals(maps);
  for (const m of outdoor) placeLamps(m);
}

function makeQuest(m: GameMap, prov: string, n: number, maps: Record<string, GameMap>, byProv: Record<string, string[]>, species: Species[], evoTargets: Set<string>): Quest | null {
  const lv = m.wild[0]?.[1] ?? 10;
  const reward = { money: 60 + lv * 25, item: (n % 5 === 0 ? ["caramella", 1] : n % 2 ? ["tortellini", 2] : ["vasetto", 4]) as [ItemId, number] };
  const id = `q_${m.id}`;
  const hello = localHello(prov, n);
  const kind = n % 3;
  if (kind === 0) {
    const local = species.filter((s) => !evoTargets.has(s.id) && N_HOME[s.id]?.includes(prov));
    const pool = local.length ? local : m.wild.map((w) => species.find((s) => s.id === w[0])!).filter(Boolean);
    const sp = pool[n % pool.length];
    if (!sp) return null;
    return { id, kind: "catch", target: sp.id, reward, ask: [hello, `Da bambino avevo un ${sp.name}. Me ne fai vedere uno? Catturalo e torna da me.`], remind: `Allora, l'hai trovato un ${sp.name}? Mi manca tanto...`, thanks: `Un ${sp.name}! Mi hai fatto tornare bambino. Grazie di cuore.` };
  }
  if (kind === 1) {
    const others = (byProv[prov] ?? []).filter((x) => x !== m.id);
    const t = others[n % Math.max(1, others.length)];
    if (!t) return null;
    return { id, kind: "visit", target: t, reward, ask: [hello, `Mia sorella abita a ${maps[t].name}. Vai a trovarla per me e poi torna a dirmi come sta?`], remind: `Sei già passato da ${maps[t].name}? Mia sorella ti aspetta.`, thanks: `Sta bene? Che sollievo! Tieni, te lo sei meritato.` };
  }
  const wins = 3 + (n % 4);
  return { id, kind: "wins", target: wins, reward, ask: [hello, `Sei un allenatore? Dimostralo: vinci ${wins} lotte e torna a raccontarmelo.`], remind: `Mancano ancora delle vittorie. Forza, che la giornata è lunga!`, thanks: `${wins} vittorie! Sei proprio bravo. Ecco il premio promesso.` };
}
