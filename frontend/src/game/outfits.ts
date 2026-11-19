// Dressing up the player: hats, glasses, scarves and shirts, each sold only in the boutique of its
// own town. Hats replace the top three rows of the 12x12 player drawing, glasses go on the eyes, the
// scarf on the neck; shirts recolour the shirt.
import type { GameMap } from "./data";
import { SPRITES } from "./sprites";
import { findSpot } from "./towns";

export type Slot = "hat" | "glasses" | "neck" | "shirt";
export type Outfit = Partial<Record<Slot, string>>;
type HatStyle = "cap" | "flat" | "brim" | "helmet" | "beret" | "crown" | "chef";
export type Accessory = { id: string; name: string; slot: Slot; town: string; price: number; desc: string; hat?: HatStyle; color?: string; shirt?: string };

// Colours are palette letters of sprites.ts (shirts use real colours).
export const ACCESSORIES: Accessory[] = [
  { id: "coppola", name: "Coppola da Umarell", slot: "hat", town: "bologna", price: 400, hat: "flat", color: "s", desc: "Il berretto ufficiale di chi controlla i cantieri. Mani dietro la schiena incluse." },
  { id: "felpa_rossoblu", name: "Felpa Rossoblù", slot: "shirt", town: "bologna", price: 600, shirt: "#22306b", desc: "Calda, comoda e del colore giusto per la domenica allo stadio." },
  { id: "casco_corsa", name: "Casco da Corsa", slot: "hat", town: "modena", price: 900, hat: "helmet", color: "r", desc: "Rosso fiammante, con visiera. Fa andare più forte anche a piedi." },
  { id: "tuta_rossa", name: "Tuta Rossa da Box", slot: "shirt", town: "maranello", price: 1200, shirt: "#d0021b", desc: "La tuta dei meccanici di Maranello. Profuma ancora di benzina." },
  { id: "cappello_cuoco", name: "Cappello da Cuoco", slot: "hat", town: "parma", price: 700, hat: "chef", color: "w", desc: "Alto e candido, da vero maestro degli anolini." },
  { id: "sciarpa_formaggio", name: "Sciarpa Color Grana", slot: "neck", town: "reggio_emilia", price: 500, color: "y", desc: "Del colore di una forma stagionata 30 mesi. Morbidissima." },
  { id: "berretto_nebbia", name: "Berretto da Nebbia", slot: "hat", town: "piacenza", price: 450, hat: "beret", color: "b", desc: "Ripara dall'umidità del Po. E dà un'aria da poeta." },
  { id: "caschetto_bici", name: "Caschetto da Bici", slot: "hat", town: "ferrara", price: 500, hat: "helmet", color: "v", desc: "Indispensabile nella città delle biciclette." },
  { id: "corona_mosaico", name: "Corona di Mosaico", slot: "hat", town: "ravenna", price: 2000, hat: "crown", color: "z", desc: "Tessere d'oro come nelle basiliche. Per sentirsi un po' imperatori." },
  { id: "occhiali_sole", name: "Occhiali da Sole", slot: "glasses", town: "rimini", price: 600, color: "k", desc: "Lenti scurissime: perfetti per il lungomare e per le notti in discoteca." },
  { id: "paglietta", name: "Cappello di Paglia", slot: "hat", town: "riccione", price: 450, hat: "brim", color: "e", desc: "Tesa larga, profumo d'estate e di crema solare." },
  { id: "berretto_marinaio", name: "Berretto da Marinaio", slot: "hat", town: "cesenatico", price: 400, hat: "cap", color: "w", desc: "Bianco come le vele del porto canale." },
  { id: "cappello_pescatore", name: "Cappello da Pescatore", slot: "hat", town: "comacchio", price: 400, hat: "brim", color: "G", desc: "Verde palude, per passare inosservati tra le anguille." },
  { id: "foulard_ceramica", name: "Foulard di Ceramica", slot: "neck", town: "faenza", price: 550, color: "l", desc: "Azzurro come le maioliche faentine. Non si rompe, giurano." },
  { id: "bandana", name: "Bandana Romagnola", slot: "neck", town: "forli", price: 350, color: "v", desc: "Per ballare il liscio senza sudare troppo." },
  { id: "cappellino_pista", name: "Cappellino del Circuito", slot: "hat", town: "imola", price: 500, hat: "cap", color: "y", desc: "Giallo come le bandiere ai bordi della pista." },
  { id: "maschera_carnevale", name: "Maschera di Carnevale", slot: "glasses", town: "cento", price: 800, color: "p", desc: "Colorata e misteriosa, dal carnevale gemellato con Rio." },
  { id: "maglia_ciliegia", name: "Maglietta Ciliegia", slot: "shirt", town: "vignola", price: 450, shirt: "#c2185b", desc: "Rosso ciliegia di Vignola. Profuma di primavera." },
  { id: "accappatoio", name: "Accappatoio delle Terme", slot: "shirt", town: "salsomaggiore_terme", price: 700, shirt: "#f5f5f5", desc: "Bianco e morbido. Si gira il paese come al centro benessere." },
  { id: "occhialini_tondi", name: "Occhialini Tondi", slot: "glasses", town: "predappio", price: 300, color: "c", desc: "Da studioso di storia. Quella vera, sui libri." },
  { id: "berretto_lana", name: "Berretto di Lana", slot: "hat", town: "sestola", price: 450, hat: "beret", color: "r", desc: "Caldo e colorato, per le giornate sulle piste del Cimone." },
  { id: "sciarpa_mare", name: "Sciarpa a Righe", slot: "neck", town: "cattolica", price: 400, color: "l", desc: "Bianca e azzurra come le cabine della spiaggia." },
];
export const ACC = Object.fromEntries(ACCESSORIES.map((a) => [a.id, a]));

// Top three rows of the player drawing for each hat style (X = hat colour). Side view: same rows,
// the brim of caps points forward.
const HATS: Record<HatStyle, { front: string[]; side: string[] }> = {
  cap: { front: ["...kkkkkk...", "..kXXXXXXk..", ".kXXXXXXXXk."], side: ["...kkkkkk...", "..kXXXXXXk..", ".kXXXXXXXXXk"] },
  flat: { front: ["............", "..kkkkkkkk..", ".kXXXXXXXXk."], side: ["............", "..kkkkkkkk..", ".kXXXXXXXXXk"] },
  brim: { front: ["...kkkkkk...", "..kXXXXXXk..", "kXXXXXXXXXXk"], side: ["...kkkkkk...", "..kXXXXXXk..", "kXXXXXXXXXXk"] },
  helmet: { front: ["..kkkkkkkk..", ".kXXXXXXXXk.", ".kXwwwwwwXk."], side: ["..kkkkkkkk..", ".kXXXXXXXXk.", ".kXXXXXwwwwk"] },
  beret: { front: ["......k.....", "..kkkkkkkk..", ".kXXXXXXXXk."], side: ["......k.....", "..kkkkkkkk..", ".kXXXXXXXXk."] },
  crown: { front: ["..k.kk.kk.k.", "..kXkXXkXk..", ".kXXXXXXXXk."], side: ["..k.kk.kk.k.", "..kXkXXkXk..", ".kXXXXXXXXk."] },
  chef: { front: ["..kXXXXXXk..", "..kXXXXXXk..", ".kXXXXXXXXk."], side: ["..kXXXXXXk..", "..kXXXXXXk..", ".kXXXXXXXXk."] },
};

const setRow = (g: string[], y: number, row: string) => { g[y] = row; };
const paint = (row: string, from: number, to: number, c: string) => row.slice(0, from) + c.repeat(to - from + 1) + row.slice(to + 1);

/** The player drawing with the outfit on. base: person, person_walk, person_back... (+ "_f"). */
export function dressed(base: string, outfit: Outfit): string {
  const key = [outfit.hat, outfit.glasses, outfit.neck].filter(Boolean).join("+");
  if (!key) return base;
  const name = `${base}~${key}`;
  if (SPRITES[name]) return name;
  const g = [...(SPRITES[base] ?? SPRITES.person)];
  const back = base.includes("back"), side = base.includes("side");
  const hat = outfit.hat ? ACC[outfit.hat] : undefined;
  if (hat?.hat) {
    const rows = side ? HATS[hat.hat].side : HATS[hat.hat].front;
    rows.forEach((r, y) => setRow(g, y, r.replace(/X/g, hat.color ?? "A")));
  }
  const gl = outfit.glasses ? ACC[outfit.glasses] : undefined;
  if (gl && !back) setRow(g, 4, side ? paint(g[4], 6, 8, gl.color ?? "k") : paint(g[4], 3, 8, gl.color ?? "k"));
  const nk = outfit.neck ? ACC[outfit.neck] : undefined;
  if (nk) setRow(g, 6, side ? paint(g[6], 4, 7, nk.color ?? "r") : paint(g[6], 4, 7, nk.color ?? "r"));
  SPRITES[name] = g;
  return name;
}

/** Shirt colour for the player drawing (the shirt is "C", or "P" in the girl's drawing). */
export const shirtLook = (outfit: Outfit | undefined) => {
  const c = outfit?.shirt ? ACC[outfit.shirt]?.shirt : undefined;
  return c ? { C: c, P: c } : undefined;
};

/** A boutique in every town that sells something (standing on a free spot that blocks nothing). */
export function buildBoutiques(maps: Record<string, GameMap>) {
  const towns = new Set(ACCESSORIES.map((a) => a.town));
  for (const id of towns) {
    const m = maps[id];
    if (!m) continue;
    const spot = findSpot(m);
    if (!spot) continue;
    m.npcs.push({
      id: `${id}_boutique`, x: spot[0], y: spot[1], name: `Boutique di ${m.name}`, look: { A: "#e91e63", C: "#ffffff" }, kind: "outfit",
      lines: [`Benvenuto nella boutique di ${m.name}! Qui trovi cose che non vendono da nessun'altra parte.`],
    });
  }
}
