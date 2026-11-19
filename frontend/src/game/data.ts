// All game content is original: creatures, places-as-maps, characters and texts.
import { linkExpansion, X_BADGES, X_MAPS, X_MOVES, X_SPECIES } from "./expansion";
import { buildWorld, W_BADGES } from "./world";
import { buildSpecies, extraSpecies } from "./bestiary";
import { N_MOVES, typeMovesets } from "./movesets";
import { buildTowns, type Quest } from "./towns";
import { placeStory } from "./story";
import { buildGyms } from "./gyms";
import { buildSecrets } from "./secrets";
import { buildBoutiques } from "./outfits";
export type TypeId = "sugo" | "campi" | "terme" | "motore" | "nebbia" | "chiacchiera";

export const TYPES: Record<TypeId, { name: string; color: string }> = {
  sugo: { name: "Sugo", color: "#d32f2f" },
  campi: { name: "Campi", color: "#388e3c" },
  terme: { name: "Terme", color: "#8d6e63" },
  motore: { name: "Motore", color: "#fbc02d" },
  nebbia: { name: "Nebbia", color: "#9e9e9e" },
  chiacchiera: { name: "Chiacchiera", color: "#e0913a" },
};

// attacker -> defender multipliers (missing = 1)
export const EFF: Partial<Record<TypeId, Partial<Record<TypeId, number>>>> = {
  sugo: { campi: 2, terme: 0.5, nebbia: 0.5 },
  campi: { terme: 2, sugo: 0.5 },
  terme: { sugo: 2, motore: 2, campi: 0.5 },
  motore: { nebbia: 2, campi: 2, terme: 0.5 },
  nebbia: { motore: 2, sugo: 2, chiacchiera: 2, nebbia: 0.5 },
  chiacchiera: { motore: 2, nebbia: 0.5 },
};

export type FxKind = "atkDown" | "defDown" | "spdDown" | "confuse" | "burn" | "selfAtkUp" | "selfDefUp" | "selfSpdUp";
export type Move = { name: string; type: TypeId; power: number; acc: number; fx?: { k: FxKind; p: number } };
export const FX_LABEL: Record<FxKind, string> = {
  atkDown: "ATT nemico giù", defDown: "DIF nemica giù", spdDown: "VEL nemica giù", confuse: "Confonde",
  burn: "Scotta", selfAtkUp: "Tuo ATT su", selfDefUp: "Tua DIF su", selfSpdUp: "Tua VEL su",
};
export const MOVES: Record<string, Move> = {
  sberla: { name: "Sberla", type: "chiacchiera", power: 40, acc: 100 },
  chiacchierata: { name: "Chiacchierata Infinita", type: "chiacchiera", power: 55, acc: 95, fx: { k: "confuse", p: 30 } },
  lamentela: { name: "Lamentela al Comune", type: "chiacchiera", power: 70, acc: 90, fx: { k: "defDown", p: 40 } },
  ragu: { name: "Schizzo di Ragù", type: "sugo", power: 45, acc: 100, fx: { k: "burn", p: 20 } },
  brodo: { name: "Brodo Bollente", type: "sugo", power: 65, acc: 95, fx: { k: "burn", p: 30 } },
  forno: { name: "Lasagna al Forno", type: "sugo", power: 85, acc: 85, fx: { k: "burn", p: 20 } },
  fango: { name: "Spruzzo di Fango", type: "terme", power: 45, acc: 100, fx: { k: "spdDown", p: 40 } },
  vapore: { name: "Getto Termale", type: "terme", power: 65, acc: 95, fx: { k: "defDown", p: 30 } },
  sauna: { name: "Sauna Infernale", type: "terme", power: 85, acc: 85, fx: { k: "atkDown", p: 30 } },
  grappolo: { name: "Grappolata", type: "campi", power: 45, acc: 100, fx: { k: "atkDown", p: 30 } },
  vendemmia: { name: "Vendemmia", type: "campi", power: 65, acc: 95, fx: { k: "selfAtkUp", p: 30 } },
  trattore: { name: "Trattore Selvaggio", type: "campi", power: 85, acc: 85, fx: { k: "defDown", p: 30 } },
  rombo: { name: "Rombo", type: "motore", power: 45, acc: 100, fx: { k: "selfSpdUp", p: 40 } },
  sgommata: { name: "Sgommata", type: "motore", power: 65, acc: 95, fx: { k: "spdDown", p: 30 } },
  girovel: { name: "Giro Veloce", type: "motore", power: 85, acc: 85, fx: { k: "selfSpdUp", p: 30 } },
  foschia: { name: "Foschia", type: "nebbia", power: 45, acc: 100, fx: { k: "spdDown", p: 50 } },
  nebbione: { name: "Nebbione Padano", type: "nebbia", power: 65, acc: 95, fx: { k: "confuse", p: 30 } },
  puntura: { name: "Puntura Estense", type: "nebbia", power: 85, acc: 85, fx: { k: "defDown", p: 30 } },
  onda: { name: "Onda Anomala", type: "terme", power: 75, acc: 90, fx: { k: "spdDown", p: 30 } },
  musica: { name: "Musica a Palla", type: "motore", power: 75, acc: 90, fx: { k: "confuse", p: 30 } },
  furto: { name: "Furto di Piadina", type: "chiacchiera", power: 60, acc: 100, fx: { k: "atkDown", p: 30 } },
  tagliatella: { name: "Frusta di Tagliatella", type: "sugo", power: 55, acc: 95, fx: { k: "atkDown", p: 20 } },
  bollicine: { name: "Bollicine Frizzanti", type: "terme", power: 50, acc: 100, fx: { k: "confuse", p: 20 } },
  clacson: { name: "Clacson Insistente", type: "motore", power: 55, acc: 95, fx: { k: "spdDown", p: 30 } },
  zucca: { name: "Zucca Rotolante", type: "campi", power: 60, acc: 95 },
  pettegolezzo: { name: "Pettegolezzo di Paese", type: "chiacchiera", power: 50, acc: 100, fx: { k: "defDown", p: 50 } },
  nebbiafitta: { name: "Nebbia Fitta", type: "nebbia", power: 60, acc: 95, fx: { k: "selfDefUp", p: 30 } },
  ombra: { name: "Ombra di Prima Fila", type: "campi", power: 70, acc: 95, fx: { k: "selfDefUp", p: 40 } },
  ...X_MOVES,
  ...N_MOVES,
};

export type Species = {
  id: string; num: number; name: string; type: TypeId;
  hp: number; atk: number; def: number; spd: number;
  catchRate: number; moves: [string, number][]; desc: string;
  evo?: { to: string; lv: number };
};

const sp = (s: Species) => s;
export const SPECIES_LIST: Species[] = [
  sp({ id: "tortellotto", num: 1, name: "Tortellotto", type: "sugo", hp: 45, atk: 52, def: 43, spd: 60, catchRate: 0.4, moves: [["sberla", 1], ["ragu", 1], ["brodo", 10], ["forno", 20]], desc: "Un tortellino ripieno di orgoglio bolognese. Se lo chiami 'raviolo' ti morde il naso.", evo: { to: "tortellone", lv: 16 } }),
  sp({ id: "fanghino", num: 2, name: "Fanghino", type: "terme", hp: 50, atk: 45, def: 55, spd: 45, catchRate: 0.4, moves: [["sberla", 1], ["fango", 1], ["vapore", 10], ["sauna", 20]], desc: "Rana di fango termale. Giura che fa benissimo alla pelle, lo dice suo cugino quasi medico.", evo: { to: "fangone", lv: 16 } }),
  sp({ id: "grappolino", num: 3, name: "Grappolino", type: "campi", hp: 48, atk: 49, def: 50, spd: 50, catchRate: 0.4, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 20]], desc: "Grappolo d'uva dei colli con le gambe. Alle quattro del pomeriggio è già allegro.", evo: { to: "vendemmione", lv: 16 } }),
  sp({ id: "mortazzone", num: 4, name: "Mortazzone", type: "chiacchiera", hp: 70, atk: 50, def: 55, spd: 30, catchRate: 0.6, moves: [["sberla", 1], ["chiacchierata", 8], ["lamentela", 16], ["brodo", 22]], desc: "Maiale rosa a fette con pistacchi. Si offende a morte se lo chiami 'Bologna' all'americana.", evo: { to: "mortadellone", lv: 20 } }),
  sp({ id: "umarellino", num: 5, name: "Umarellino", type: "chiacchiera", hp: 40, atk: 35, def: 60, spd: 25, catchRate: 0.7, moves: [["sberla", 1], ["chiacchierata", 5], ["lamentela", 12], ["foschia", 18]], desc: "Spiritello pensionato con le mani dietro la schiena. Compare davanti a ogni cantiere per criticare.", evo: { to: "umarellone", lv: 14 } }),
  sp({ id: "zanzarone", num: 6, name: "Zanzarone", type: "nebbia", hp: 35, atk: 55, def: 35, spd: 75, catchRate: 0.5, moves: [["sberla", 1], ["foschia", 1], ["puntura", 12], ["nebbione", 18]], desc: "Zanzara della pianura grande come un piccione. Da giugno a settembre comanda lei.", evo: { to: "zanzarazza", lv: 24 } }),
  sp({ id: "nebbiolone", num: 7, name: "Nebbiolone", type: "nebbia", hp: 55, atk: 50, def: 60, spd: 40, catchRate: 0.45, moves: [["foschia", 1], ["sberla", 1], ["nebbione", 12], ["puntura", 22]], desc: "Fantasma di nebbia ferrarese. Lo vedi solo nei giorni in cui non c'è." }),
  sp({ id: "salamone", num: 8, name: "Salamone", type: "sugo", hp: 65, atk: 60, def: 50, spd: 35, catchRate: 0.45, moves: [["sberla", 1], ["ragu", 1], ["brodo", 10], ["forno", 18]], desc: "Salama da sugo vivente. Cuoce da sei ore e non ha nessuna fretta." }),
  sp({ id: "biciclone", num: 9, name: "Biciclone", type: "motore", hp: 45, atk: 55, def: 45, spd: 80, catchRate: 0.45, moves: [["sberla", 1], ["rombo", 1], ["sgommata", 12], ["girovel", 20]], desc: "Serpente con due ruote. Suona il campanello e non si ferma mai, nemmeno col rosso.", evo: { to: "tandemone", lv: 24 } }),
  sp({ id: "pistonzo", num: 10, name: "Pistonzo", type: "motore", hp: 50, atk: 65, def: 55, spd: 65, catchRate: 0.45, moves: [["sberla", 1], ["rombo", 1], ["sgommata", 10], ["girovel", 18]], desc: "Scarabeo con pistoni al posto delle zampe. Vive vicino all'autodromo e sogna il podio.", evo: { to: "turbonzo", lv: 22 } }),
  sp({ id: "vaporella", num: 11, name: "Vaporella", type: "terme", hp: 45, atk: 50, def: 45, spd: 70, catchRate: 0.5, moves: [["sberla", 1], ["fango", 1], ["vapore", 10], ["sauna", 20]], desc: "Uccellino fatto di vapore termale. Profuma leggermente di zolfo e di accappatoio.", evo: { to: "vaporiera", lv: 22 } }),
  sp({ id: "cinghialotto", num: 12, name: "Cinghialotto", type: "campi", hp: 60, atk: 65, def: 50, spd: 40, catchRate: 0.5, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 16]], desc: "Cinghiale delle colline. Distrugge le vigne e poi se ne vanta al bar.", evo: { to: "cinghialone", lv: 18 } }),
  sp({ id: "squacquerone", num: 13, name: "Squacquerone", type: "chiacchiera", hp: 60, atk: 40, def: 45, spd: 35, catchRate: 0.65, moves: [["sberla", 1], ["fango", 4], ["chiacchierata", 10], ["lamentela", 18]], desc: "Formaggio molle e chiacchierone. Si spalma su qualsiasi conversazione, invitato o no.", evo: { to: "squacquerona", lv: 18 } }),
  sp({ id: "piadinone", num: 14, name: "Piadinone", type: "campi", hp: 55, atk: 50, def: 65, spd: 30, catchRate: 0.55, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 18]], desc: "Tartaruga col guscio di piadina. Viene dalla Romagna e non smette un secondo di ricordartelo.", evo: { to: "piadinazza", lv: 20 } }),
  sp({ id: "passatellone", num: 15, name: "Passatellone", type: "sugo", hp: 50, atk: 55, def: 45, spd: 55, catchRate: 0.55, moves: [["sberla", 1], ["ragu", 1], ["brodo", 9], ["forno", 19]], desc: "Verme di passatelli che nuota nel brodo. Si arriccia tutto quando è contento.", evo: { to: "passatellaccio", lv: 20 } }),
  sp({ id: "portichino", num: 16, name: "Portichino", type: "chiacchiera", hp: 80, atk: 70, def: 80, spd: 30, catchRate: 0.25, moves: [["sberla", 1], ["chiacchierata", 1], ["lamentela", 10], ["forno", 15]], desc: "Golem fatto di portici. Ti ripara sempre dalla pioggia, ma poi ti chiede 600 euro d'affitto." }),
  sp({ id: "tortellone", num: 17, name: "Tortellone", type: "sugo", hp: 78, atk: 84, def: 70, spd: 80, catchRate: 0.15, moves: [["ragu", 1], ["brodo", 1], ["forno", 16], ["lamentela", 24]], desc: "Tortellotto diventato gigante a forza di domeniche dalla nonna. Ripieno di carne e di arroganza." }),
  sp({ id: "fangone", num: 18, name: "Fangone", type: "terme", hp: 82, atk: 75, def: 85, spd: 60, catchRate: 0.15, moves: [["fango", 1], ["vapore", 1], ["sauna", 16], ["onda", 26]], desc: "Rospo termale enorme. Chiede l'impegnativa del medico prima di ogni lotta." }),
  sp({ id: "vendemmione", num: 19, name: "Vendemmione", type: "campi", hp: 80, atk: 80, def: 80, spd: 65, catchRate: 0.15, moves: [["grappolo", 1], ["vendemmia", 1], ["trattore", 16], ["ombra", 26]], desc: "Grappolo maturo dei colli. Dopo le sei di sera parla solo in dialetto." }),
  sp({ id: "umarellone", num: 20, name: "Umarellone", type: "chiacchiera", hp: 72, atk: 60, def: 92, spd: 35, catchRate: 0.2, moves: [["chiacchierata", 1], ["lamentela", 1], ["foschia", 14], ["furto", 22]], desc: "Umarell anziano col bastone. Ha supervisionato tre generazioni di cantieri senza mai lavorarci." }),
  sp({ id: "cinghialone", num: 21, name: "Cinghialone", type: "campi", hp: 92, atk: 95, def: 70, spd: 50, catchRate: 0.15, moves: [["grappolo", 1], ["vendemmia", 1], ["trattore", 18], ["ombra", 26]], desc: "Cinghiale dei colli con zanne da sagra. I cacciatori lo raccontano, nessuno l'ha mai preso." }),
  sp({ id: "gabbianone", num: 22, name: "Gabbianone", type: "chiacchiera", hp: 55, atk: 68, def: 45, spd: 85, catchRate: 0.45, moves: [["sberla", 1], ["furto", 1], ["chiacchierata", 18], ["lamentela", 24]], desc: "Gabbiano enorme che ruba le piadine di mano ai turisti. Non prova alcuna vergogna.", evo: { to: "gabbianazzo", lv: 28 } }),
  sp({ id: "vongolino", num: 23, name: "Vongolino", type: "terme", hp: 50, atk: 48, def: 88, spd: 30, catchRate: 0.5, moves: [["fango", 1], ["vapore", 1], ["onda", 20], ["chiacchierata", 22]], desc: "Vongola di Riviera. Si chiude a riccio quando sente parlare di prezzi degli spaghetti allo scoglio." }),
  sp({ id: "medusella", num: 24, name: "Medusella", type: "terme", hp: 50, atk: 62, def: 50, spd: 62, catchRate: 0.5, moves: [["fango", 1], ["vapore", 1], ["onda", 19], ["puntura", 24]], desc: "Medusa d'agosto. Compare sempre quando hai appena deciso di fare il bagno." }),
  sp({ id: "discotecco", num: 25, name: "Discotecco", type: "motore", hp: 55, atk: 72, def: 50, spd: 78, catchRate: 0.4, moves: [["rombo", 1], ["sgommata", 1], ["musica", 20], ["girovel", 24]], desc: "Palla da discoteca vivente. Esce alle due di notte, rientra alle nove col cornetto." }),
  sp({ id: "ombrellone", num: 26, name: "Ombrellone", type: "campi", hp: 68, atk: 58, def: 72, spd: 40, catchRate: 0.45, moves: [["sberla", 1], ["grappolo", 1], ["ombra", 19], ["furto", 23]], desc: "Ombrellone di prima fila. Costa più di un affitto in centro, e lo sa benissimo." }),
  sp({ id: "crescentino", num: 27, name: "Crescentino", type: "sugo", hp: 55, atk: 55, def: 55, spd: 50, catchRate: 0.6, moves: [["sberla", 1], ["ragu", 1], ["tagliatella", 12], ["brodo", 18]], desc: "Crescentina fritta e gonfia d'orgoglio. Senza mortadella accanto si sente nuda.", evo: { to: "crescentone", lv: 20 } }),
  sp({ id: "lambruschino", num: 28, name: "Lambruschino", type: "terme", hp: 50, atk: 55, def: 50, spd: 65, catchRate: 0.5, moves: [["fango", 1], ["bollicine", 8], ["vapore", 14], ["onda", 22]], desc: "Goccia frizzante dei colli. Dopo un bicchiere diventa amico di tutti.", evo: { to: "lambruscone", lv: 22 } }),
  sp({ id: "canalino", num: 29, name: "Canalino", type: "terme", hp: 50, atk: 60, def: 55, spd: 60, catchRate: 0.4, moves: [["fango", 1], ["bollicine", 1], ["onda", 18], ["nebbiafitta", 22]], desc: "Anguilla dei canali nascosti di Bologna. Spunta dalla finestrella e ti spaventa." }),
  sp({ id: "scooterone", num: 30, name: "Scooterone", type: "motore", hp: 55, atk: 65, def: 55, spd: 75, catchRate: 0.45, moves: [["rombo", 1], ["clacson", 10], ["sgommata", 16], ["girovel", 22]], desc: "Motorino da lungomare. Due persone sopra, tre borse frigo e nessun casco." }),
  sp({ id: "cappellaccio", num: 31, name: "Cappellaccio", type: "campi", hp: 60, atk: 55, def: 60, spd: 45, catchRate: 0.45, moves: [["grappolo", 1], ["zucca", 10], ["vendemmia", 16], ["trattore", 22]], desc: "Pasta ripiena di zucca ferrarese. Guai a chiamarla tortello: si offende." }),
  sp({ id: "zuppone", num: 32, name: "Zuppone", type: "chiacchiera", hp: 65, atk: 50, def: 60, spd: 40, catchRate: 0.5, moves: [["sberla", 1], ["pettegolezzo", 8], ["chiacchierata", 14], ["lamentela", 20]], desc: "Zuppa inglese a strati. Sa tutti i fatti del paese, e li racconta tutti.", evo: { to: "zuppissima", lv: 21 } }),
  sp({ id: "mortadellone", num: 0, name: "Mortadellone", type: "chiacchiera", hp: 95, atk: 75, def: 77, spd: 48, catchRate: 0.15, moves: [["sberla", 1], ["chiacchierata", 8], ["lamentela", 16], ["brodo", 22]], desc: "Mortadella gigante IGP. Pesa come un'utilitaria e profuma come la domenica." }),
  sp({ id: "squacquerona", num: 0, name: "Squacquerona", type: "chiacchiera", hp: 85, atk: 65, def: 67, spd: 53, catchRate: 0.15, moves: [["sberla", 1], ["fango", 4], ["chiacchierata", 10], ["lamentela", 18]], desc: "Squacquerone stagionato in chiacchiere. Ormai conosce i segreti di tutta la Romagna." }),
  sp({ id: "passatellaccio", num: 0, name: "Passatellaccio", type: "sugo", hp: 75, atk: 80, def: 67, spd: 73, catchRate: 0.15, moves: [["sberla", 1], ["ragu", 1], ["brodo", 9], ["forno", 19]], desc: "Passatello robusto cotto in brodo di cappone. Si annoda per farti paura." }),
  sp({ id: "piadinazza", num: 0, name: "Piadinazza", type: "campi", hp: 80, atk: 75, def: 87, spd: 48, catchRate: 0.15, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 18]], desc: "Tartaruga con piadina doppia farcita. Corazza alta, opinioni ancora più alte." }),
  sp({ id: "zanzarazza", num: 0, name: "Zanzarazza", type: "nebbia", hp: 60, atk: 80, def: 57, spd: 93, catchRate: 0.15, moves: [["sberla", 1], ["foschia", 1], ["puntura", 12], ["nebbione", 18]], desc: "Regina delle zanzare del Po. L'autan le fa il solletico." }),
  sp({ id: "turbonzo", num: 0, name: "Turbonzo", type: "motore", hp: 75, atk: 90, def: 77, spd: 83, catchRate: 0.15, moves: [["sberla", 1], ["rombo", 1], ["sgommata", 10], ["girovel", 18]], desc: "Scarabeo col turbo. Fa il giro dell'autodromo in un minuto e mezzo, pit-stop compreso." }),
  sp({ id: "vaporiera", num: 0, name: "Vaporiera", type: "terme", hp: 70, atk: 75, def: 67, spd: 88, catchRate: 0.15, moves: [["sberla", 1], ["fango", 1], ["vapore", 10], ["sauna", 20]], desc: "Uccello di vapore bollente. Quando passa, tutti si sentono in sauna." }),
  sp({ id: "tandemone", num: 0, name: "Tandemone", type: "motore", hp: 70, atk: 80, def: 67, spd: 98, catchRate: 0.15, moves: [["sberla", 1], ["rombo", 1], ["sgommata", 12], ["girovel", 20]], desc: "Bicicletta a due posti con la testa di serpente. Pedala controvento e non si lamenta mai." }),
  sp({ id: "crescentone", num: 0, name: "Crescentone", type: "sugo", hp: 80, atk: 80, def: 77, spd: 68, catchRate: 0.15, moves: [["sberla", 1], ["ragu", 1], ["tagliatella", 12], ["brodo", 18]], desc: "Crescentina gigante farcita di salumi. Il re dei taglieri bolognesi." }),
  sp({ id: "gabbianazzo", num: 0, name: "Gabbianazzo", type: "chiacchiera", hp: 80, atk: 93, def: 67, spd: 103, catchRate: 0.15, moves: [["sberla", 1], ["furto", 1], ["chiacchierata", 18], ["lamentela", 24]], desc: "Il terrore dei lidi. Ruba piadine, gelati e pure gli occhiali da sole." }),
  sp({ id: "lambruscone", num: 0, name: "Lambruscone", type: "terme", hp: 75, atk: 80, def: 72, spd: 83, catchRate: 0.15, moves: [["fango", 1], ["bollicine", 8], ["vapore", 14], ["onda", 22]], desc: "Fiasco di frizzante dei colli. Le sue bollicine stordiscono anche i più sobri." }),
  sp({ id: "zuppissima", num: 0, name: "Zuppissima", type: "chiacchiera", hp: 90, atk: 75, def: 82, spd: 58, catchRate: 0.15, moves: [["sberla", 1], ["pettegolezzo", 8], ["chiacchierata", 14], ["lamentela", 20]], desc: "Zuppa inglese a dieci strati con alchermes doppio. Sa i segreti di ogni paese." }),
  ...X_SPECIES,
];
// New regional Mostrelli (bestiary.ts): learnsets from the existing moves of their type, weakest first.
const MOVES_BY_TYPE: Record<string, string[]> = {};
Object.entries(MOVES).sort((a, b) => a[1].power - b[1].power).forEach(([id, m]) => { if (id !== "sberla") (MOVES_BY_TYPE[m.type] ??= []).push(id); });
SPECIES_LIST.push(...buildSpecies(MOVES_BY_TYPE), ...extraSpecies());
// Every Mostrello learns only moves of its own type (movesets.ts).
typeMovesets(SPECIES_LIST, MOVES);
SPECIES_LIST.forEach((x, i) => (x.num = i + 1));
export const SPECIES: Record<string, Species> = Object.fromEntries(SPECIES_LIST.map((s) => [s.id, s]));
export const STARTERS = ["tortellotto", "fanghino", "grappolino"];

export const ITEMS = {
  vasetto: { name: "Vasetto di Vetro", price: 8, kind: "catch", amount: 0, desc: "Per catturare i mostrelli selvatici. Lavato a mano dalla nonna." },
  brodino: { name: "Brodino Caldo", price: 5, kind: "heal", amount: 25, desc: "Cura 25 PV. Fatto col cappone, come Dio comanda." },
  tortellini: { name: "Tortellini in Brodo", price: 15, kind: "heal", amount: 70, desc: "Cura 70 PV. Trecento tortellini chiusi a mano, uno per uno." },
  digestivo: { name: "Digestivo della Casa", price: 10, kind: "cureConf", amount: 0, desc: "Cura la confusione. Solo in lotta. Fatto dallo zio, non chiedere cosa c'è dentro." },
  gelato: { name: "Gelato Artigianale", price: 10, kind: "cureBurn", amount: 0, desc: "Cura le scottature. Solo in lotta. Gusto crema, il più serio." },
  caffe: { name: "Caffè Ristretto", price: 25, kind: "revive", amount: 0.5, desc: "Risveglia un mostrello esausto con metà dei PV. Corretto, ovviamente." },
  caramella: { name: "Caramella Rara", price: 0, kind: "level", amount: 1, desc: "Fa salire di un livello. Non si vende: si trova in giro o si vince." },
} as const;
export type ItemId = keyof typeof ITEMS;

export const BLOCKING = new Set(["T", "W", "R", "H", "D", "B", "S", "O", "U", "X", "K", "M", "N", "J", "I", "=", "%", "&", "^", "!"]);
export const ENCOUNTER_TILES = new Set(["G", "Q"]);

export type Npc = {
  id: string; x: number; y: number; name: string;
  look: { A: string; C: string };
  kind: "talk" | "heal" | "shop" | "trainer" | "boss" | "quest" | "gym" | "wild" | "gift" | "outfit";
  lines: string[];
  team?: [string, number][];
  reward?: number;
  badge?: string;
  after?: string[];
  prize?: [string, number];
  /** Side quest given by this person. */
  quest?: Quest;
  /** Main story: this trainer appears only during that chapter. */
  story?: number;
  /** Doorman of a gym: the hall it leads to. */
  gym?: string;
  /** A special wild Mostrello waiting in a secret corner (fight it to catch it). */
  mon?: { s: string; lv: number; shiny?: boolean };
};

export type GameMap = {
  id: string; name: string; tiles: string[];
  exits: { x: number; y: number; to: string; tx: number; ty: number }[];
  heal: { x: number; y: number };
  wild: [string, number, number, number][];
  music?: string;
  npcs: Npc[];
  signs: Record<string, string>;
  pickups?: { id: string; x: number; y: number; item: ItemId }[];
  /** Province code (BO, MO...), terrain of generated places, comune of a frazione, battle backdrop. */
  prov?: string;
  terrain?: "c" | "p" | "h" | "a" | "m" | "f";
  fraz?: string;
  field?: "grass" | "beach";
  /** Inside a building (no weather, no clouds, not listed on the world map). */
  interior?: boolean;
  /** A gym hall (reached by talking to its doorman). */
  gym?: boolean;
};

const L = (A: string, C: string) => ({ A, C });

export const MAPS: Record<string, GameMap> = {
  bologna: {
    id: "bologna", name: "Bologna", music: "bologna",
    tiles: [
      "TTTTTTT.TTTTTTTT", "TGGGGGT.TBBTRRRT", "TGGGGG..TBBTHDHT", "TT,,,,..,BB,,.,T",
      "TRRRT,.......,,T", "THDHT,PPPPPPP.,T", "T,.,,,PCCCCCP.,T", "T,.,,,PCCCCCP.,T",
      "T,.........CC...", "T,,,S,PCCCCCP.,T", "TRRRT,PPPPPPP.,T", "THDHT,.......GGT",
      "T,.,,,,GGGG,,GGT", "TFF,,,,GGGG,,GGT", "TFF,,,,GGGG,,GGT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 7, y: 0, to: "maggiore", tx: 7, ty: 14 }, { x: 15, y: 8, to: "osteria", tx: 1, ty: 8 }],
    heal: { x: 2, y: 13 },
    wild: [["mortazzone", 3, 5, 3], ["umarellino", 3, 5, 3], ["squacquerone", 3, 5, 3], ["portichino", 6, 6, 1], ["crescentino", 3, 5, 2], ["canalino", 5, 5, 1]],
    signs: { "4,9": "BOLOGNA: la Dotta, la Grassa, la Rossa. E da qualche anno anche la Cara (vedi affitti)." },
    npcs: [
      { id: "bo_balanzone", x: 4, y: 7, name: "Prof. Albe", look: L("#4e2e18", "#263238"), kind: "talk", lines: ["Eccoti! Ricorda: ogni provincia ha i suoi Mostrelli, i suoi piatti e il suo dialetto. Esplorale tutte!", "Se ti perdi, guarda l'obiettivo in alto: ti dico sempre io dove andare.", "E se trovi qualcuno della Banda della Panna... fagli vedere chi comanda in Emilia-Romagna!"] },
      { id: "bo_sfoglina", x: 2, y: 12, name: "Sfoglina Rosanna", look: L("#ffffff", "#c0392b"), kind: "heal", lines: ["Ma guarda come sei sciupato! Siediti che ti faccio i tortellini. In brodo, ovvio.", "Con la panna? Ma sei matto? Ti caccio di casa a mattarellate!", "Ecco, la tua squadra è tornata in forma. Mangia, che sei pelle e ossa."] },
      { id: "bo_bottega", x: 13, y: 3, name: "Bottegaio del Quadrilatero", look: L("#ffffff", "#7b4a2a"), kind: "shop", lines: ["Benvenuto in bottega! Prezzi da centro storico, sorrisi da centro storico. Cosa ti serve?"] },
      { id: "bo_studente", x: 8, y: 7, name: "Studente Fuorisede", look: L("#2e7d32", "#616161"), kind: "trainer", lines: ["Pago 600 euro per un posto letto in doppia con tre coinquilini. Ho bisogno di vincere QUALCOSA nella vita!"], team: [["squacquerone", 3]], reward: 60, after: ["Ho perso pure questa. Torno in Piazza Verdi a fare l'aperitivo... a 9 euro lo spritz. Che città."] },
      { id: "bo_gino", x: 9, y: 4, name: "Gino, Umarell Supremo", look: L("#616161", "#7b4a2a"), kind: "boss", badge: "Sigillo del Cantiere", lines: ["Eh, ma qui hanno sbagliato tutto. Quel tubo va a sinistra. Lo dico da quarant'anni, ma nessuno mi ascolta.", "Tu! Vuoi insegnarmi qualcosa? Fatti sotto, che io ho visto più cantieri che tramonti!"], team: [["umarellino", 7], ["mortazzone", 8]], reward: 200, after: ["Socc'mel, che lotta! Prendi il Sigillo del Cantiere.", "E ricordati: i lavori del tram finiscono sempre... l'anno prossimo."] },
    ],
  },
  ferrara: {
    id: "ferrara", name: "Ferrara", music: "ferrara",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TGGGG,,,,,,GGGGT", "TGGGG,WWWW,GGGGT", "T,,,,WWBBWW,,,,T",
      "T,RRR,WBBBW,RRRT", "T,HDH,WWWW,,HDHT", "T,,,,,,..,,,,,,T", "TCCCCCCCCCCCCCCT",
      "T,,,,,,..,,,,,,T", "TGGG,S,..,,,GGGT", "TGGG,,,..,,,GGGT", "TGGGGG,..,GGGGGT",
      "TFF,,,,..,,,,FFT", "T,,,,,,..,,,,,,T", "T,,,,,,..,,,,,,T", "TTTTTTT.TTTTTTTT",
    ],
    exits: [{ x: 7, y: 15, to: "altedo", tx: 7, ty: 1 }],
    heal: { x: 3, y: 7 },
    wild: [["zanzarone", 14, 16, 3], ["nebbiolone", 14, 16, 3], ["salamone", 14, 16, 2], ["biciclone", 14, 16, 2], ["cappellaccio", 14, 16, 2], ["canalino", 14, 16, 1]],
    signs: { "5,9": "FERRARA: città delle biciclette. Pedoni, siete stati avvisati. Automobilisti, pure." },
    npcs: [
      { id: "fe_oste", x: 3, y: 6, name: "Oste della Salama", look: L("#ffffff", "#e0913a"), kind: "heal", lines: ["Salama da sugo col purè: sei ore di cottura. E tu arrivi di corsa? Siediti e mastica piano, bolognese.", "Ecco, tutti rimessi in sesto. Il cappellaccio di zucca te lo offro io."] },
      { id: "fe_fornaio", x: 13, y: 6, name: "Fornaio della Coppia", look: L("#ffffff", "#f3e3b5"), kind: "shop", lines: ["Pane a coppia appena sfornato! Ah, vuoi solo vasetti? Che tristezza, voi giovani."] },
      { id: "fe_ciclista", x: 5, y: 7, name: "Ciclista Furibonda", look: L("#c0392b", "#fbc02d"), kind: "trainer", lines: ["DLIN DLIN! Togliti dalla ciclabile! Ah, sei sulla strada? Togliti lo stesso!"], team: [["biciclone", 15], ["zanzarone", 15]], reward: 200, after: ["Ho forato. Per colpa tua. Ora devo andare a piedi come una bolognese qualunque."] },
      { id: "fe_pescatore", x: 10, y: 10, name: "Pescatore del Po", look: L("#2e7d32", "#8d6e63"), kind: "trainer", lines: ["Qui c'è nebbia e zanzare. Le zanzare le senti, la nebbia la respiri. Il pesce? Mai visto."], team: [["nebbiolone", 15], ["salamone", 16]], reward: 200, after: ["Oggi non si pesca niente. Nemmeno una vittoria."] },
      { id: "fe_contessa", x: 8, y: 6, name: "Contessa Nebbia d'Este", look: L("#fbc02d", "#7b1f3a"), kind: "boss", badge: "Sigillo Estense", lines: ["Chi è questo forestiero che puzza di mortadella? Noi qui avevamo una corte rinascimentale quando voi stavate ancora sotto i portici a lamentarvi.", "La nebbia è la mia corte. Inchinati, o perdi!"], team: [["nebbiolone", 19], ["zanzarazza", 22], ["salamone", 21]], reward: 800, after: ["Uff... Hai vinto. Prendi il Sigillo Estense.", "Ma non dirlo in giro a Bologna, che poi si montano la testa."] },
    ],
  },
  osteria: {
    id: "osteria", name: "Osteria Grande", music: "osteria",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TGGGGGGT,,GGGGGT", "TGGGGGGT,,GGGGGT", "T,,,,,,,,,,,,,,T",
      "T,RRRRR,,,RRRR,T", "T,HHDHH,,,HHDH,T", "T,,,,,,,,,,,,,,T", "TAAAAAAAAAAAAAAT",
      "................", "TAAAAAAAAAAAAAAT", "T,,,,,,,,,,,,,,T", "T,GGGGG,,,GGGGGT",
      "T,GGGGG,S,GGGGGT", "T,GGGGG,,,GGGGGT", "T,FFF,,,,,,,FFFT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 0, y: 8, to: "bologna", tx: 14, ty: 8 }, { x: 15, y: 8, to: "csp", tx: 1, ty: 8 }],
    heal: { x: 4, y: 7 },
    wild: [["mortazzone", 5, 7, 2], ["passatellone", 5, 7, 3], ["cinghialotto", 5, 7, 3], ["piadinone", 6, 6, 1], ["crescentino", 5, 7, 2], ["zuppone", 6, 7, 2]],
    signs: { "8,12": "OSTERIA GRANDE: dove la Via Emilia rallenta solo per la crescentina." },
    npcs: [
      { id: "og_oste", x: 4, y: 6, name: "Oste Bruno", look: L("#ffffff", "#ffffff"), kind: "heal", lines: ["Benvenuto all'osteria! Il menu non c'è: mangi quello che dico io. Oggi crescentine. Domani pure.", "Ecco fatto, squadra sazia. Il conto? Te lo segno, tanto torni."] },
      { id: "og_sagra", x: 8, y: 3, name: "Fanatico della Sagra", look: L("#fbc02d", "#c0392b"), kind: "trainer", lines: ["Sagra della salsiccia, sagra del tortellone, sagra della sagra! Non me ne perdo una dal '78!"], team: [["mortazzone", 7], ["passatellone", 7]], reward: 90, after: ["Vado a consolarmi alla sagra della polenta. Ce n'è una stasera, sicuro."] },
      { id: "og_cacciatore", x: 6, y: 10, name: "Cacciatore Domenicale", look: L("#2e7d32", "#4e2e18"), kind: "trainer", lines: ["Ssst! Aspetto il cinghiale da sei ore. Tu mi hai fatto scappare tutto!"], team: [["cinghialotto", 8]], reward: 80, after: ["Va beh, stasera tagliatelle senza ragù di cinghiale. Colpa tua."] },
      { id: "og_tonello", x: 3, y: 3, name: "Tonello", look: L("#7b4a2a", "#fbc02d"), kind: "trainer", lines: ["Sono Tonello, campione di briscola del bar di Osteria Grande dal 1983! Al bar mi temono tutti, anche il barista.", "Tu hai la faccia di uno che ha appena finito di perdere a carte. Vediamo se coi mostrelli vai meglio!"], team: [["mortazzone", 8], ["cinghialotto", 8], ["passatellone", 9]], reward: 120, after: ["Mi hai battuto come un due di picche. Torno al bar a dire che ho vinto io, tanto nessuno controlla."] },
      { id: "og_loris", x: 12, y: 6, name: "Camionista Loris", look: L("#c0392b", "#616161"), kind: "boss", badge: "Sigillo della Via Emilia", lines: ["Faccio la Via Emilia da Piacenza a Rimini da trent'anni. Conosco ogni buca e ogni autogrill per nome.", "Vediamo se reggi il ritmo di uno che pranza alle 11 e cena alle 18!"], team: [["passatellone", 10], ["cinghialotto", 11], ["crescentone", 12]], reward: 300, after: ["Mi hai sorpassato a destra, ma per stavolta chiudo un occhio. Ecco il Sigillo della Via Emilia."] },
    ],
  },
  csp: {
    id: "csp", name: "Castel San Pietro", music: "terme",
    tiles: [
      "TTTTTTTTTTTTTTTT", "T,,,,TBBBT,,,,,T", "T,RR,TBBBT,RRR,T", "T,HD,,,.,,,HDH,T",
      "T,,,,,,.,,,,,,,T", "TWWWWW,.,GGGGGGT", "TWWWWW,.,GGGGGGT", "TWWWWW,.,GGGGGGT",
      "................", "T,,,,,,.,,,,,,,T", "TGGGGG,.,RRRR,,T", "TGGGGG,.,HHDH,,T",
      "TGGGGG,.,,,,,S,T", "TGGGGG,.,,,,,,,T", "TFFF,,,.,,,FFFFT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 0, y: 8, to: "osteria", tx: 14, ty: 8 }, { x: 15, y: 8, to: "imola", tx: 1, ty: 8 }],
    heal: { x: 4, y: 4 },
    wild: [["vaporella", 8, 10, 3], ["piadinone", 8, 10, 3], ["cinghialotto", 8, 10, 2], ["passatellone", 9, 9, 2], ["lambruschino", 8, 10, 2], ["zuppone", 8, 10, 2]],
    signs: { "13,12": "CASTEL SAN PIETRO TERME: rilassati. È un ordine del Sindaco." },
    npcs: [
      { id: "cs_terme", x: 3, y: 4, name: "Signora delle Terme", look: L("#ffffff", "#cfd8dc"), kind: "heal", lines: ["Un bel bagno nei fanghi e torni come nuovo! L'ha detto anche mio cugino, che è quasi medico.", "Visto? Pelle di pesca. Tutti in forma."] },
      { id: "cs_farmacia", x: 12, y: 4, name: "Farmacista del Corso", look: L("#ffffff", "#4caf50"), kind: "shop", lines: ["Brodini, vasetti e consigli non richiesti. I consigli sono gratis, purtroppo per te."] },
      { id: "cs_sindaco", x: 7, y: 4, name: "Sindaco del Cassero", look: L("#1a1a1a", "#1a1a1a"), kind: "trainer", lines: ["Inauguro questa rotonda, questa panchina e anche te! Ma prima, una lotta per il giornalino comunale!"], team: [["squacquerone", 10], ["cinghialotto", 11]], reward: 150, after: ["Ottimo, finirà comunque in prima pagina. Con la mia foto, non la tua."] },
      { id: "cs_bagnante", x: 8, y: 9, name: "Bagnante in Accappatoio", look: L("#ffffff", "#ffffff"), kind: "trainer", lines: ["Sono alle terme da tre settimane. Non ricordo più che lavoro faccio. Che bello."], team: [["vaporella", 11], ["piadinone", 11]], reward: 120, after: ["Torno in vasca. Se mi cerca il capo, non mi hai visto."] },
      { id: "cs_ivonne", x: 11, y: 12, name: "Nonna Ivonne", look: L("#cfd8dc", "#7b1f3a"), kind: "boss", badge: "Sigillo delle Terme", lines: ["Alla mia età ho visto di tutto: la guerra, il boom, e i giovani che mettono l'ananas sulla piadina.", "Non ti lascio andare finché non hai mangiato. E lottato. Prima lottato."], team: [["vaporella", 13], ["fanghino", 13], ["piadinone", 14]], reward: 400, after: ["Bravo, bravo. Tieni il Sigillo delle Terme e una fetta di torta di riso.", "Non dire di no, che mi offendo."] },
    ],
  },
  imola: {
    id: "imola", name: "Imola", music: "imola",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TAAAAAAAAAAAAAAT", "TA,,,,,,,,,,,,AT", "TA,GGGG,,GGGG,AT",
      "TA,GGGG,,GGGG,AT", "TA,,,,,,,,,,,,AT", "TAAAAAAA.AAAAAAT", "T,,,,,,,.,,,,,,T",
      "........,RRRR,,.", "T,RRR,,,,HHDH,,T", "T,HDH,,,,,,,,S,T", "T,,,,,,,,,,,,,,T",
      "TGGGGGG,,GGGGGGT", "TGGGGGG,,GGGGGGT", "TFFF,,,,,,,,FFFT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 0, y: 8, to: "csp", tx: 14, ty: 8 }, { x: 15, y: 8, to: "riviera", tx: 1, ty: 8 }],
    heal: { x: 4, y: 11 },
    wild: [["pistonzo", 11, 13, 3], ["cinghialotto", 11, 13, 2], ["vaporella", 12, 12, 1], ["biciclone", 12, 13, 1], ["lambruschino", 11, 13, 2], ["scooterone", 12, 13, 1]],
    signs: { "13,10": "IMOLA: qui si va forte. Anche al bar, anche a tavola." },
    npcs: [
      { id: "im_barista", x: 3, y: 11, name: "Barista dell'Autodromo", look: L("#c0392b", "#ffffff"), kind: "heal", lines: ["Caffè ristretto, gomme nuove e via! Al mio bar il pit-stop lo facciamo anche ai mostrelli.", "Fatto! Tutti al cento per cento. Il caffè però lo paghi."] },
      { id: "im_tifoso", x: 8, y: 5, name: "Tifoso in Tuta Rossa", look: L("#c0392b", "#c0392b"), kind: "trainer", lines: ["Vengo qui ogni weekend dal 1987. Mia moglie è convinta che lavoro la domenica."], team: [["pistonzo", 13], ["cinghialotto", 13]], reward: 160, after: ["Nooo! Va beh, la stagione prossima è quella buona. Lo dico da 37 anni."] },
      { id: "im_contadina", x: 5, y: 7, name: "Contadina dei Colli", look: L("#fbc02d", "#388e3c"), kind: "trainer", lines: ["Le mie albicocche sono le migliori del mondo. Chi dice il contrario se la vede coi miei mostrelli!"], team: [["cinghialotto", 12], ["piadinone", 13]], reward: 140, after: ["Brava gioventù. Ti darei un'albicocca, ma quest'anno le ha mangiate tutte il cinghiale."] },
      { id: "im_ivano", x: 11, y: 10, name: "Ivano detto Pistone", look: L("#fbc02d", "#c0392b"), kind: "boss", badge: "Sigillo del Rombo", lines: ["Avrei potuto essere un pilota. Davvero. Ho solo sbagliato... tutto il resto.", "Ma in lotta sono il più veloce della Romagna! ...Come, Imola è ancora un po' Emilia? Non importa. VRRRUUUM!"], team: [["turbonzo", 18], ["biciclone", 17]], reward: 500, after: ["Giù dal podio un'altra volta. Prendi il Sigillo del Rombo.", "Io torno a guardare le gare dal prato, con la mia sedia pieghevole."] },
    ],
  },
  maggiore: {
    id: "maggiore", name: "Castel Maggiore", music: "maggiore",
    tiles: ['TTTTTTT.TTTTTTTT', 'TGGGG,,.,,GGGGGT', 'TGGGG,,.,,GGGGGT', 'T,RRR,,.,,RRRR,T', 'T,HDH,,.,,HHDH,T', 'T,,,,,,.,,,,,,,T', 'T,,,,,,.,,,,,,,T', 'TCCCCCCCCCCCCCCT', 'T,,,,,,.,,,S,,,T', 'TGGGGG,.,GGGGGGT', 'TGGGGG,.,GGGGGGT', 'T,,,,,,.,,,,,,,T', 'TWWWW,,.,,FFFFFT', 'TWWWW,,.,,FFFFFT', 'T,,,,,,.,,,,,,,T', 'TTTTTTT.TTTTTTTT'],
    exits: [{ x: 7, y: 15, to: "bologna", tx: 7, ty: 1 }, { x: 7, y: 0, to: "altedo", tx: 7, ty: 14 }],
    heal: { x: 4, y: 5 },
    wild: [["canalino", 9, 12, 2], ["crescentino", 9, 12, 2], ["zuppone", 9, 12, 2], ["umarellino", 10, 12, 2]],
    signs: { "11,8": "CASTEL MAGGIORE: a due passi da Bologna, ma guai a dire che è periferia." },
    npcs: [
      { id: "cm_barista", x: 3, y: 5, name: "Barista della Piazza", look: L("#ffffff", "#1a1a1a"), kind: "heal", lines: ["Un caffè, un toast e due chiacchiere sul Bologna. Ecco fatto, squadra come nuova!"] },
      { id: "cm_ferramenta", x: 12, y: 5, name: "Ferramenta Eugenio", look: L("#7b4a2a", "#9e9e9e"), kind: "shop", lines: ["Viti, bulloni, vasetti e brodini. Da Eugenio c'è tutto, basta saperlo cercare."] },
      { id: "cm_pendolare", x: 5, y: 8, name: "Pendolare delle 7:12", look: L("#424242", "#1565c0"), kind: "trainer", lines: ["Il mio treno per Bologna ha 40 minuti di ritardo. Ho tutto il tempo per batterti!"], team: [["canalino", 10], ["umarellino", 11]], reward: 140, after: ["Ecco, è arrivato il treno. Anzi no, è soppresso. Che giornata."] },
      { id: "cm_mamma", x: 10, y: 11, name: "Mamma del Gruppo WhatsApp", look: L("#e91e63", "#f4a6b0"), kind: "trainer", lines: ["Ho 47 notifiche non lette sul gruppo della scuola e una lotta da vincere. Facciamo in fretta!"], team: [["zuppone", 11], ["crescentino", 11]], reward: 150, after: ["Ho perso, ma lo scrivo sul gruppo come se avessi vinto io."] },
    ],
  },
  altedo: {
    id: "altedo", name: "Altedo", music: "altedo",
    tiles: ['TTTTTTT.TTTTTTTT', 'TGGGG,,.,,GGGGGT', 'TGGGG,,.,,GGGGGT', 'T,RRR,,.,,RRRR,T', 'T,HDH,,.,,HHDH,T', 'T,,,,,,.,,,,,,,T', 'T,,,,,,.,,,,,,,T', 'TCCCCCCCCCCCCCCT', 'T,,,,,,.,,,S,,,T', 'TGGGGG,.,GGGGGGT', 'TGGGGG,.,GGGGGGT', 'T,,,,,,.,,,,,,,T', 'TGGGG,,.,,GGGGGT', 'TGGGG,,.,,GGGGGT', 'T,,,,,,.,,,,,,,T', 'TTTTTTT.TTTTTTTT'],
    exits: [{ x: 7, y: 15, to: "maggiore", tx: 7, ty: 1 }, { x: 7, y: 0, to: "ferrara", tx: 7, ty: 14 }],
    heal: { x: 4, y: 5 },
    wild: [["cappellaccio", 11, 14, 3], ["cinghialotto", 11, 14, 2], ["zanzarone", 12, 14, 2], ["lambruschino", 11, 13, 2]],
    signs: { "11,8": "ALTEDO: capitale dell'asparago verde. Qui l'asparago è una religione." },
    npcs: [
      { id: "al_nonna", x: 3, y: 5, name: "Nonna dell'Asparago", look: L("#cfd8dc", "#4caf50"), kind: "heal", lines: ["Risotto agli asparagi per tutti! Fa bene, purifica, e ti fa fare la pipì profumata. Lo dice la scienza."] },
      { id: "al_banco", x: 12, y: 5, name: "Banco della Sagra", look: L("#fbc02d", "#2e7d32"), kind: "shop", lines: ["Prezzi da sagra! Vasetti, brodini e un mazzo di asparagi in omaggio. Gli asparagi no, quelli sono finiti."] },
      { id: "al_coltivatore", x: 5, y: 8, name: "Coltivatore di Asparagi", look: L("#2e7d32", "#8d6e63"), kind: "trainer", lines: ["Asparago verde, mica bianco come quelli del nord! Ti insegno io il rispetto per l'ortaggio!"], team: [["cappellaccio", 12], ["cinghialotto", 13]], reward: 170, after: ["Va bene, hai vinto. Ma l'asparago resta il re della tavola."] },
      { id: "al_ciclista", x: 10, y: 11, name: "Ciclista in Lycra della Domenica", look: L("#ffeb3b", "#00acc1"), kind: "trainer", lines: ["Bici da 8000 euro, maglia aderente, 40 km di pianura. Mi sento al Giro d'Italia!"], team: [["biciclone", 13], ["zanzarone", 13]], reward: 180, after: ["Ho perso perché la bici pesa 50 grammi di troppo. Sicuro."] },
    ],
  },
  riviera: {
    id: "riviera", name: "Riviera Romagnola", music: "beach",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TQQQQ,,,,,RRRR,T", "TQQQQ,,,,,HHDH,T", "T,,,,,,..,,,,,,T",
      "TRRR,,,..,,QQQQT", "THDH,,,..,,QQQQT", "T,,,,,,..,,,,,,T", "TYYYYYYYYYYYYYYT",
      "YYYYYYYYYYYYYYYT", "TYUYYYUYYYUYYYUT", "TYYYQQYYYYYQQYYT", "TUYYQQYYUYYQQYUT",
      "TYYYYYYYYYYYYYYT", "OOOOOOOOOOOOOOOO", "OOOOOOOOOOOOOOOO", "OOOOOOOOOOOOOOOO",
    ],
    exits: [{ x: 0, y: 8, to: "imola", tx: 14, ty: 8 }],
    heal: { x: 2, y: 7 },
    wild: [["gabbianone", 18, 21, 3], ["vongolino", 18, 21, 2], ["medusella", 18, 21, 2], ["discotecco", 19, 22, 2], ["ombrellone", 19, 22, 2], ["scooterone", 18, 21, 2]],
    signs: {},
    npcs: [
      { id: "ri_piadinara", x: 2, y: 6, name: "Piadinara Loretta", look: L("#ffffff", "#e0913a"), kind: "heal", lines: ["Piadina con squacquerone e rucola, e ti passa tutto! Il prosciutto? Lo paghi a parte, tesoro.", "Ecco, squadra rimessa a nuovo. Ricordati: qui la piadina si fa SOTTILE. Chi dice il contrario è di Rimini nord o di Rimini sud, non ricordo."] },
      { id: "ri_ambulante", x: 12, y: 3, name: "Venditore Ambulante", look: L("#fbc02d", "#ffffff"), kind: "shop", lines: ["Cocco fresco! Bibite fresche! Vasetti freschi! Tutto fresco tranne i prezzi, quelli scottano!"] },
      { id: "ri_turista", x: 5, y: 9, name: "Turista in Sandali e Calzini", look: L("#fbc02d", "#4caf50"), kind: "trainer", lines: ["Ja! Vengo qui da 30 estati. Conosco ogni bagnino per nome, e ho sempre l'asciugamano sul lettino alle 6 di mattina!"], team: [["vongolino", 19], ["gabbianone", 20]], reward: 250, after: ["Nein! Domani mi alzo alle 5, così il lettino migliore è mio."] },
      { id: "ri_vitellone", x: 10, y: 11, name: "Vitellone da Spiaggia", look: L("#1a1a1a", "#c0392b"), kind: "trainer", lines: ["Abbronzatura da 12 ore, camicia aperta, collanina d'oro. Ho conquistato tutta la spiaggia. Tranne mia madre, che mi chiama per il pranzo."], team: [["discotecco", 20], ["medusella", 20]], reward: 260, after: ["Ok, hai vinto. Ma stasera in discoteca il re sono io. Fino alle 23, poi devo rientrare."] },
      { id: "ri_nonna", x: 13, y: 7, name: "Nonna con la Borsa Frigo", look: L("#cfd8dc", "#4caf50"), kind: "trainer", lines: ["In questa borsa frigo ho lasagne, cotolette, anguria e un pollo intero. Al bar? Mai! Prima però si lotta."], team: [["ombrellone", 20], ["vongolino", 21]], reward: 240, after: ["Brava, ti sei meritato una cotoletta. Fredda, ma buonissima."] },
      { id: "ri_romeo", x: 8, y: 12, name: "Romeo, Re dei Lettini", look: L("#c0392b", "#fbc02d"), kind: "boss", badge: "Sigillo dell'Ombrellone", lines: ["Benvenuto al Bagno Mariolino 33! Prima fila 80 euro, seconda fila 75, la sabbia è gratis ma te la faccio pagare uguale.", "Quarant'anni di stagioni, migliaia di turisti, un solo amore: l'incasso di Ferragosto. Vediamo se mi rovini la stagione!"], team: [["gabbianazzo", 26], ["medusella", 22], ["discotecco", 24]], reward: 1000, after: ["Mi hai battuto in pieno agosto, che disonore! Prendi il Sigillo dell'Ombrellone.", "E l'ombrellone stasera te lo regalo. Il lettino no, eh."] },
    ],
  },
};

Object.assign(MAPS, X_MAPS);
linkExpansion(MAPS);
buildWorld(MAPS, SPECIES_LIST);
MAPS.acetaia.interior = true;
MAPS.mercato.interior = true;
buildSecrets(MAPS, SPECIES_LIST);
buildTowns(MAPS, SPECIES_LIST);
placeStory(MAPS);
buildGyms(MAPS, SPECIES_LIST);
buildBoutiques(MAPS);
if (MAPS.predappio__palestra) MAPS.predappio__palestra.music = "duc";
if (MAPS.predappio__3_3) MAPS.predappio__3_3.name = "Chiesa di Sant'Antonio";
if (MAPS.predappio__7_13) {
  MAPS.predappio__7_13.name = "Bottega dei Souvenir";
  const p0 = MAPS.predappio__7_13.npcs.find((n) => n.kind === "talk");
  if (p0) p0.lines = ["Calamite, tazze, magliette, accendini... qui si vende proprio di tutto.", "Il buon gusto, purtroppo, l'abbiamo finito anni fa."];
}

export const ALL_BADGES = ["Sigillo del Cantiere", "Sigillo della Via Emilia", "Sigillo delle Terme", "Sigillo del Rombo", "Sigillo Estense", "Sigillo dell'Ombrellone", ...X_BADGES, ...W_BADGES];

export const INTRO_LINES = [
  "Ciao! Io sono il Prof. Albe, e studio i MOSTRELLI: creature strane, golose e chiacchierone.",
  "Ne trovi in tutta l'Emilia-Romagna, da Piacenza a Rimini, dalle valli del Po all'Appennino. Ogni zona ha i suoi.",
  "Ti accompagnerò in tutta l'avventura. Prima però dimmi chi sei: poi andiamo in trattoria, che ti ho preparato una sorpresa!",
];
