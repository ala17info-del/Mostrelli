// Trophies: goals with a prize, checked automatically as the game goes on.
import { ALL_BADGES, ItemId, MAPS, SPECIES_LIST } from "./data";

export type Stats = { wins?: number; catches?: number; shinies?: number; sagre?: number };
type SaveLike = { caught: string[]; badges: string[]; defeated: string[]; visited?: string[]; stats?: Stats; party: { shiny?: boolean; lv: number }[]; box: { shiny?: boolean; lv: number }[] };
export type Trophy = { id: string; icon: string; name: string; desc: string; goal: number; value: (s: SaveLike) => number; prize: { money?: number; items?: Partial<Record<ItemId, number>> } };

const caught = (s: SaveLike) => s.caught.length;
const places = (s: SaveLike) => new Set([...(s.visited ?? []), "bologna"].filter((id) => MAPS[id] && !MAPS[id].interior)).size;
const shinyOwned = (s: SaveLike) => [...s.party, ...s.box].filter((m) => m.shiny).length;
const TOTAL_SPECIES = SPECIES_LIST.length;
const TOTAL_PLACES = Object.values(MAPS).filter((m) => !m.interior).length;

export const TROPHIES: Trophy[] = [
  { id: "catch1", icon: "🫙", name: "Primo vasetto", desc: "Cattura il tuo primo Mostrello", goal: 2, value: caught, prize: { items: { vasetto: 5 } } },
  { id: "catch10", icon: "📖", name: "Collezionista", desc: "Registra 10 Mostrelli nel Mostrario", goal: 10, value: caught, prize: { money: 500, items: { vasetto: 5 } } },
  { id: "catch25", icon: "📚", name: "Enciclopedia vivente", desc: "Registra 25 Mostrelli", goal: 25, value: caught, prize: { money: 1500, items: { caramella: 2 } } },
  { id: "catchAll", icon: "👑", name: "Mostrario completo", desc: `Registra tutti i ${TOTAL_SPECIES} Mostrelli`, goal: TOTAL_SPECIES, value: caught, prize: { money: 10000, items: { caramella: 10 } } },
  { id: "shiny1", icon: "✨", name: "Che luccichio!", desc: "Cattura un Mostrello cromatico", goal: 1, value: shinyOwned, prize: { money: 1000, items: { caramella: 2 } } },
  { id: "shiny5", icon: "💎", name: "Cacciatore di cromatici", desc: "Possiedi 5 Mostrelli cromatici", goal: 5, value: shinyOwned, prize: { money: 5000, items: { caramella: 5 } } },
  { id: "wins10", icon: "⚔️", name: "Si scaldano i motori", desc: "Vinci 10 lotte", goal: 10, value: (s) => s.stats?.wins ?? 0, prize: { items: { tortellini: 3 } } },
  { id: "wins100", icon: "🏅", name: "Veterano", desc: "Vinci 100 lotte", goal: 100, value: (s) => s.stats?.wins ?? 0, prize: { money: 3000, items: { caramella: 3 } } },
  { id: "trainers20", icon: "🤝", name: "Rispetto in paese", desc: "Batti 20 allenatori", goal: 20, value: (s) => s.defeated.length, prize: { money: 1000, items: { caffe: 2 } } },
  { id: "badge1", icon: "🎖️", name: "Primo Sigillo", desc: "Ottieni il primo Sigillo", goal: 1, value: (s) => s.badges.length, prize: { money: 300 } },
  { id: "badge6", icon: "🏵️", name: "Mezza regione", desc: "Ottieni 6 Sigilli", goal: 6, value: (s) => s.badges.length, prize: { money: 2000, items: { caramella: 2 } } },
  { id: "badgeAll", icon: "🏆", name: "Campione dell'Emilia-Romagna", desc: `Ottieni tutti i ${ALL_BADGES.length} Sigilli`, goal: ALL_BADGES.length, value: (s) => s.badges.length, prize: { money: 10000, items: { caramella: 10 } } },
  { id: "visit10", icon: "🗺️", name: "Gita fuori porta", desc: "Visita 10 luoghi", goal: 10, value: places, prize: { items: { brodino: 5 } } },
  { id: "visit50", icon: "🚲", name: "Giro della provincia", desc: "Visita 50 luoghi", goal: 50, value: places, prize: { money: 1500, items: { caramella: 2 } } },
  { id: "visitAll", icon: "🧭", name: "Ogni frazione, ogni campanile", desc: `Visita tutti i ${TOTAL_PLACES} luoghi`, goal: TOTAL_PLACES, value: places, prize: { money: 10000, items: { caramella: 10 } } },
  { id: "lv50", icon: "💪", name: "Bello robusto", desc: "Porta un Mostrello al livello 50", goal: 50, value: (s) => Math.max(0, ...[...s.party, ...s.box].map((m) => m.lv)), prize: { money: 3000, items: { caramella: 3 } } },
  { id: "lv100", icon: "💯", name: "Al massimo!", desc: "Porta un Mostrello al livello 100", goal: 100, value: (s) => Math.max(0, ...[...s.party, ...s.box].map((m) => m.lv)), prize: { money: 20000, items: { caramella: 10 } } },
  { id: "sagra1", icon: "🎉", name: "Prima sagra", desc: "Partecipa a una sagra", goal: 1, value: (s) => s.stats?.sagre ?? 0, prize: { items: { tortellini: 2 } } },
  { id: "sagra7", icon: "🎪", name: "Habitué delle sagre", desc: "Partecipa a 7 sagre diverse giornate", goal: 7, value: (s) => s.stats?.sagre ?? 0, prize: { money: 2500, items: { caramella: 3 } } },
];

/** Trophies reached but not yet collected. */
export const newlyEarned = (s: SaveLike & { trophies?: string[] }) => TROPHIES.filter((t) => !(s.trophies ?? []).includes(t.id) && t.value(s) >= t.goal);

export function prizeText(t: Trophy) {
  const parts: string[] = [];
  if (t.prize.money) parts.push(`${t.prize.money} €`);
  for (const [k, v] of Object.entries(t.prize.items ?? {})) parts.push(`${v}× ${k === "caramella" ? "Caramella Rara" : k === "vasetto" ? "Vasetto" : k === "caffe" ? "Caffè" : k[0].toUpperCase() + k.slice(1)}`);
  return parts.join(" + ");
}
