// Type-specific moves. Every type has its own pool (9-10 moves); a Mostrello learns only moves of its
// own type. Each evolution line gets its own 5 moves from the pool (keeping the ones it had before),
// and evolved forms add a signature move. So two Sugo Mostrelli can fight in different ways.
import type { Move, Species } from "./data";

export const N_MOVES: Record<string, Move> = {
  // Field moves (also usable outside battle to clear obstacles, see secrets.ts)
  ciabattata: { name: "Ciabattata", type: "chiacchiera", power: 60, acc: 100, fx: { k: "atkDown", p: 20 } },
  potatura: { name: "Potatura", type: "campi", power: 60, acc: 100, fx: { k: "defDown", p: 20 } },
  sfondamento: { name: "Sfondamento", type: "motore", power: 75, acc: 90 },
  // The only thing Inutilino can do: wave its little hand and say "Ciao!". Useless in battle.
  saluto: { name: "Saluto", type: "chiacchiera", power: 5, acc: 100 },
  // Sugo
  mattarello: { name: "Mattarello", type: "sugo", power: 70, acc: 90, fx: { k: "defDown", p: 30 } },
  lasagna: { name: "Lasagna Bollente", type: "sugo", power: 95, acc: 85, fx: { k: "burn", p: 20 } },
  sfoglia: { name: "Sfoglia Tirata", type: "sugo", power: 50, acc: 100, fx: { k: "selfDefUp", p: 40 } },
  cappone: { name: "Brodo di Cappone", type: "sugo", power: 40, acc: 100, fx: { k: "selfAtkUp", p: 50 } },
  // Campi
  raccolto: { name: "Raccolto", type: "campi", power: 50, acc: 100, fx: { k: "selfAtkUp", p: 40 } },
  spaventapasseri: { name: "Spaventapasseri", type: "campi", power: 55, acc: 95, fx: { k: "confuse", p: 30 } },
  irrigazione: { name: "Irrigazione", type: "campi", power: 65, acc: 100, fx: { k: "spdDown", p: 30 } },
  mietitrebbia: { name: "Mietitrebbia", type: "campi", power: 95, acc: 80 },
  // Terme
  idromassaggio: { name: "Idromassaggio", type: "terme", power: 55, acc: 100, fx: { k: "selfDefUp", p: 50 } },
  sulfurea: { name: "Acqua Sulfurea", type: "terme", power: 70, acc: 95, fx: { k: "defDown", p: 30 } },
  geyser: { name: "Geyser", type: "terme", power: 95, acc: 80 },
  fanghicaldi: { name: "Fanghi Caldi", type: "terme", power: 60, acc: 95, fx: { k: "burn", p: 20 } },
  // Motore
  pieno: { name: "Pieno di Benzina", type: "motore", power: 40, acc: 100, fx: { k: "selfSpdUp", p: 60 } },
  testacoda: { name: "Testacoda", type: "motore", power: 70, acc: 90, fx: { k: "confuse", p: 25 } },
  turbo: { name: "Turbo", type: "motore", power: 80, acc: 95, fx: { k: "selfSpdUp", p: 30 } },
  frenata: { name: "Frenata Brusca", type: "motore", power: 60, acc: 100, fx: { k: "spdDown", p: 40 } },
  // Nebbia
  umidita: { name: "Umidità", type: "nebbia", power: 50, acc: 100, fx: { k: "spdDown", p: 40 } },
  brina: { name: "Brina", type: "nebbia", power: 65, acc: 95, fx: { k: "defDown", p: 30 } },
  ronzio: { name: "Ronzio", type: "nebbia", power: 55, acc: 95, fx: { k: "confuse", p: 30 } },
  galaverna: { name: "Galaverna", type: "nebbia", power: 95, acc: 80 },
  // Chiacchiera
  ramanzina: { name: "Ramanzina", type: "chiacchiera", power: 65, acc: 95, fx: { k: "atkDown", p: 40 } },
  modai: { name: "Mo' Dai!", type: "chiacchiera", power: 55, acc: 100, fx: { k: "confuse", p: 25 } },
  comizio: { name: "Comizio in Piazza", type: "chiacchiera", power: 90, acc: 85 },
  barsport: { name: "Bar Sport", type: "chiacchiera", power: 70, acc: 95, fx: { k: "selfAtkUp", p: 30 } },
};

/** Species whose learnset is hand-made and must not be rewritten. */
const KEEP = new Set(["inutilino"]);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Rewrites every learnset with moves of the Mostrello's own type only. */
export function typeMovesets(species: Species[], moves: Record<string, Move>) {
  const byId = Object.fromEntries(species.map((s) => [s.id, s]));
  const evoTargets = new Set(species.map((s) => s.evo?.to).filter(Boolean) as string[]);
  const pool: Record<string, string[]> = {};
  for (const [id, m] of Object.entries(moves)) (pool[m.type] ??= []).push(id);
  // Field moves are given to every line of their type below, not picked at random.
  const FIELDM: Record<string, string> = { chiacchiera: "ciabattata", campi: "potatura", motore: "sfondamento" };
  for (const t of Object.keys(pool)) pool[t] = pool[t].filter((m) => m !== FIELDM[t] && m !== "saluto");
  for (const t of Object.keys(pool)) pool[t].sort((a, b) => moves[a].power - moves[b].power || a.localeCompare(b));

  // Signature moves rotate among the lines of each type, so every strong move has someone to learn it.
  const turn: Record<string, number> = {};
  for (const root of species.filter((s) => !evoTargets.has(s.id) && !KEEP.has(s.id))) {
    const line: Species[] = [];
    for (let s: Species | undefined = root; s && !line.includes(s); s = s.evo ? byId[s.evo.to] : undefined) line.push(s);
    const type = root.type;
    const p = pool[type] ?? [];
    if (p.length < 2) continue;
    // Keep the moves of its type the line already had (they were chosen for its character)...
    const own = [...new Set(line.flatMap((s) => s.moves.map(([m]) => m)).filter((m) => moves[m]?.type === type))];
    const set = new Set<string>([p[0], ...own]);
    // ...then fill up to 5 with moves of the same type, a different mix for every line.
    let k = hash(root.id);
    const rest = p.filter((m) => !set.has(m) && moves[m].power < 90);
    while (set.size < 5 && rest.length) { const i = k % rest.length; set.add(rest.splice(i, 1)[0]); k = Math.floor(k / 7) + 13; }
    const base = [...set].sort((a, b) => moves[a].power - moves[b].power).slice(0, 5);
    const levels = [1, 1, 9, 18, 28];
    const learn: [string, number][] = base.map((m, i) => [m, levels[i]]);
    // Signature moves for evolved forms: the strongest of the type not already known.
    const strong = p.filter((m) => !base.includes(m)).sort((a, b) => moves[b].power - moves[a].power);
    const first = line.length > 1 ? (turn[type] = (turn[type] ?? -1) + 1) : 0;
    line.forEach((s, stage) => {
      const extra: [string, number][] = [];
      for (let j = 1; j <= stage; j++) {
        const sig = strong[(first + j - 1) % Math.min(3, Math.max(1, strong.length))];
        const at = line[j - 1].evo?.lv ?? 20;
        if (sig && !extra.some(([m]) => m === sig)) extra.push([sig, at + 4]);
      }
      const field: [string, number][] = FIELDM[type] && moves[FIELDM[type]] ? [[FIELDM[type], 8]] : [];
      s.moves = [...learn, ...field, ...extra].sort((a, b) => a[1] - b[1] || moves[a[0]].power - moves[b[0]].power);
    });
  }
}
