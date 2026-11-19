// World map layout: every outdoor place gets a grid position following the exits, so the map reads
// like the game: leave Bologna to the east and the next place is drawn to the right of Bologna.
import { GameMap, MAPS } from "./data";

export type Side = "N" | "S" | "E" | "W";
export type Node = { id: string; x: number; y: number };
export type Link = { a: string; b: string; side: Side };

const D: Record<Side, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
export const SIDE_NAME: Record<Side, string> = { N: "Nord", S: "Sud", E: "Est", W: "Ovest" };

export function exitSide(e: { x: number; y: number }, m: GameMap): Side | null {
  const W = m.tiles[0].length - 1, H = m.tiles.length - 1;
  if (e.y === 0) return "N";
  if (e.y === H) return "S";
  if (e.x === 0) return "W";
  if (e.x === W) return "E";
  return null;
}

const outdoor = (id: string) => !!MAPS[id] && !MAPS[id].interior;

let cache: { nodes: Record<string, Node>; links: Link[]; w: number; h: number } | null = null;

export function worldLayout() {
  if (cache) return cache;
  const pos: Record<string, [number, number]> = { bologna: [0, 0] };
  const used = new Map<string, string>([["0,0", "bologna"]]);
  const links: Link[] = [];
  const seen = new Set<string>();
  const q = ["bologna"];
  while (q.length) {
    const id = q.shift()!;
    const m = MAPS[id];
    for (const e of m.exits) {
      if (!outdoor(e.to)) continue;
      const side = exitSide(e, m);
      if (!side) continue;
      const key = [id, e.to].sort().join("|");
      if (!seen.has(key)) { seen.add(key); links.push({ a: id, b: e.to, side }); }
      if (pos[e.to]) continue;
      // Two grid units per step, so a place that collides can sit half a step to the side instead
      // of far away. Candidates: straight ahead, then slightly left/right, then further ahead.
      const [px, py] = pos[id];
      const [dx, dy] = D[side];
      const perp: [number, number] = [dy, dx];
      const cands: [number, number][] = [];
      for (const ahead of [2, 3, 4, 5, 6, 8, 10]) for (const off of [0, 1, -1, 2, -2]) cands.push([px + dx * ahead + perp[0] * off, py + dy * ahead + perp[1] * off]);
      const free = (c: [number, number]) => [-1, 0, 1].every((ox) => [-1, 0, 1].every((oy) => !used.has(`${c[0] + ox},${c[1] + oy}`)));
      const [x, y] = cands.find(free) ?? cands.find((c) => !used.has(`${c[0]},${c[1]}`))!;
      pos[e.to] = [x, y];
      used.set(`${x},${y}`, e.to);
      q.push(e.to);
    }
  }
  const xs = Object.values(pos).map((p) => p[0]), ys = Object.values(pos).map((p) => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const nodes: Record<string, Node> = {};
  for (const [id, [x, y]] of Object.entries(pos)) nodes[id] = { id, x: x - minX, y: y - minY };
  cache = { nodes, links, w: Math.max(...xs) - minX + 1, h: Math.max(...ys) - minY + 1 };
  return cache;
}

/** Shortest way between two places: the list of places and the side to leave each one by. */
export function route(from: string, to: string): { id: string; side?: Side }[] | null {
  if (from === to) return [{ id: from }];
  const prev: Record<string, { id: string; side: Side }> = {};
  const q = [from];
  const seen = new Set([from]);
  while (q.length) {
    const id = q.shift()!;
    const m = MAPS[id];
    for (const e of m.exits) {
      if (!outdoor(e.to) || seen.has(e.to)) continue;
      const side = exitSide(e, m);
      if (!side) continue;
      seen.add(e.to);
      prev[e.to] = { id, side };
      if (e.to === to) {
        const out: { id: string; side?: Side }[] = [{ id: to }];
        let cur = to;
        while (cur !== from) { const p = prev[cur]; out.unshift({ id: p.id, side: p.side }); cur = p.id; }
        return out;
      }
      q.push(e.to);
    }
  }
  return null;
}
