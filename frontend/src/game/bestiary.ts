// New Mostrelli: 18 evolution lines (36 + 3 third stages = 39 species), each tied to its own corner of
// Emilia-Romagna. Names, descriptions and homes are written by hand; drawings come from spriteGen.
import type { Species, TypeId } from "./data";
import { makeSprite, Recipe } from "./spriteGen";

type Form = { id: string; name: string; desc: string };
type Line = { type: TypeId; home: string[]; base: Form; evo: Form & { lv: number }; third?: Form & { lv: number }; rc: Omit<Recipe, "seed" | "acc">; acc: Recipe["acc"]; acc3?: Recipe["acc"]; stats: [number, number, number, number] };

export const LINES: Line[] = [
  { type: "sugo", home: ["RN", "FC", "RA"], stats: [55, 55, 45, 60], rc: { body: "e", shade: "o", light: "w", shape: "wide", feet: true, mouth: "smile" }, acc: "crown", acc3: "halo",
    base: { id: "piadinetta", name: "Piadinetta", desc: "Piadina sottile appena tolta dalla teglia. Discute con tutti su quanto debba essere spessa." },
    evo: { id: "piadinona", name: "Piadinona", lv: 18, desc: "Piadina farcita fino all'orlo. Squacquerone e rucola, il prosciutto si paga a parte." },
    third: { id: "piadinissima", name: "Piadinissima", lv: 34, desc: "La regina dei chioschi della Riviera. Sotto l'ombrellone la riconoscono tutti." } },
  { type: "sugo", home: ["PC", "PR"], stats: [60, 50, 55, 45], rc: { body: "y", shade: "o", light: "e", shape: "round", ears: "round", mouth: "open" }, acc: "hat",
    base: { id: "anolino", name: "Anolino", desc: "Piccolo anolino in brodo di terza. Guai a chi lo chiama cappelletto." },
    evo: { id: "anolone", name: "Anolone", lv: 20, desc: "Anolino della domenica, ripieno di stracotto cotto per tre giorni. Ha la pazienza di un santo." } },
  { type: "sugo", home: ["PC"], stats: [50, 60, 50, 50], rc: { body: "t", shade: "b", light: "e", shape: "bean", ears: "none", feet: true, mouth: "teeth" }, acc: "horns",
    base: { id: "pisarello", name: "Pisarello", desc: "Gnocchetto di pane coi fagioli. Piccolo, sodo e testardo come un piacentino." },
    evo: { id: "pisarone", name: "Pisarone", lv: 20, desc: "Una pentola intera di pisarei e fasö. Riscalda le serate di nebbia sul Po." } },
  { type: "campi", home: ["RE"], stats: [55, 50, 60, 45], rc: { body: "g", shade: "G", light: "l", shape: "wide", ears: "leaf", mouth: "smile" }, acc: "crown",
    base: { id: "erbazzino", name: "Erbazzino", desc: "Fetta di erbazzone con le bietole del campo. Profuma di forno e di nonna." },
    evo: { id: "erbazzone", name: "Erbazzone", lv: 20, desc: "Teglia intera di erbazzone reggiano. Dice che il suo è l'unico vero, come tutti." } },
  { type: "sugo", home: ["PR"], stats: [50, 65, 45, 55], rc: { body: "P", shade: "m", light: "p", shape: "drop", ears: "none", feet: true, mouth: "smile" }, acc: "bow",
    base: { id: "culatellino", name: "Culatellino", desc: "Stagiona nelle cantine nebbiose della Bassa. Tagliato a mano, sennò si offende." },
    evo: { id: "culatellone", name: "Culatellone", lv: 22, desc: "Re dei salumi, stagionato due inverni. Pretende il burro e il pane giusto." } },
  { type: "sugo", home: ["MO"], stats: [55, 55, 50, 55], rc: { body: "e", shade: "y", light: "w", shape: "round", ears: "points", mouth: "open" }, acc: "hat",
    base: { id: "gnocchino", name: "Gnocchino", desc: "Gnocco fritto gonfio e caldo. Scotta, ma è impossibile mangiarne uno solo." },
    evo: { id: "gnoccone", name: "Gnoccone", lv: 20, desc: "Gnoccone col salume dentro. Si presenta a ogni sagra senza invito." } },
  { type: "campi", home: ["MO"], stats: [45, 50, 45, 70], rc: { body: "r", shade: "d", light: "p", shape: "round", ears: "leaf", mouth: "smile" }, acc: "bow",
    base: { id: "ciliegina", name: "Ciliegina", desc: "Ciliegia dei colli di Vignola. Viaggia sempre in coppia, mai da sola." },
    evo: { id: "ciliegiona", name: "Ciliegiona", lv: 18, desc: "Ciliegia gigante e lucida. In fiera vince sempre il premio della più bella." } },
  { type: "campi", home: ["RN", "PC", "PR"], stats: [55, 60, 55, 40], rc: { body: "b", shade: "B", light: "t", shape: "bean", ears: "round", feet: true, mouth: "teeth" }, acc: "crown",
    base: { id: "tartufino", name: "Tartufino", desc: "Tartufo nascosto nel bosco dell'Appennino. Solo i cani bravi lo trovano." },
    evo: { id: "tartufone", name: "Tartufone", lv: 24, desc: "Tartufo da fiera, pesato a grammi d'oro. Profuma tutto il paese." } },
  { type: "nebbia", home: ["FE", "RA"], stats: [50, 55, 45, 65], rc: { body: "n", shade: "k", light: "l", shape: "tall", ears: "antenna", mouth: "open" }, acc: "horns",
    base: { id: "anguillina", name: "Anguillina", desc: "Scivola tra i canali delle valli. Ti sguscia dalle mani, e pure dai vasetti." },
    evo: { id: "anguillona", name: "Anguillona", lv: 22, desc: "Anguilla marinata di Comacchio. Antica, saggia e un po' permalosa." } },
  { type: "terme", home: ["RA", "FC"], stats: [60, 45, 60, 45], rc: { body: "w", shade: "c", light: "l", shape: "wide", ears: "none", feet: true, mouth: "smile" }, acc: "crown",
    base: { id: "salinello", name: "Salinello", desc: "Cristallo di sale delle saline. Dolce di carattere, nonostante tutto." },
    evo: { id: "salinone", name: "Salinone", lv: 20, desc: "Montagna di sale bianco che brilla al sole. Conserva tutto, anche i rancori." } },
  { type: "chiacchiera", home: ["BO"], stats: [45, 50, 45, 65], rc: { body: "t", shade: "b", light: "e", shape: "drop", ears: "antenna", mouth: "open" }, acc: "hat", acc3: "crown",
    base: { id: "ocarino", name: "Ocarino", desc: "Piccola ocarina di terracotta. Fischietta sempre la stessa canzone." },
    evo: { id: "ocarinone", name: "Ocarinone", lv: 18, desc: "Suona in un'orchestra di paese. Prende un'aria solenne quando attacca." },
    third: { id: "ocarinissimo", name: "Ocarinissimo", lv: 36, desc: "Maestro d'orchestra di sette ocarine. Quando suona si ferma la piazza." } },
  { type: "chiacchiera", home: ["RA", "FC", "RN"], stats: [50, 50, 45, 65], rc: { body: "v", shade: "m", light: "p", shape: "tall", ears: "points", feet: true, mouth: "smile" }, acc: "bow",
    base: { id: "lisciolo", name: "Lisciolo", desc: "Balla il liscio in ogni balera della Romagna. Valzer, mazurka e polka." },
    evo: { id: "liscione", name: "Liscione", lv: 22, desc: "Re della pista, con la camicia stirata. Non sbaglia un giro da quarant'anni." } },
  { type: "terme", home: ["RA"], stats: [55, 45, 65, 45], rc: { body: "l", shade: "v", light: "w", shape: "round", ears: "round", mouth: "smile" }, acc: "halo",
    base: { id: "ceramichino", name: "Ceramichino", desc: "Piattino di maiolica dipinto a mano. Fragile? Mai dirglielo in faccia." },
    evo: { id: "ceramicone", name: "Ceramicone", lv: 22, desc: "Vaso di maiolica da museo. Ogni crepa ha una storia da raccontare." } },
  { type: "motore", home: ["BO", "MO", "RN"], stats: [45, 60, 40, 70], rc: { body: "r", shade: "d", light: "z", shape: "wide", ears: "antenna", feet: true, mouth: "teeth" }, acc: "horns", acc3: "crown",
    base: { id: "motorino", name: "Motorino", desc: "Motorino truccato da ragazzi di paese. Fa più rumore che strada." },
    evo: { id: "motorone", name: "Motorone", lv: 20, desc: "Moto da strada che rimbomba tra le colline la domenica mattina." },
    third: { id: "motorissimo", name: "Motorissimo", lv: 38, desc: "Bolide da circuito. Le curve di Misano le conosce a memoria." } },
  { type: "sugo", home: ["RN", "RA"], stats: [60, 50, 50, 50], rc: { body: "y", shade: "o", light: "w", shape: "round", ears: "none", feet: true, mouth: "open" }, acc: "crown",
    base: { id: "bombolino", name: "Bombolino", desc: "Bombolone alla crema venduto in spiaggia. Arriva sempre quando hai fame." },
    evo: { id: "bombolone", name: "Bombolone", lv: 20, desc: "Bombolone gigante, ripieno fino a scoppiare. Grida il suo nome lungo la battigia." } },
  { type: "nebbia", home: ["FE", "RE", "PR"], stats: [55, 45, 55, 55], rc: { body: "c", shade: "s", light: "w", shape: "tall", ears: "leaf", mouth: "smile" }, acc: "halo",
    base: { id: "pioppino", name: "Pioppino", desc: "Pioppo della golena del Po. Si perde nella nebbia, ma ritrova sempre l'argine." },
    evo: { id: "pioppone", name: "Pioppone", lv: 22, desc: "Filare intero di pioppi. Quando tira vento sussurrano i pettegolezzi della Bassa." } },
  { type: "campi", home: ["BO", "FC", "RA"], stats: [60, 55, 55, 35], rc: { body: "b", shade: "B", light: "o", shape: "round", ears: "points", feet: true, mouth: "teeth" }, acc: "hat",
    base: { id: "castagnino", name: "Castagnino", desc: "Castagna con il riccio pungente. Cade dagli alberi in autunno, a volte in testa." },
    evo: { id: "castagnone", name: "Castagnone", lv: 22, desc: "Caldarrosta fumante delle sagre di montagna. Scotta le dita a chi lo prende." } },
  { type: "terme", home: ["PR", "FC"], stats: [55, 50, 55, 50], rc: { body: "l", shade: "c", light: "w", shape: "drop", ears: "antenna", mouth: "open" }, acc: "crown",
    base: { id: "bollicino", name: "Bollicino", desc: "Bollicina delle acque termali. Fa il solletico e scompare quando lo cerchi." },
    evo: { id: "bollicione", name: "Bollicione", lv: 20, desc: "Sorgente termale che borbotta. I medici dicono che fa bene, lui ne è convinto." } },
];

const ALL_TYPES = ["sugo", "campi", "terme", "motore", "nebbia", "chiacchiera"];
let seed = 100;
/** Sprites for every new form. */
export const N_SPRITES: Record<string, string[]> = {};
/** Region (province codes) where each new species lives. */
export const N_HOME: Record<string, string[]> = {};
for (const ln of LINES) {
  const s = seed++;
  N_SPRITES[ln.base.id] = makeSprite({ ...ln.rc, seed: s, acc: "none" }, 12);
  N_SPRITES[ln.evo.id] = makeSprite({ ...ln.rc, seed: s, acc: ln.acc }, 16);
  if (ln.third) N_SPRITES[ln.third.id] = makeSprite({ ...ln.rc, seed: s + 500, shape: ln.rc.shape === "wide" ? "round" : ln.rc.shape, acc: ln.acc3 ?? "crown" }, 16);
  for (const f of [ln.base, ln.evo, ln.third]) if (f) N_HOME[f.id] = ln.home;
}
void ALL_TYPES;

/** Builds the species with learnsets taken from the existing moves of the same type. */
export function buildSpecies(movesByType: Record<string, string[]>): Species[] {
  const out: Species[] = [];
  for (const ln of LINES) {
    const mv = movesByType[ln.type] ?? [];
    const learn = (start: number): [string, number][] => [["sberla", 1], ...mv.map((m, i) => [m, i === 0 ? 1 : start + i * 8] as [string, number])].filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i) as [string, number][];
    const [hp, atk, def, spd] = ln.stats;
    const sp = (f: Form, mult: number, rate: number, evo?: { to: string; lv: number }): Species => ({
      id: f.id, num: 0, name: f.name, type: ln.type, hp: Math.round(hp * mult), atk: Math.round(atk * mult), def: Math.round(def * mult), spd: Math.round(spd * mult),
      catchRate: rate, moves: learn(mult > 1.6 ? 10 : 8), desc: f.desc, ...(evo ? { evo } : {}),
    });
    out.push(sp(ln.base, 1, 0.4, { to: ln.evo.id, lv: ln.evo.lv }));
    out.push(sp(ln.evo, 1.45, 0.18, ln.third ? { to: ln.third.id, lv: ln.third.lv } : undefined));
    if (ln.third) out.push(sp(ln.third, 1.85, 0.08));
  }
  return out;
}

// Inutilino: the most useless Mostrello in Emilia-Romagna. It can only wave hello.
N_SPRITES.inutilino = makeSprite({ seed: 77, body: "s", shade: "c", light: "w", shape: "bean", ears: "none", feet: true, mouth: "open", acc: "none" }, 12);
N_HOME.inutilino = [];
export function extraSpecies(): Species[] {
  return [{
    id: "inutilino", num: 0, name: "Inutilino", type: "chiacchiera", hp: 30, atk: 10, def: 15, spd: 12, catchRate: 1,
    moves: [["saluto", 1]],
    desc: "Non sa fare assolutamente niente, a parte salutare con la manina. Ma lo fa con un garbo che apre tutte le porte.",
  }];
}
