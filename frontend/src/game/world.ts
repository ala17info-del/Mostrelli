// The whole of Emilia-Romagna, built from data.
//
// Hand-drawn maps (Bologna, Ferrara, Modena...) stay as they are. Every other town, village and
// frazione is ONE line in ROUTES below: the generator draws a 16x16 map for it (roads, houses,
// fields, woods, valleys or beach depending on the terrain), fills it with wild Mostrelli, trainers,
// a sign and, in bigger towns, a healer and a shop, and links it to its neighbours.
//
// To add a place: add a line to a route. Format: "Name[@PROV]|terrain|options..."
//   terrain: c = town, p = plain (la Bassa), h = hills, a = Apennines, m = seaside, f = river/valleys
//   options: "*" bigger town (healer + shop) · "fz:Comune" it is a frazione of that comune
//            any other text is the curiosity written on the town sign.
// A route starts from an existing map and goes on in one direction (N, S, E, W). With `to` the last
// place connects to another existing map (and replaces that map's old link on that side).
import type { GameMap, ItemId, Npc, Species, TypeId } from "./data";
import { N_HOME } from "./bestiary";

type Terrain = "c" | "p" | "h" | "a" | "m" | "f";
type Side = "N" | "S" | "E" | "W";
type Route = { from: string; side: Side; prov: string; places: string[]; to?: string; toSide?: Side };

export const PROVINCES: Record<string, string> = {
  PC: "Piacenza", PR: "Parma", RE: "Reggio Emilia", MO: "Modena", BO: "Bologna",
  FE: "Ferrara", RA: "Ravenna", FC: "Forlì-Cesena", RN: "Rimini",
};
// Province of the hand-drawn maps, west to east (used by the world map screen).
export const BASE_PROV: Record<string, string> = {
  parma: "PR", modena: "MO", acetaia: "MO", bologna: "BO", mercato: "BO", maggiore: "BO", altedo: "BO",
  osteria: "BO", csp: "BO", imola: "BO", ferrara: "FE", ravenna: "RA", riviera: "RN",
};
export const PROV_ORDER = ["PC", "PR", "RE", "MO", "BO", "FE", "RA", "FC", "RN"];

export const ROUTES: Route[] = [
  // ---- Bologna and its province
  { from: "bologna", side: "S", prov: "BO", places: [
    "Casalecchio di Reno|c|*|Qui il Reno esce dalle colline e si butta in città.",
    "Pontecchio Marconi|h|fz:Sasso Marconi|A Villa Griffone Guglielmo Marconi fece i primi esperimenti con la radio.",
    "Sasso Marconi|h", "Marzabotto|a|Qui sorgeva Kainua, una città etrusca: le sue strade si vedono ancora.",
    "Vergato|a", "Porretta Terme|a|*|Acque termali e, d'estate, il festival soul più famoso d'Italia.",
    "Lizzano in Belvedere|a", "Corno alle Scale|a|fz:Lizzano in Belvedere|La vetta più alta della provincia di Bologna. D'inverno si scia.",
  ] },
  { from: "casalecchio_di_reno", side: "W", prov: "BO", places: [
    "Zola Predosa|h", "Crespellano|h|fz:Valsamoggia", "Bazzano|h|fz:Valsamoggia",
    "Monteveglio|h|fz:Valsamoggia|Un'abbazia sul colle e un parco tutto intorno.",
  ] },
  { from: "casalecchio_di_reno", side: "E", prov: "BO", places: ["San Lazzaro di Savena|c|*", "Ozzano dell'Emilia|p"] },
  { from: "san_lazzaro_di_savena", side: "S", prov: "BO", places: ["Pianoro|h", "Loiano|a", "Monghidoro|a"] },
  { from: "maggiore", side: "W", prov: "BO", places: [
    "Argelato|p", "San Giorgio di Piano|p", "San Pietro in Casale|p", "Galliera|p", "Pieve di Cento|p",
    "Cento@FE|c|*|Patria del Guercino e di un carnevale gemellato con quello di Rio.",
  ] },
  { from: "maggiore", side: "E", prov: "BO", places: [
    "Granarolo dell'Emilia|p", "Budrio|p|*|Qui si fabbricano ocarine da più di centocinquant'anni.", "Mezzolara|p|fz:Budrio",
  ] },
  { from: "budrio", side: "N", prov: "BO", places: ["Molinella|f", "Marmorta|f|fz:Molinella"] },
  { from: "altedo", side: "E", prov: "BO", places: ["Malalbergo|p", "Baricella|p"] },
  { from: "altedo", side: "W", prov: "FE", places: ["Poggio Renatico|p"] },
  { from: "osteria", side: "N", prov: "BO", places: [
    "Medicina|p|*|Qui ci sono grandi radiotelescopi: ascoltano le stelle, e pure i pettegolezzi del bar.",
    "Villafontana|p|fz:Medicina", "Buda|p|fz:Medicina",
  ] },
  { from: "osteria", side: "S", prov: "BO", places: ["Varignana|h|fz:Castel San Pietro Terme", "Palesio|h|fz:Castel San Pietro Terme"] },
  { from: "csp", side: "S", prov: "BO", places: ["Dozza|h|Il borgo dei muri dipinti: ogni casa è un quadro."] },
  { from: "csp", side: "N", prov: "BO", places: ["Gallo Bolognese|p|fz:Castel San Pietro Terme", "Castel Guelfo di Bologna|p|Si viene per i saldi all'outlet, si resta per la piadina."] },
  { from: "imola", side: "S", prov: "BO", places: [
    "Casalfiumanese|h", "Borgo Tossignano|h", "Fontanelice|a",
    "Castel del Rio|a|Il Ponte degli Alidosi: un arco solo, alto e spavaldo, dal Cinquecento.",
  ] },

  // ---- Romagna: the Via Emilia from Imola to the coast
  { from: "imola", side: "E", prov: "RA", to: "riviera", places: [
    "Castel Bolognese|p", "Faenza|c|*|Città delle ceramiche: la parola francese faïence viene da qui.",
    "Forlì@FC|c|*|La Rocca di Ravaldino, dove comandava Caterina Sforza.",
    "Forlimpopoli@FC|p|Patria di Pellegrino Artusi, che scrisse il ricettario di tutti gli italiani.",
    "Cesena@FC|c|*|La Biblioteca Malatestiana, antichissima biblioteca aperta alla città.",
    "Savignano sul Rubicone@FC|p|Qui scorre il Rubicone: Cesare lo passò e il dado fu tratto.",
  ] },
  { from: "castel_bolognese", side: "S", prov: "RA", places: ["Riolo Terme|h", "Casola Valsenio|a|Il paese delle erbe officinali."] },
  { from: "faenza", side: "S", prov: "RA", places: ["Brisighella|h|*|Tre colli: la Rocca, il Santuario e la Torre dell'Orologio.", "Fognano|h|fz:Brisighella"] },
  { from: "forli", side: "S", prov: "FC", places: [
    "Castrocaro Terme|h|Terme e un famoso concorso per voci nuove.", "Dovadola|a", "Rocca San Casciano|a",
    "Portico di Romagna|a|fz:Portico e San Benedetto",
  ] },
  { from: "castrocaro_terme", side: "E", prov: "FC", places: [
    "Predappio|h|*|Paese di colline e di Sangiovese. Il resto della sua storia lo trovi nei libri, non nei negozi di souvenir.",
  ] },
  { from: "forlimpopoli", side: "S", prov: "FC", places: ["Bertinoro|h|Il balcone della Romagna, con la colonna degli anelli dell'ospitalità."] },
  { from: "cesena", side: "S", prov: "FC", places: [
    "Mercato Saraceno|h", "Sarsina|a|Patria di Plauto, che faceva ridere i Romani.",
    "Bagno di Romagna|a|*|Terme in mezzo alle foreste.", "San Piero in Bagno|a|fz:Bagno di Romagna",
  ] },
  { from: "cesena", side: "N", prov: "FC", places: [
    "Cesenatico|m|Il porto canale che, si racconta, fu disegnato da Leonardo da Vinci.",
    "Cervia@RA|m|*|Città del sale: le saline sono qui da secoli.", "Milano Marittima@RA|m|fz:Cervia",
  ] },
  { from: "imola", side: "N", prov: "RA", to: "ravenna", toSide: "W", places: [
    "Mordano@BO|p", "Massa Lombarda|p", "Lugo|p|*|Patria di Francesco Baracca, l'asso del cavallino rampante.",
    "Bagnacavallo|p", "Russi|p",
  ] },
  { from: "lugo", side: "E", prov: "RA", places: ["Fusignano|p|Paese natale di Arcangelo Corelli, violinista barocco.", "Alfonsine|f"] },
  { from: "ravenna", side: "N", prov: "RA", places: ["Sant'Alberto|f|fz:Ravenna", "Mandriole|f|fz:Ravenna"] },
  { from: "ravenna", side: "E", prov: "RA", places: ["Marina di Ravenna|m|fz:Ravenna", "Punta Marina|m|fz:Ravenna", "Lido Adriano|m|fz:Ravenna"] },
  { from: "riviera", side: "E", prov: "RN", places: [
    "Rimini|c|*|Il Ponte di Tiberio regge da duemila anni. Altro che i cantieri di oggi.",
    "Riccione|m|*|La Perla Verde dell'Adriatico.", "Misano Adriatico|m|Rombo di moto: qui c'è il circuito.", "Cattolica|m|*",
  ] },
  { from: "rimini", side: "S", prov: "RN", places: [
    "Verucchio|h|Culla dei Malatesta, con una rocca che guarda il mare.",
    "San Leo|a|La fortezza sulla rupe dove fu rinchiuso Cagliostro.", "Novafeltria|a", "Pennabilli|a",
  ] },
  { from: "verucchio", side: "W", prov: "RN", places: ["Santarcangelo di Romagna|h|*|Teatro in piazza ogni estate e grotte scavate sotto il paese."] },
  { from: "rimini", side: "N", prov: "RN", places: ["Viserba|m|fz:Rimini", "Torre Pedrera|m|fz:Rimini", "Bellaria-Igea Marina|m"] },
  { from: "cattolica", side: "S", prov: "RN", places: ["San Giovanni in Marignano|h", "Saludecio|h", "Mondaino|h|Ogni estate il Palio del Daino.", "Montegridolfo|h"] },

  // ---- Ferrara and the Po delta
  { from: "ferrara", side: "W", prov: "FE", places: [
    "Bondeno|p", "Finale Emilia@MO|p", "Mirandola@MO|c|*|Patria di Pico, quello dalla memoria prodigiosa.", "Concordia sulla Secchia@MO|p",
  ] },
  { from: "ferrara", side: "E", prov: "FE", places: [
    "Voghiera|p", "Portomaggiore|p", "Ostellato|f", "Comacchio|f|*|La piccola Venezia: canali, ponti e anguille marinate.",
    "Porto Garibaldi|m|fz:Comacchio", "Lido degli Estensi|m|fz:Comacchio", "Lido di Spina|m|fz:Comacchio",
  ] },
  { from: "ferrara", side: "N", prov: "FE", places: [
    "Copparo|p", "Jolanda di Savoia|p", "Codigoro|f",
    "Pomposa|f|fz:Codigoro|Nell'abbazia visse Guido d'Arezzo, che diede il nome alle note musicali.",
    "Goro|f|Il regno delle vongole.", "Gorino|f|fz:Goro",
  ] },

  // ---- Modena and its province
  { from: "modena", side: "S", prov: "MO", places: [
    "Formigine|p", "Maranello|c|*|Qui nascono le auto rosse col cavallino.", "Serramazzoni|h", "Pavullo nel Frignano|a|*",
    "Lama Mocogno|a", "Sestola|a|Sotto il Monte Cimone, la vetta più alta dell'Emilia-Romagna.", "Fanano|a",
  ] },
  { from: "maranello", side: "W", prov: "MO", places: [
    "Fiorano Modenese|p", "Sassuolo|c|*|Capitale delle piastrelle: qui anche i pavimenti si vantano.",
    "Scandiano@RE|h|Patria di Matteo Maria Boiardo, quello dell'Orlando innamorato.",
  ] },
  { from: "formigine", side: "E", prov: "MO", places: ["Spilamberto|p", "Vignola|p|*|Le ciliegie più famose d'Italia.", "Savignano sul Panaro|h"] },
  { from: "modena", side: "N", prov: "MO", places: ["Soliera|p", "Carpi|c|*|Una delle piazze più grandi d'Italia.", "Novi di Modena|p"] },

  // ---- Reggio Emilia (between Modena and Parma)
  { from: "modena", side: "W", prov: "RE", to: "parma", places: [
    "Rubiera|p", "Reggio Emilia|c|*|Qui nel 1797 nacque il Tricolore.", "Sant'Ilario d'Enza|p",
  ] },
  { from: "reggio_emilia", side: "S", prov: "RE", places: [
    "Albinea|h", "Quattro Castella|h|Ogni anno un corteo storico in onore di Matilde di Canossa.",
    "Canossa|h|Nel 1077 un imperatore aspettò qui tre giorni nella neve. Da allora si dice 'andare a Canossa'.",
    "Castelnovo ne' Monti|a|*|Ai piedi della Pietra di Bismantova, citata pure da Dante.", "Cerreto Laghi|a|fz:Ventasso",
  ] },
  { from: "reggio_emilia", side: "N", prov: "RE", places: [
    "Correggio|p|Patria del pittore che si chiamava come il paese.", "Novellara|p", "Guastalla|p|*", "Luzzara|p",
  ] },
  { from: "novellara", side: "W", prov: "RE", places: [
    "Gualtieri|f|Il pittore Antonio Ligabue dipingeva tigri lungo il Po.", "Brescello|f|Qui furono girati i film di Don Camillo e Peppone.",
  ] },

  // ---- Parma and Piacenza
  { from: "parma", side: "W", prov: "PR", places: [
    "Fidenza|c|*", "Fiorenzuola d'Arda@PC|p", "Cadeo@PC|p",
    "Piacenza@PC|c|*|La Primogenita: la prima città a votare l'unione al Piemonte, nel 1848.",
    "Rottofreno@PC|p", "Castel San Giovanni@PC|p",
  ] },
  { from: "fidenza", side: "S", prov: "PR", places: [
    "Salsomaggiore Terme|h|*|Terme in stile liberty e acque salsobromoiodiche.", "Pellegrino Parmense|a",
    "Bardi|a|Un castello arroccato su una rupe di diaspro rosso.",
  ] },
  { from: "fiorenzuola_d_arda", side: "S", prov: "PC", places: ["Castell'Arquato|h|Borgo medievale da film: la rocca e la piazza in salita.", "Lugagnano Val d'Arda|a"] },
  { from: "cadeo", side: "S", prov: "PC", places: ["Grazzano Visconti|h|fz:Vigolzone|Sembra medievale, ma è stato costruito agli inizi del Novecento.", "Vigolzone|h"] },
  { from: "piacenza", side: "S", prov: "PC", places: ["Rivergaro|h", "Travo|h", "Bobbio|a|*|Il Ponte Gobbo e l'abbazia di San Colombano.", "Ottone|a"] },
  { from: "parma", side: "S", prov: "PR", places: [
    "Collecchio|p", "Langhirano|h|*|Il prosciutto qui stagiona all'aria buona della valle.", "Tizzano Val Parma|a", "Corniglio|a",
    "Lagdei|a|fz:Corniglio|Faggete e laghetti di montagna.",
  ] },
  { from: "parma", side: "N", prov: "PR", places: [
    "Colorno|p|La Reggia, detta la piccola Versailles dei duchi.", "Sissa Trecasali|f", "Roccabianca|f",
    "Zibello|f|fz:Polesine Zibello|Patria del culatello, il re dei salumi.", "Busseto|p|*|Terra di Giuseppe Verdi.",
  ] },
];

// Capopalestra of the new big cities. Each one gives a new Sigillo.
const BOSSES: Record<string, { name: string; badge: string; look: [string, string]; types: TypeId[]; lines: string[]; after: string[] }> = {
  reggio_emilia: {
    name: "Erminia dell'Erbazzone", badge: "Sigillo del Tricolore", look: ["#2e7d32", "#c0392b"], types: ["campi", "sugo"],
    lines: ["Il Parmigiano? Reggiano, prego. Quelli di Parma se lo scordano.", "Qui è nato il Tricolore: verde come le mie erbette, bianco come il formaggio, rosso come la tua faccia quando perdi!"],
    after: ["Va bene, hai vinto. Prendi il Sigillo del Tricolore.", "Ma una fetta di erbazzone la mangi lo stesso, che sei sciupato."],
  },
  piacenza: {
    name: "Gutturnio della Primogenita", badge: "Sigillo della Primogenita", look: ["#7b1f3a", "#4e2e18"], types: ["sugo", "nebbia"],
    lines: ["Lombardi? Emiliani? Noi siamo piacentini, e basta così.", "Pisarei e fasö a pranzo, una lotta al pomeriggio. Sei tu il pomeriggio."],
    after: ["Bella lotta. Prendi il Sigillo della Primogenita.", "E brinda con un Gutturnio, ma solo se hai l'età."],
  },
  forli: {
    name: "Caterina della Rocca", badge: "Sigillo della Tigre", look: ["#1a1a1a", "#c0392b"], types: ["chiacchiera", "motore"],
    lines: ["Mi chiamavano la Tigre di Forlì. Indovina perché.", "Dalla Rocca di Ravaldino ho visto passare eserciti interi. Tu non mi spaventi."],
    after: ["Hai il cuore di un condottiero. Prendi il Sigillo della Tigre.", "Ora sparisci, prima che cambi idea."],
  },
  predappio: {
    name: "Zio DUC", badge: "Sigillo del Balcone", look: ["#1a1a1a", "#1a1a1a"], types: ["chiacchiera"],
    lines: [
      "Ah, un visitatore! Nel MIO paese mi conoscono tutti... soprattutto quelli dei negozi di souvenir.",
      "Ogni mattina mi affaccio al balcone e parlo alla folla. Oggi la folla sei tu, quindi ascolta bene e poi perdi!",
    ],
    after: [
      "Sconfitto. Di nuovo. La storia, si vede, non mi dà mai ragione.",
      "Prendi il Sigillo e vai, prima che torni sul balcone a parlare per altre tre ore.",
    ],
  },
  rimini: {
    name: "Federico del Grand Hotel", badge: "Sigillo dell'Amarcord", look: ["#1a1a1a", "#ffffff"], types: ["terme", "chiacchiera"],
    lines: ["Ah, la Rimini d'inverno: nebbia, ricordi e un pavone che passa.", "Questa lotta la giriamo in un'unica ripresa. Azione!"],
    after: ["Stop! Buona la prima. Prendi il Sigillo dell'Amarcord.", "Me lo ricorderò, come si ricordano le estati da ragazzi."],
  },
};
export const W_BADGES = Object.values(BOSSES).map((b) => b.badge);

// ---- Hand-drawn places (replace the generated drawing; exits are added later as usual).
// Predappio: the square with the fountain and the porticoes, the church with its bell tower, the big
// gym palace with a balcony (Zio DUC watches from up there), houses and the souvenir shop.
type Craft = { tiles: string[]; npcs: Record<string, [number, number]>; heal: [number, number]; sign: [number, number]; reserve?: { door: [number, number]; to: string } };
const CRAFT: Record<string, Craft> = {
  predappio: {
    tiles: [
      "TTTTTTTTTTTTTTTT",
      "TFB,,RRRRRR,RRRT",
      "T,BR,RRRRRR,HDHT",
      "T,HDFHH==HH,,.,T",
      "T,..,HHHDHH,,.,T",
      "T,.,ICCCCCCCI.,T",
      "T,.,CCCCCCCCC.,T",
      "T,.,CCCWWCCCC.,T",
      "....CCCWWCCCC.,T",
      "T,S,CCCCCCCCC.,T",
      "T,,,PPPPPPPPP,,T",
      "T,RRR,,,,,TT!TTT",
      "T,HDH,RRR,TF,,FT",
      "T,,.,,HDH,T,,,,T",
      "TF,,,,,.,,TF,,FT",
      "TTTTTTTTTTTTTTTT",
    ],
    // healer and shop on the square, the two trainers at the edges
    npcs: { cura: [11, 9], bottega: [5, 9], t0: [1, 10], t1: [13, 7] },
    heal: [10, 9],
    sign: [2, 9],
    reserve: { door: [8, 4], to: "predappio__palestra" },
  },
};

function applyCraft(m: GameMap, id: string) {
  const c = CRAFT[id];
  if (!c) return;
  m.tiles = [...c.tiles];
  for (const n of m.npcs) {
    const key = n.id.slice(id.length + 1);
    if (c.npcs[key]) [n.x, n.y] = c.npcs[key];
  }
  m.heal = { x: c.heal[0], y: c.heal[1] };
  const text = Object.values(m.signs)[0];
  m.signs = text ? { [`${c.sign[0]},${c.sign[1]}`]: text } : {};
  m.pickups = [];
  // The gym door leads straight into the hall (built later by buildGyms).
  if (c.reserve) m.exits.push({ x: c.reserve.door[0], y: c.reserve.door[1], to: c.reserve.to, tx: 7, ty: 14 });
}

// ---- Helpers
export const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;
const pick = <T,>(r: R, a: readonly T[]) => a[Math.floor(r() * a.length)];

const OPP: Record<Side, Side> = { N: "S", S: "N", E: "W", W: "E" };
const EDGE: Record<Side, [number, number]> = { N: [7, 0], S: [7, 15], W: [0, 8], E: [15, 8] };
const INSIDE: Record<Side, [number, number]> = { N: [7, 1], S: [7, 14], W: [1, 8], E: [14, 8] };
const STEP_IN: Record<Side, [number, number]> = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const BLOCK = new Set(["T", "W", "R", "H", "D", "B", "S", "O", "U", "X", "K", "M", "N", "J", "I", "=", "%", "&", "^", "!"]);

function sideOf(x: number, y: number): Side | null {
  for (const s of ["N", "S", "E", "W"] as Side[]) if (EDGE[s][0] === x && EDGE[s][1] === y) return s;
  return null;
}

// Opens a passage on the edge of a hand-drawn map, walking inwards until it meets open ground.
function carve(m: GameMap, side: Side) {
  const rows = m.tiles.map((r) => r.split(""));
  let [x, y] = EDGE[side];
  const [dx, dy] = STEP_IN[side];
  for (let i = 0; i < 8; i++) {
    const ch = rows[y][x];
    const npcHere = m.npcs.some((n) => n.x === x && n.y === y);
    if (i > 0 && !BLOCK.has(ch) && !npcHere) break;
    rows[y][x] = ch === "Y" || ch === "Q" ? "Y" : ".";
    if (npcHere) { const n = m.npcs.find((q) => q.x === x && q.y === y)!; n.x += dy !== 0 ? 1 : 0; n.y += dx !== 0 ? 1 : 0; }
    x += dx; y += dy;
  }
  m.tiles = rows.map((r) => r.join(""));
}

function setExit(m: GameMap, side: Side, to: string, arriveSide: Side) {
  const [x, y] = EDGE[side];
  const [tx, ty] = INSIDE[arriveSide];
  m.exits = m.exits.filter((e) => sideOf(e.x, e.y) !== side);
  m.exits.push({ x, y, to, tx, ty });
}

// ---- Map drawing
type Grid = string[][];
const inQ = { TL: [1, 1, 5, 6], TR: [9, 1, 6, 6], BL: [1, 10, 5, 5], BR: [9, 10, 6, 5] } as const; // x, y, w, h

function fill(g: Grid, x: number, y: number, w: number, h: number, ch: string, r?: R, dens = 1) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!r || r() < dens) g[j][i] = ch;
}
function house(g: Grid, x: number, y: number) {
  g[y][x] = "R"; g[y][x + 1] = "R"; g[y][x + 2] = "R";
  g[y + 1][x] = "H"; g[y + 1][x + 1] = "D"; g[y + 1][x + 2] = "H";
}

type Feature = "houses" | "house" | "grass" | "woods" | "pond" | "flowers" | "valley" | "beachy";
const PLAN: Record<Terrain, Feature[]> = {
  c: ["houses", "houses", "houses", "grass", "flowers"],
  p: ["grass", "grass", "house", "pond", "flowers"],
  h: ["grass", "woods", "house", "flowers", "grass"],
  a: ["woods", "woods", "grass", "grass", "house"],
  m: ["house", "grass", "houses", "flowers"],
  f: ["valley", "valley", "grass", "house"],
};

function drawQuadrant(g: Grid, f: Feature, q: readonly [number, number, number, number], r: R, base: string) {
  const [x, y, w, h] = q;
  switch (f) {
    case "houses":
      house(g, x, y); if (w >= 6) house(g, x + 3, y + 3); else house(g, x + 1, y + 3);
      break;
    case "house":
      house(g, x + Math.floor(r() * (w - 2)), y + Math.floor(r() * (h - 2)));
      fill(g, x, y + h - 1, w, 1, "F", r, 0.4);
      break;
    case "grass":
      fill(g, x, y + 1, w, h - 1, base === "Y" ? "Q" : "G", r, 0.92);
      break;
    case "woods":
      fill(g, x, y, w, h, "T", r, 0.55);
      fill(g, x + 1, y + 1, w - 2, h - 2, "G", r, 0.35);
      break;
    case "pond":
      fill(g, x + 1, y + 1, Math.min(3, w - 1), 2, "W");
      fill(g, x, y + 4, w, Math.max(1, h - 4), "G", r, 0.8);
      break;
    case "flowers":
      fill(g, x, y, w, h, "F", r, 0.3);
      fill(g, x, y + 2, w, 2, "G", r, 0.8);
      break;
    case "valley":
      fill(g, x, y, w, Math.ceil(h / 2), "W");
      fill(g, x, y + Math.ceil(h / 2), w, Math.floor(h / 2), "G", r, 0.9);
      break;
    case "beachy":
      fill(g, x, y, w, h, "Y");
      fill(g, x, y + 1, w, h - 2, "Q", r, 0.5);
      for (let i = 0; i < 2; i++) g[y + Math.floor(r() * h)][x + Math.floor(r() * w)] = "U";
      break;
  }
}

function drawMap(t: Terrain, sides: Side[], seed: number): string[] {
  const r = rng(seed);
  const coast = t === "m" && !sides.includes("S");
  const base = t === "m" && !coast ? "Y" : ",";
  const g: Grid = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => (x === 0 || y === 0 || x === 15 || y === 15 ? "T" : base)));
  const plan = [...PLAN[t]].sort(() => r() - 0.5);
  const quads: (keyof typeof inQ)[] = coast ? ["TL", "TR"] : ["TL", "TR", "BL", "BR"];
  quads.forEach((q, i) => drawQuadrant(g, plan[i % plan.length], inQ[q], r, base));
  // Always some tall grass for wild Mostrelli.
  if (!g.some((row) => row.includes("G") || row.includes("Q"))) fill(g, 1, 10, 5, 3, base === "Y" ? "Q" : "G");
  if (coast) {
    for (let y = 10; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (y >= 13) g[y][x] = "O";
      else if (x > 0 && x < 15) g[y][x] = y === 10 ? "Y" : r() < 0.12 ? "U" : r() < 0.35 ? "Q" : "Y";
    }
  }
  // Roads from every exit to the centre (cobbles in towns).
  const road = t === "c" ? "C" : base === "Y" ? "Y" : ".";
  for (const s of sides) {
    const [ex, ey] = EDGE[s];
    if (s === "N" || s === "S") for (let y = Math.min(ey, 8); y <= Math.max(ey, 8); y++) g[y][7] = road;
    else for (let x = Math.min(ex, 7); x <= Math.max(ex, 7); x++) g[8][x] = road;
  }
  if (t === "c") fill(g, 6, 7, 3, 3, "C");
  // Rows 7 and 9 and columns 6 and 8 stay open: they hold NPCs and keep every corner reachable.
  for (let i = 1; i < 15; i++) {
    for (const yy of [7, 9]) if (g[yy][i] !== "C" && BLOCK.has(g[yy][i])) g[yy][i] = base;
    for (const xx of [6, 8]) if (i < 10 || !coast) { if (g[i][xx] !== "C" && BLOCK.has(g[i][xx])) g[i][xx] = base; }
  }
  g[9][9] = "S";
  return g.map((row) => row.join(""));
}

// ---- People
type Arche = { n: string; lines: string[]; after: string[] };
const TRAINERS: Record<Terrain, Arche[]> = {
  c: [
    { n: "Umarell di {X}", lines: ["Quel cantiere lì lo seguo da tre anni. Tu invece mi sembri un lavoro finito male."], after: ["Va bene, torno al cantiere. Almeno lì ho sempre ragione io."] },
    { n: "Barista di {X}", lines: ["Caffè, cappuccino o una lotta? Qui serviamo tutto, ma la lotta è corretta."], after: ["Hai vinto. Il caffè però lo paghi."] },
    { n: "Vigile di {X}", lines: ["Sosta vietata! Anche per i Mostrelli. Documenti e lotta, prego."], after: ["Per stavolta niente multa. Circolare!"] },
    { n: "Studentessa di {X}", lines: ["Domani ho l'esame. Oggi ho bisogno di sfogarmi. Tu vai benissimo."], after: ["Ecco, ora sono pure in ansia per la lotta persa."] },
  ],
  p: [
    { n: "Contadino di {X}", lines: ["Qui la terra è piatta come la tua strategia. Vediamo."], after: ["Bravo. Torno sul trattore, che il campo non si ara da solo."] },
    { n: "Trattorista della Bassa", lines: ["Vado a quindici all'ora, ma in lotta sono un fulmine!"], after: ["Che botta. Mi sa che passo dal meccanico."] },
    { n: "Ciclista di {X}", lines: ["Qui si va in bici anche sotto la nebbia. Le gambe ce le ho, la lotta pure."], after: ["Ho perso, ma almeno è tutto in pianura."] },
  ],
  h: [
    { n: "Vignaiolo di {X}", lines: ["La vendemmia è finita, ma ho ancora energie da spremere."], after: ["Annata storta. Succede."] },
    { n: "Cercatore di Funghi", lines: ["Dove sono i porcini? Non te lo dico. Però lottiamo."], after: ["Va bene, ti dico solo che sono nel bosco. Fine."] },
    { n: "Escursionista della Domenica", lines: ["Scarponi nuovi, bastoncini nuovi, zaino nuovo. Esperienza: zero. Lottiamo!"], after: ["Torno in macchina. Era vicina, per fortuna."] },
  ],
  a: [
    { n: "Boscaiolo di {X}", lines: ["Taglio legna dalle cinque. Sono sveglio e di cattivo umore."], after: ["Hai vinto. Ti spetta una fetta di torta di castagne."] },
    { n: "Rifugista di {X}", lines: ["Polenta, tagliatelle ai funghi e una lotta. Il menù è fisso."], after: ["Bella lotta. Il conto è sul tavolo."] },
    { n: "Sciatore Fuori Stagione", lines: ["La neve non c'è, ma la voglia di vincere sì!"], after: ["Aspetterò l'inverno. E la rivincita."] },
  ],
  m: [
    { n: "Bagnino di {X}", lines: ["Fischietto al collo e occhio di falco. Nessuno annega nella mia lotta, al massimo perde."], after: ["Bandiera rossa per me. Hai vinto tu."] },
    { n: "Venditore di Cocco", lines: ["Cocco bello! Cocco fresco! E lotte calde, caldissime!"], after: ["Ti regalo un pezzo di cocco. È tutto quello che mi resta."] },
    { n: "Turista Tedesca", lines: ["Ja! Trentesima estate qui. Conosco ogni ombrellone. E ogni Mostrello!"], after: ["Nein! Domani lettino alle sei, per consolarmi."] },
  ],
  f: [
    { n: "Pescatore delle Valli", lines: ["Le anguille sono furbe. Tu un po' meno, spero."], after: ["Niente pesce e niente vittoria. Giornata storta."] },
    { n: "Guardiano dell'Argine", lines: ["Controllo l'argine da quando ero ragazzo. Anche la tua squadra la controllo."], after: ["Argine tenuto, lotta persa. Mi accontento."] },
    { n: "Birdwatcher di {X}", lines: ["Shhh, c'è un airone. Lottiamo piano, per favore."], after: ["È volato via. Colpa tua e della tua vittoria."] },
  ],
};
const HEALERS: Record<Terrain, string> = { c: "Sfoglina di {X}", p: "Rezdora di {X}", h: "Nonna di {X}", a: "Rifugista di {X}", m: "Piadinara di {X}", f: "Ostessa di {X}" };
const HEAL_LINES = [
  "Siediti, che ti preparo qualcosa di caldo. Con quella faccia non vai da nessuna parte.",
  "Ecco fatto: squadra in forma. E adesso mangia, che sei pelle e ossa.",
];
const SHOPS: Record<Terrain, string> = { c: "Bottega di {X}", p: "Alimentari di {X}", h: "Bottega di {X}", a: "Emporio di {X}", m: "Chiosco di {X}", f: "Spaccio di {X}" };
const LOOKS: [string, string][] = [["#c0392b", "#1565c0"], ["#2e7d32", "#fbc02d"], ["#7b4a2a", "#ffffff"], ["#1a1a1a", "#e0913a"], ["#8e24aa", "#4caf50"], ["#616161", "#c0392b"], ["#fbc02d", "#2e7d32"]];
const L = ([A, C]: [string, string]) => ({ A, C });

const KIND: Record<Terrain, string> = { c: "città", p: "paese della Bassa", h: "paese di collina", a: "paese di montagna", m: "località di mare", f: "paese delle valli e dei fiumi" };
const MUSIC: Record<Terrain, string> = { c: "town", p: "altedo", h: "osteria", a: "terme", m: "beach", f: "ferrara" };
const T_TYPES: Record<Terrain, TypeId[]> = {
  c: ["sugo", "chiacchiera", "motore"], p: ["campi", "nebbia", "sugo"], h: ["campi", "terme", "sugo"],
  a: ["campi", "terme", "nebbia"], m: ["terme", "chiacchiera"], f: ["nebbia", "campi"],
};

// ---- Building
type Place = { id: string; name: string; prov: string; t: Terrain; big: boolean; fraz?: string; fact?: string };
function parse(line: string, prov: string): Place {
  const [raw, t, ...opts] = line.split("|");
  const [name, p] = raw.split("@");
  const place: Place = { id: slug(name), name, prov: p ?? prov, t: t as Terrain, big: false };
  for (const o of opts) {
    if (o === "*") place.big = true;
    else if (o.startsWith("fz:")) place.fraz = o.slice(3);
    else place.fact = o;
  }
  return place;
}

const minLv = (m: GameMap) => Math.min(...m.wild.map((w) => w[1]));

export function buildWorld(maps: Record<string, GameMap>, species: Species[]) {
  for (const [id, p] of Object.entries(BASE_PROV)) if (maps[id]) maps[id].prov = p;
  maps.riviera.field = "beach";
  const evoTargets = new Set(species.map((s) => s.evo?.to).filter(Boolean) as string[]);
  const byId = Object.fromEntries(species.map((s) => [s.id, s]));
  const base = (types: TypeId[]) => species.filter((s) => types.includes(s.type) && !evoTargets.has(s.id));
  const grow = (sid: string, lv: number) => {
    let s = byId[sid];
    while (s?.evo && lv >= s.evo.lv && byId[s.evo.to]) s = byId[s.evo.to];
    return s?.id ?? sid;
  };
  const coastWild = maps.riviera.wild.map((w) => w[0]);
  const valleyWild = maps.ferrara.wild.map((w) => w[0]);

  // Pass 1: every place, its level and ALL its sides (a later route may start from it).
  type Info = { p: Place; lv: number };
  const info: Record<string, Info> = {};
  const sidesOf: Record<string, Set<Side>> = {};
  const addSide = (id: string, s: Side) => (sidesOf[id] ??= new Set()).add(s);
  const levelOf = (id: string) => info[id]?.lv ?? minLv(maps[id]);
  for (const route of ROUTES) {
    if (!maps[route.from] && !info[route.from]) throw new Error(`world: unknown map ${route.from}`);
    const places = route.places.map((l) => parse(l, route.prov));
    const lv0 = levelOf(route.from);
    const lv1 = route.to ? levelOf(route.to) : undefined;
    addSide(route.from, route.side);
    places.forEach((p, i) => {
      if (maps[p.id] || info[p.id]) throw new Error(`world: duplicate place ${p.id}`);
      // Mostrelli stop at level 50: places far from the start top out at 45 (wild up to 48).
      const lv = Math.min(45, lv1 !== undefined ? Math.round(lv0 + ((lv1 - lv0) * (i + 1)) / (places.length + 1)) : lv0 + 1 + i * 2);
      info[p.id] = { p, lv };
      addSide(p.id, OPP[route.side]);
      if (i < places.length - 1 || route.to) addSide(p.id, route.side);
    });
  }
  // Pass 2: draw and fill every place.
  for (const { p, lv } of Object.values(info)) {
    {
      const r = rng(hashStr(p.id));
      const tiles = drawMap(p.t, [...sidesOf[p.id]], hashStr(p.id));
      // Wild Mostrelli: local types, plus the coast or valley regulars where it fits.
      const pool = base(T_TYPES[p.t]).map((s) => s.id);
      if (p.t === "m") pool.push(...coastWild);
      if (p.t === "f") pool.push(...valleyWild);
      // Regional Mostrelli of this province always live here (one or two of them).
      const local = base(["sugo", "campi", "terme", "motore", "nebbia", "chiacchiera"]).filter((x) => N_HOME[x.id]?.includes(p.prov)).map((x) => x.id).sort(() => r() - 0.5).slice(0, 2);
      const chosen = [...new Set([...local, ...[...pool].sort(() => r() - 0.5)])].slice(0, 6);
      const wild: [string, number, number, number][] = chosen.map((sid, k) => [grow(sid, lv), lv, lv + 3, k < 2 ? 3 : 2]);
      const X = p.name;
      const fill = (s: string) => s.replace(/\{X\}/g, X);
      const npcs: Npc[] = [];
      const look = () => L(pick(r, LOOKS));
      if (p.big) {
        npcs.push({ id: `${p.id}_cura`, x: 5, y: 7, name: fill(HEALERS[p.t]), look: L(["#ffffff", "#c0392b"]), kind: "heal", lines: HEAL_LINES });
        npcs.push({ id: `${p.id}_bottega`, x: 9, y: 7, name: fill(SHOPS[p.t]), look: L(["#ffffff", "#7b4a2a"]), kind: "shop", lines: [`Benvenuto a ${X}! Cosa ti serve per il viaggio?`] });
      }
      const nTrainers = p.big ? 2 : r() < 0.75 ? 1 : 0;
      const spots: [number, number][] = [[3, 9], [12, 7]];
      for (let k = 0; k < nTrainers; k++) {
        const a = pick(r, TRAINERS[p.t]);
        const team: [string, number][] = [[grow(pick(r, chosen), lv + 1), lv + 1]];
        if (r() < 0.6 || p.big) team.push([grow(pick(r, chosen), lv + 2), lv + 2]);
        npcs.push({ id: `${p.id}_t${k}`, x: spots[k][0], y: spots[k][1], name: fill(a.n), look: look(), kind: "trainer", lines: a.lines.map(fill), after: a.after.map(fill), team, reward: 30 + lv * 12 });
      }
      const boss = BOSSES[p.id];
      if (boss) {
        const pool2 = base(boss.types).map((s) => s.id);
        const team: [string, number][] = [0, 1, 2].map((k) => [grow(pool2[(hashStr(p.id) + k * 7) % pool2.length], Math.min(50, lv + 3 + k)), Math.min(50, lv + 3 + k)]);
        npcs.push({ id: `${p.id}_capo`, x: 11, y: 9, name: boss.name, look: L(boss.look), kind: "boss", badge: boss.badge, lines: boss.lines, after: boss.after, team, reward: 300 + lv * 25, prize: ["caramella", 2] });
      }
      const sign = `${X.toUpperCase()}: ${p.fraz ? `frazione di ${p.fraz}` : KIND[p.t]}, provincia di ${PROVINCES[p.prov] ?? p.prov}.${p.fact ? ` ${p.fact}` : ""}`;
      const pickups = r() < 0.4 ? [{ id: `${p.id}_pk`, x: r() < 0.5 ? 2 : 13, y: r() < 0.5 ? 7 : 9, item: (r() < 0.15 ? "caramella" : pick(r, ["vasetto", "brodino", "tortellini"] as const)) as ItemId }] : [];
      maps[p.id] = {
        id: p.id, name: X, tiles, exits: [], heal: { x: 5, y: 8 }, wild, music: MUSIC[p.t], npcs, signs: { "9,9": sign }, pickups,
        prov: p.prov, terrain: p.t, fraz: p.fraz, field: p.t === "m" ? "beach" : "grass",
      };
    }
  }
  for (const id of Object.keys(CRAFT)) if (maps[id]) applyCraft(maps[id], id);
  // Pass 3: links along each route.
  for (const route of ROUTES) {
    const places = route.places.map((l) => parse(l, route.prov));
    const ids = [route.from, ...places.map((p) => p.id), ...(route.to ? [route.to] : [])];
    for (let i = 0; i < ids.length - 1; i++) {
      const a = maps[ids[i]], b = maps[ids[i + 1]];
      const arrive = i === ids.length - 2 && route.toSide ? route.toSide : OPP[route.side];
      if (!a.terrain) carve(a, route.side);
      if (!b.terrain) carve(b, arrive);
      setExit(a, route.side, b.id, arrive);
      setExit(b, arrive, a.id, route.side);
    }
  }
}
