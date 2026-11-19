// Gyms: every capopalestra waiting outdoors gets a hall of their own. In town a doorman stands where
// the boss was; talking to him leads inside: a long red carpet, pillars, two apprentices with
// Mostrelli of the boss's type, and the boss at the far end.
import type { GameMap, Npc, Species } from "./data";

const BLOCK = new Set(["T", "W", "R", "H", "D", "B", "S", "O", "U", "X", "K", "M", "N", "J", "I", "=", "%", "&", "^", "!"]);
const HALL = [
  "NNNNNNNNNNNNNNNN",
  "NNNNNNNNNNNNNNNN",
  "NLLLLKLLLKLLLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLKLLLVLLLKLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLKLLLVLLLKLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLKLLLVLLLKLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLLLLLVLLLLLLLN",
  "NLLLLLLVLLLLLLLN",
  "NNNNNNNLNNNNNNNN",
];
const TITLES: Record<string, string> = { sugo: "Cuoco", campi: "Contadino", terme: "Bagnante", motore: "Meccanico", nebbia: "Pescatore", chiacchiera: "Chiacchierone" };

export const gymIdOf = (mapId: string) => `${mapId}__palestra`;

export function buildGyms(maps: Record<string, GameMap>, species: Species[]) {
  const byId = Object.fromEntries(species.map((s) => [s.id, s]));
  for (const m of Object.values(maps)) {
    if (m.interior) continue;
    const i = m.npcs.findIndex((n) => n.kind === "boss");
    if (i < 0) continue;
    const boss = m.npcs[i];
    const id = gymIdOf(m.id);
    // Where to land when leaving the gym: next to the doorman, on open ground.
    const occ = new Set(m.npcs.map((n) => `${n.x},${n.y}`));
    const out = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [boss.x + dx, boss.y + dy]).find(([x, y]) => {
      const c = m.tiles[y]?.[x];
      return !!c && !BLOCK.has(c) && !occ.has(`${x},${y}`);
    }) ?? [boss.x, boss.y + 1];
    const team = boss.team ?? [];
    const type = byId[team[0]?.[0]]?.type ?? "sugo";
    const low = Math.max(3, Math.min(...team.map((t) => t[1])) - 2);
    const types = [...new Set(team.map(([s]) => s))];
    // "Gino" for "Gino, Umarell Supremo"; short names like "Zio DUC" stay whole.
    const short = boss.name.length <= 10 ? boss.name : boss.name.split(/[ ,]/)[0];
    const apprentice = (k: number, x: number, y: number): Npc => ({
      id: `${boss.id}_allievo${k}`, x, y, name: `${TITLES[type] ?? "Allievo"} allievo di ${short}`, look: { A: boss.look?.A ?? "#7a4a22", C: k ? "#ffffff" : "#263238" }, kind: "trainer",
      lines: k === 0 ? [`Per arrivare da ${short} devi passare da me!`] : [`Sono l'allievo preferito di ${short}. Vediamo se sei all'altezza.`],
      after: k === 0 ? [`Va bene, passa. Ma ${short} è un'altra storia.`] : [`Hai stoffa. ${short} ti aspetta in fondo alla sala.`],
      team: [[types[k % types.length], low + k], ...(k ? [[types[(k + 1) % types.length], low + k] as [string, number]] : [])],
      reward: 80 + low * 15,
    });
    maps[id] = {
      id, name: `Palestra di ${m.name}`, tiles: [...HALL], exits: [{ x: 7, y: 15, to: m.id, tx: out[0], ty: out[1] }], heal: { x: 7, y: 13 }, wild: [],
      music: m.music, npcs: [{ ...boss, x: 7, y: 2 + 1 }, apprentice(0, 5, 11), apprentice(1, 9, 7)], signs: {}, prov: m.prov, interior: true, gym: true,
    };
    // A hand-drawn town whose gym door already leads inside: the hall exit returns below that door,
    // and the boss leaves the street (he watches from the balcony instead).
    const door = m.exits.find((e) => e.to === id);
    if (door) {
      maps[id].exits[0] = { x: 7, y: 15, to: m.id, tx: door.x, ty: door.y + 1 };
      m.npcs.splice(i, 1);
      const balcony = m.tiles.findIndex((row) => row.includes("="));
      if (balcony >= 0) m.npcs.push({
        id: `${boss.id}_balcone`, x: m.tiles[balcony].indexOf("="), y: balcony, name: boss.name, look: boss.look, kind: "talk",
        lines: ["(dal balcone) Popolo di Predappio! ...C'è nessuno?", "Vuoi sfidarmi? Entra nella palestra, qui sotto. Ti aspetto!"],
      });
      continue;
    }
    // In town: the doorman takes the boss's place.
    m.npcs[i] = {
      id: `${boss.id}_porta`, x: boss.x, y: boss.y, name: `Palestra · ${boss.name}`, look: boss.look, kind: "gym", gym: id, badge: boss.badge,
      lines: [`Questa è la palestra di ${boss.name}.`, `Dentro ti aspettano due allievi e poi il capopalestra, che mette in palio il ${boss.badge}. Entri?`],
    };
  }
}
