// Field moves and secret corners. A crowd (%), a thick hedge (&) or a boulder (^) blocks the way into
// a small hidden corner; a Mostrello who has learned the right move clears it for good. Inside: a
// special Mostrello to fight and catch (an evolved form, sometimes cromatico) and a couple of treats.
import type { GameMap, ItemId, Npc, Species, TypeId } from "./data";

export type Obstacle = "%" | "&" | "^" | "!";
export const FIELD: Record<Obstacle, { move: string; type: TypeId; what: string; done: string }> = {
  "%": { move: "ciabattata", type: "chiacchiera", what: "Un corteo di manifestanti blocca il vicolo coi cartelli: «Giù le mani dai tortellini! No alla panna!»", done: "I manifestanti si spostano più in là, continuando a cantare cori. Il passaggio è libero!" },
  "&": { move: "potatura", type: "campi", what: "Una siepe fitta e spinosa chiude il passaggio.", done: "Zac, zac! La siepe è potata a regola d'arte. Si passa!" },
  "!": { move: "saluto", type: "chiacchiera", what: "Un portone solenne, sbarrato con un lucchetto. C'è scritto: «Vietato l'ingresso ai non autorizzati».", done: "Inutilino agita la manina: «Ciao!». Il portone, spiazzato da tanta gentilezza, si apre da solo. Dietro c'è un cortile nascosto!" },
  "^": { move: "sfondamento", type: "motore", what: "Un grosso masso è caduto in mezzo al sentiero.", done: "BOOM! Il masso va in frantumi. La strada è aperta!" },
};
export const OBSTACLES = new Set(Object.keys(FIELD));
/** What an obstacle becomes once cleared. */
export const CLEARED_AS: Record<Obstacle, string> = { "%": ".", "&": ",", "^": ".", "!": "." };
/** Learned at this level by every Mostrello of the move's type. */
export const FIELD_LV = 8;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A Mostrello in the party who has learned the move (even if it is no longer one of its 4 battle moves). */
export function fieldUser<M extends { s: string; lv: number; hp: number }>(party: M[], move: string, species: Record<string, Species>) {
  return party.find((m) => m.hp > 0 && species[m.s]?.moves.some(([id, l]) => id === move && l <= m.lv));
}

function put(m: GameMap, x: number, y: number, c: string) {
  m.tiles[y] = m.tiles[y].slice(0, x) + c + m.tiles[y].slice(x + 1);
}

function stock(m: GameMap, spots: { mon: [number, number]; items: [number, number][] }, species: Species[], evoTargets: Set<string>, alwaysShiny = false) {
  const h = hash(m.id);
  const lv = Math.min(60, (m.wild[0]?.[1] ?? 10) + 4);
  const evolved = species.filter((s) => evoTargets.has(s.id));
  const sp = evolved[h % evolved.length];
  const npc: Npc = {
    id: `${m.id}_segreto`, x: spots.mon[0], y: spots.mon[1], name: sp.name, look: { A: "#ffffff", C: "#ffffff" }, kind: "wild", lines: [],
    mon: { s: sp.id, lv, shiny: alwaysShiny || h % 4 === 0 },
  };
  m.npcs.push(npc);
  const extra: ItemId[] = ["tortellini", "digestivo", "gelato", "caffe"];
  m.pickups = [...(m.pickups ?? []), { id: `${m.id}_seg1`, x: spots.items[0][0], y: spots.items[0][1], item: "caramella" }, { id: `${m.id}_seg2`, x: spots.items[1][0], y: spots.items[1][1], item: extra[h % extra.length] }];
}

export function buildSecrets(maps: Record<string, GameMap>, species: Species[]) {
  const evoTargets = new Set(species.map((s) => s.evo?.to).filter(Boolean) as string[]);
  // Bologna: a crowd fills the alley by the north gate; behind it the tall grass by the walls.
  const bo = maps.bologna;
  if (bo) {
    put(bo, 6, 2, "%");
    put(bo, 6, 3, "T");
    stock(bo, { mon: [3, 3], items: [[1, 1], [5, 3]] }, species, evoTargets);
  }
  // Predappio: a pompous locked gate at the end of the porticoes. A polite hello opens it.
  const pr = maps.predappio;
  if (pr) {
    stock(pr, { mon: [12, 13], items: [[11, 13], [13, 14]] }, species, evoTargets, true);
    pr.npcs.push({
      id: "predappio_tonino", x: 9, y: 6, name: "Nonno Tonino", look: { A: "#cfd8dc", C: "#6d4c41" }, kind: "gift",
      lines: ["Vedi questo Mostrello? Si chiama Inutilino. Non sa lottare, non sa correre, non sa niente.", "Sa solo salutare: agita la manina e dice «Ciao!». Però lo fa con tanto garbo. Prendilo tu, magari ti serve!"],
      after: ["Te l'avevo detto: buono solo per salutare. Ma un po' di buone maniere aprono più porte di quanto pensi."],
      mon: { s: "inutilino", lv: 5 },
    });
  }
  // One generated place in five gets a hidden corner at the bottom left, closed by trees.
  for (const m of Object.values(maps)) {
    if (!m.terrain || m.interior || hash(m.id) % 5 !== 0 || m.id === "predappio") continue;
    if (m.terrain === "m") continue; // seaside: that corner is beach and sea
    const ob: Obstacle = m.terrain === "c" ? "%" : m.terrain === "a" ? "^" : "&";
    for (let y = 10; y <= 14; y++) for (let x = 1; x <= 5; x++) {
      const edge = x === 5 || y === 10;
      put(m, x, y, edge ? "T" : (x + y) % 3 === 0 ? "F" : ",");
    }
    put(m, 2, 10, ob);
    stock(m, { mon: [3, 12], items: [[1, 13], [4, 14]] }, species, evoTargets);
  }
}
