// Sagre: one village feast every day, chosen from the real date (the same for every player).
// In the feast town wild Mostrelli of the feast's type show up more often, cromatici are 5 times
// more common, and the first visit of the day gives a gift.
import { ItemId, MAPS, TypeId } from "./data";

export type Sagra = { id: string; name: string; map: string; type: TypeId; gift: [ItemId, number]; line: string };

const ALL_SAGRE: Sagra[] = [
  { id: "tortellino", name: "Sagra del Tortellino", map: "bologna", type: "sugo", gift: ["tortellini", 3], line: "Trecento tortellini chiusi a mano, e uno è per te!" },
  { id: "lambrusco", name: "Festa del Lambrusco", map: "modena", type: "sugo", gift: ["vasetto", 5], line: "Bollicine rosse e vasetti in regalo per chi passa!" },
  { id: "piadina", name: "Sagra della Piadina", map: "bellaria_igea_marina", type: "chiacchiera", gift: ["brodino", 4], line: "Piadina calda e chiacchiere: prendi pure, offre la casa." },
  { id: "salama", name: "Sagra della Salama da Sugo", map: "ferrara", type: "sugo", gift: ["tortellini", 2], line: "Sei ore di cottura, ma per te c'è già una porzione pronta." },
  { id: "tartufo", name: "Fiera del Tartufo", map: "san_leo", type: "campi", gift: ["caramella", 1], line: "Abbiamo trovato un tartufo... e una Caramella Rara!" },
  { id: "ciliegie", name: "Festa delle Ciliegie", map: "vignola", type: "campi", gift: ["vasetto", 5], line: "Una cesta di ciliegie e qualche vasetto per il viaggio." },
  { id: "culatello", name: "Sagra del Culatello", map: "zibello", type: "sugo", gift: ["caffe", 1], line: "Una fetta sottile e un caffè, che il pomeriggio è lungo." },
  { id: "anguilla", name: "Festa dell'Anguilla", map: "comacchio", type: "nebbia", gift: ["vasetto", 5], line: "Le anguille scappano, i Mostrelli no: ecco dei vasetti!" },
  { id: "terme", name: "Notte delle Terme", map: "salsomaggiore_terme", type: "terme", gift: ["brodino", 4], line: "Un bagno caldo e un brodino: la squadra ringrazia." },
  { id: "castagna", name: "Sagra della Castagna", map: "castel_del_rio", type: "campi", gift: ["tortellini", 2], line: "Caldarroste per tutti! Attento, scottano." },
  { id: "motori", name: "Raduno dei Motori", map: "maranello", type: "motore", gift: ["caffe", 1], line: "Rombo di motori e caffè ristretto per i piloti." },
  { id: "mare", name: "Festa del Porto", map: "cesenatico", type: "terme", gift: ["vasetto", 5], line: "Barche in festa sul porto canale: prendi questi vasetti!" },
  { id: "chiacchiere", name: "Festa dei Muri Dipinti", map: "dozza", type: "chiacchiera", gift: ["digestivo", 2], line: "Pittori ovunque e chiacchiere a non finire. Un digestivo?" },
  { id: "nebbia", name: "Festa della Nebbia", map: "codigoro", type: "nebbia", gift: ["caramella", 1], line: "Non si vede niente, ma la Caramella Rara te la diamo lo stesso!" },
];
export const SAGRE = ALL_SAGRE.filter((s) => MAPS[s.map]);

/** "2026-11-18": the key of a day, in local time. */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's feast: changes at midnight, same for everyone. */
export function todaySagra(d = new Date()): Sagra {
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  // Step through the list in a shuffled-looking order that still visits every feast (5 and 14 share no factor).
  return SAGRE[(((day * 5 + 3) % SAGRE.length) + SAGRE.length) % SAGRE.length];
}

/** Base chance of a cromatico (shiny) wild Mostrello, and inside today's feast town. */
export const SHINY_CHANCE = 1 / 64;
export const SHINY_FEAST_MULT = 5;
