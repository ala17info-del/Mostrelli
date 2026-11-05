// All game content is original: creatures, places-as-maps, characters and texts.
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

export type Move = { name: string; type: TypeId; power: number; acc: number };
export const MOVES: Record<string, Move> = {
  sberla: { name: "Sberla", type: "chiacchiera", power: 40, acc: 100 },
  chiacchierata: { name: "Chiacchierata Infinita", type: "chiacchiera", power: 55, acc: 95 },
  lamentela: { name: "Lamentela al Comune", type: "chiacchiera", power: 70, acc: 90 },
  ragu: { name: "Schizzo di Ragù", type: "sugo", power: 45, acc: 100 },
  brodo: { name: "Brodo Bollente", type: "sugo", power: 65, acc: 95 },
  forno: { name: "Lasagna al Forno", type: "sugo", power: 85, acc: 85 },
  fango: { name: "Spruzzo di Fango", type: "terme", power: 45, acc: 100 },
  vapore: { name: "Getto Termale", type: "terme", power: 65, acc: 95 },
  sauna: { name: "Sauna Infernale", type: "terme", power: 85, acc: 85 },
  grappolo: { name: "Grappolata", type: "campi", power: 45, acc: 100 },
  vendemmia: { name: "Vendemmia", type: "campi", power: 65, acc: 95 },
  trattore: { name: "Trattore Selvaggio", type: "campi", power: 85, acc: 85 },
  rombo: { name: "Rombo", type: "motore", power: 45, acc: 100 },
  sgommata: { name: "Sgommata", type: "motore", power: 65, acc: 95 },
  girovel: { name: "Giro Veloce", type: "motore", power: 85, acc: 85 },
  foschia: { name: "Foschia", type: "nebbia", power: 45, acc: 100 },
  nebbione: { name: "Nebbione Padano", type: "nebbia", power: 65, acc: 95 },
  puntura: { name: "Puntura Estense", type: "nebbia", power: 85, acc: 85 },
};

export type Species = {
  id: string; num: number; name: string; type: TypeId;
  hp: number; atk: number; def: number; spd: number;
  catchRate: number; moves: [string, number][]; desc: string;
};

const sp = (s: Species) => s;
export const SPECIES_LIST: Species[] = [
  sp({ id: "tortellotto", num: 1, name: "Tortellotto", type: "sugo", hp: 45, atk: 52, def: 43, spd: 60, catchRate: 0.4, moves: [["sberla", 1], ["ragu", 1], ["brodo", 10], ["forno", 20]], desc: "Un tortellino ripieno di orgoglio bolognese. Se lo chiami 'raviolo' ti morde il naso." }),
  sp({ id: "fanghino", num: 2, name: "Fanghino", type: "terme", hp: 50, atk: 45, def: 55, spd: 45, catchRate: 0.4, moves: [["sberla", 1], ["fango", 1], ["vapore", 10], ["sauna", 20]], desc: "Rana di fango termale. Giura che fa benissimo alla pelle, lo dice suo cugino quasi medico." }),
  sp({ id: "grappolino", num: 3, name: "Grappolino", type: "campi", hp: 48, atk: 49, def: 50, spd: 50, catchRate: 0.4, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 20]], desc: "Grappolo d'uva dei colli con le gambe. Alle quattro del pomeriggio è già allegro." }),
  sp({ id: "mortazzone", num: 4, name: "Mortazzone", type: "chiacchiera", hp: 70, atk: 50, def: 55, spd: 30, catchRate: 0.6, moves: [["sberla", 1], ["chiacchierata", 8], ["lamentela", 16], ["brodo", 22]], desc: "Maiale rosa a fette con pistacchi. Si offende a morte se lo chiami 'Bologna' all'americana." }),
  sp({ id: "umarellino", num: 5, name: "Umarellino", type: "chiacchiera", hp: 40, atk: 35, def: 60, spd: 25, catchRate: 0.7, moves: [["sberla", 1], ["chiacchierata", 5], ["lamentela", 12], ["foschia", 18]], desc: "Spiritello pensionato con le mani dietro la schiena. Compare davanti a ogni cantiere per criticare." }),
  sp({ id: "zanzarone", num: 6, name: "Zanzarone", type: "nebbia", hp: 35, atk: 55, def: 35, spd: 75, catchRate: 0.5, moves: [["sberla", 1], ["foschia", 1], ["puntura", 12], ["nebbione", 18]], desc: "Zanzara della pianura grande come un piccione. Da giugno a settembre comanda lei." }),
  sp({ id: "nebbiolone", num: 7, name: "Nebbiolone", type: "nebbia", hp: 55, atk: 50, def: 60, spd: 40, catchRate: 0.45, moves: [["foschia", 1], ["sberla", 1], ["nebbione", 12], ["puntura", 22]], desc: "Fantasma di nebbia ferrarese. Lo vedi solo nei giorni in cui non c'è." }),
  sp({ id: "salamone", num: 8, name: "Salamone", type: "sugo", hp: 65, atk: 60, def: 50, spd: 35, catchRate: 0.45, moves: [["sberla", 1], ["ragu", 1], ["brodo", 10], ["forno", 18]], desc: "Salama da sugo vivente. Cuoce da sei ore e non ha nessuna fretta." }),
  sp({ id: "biciclone", num: 9, name: "Biciclone", type: "motore", hp: 45, atk: 55, def: 45, spd: 80, catchRate: 0.45, moves: [["sberla", 1], ["rombo", 1], ["sgommata", 12], ["girovel", 20]], desc: "Serpente con due ruote. Suona il campanello e non si ferma mai, nemmeno col rosso." }),
  sp({ id: "pistonzo", num: 10, name: "Pistonzo", type: "motore", hp: 50, atk: 65, def: 55, spd: 65, catchRate: 0.45, moves: [["sberla", 1], ["rombo", 1], ["sgommata", 10], ["girovel", 18]], desc: "Scarabeo con pistoni al posto delle zampe. Vive vicino all'autodromo e sogna il podio." }),
  sp({ id: "vaporella", num: 11, name: "Vaporella", type: "terme", hp: 45, atk: 50, def: 45, spd: 70, catchRate: 0.5, moves: [["sberla", 1], ["fango", 1], ["vapore", 10], ["sauna", 20]], desc: "Uccellino fatto di vapore termale. Profuma leggermente di zolfo e di accappatoio." }),
  sp({ id: "cinghialotto", num: 12, name: "Cinghialotto", type: "campi", hp: 60, atk: 65, def: 50, spd: 40, catchRate: 0.5, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 16]], desc: "Cinghiale delle colline. Distrugge le vigne e poi se ne vanta al bar." }),
  sp({ id: "squacquerone", num: 13, name: "Squacquerone", type: "chiacchiera", hp: 60, atk: 40, def: 45, spd: 35, catchRate: 0.65, moves: [["sberla", 1], ["fango", 4], ["chiacchierata", 10], ["lamentela", 18]], desc: "Formaggio molle e chiacchierone. Si spalma su qualsiasi conversazione, invitato o no." }),
  sp({ id: "piadinone", num: 14, name: "Piadinone", type: "campi", hp: 55, atk: 50, def: 65, spd: 30, catchRate: 0.55, moves: [["sberla", 1], ["grappolo", 1], ["vendemmia", 10], ["trattore", 18]], desc: "Tartaruga col guscio di piadina. Viene dalla Romagna e non smette un secondo di ricordartelo." }),
  sp({ id: "passatellone", num: 15, name: "Passatellone", type: "sugo", hp: 50, atk: 55, def: 45, spd: 55, catchRate: 0.55, moves: [["sberla", 1], ["ragu", 1], ["brodo", 9], ["forno", 19]], desc: "Verme di passatelli che nuota nel brodo. Si arriccia tutto quando è contento." }),
  sp({ id: "portichino", num: 16, name: "Portichino", type: "chiacchiera", hp: 80, atk: 70, def: 80, spd: 30, catchRate: 0.25, moves: [["sberla", 1], ["chiacchierata", 1], ["lamentela", 10], ["forno", 15]], desc: "Golem fatto di portici. Ti ripara sempre dalla pioggia, ma poi ti chiede 600 euro d'affitto." }),
];
export const SPECIES: Record<string, Species> = Object.fromEntries(SPECIES_LIST.map((s) => [s.id, s]));
export const STARTERS = ["tortellotto", "fanghino", "grappolino"];

export const ITEMS = {
  vasetto: { name: "Vasetto di Vetro", price: 20, desc: "Per catturare i mostri selvatici. Lavato a mano dalla nonna." },
  brodino: { name: "Brodino Caldo", price: 15, desc: "Cura 25 PV. Fatto col cappone, come Dio comanda." },
} as const;
export type ItemId = keyof typeof ITEMS;

export const BLOCKING = new Set(["T", "W", "R", "H", "D", "B", "S"]);

export type Npc = {
  id: string; x: number; y: number; name: string;
  look: { A: string; C: string };
  kind: "talk" | "heal" | "shop" | "trainer" | "boss";
  lines: string[];
  team?: [string, number][];
  reward?: number;
  badge?: string;
  after?: string[];
};

export type GameMap = {
  id: string; name: string; tiles: string[];
  exits: { x: number; y: number; to: string; tx: number; ty: number }[];
  heal: { x: number; y: number };
  wild: [string, number, number, number][];
  npcs: Npc[];
  signs: Record<string, string>;
};

const L = (A: string, C: string) => ({ A, C });

export const MAPS: Record<string, GameMap> = {
  bologna: {
    id: "bologna", name: "Bologna",
    tiles: [
      "TTTTTTT.TTTTTTTT", "TGGGGGT.TBBTRRRT", "TGGGGG..TBBTHDHT", "TT,,,,..,BB,,.,T",
      "TRRRT,.......,,T", "THDHT,PPPPPPP.,T", "T,.,,,PCCCCCP.,T", "T,.,,,PCCCCCP.,T",
      "T,.........CC...", "T,,,S,PCCCCCP.,T", "TRRRT,PPPPPPP.,T", "THDHT,.......GGT",
      "T,.,,,,GGGG,,GGT", "TFF,,,,GGGG,,GGT", "TFF,,,,GGGG,,GGT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 7, y: 0, to: "ferrara", tx: 7, ty: 14 }, { x: 15, y: 8, to: "osteria", tx: 1, ty: 8 }],
    heal: { x: 2, y: 13 },
    wild: [["mortazzone", 3, 5, 3], ["umarellino", 3, 5, 3], ["squacquerone", 3, 5, 3], ["portichino", 6, 6, 1]],
    signs: { "4,9": "BOLOGNA: la Dotta, la Grassa, la Rossa. E da qualche anno anche la Cara (vedi affitti)." },
    npcs: [
      { id: "bo_balanzone", x: 4, y: 7, name: "Dottor Balanzone", look: L("#1a1a1a", "#1a1a1a"), kind: "talk", lines: ["Ah, il mio apprendista! Ricorda: l'Università di Bologna è la più antica del mondo occidentale. Te l'ho già detto? Te lo ridico.", "Cinque Capi comandano queste terre: Bologna, Osteria Grande, Castel San Pietro, Imola e Ferrara. Battili tutti e sarai Campione dell'Emilia!", "O almeno avrai qualcosa da raccontare al bar per i prossimi trent'anni."] },
      { id: "bo_sfoglina", x: 2, y: 12, name: "Sfoglina Rosanna", look: L("#ffffff", "#c0392b"), kind: "heal", lines: ["Ma guarda come sei sciupato! Siediti che ti faccio i tortellini. In brodo, ovvio.", "Con la panna? Ma sei matto? Ti caccio di casa a mattarellate!", "Ecco, la tua squadra è tornata in forma. Mangia, che sei pelle e ossa."] },
      { id: "bo_bottega", x: 13, y: 3, name: "Bottegaio del Quadrilatero", look: L("#ffffff", "#7b4a2a"), kind: "shop", lines: ["Benvenuto in bottega! Prezzi da centro storico, sorrisi da centro storico. Cosa ti serve?"] },
      { id: "bo_studente", x: 8, y: 7, name: "Studente Fuorisede", look: L("#2e7d32", "#616161"), kind: "trainer", lines: ["Pago 600 euro per un posto letto in doppia con tre coinquilini. Ho bisogno di vincere QUALCOSA nella vita!"], team: [["squacquerone", 3]], reward: 60, after: ["Ho perso pure questa. Torno in Piazza Verdi a fare l'aperitivo... a 9 euro lo spritz. Che città."] },
      { id: "bo_gino", x: 9, y: 4, name: "Gino, Umarell Supremo", look: L("#616161", "#7b4a2a"), kind: "boss", badge: "Sigillo del Cantiere", lines: ["Eh, ma qui hanno sbagliato tutto. Quel tubo va a sinistra. Lo dico da quarant'anni, ma nessuno mi ascolta.", "Tu! Vuoi insegnarmi qualcosa? Fatti sotto, che io ho visto più cantieri che tramonti!"], team: [["umarellino", 7], ["mortazzone", 8]], reward: 200, after: ["Socc'mel, che lotta! Prendi il Sigillo del Cantiere.", "E ricordati: i lavori del tram finiscono sempre... l'anno prossimo."] },
    ],
  },
  ferrara: {
    id: "ferrara", name: "Ferrara",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TGGGG,,,,,,GGGGT", "TGGGG,WWWW,GGGGT", "T,,,,WWBBWW,,,,T",
      "T,RRR,WBBBW,RRRT", "T,HDH,WWWW,,HDHT", "T,,,,,,..,,,,,,T", "TCCCCCCCCCCCCCCT",
      "T,,,,,,..,,,,,,T", "TGGG,S,..,,,GGGT", "TGGG,,,..,,,GGGT", "TGGGGG,..,GGGGGT",
      "TFF,,,,..,,,,FFT", "T,,,,,,..,,,,,,T", "T,,,,,,..,,,,,,T", "TTTTTTT.TTTTTTTT",
    ],
    exits: [{ x: 7, y: 15, to: "bologna", tx: 7, ty: 1 }],
    heal: { x: 3, y: 7 },
    wild: [["zanzarone", 14, 16, 3], ["nebbiolone", 14, 16, 3], ["salamone", 14, 16, 2], ["biciclone", 14, 16, 2]],
    signs: { "5,9": "FERRARA: città delle biciclette. Pedoni, siete stati avvisati. Automobilisti, pure." },
    npcs: [
      { id: "fe_oste", x: 3, y: 6, name: "Oste della Salama", look: L("#ffffff", "#e0913a"), kind: "heal", lines: ["Salama da sugo col purè: sei ore di cottura. E tu arrivi di corsa? Siediti e mastica piano, bolognese.", "Ecco, tutti rimessi in sesto. Il cappellaccio di zucca te lo offro io."] },
      { id: "fe_fornaio", x: 13, y: 6, name: "Fornaio della Coppia", look: L("#ffffff", "#f3e3b5"), kind: "shop", lines: ["Pane a coppia appena sfornato! Ah, vuoi solo vasetti? Che tristezza, voi giovani."] },
      { id: "fe_ciclista", x: 5, y: 7, name: "Ciclista Furibonda", look: L("#c0392b", "#fbc02d"), kind: "trainer", lines: ["DLIN DLIN! Togliti dalla ciclabile! Ah, sei sulla strada? Togliti lo stesso!"], team: [["biciclone", 15], ["zanzarone", 15]], reward: 200, after: ["Ho forato. Per colpa tua. Ora devo andare a piedi come una bolognese qualunque."] },
      { id: "fe_pescatore", x: 10, y: 10, name: "Pescatore del Po", look: L("#2e7d32", "#8d6e63"), kind: "trainer", lines: ["Qui c'è nebbia e zanzare. Le zanzare le senti, la nebbia la respiri. Il pesce? Mai visto."], team: [["nebbiolone", 15], ["salamone", 16]], reward: 200, after: ["Oggi non si pesca niente. Nemmeno una vittoria."] },
      { id: "fe_contessa", x: 8, y: 6, name: "Contessa Nebbia d'Este", look: L("#fbc02d", "#7b1f3a"), kind: "boss", badge: "Sigillo Estense", lines: ["Chi è questo forestiero che puzza di mortadella? Noi qui avevamo una corte rinascimentale quando voi stavate ancora sotto i portici a lamentarvi.", "La nebbia è la mia corte. Inchinati, o perdi!"], team: [["nebbiolone", 19], ["zanzarone", 19], ["salamone", 21]], reward: 800, after: ["Uff... Hai vinto. Prendi il Sigillo Estense.", "Ma non dirlo in giro a Bologna, che poi si montano la testa."] },
    ],
  },
  osteria: {
    id: "osteria", name: "Osteria Grande",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TGGGGGGT,,GGGGGT", "TGGGGGGT,,GGGGGT", "T,,,,,,,,,,,,,,T",
      "T,RRRRR,,,RRRR,T", "T,HHDHH,,,HHDH,T", "T,,,,,,,,,,,,,,T", "TAAAAAAAAAAAAAAT",
      "................", "TAAAAAAAAAAAAAAT", "T,,,,,,,,,,,,,,T", "T,GGGGG,,,GGGGGT",
      "T,GGGGG,S,GGGGGT", "T,GGGGG,,,GGGGGT", "T,FFF,,,,,,,FFFT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 0, y: 8, to: "bologna", tx: 14, ty: 8 }, { x: 15, y: 8, to: "csp", tx: 1, ty: 8 }],
    heal: { x: 4, y: 7 },
    wild: [["mortazzone", 5, 7, 2], ["passatellone", 5, 7, 3], ["cinghialotto", 5, 7, 3], ["piadinone", 6, 6, 1]],
    signs: { "8,12": "OSTERIA GRANDE: dove la Via Emilia rallenta solo per la crescentina." },
    npcs: [
      { id: "og_oste", x: 4, y: 6, name: "Oste Bruno", look: L("#ffffff", "#ffffff"), kind: "heal", lines: ["Benvenuto all'osteria! Il menu non c'è: mangi quello che dico io. Oggi crescentine. Domani pure.", "Ecco fatto, squadra sazia. Il conto? Te lo segno, tanto torni."] },
      { id: "og_sagra", x: 8, y: 3, name: "Fanatico della Sagra", look: L("#fbc02d", "#c0392b"), kind: "trainer", lines: ["Sagra della salsiccia, sagra del tortellone, sagra della sagra! Non me ne perdo una dal '78!"], team: [["mortazzone", 7], ["passatellone", 7]], reward: 90, after: ["Vado a consolarmi alla sagra della polenta. Ce n'è una stasera, sicuro."] },
      { id: "og_cacciatore", x: 6, y: 10, name: "Cacciatore Domenicale", look: L("#2e7d32", "#4e2e18"), kind: "trainer", lines: ["Ssst! Aspetto il cinghiale da sei ore. Tu mi hai fatto scappare tutto!"], team: [["cinghialotto", 8]], reward: 80, after: ["Va beh, stasera tagliatelle senza ragù di cinghiale. Colpa tua."] },
      { id: "og_loris", x: 12, y: 6, name: "Camionista Loris", look: L("#c0392b", "#616161"), kind: "boss", badge: "Sigillo della Via Emilia", lines: ["Faccio la Via Emilia da Piacenza a Rimini da trent'anni. Conosco ogni buca e ogni autogrill per nome.", "Vediamo se reggi il ritmo di uno che pranza alle 11 e cena alle 18!"], team: [["passatellone", 10], ["cinghialotto", 11]], reward: 300, after: ["Mi hai sorpassato a destra, ma per stavolta chiudo un occhio. Ecco il Sigillo della Via Emilia."] },
    ],
  },
  csp: {
    id: "csp", name: "Castel San Pietro",
    tiles: [
      "TTTTTTTTTTTTTTTT", "T,,,,TBBBT,,,,,T", "T,RR,TBBBT,RRR,T", "T,HD,,,.,,,HDH,T",
      "T,,,,,,.,,,,,,,T", "TWWWWW,.,GGGGGGT", "TWWWWW,.,GGGGGGT", "TWWWWW,.,GGGGGGT",
      "................", "T,,,,,,.,,,,,,,T", "TGGGGG,.,RRRR,,T", "TGGGGG,.,HHDH,,T",
      "TGGGGG,.,,,,,S,T", "TGGGGG,.,,,,,,,T", "TFFF,,,.,,,FFFFT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 0, y: 8, to: "osteria", tx: 14, ty: 8 }, { x: 15, y: 8, to: "imola", tx: 1, ty: 8 }],
    heal: { x: 4, y: 4 },
    wild: [["vaporella", 8, 10, 3], ["piadinone", 8, 10, 3], ["cinghialotto", 8, 10, 2], ["passatellone", 9, 9, 2]],
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
    id: "imola", name: "Imola",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TAAAAAAAAAAAAAAT", "TA,,,,,,,,,,,,AT", "TA,GGGG,,GGGG,AT",
      "TA,GGGG,,GGGG,AT", "TA,,,,,,,,,,,,AT", "TAAAAAAA.AAAAAAT", "T,,,,,,,.,,,,,,T",
      "........,RRRR,,T", "T,RRR,,,,HHDH,,T", "T,HDH,,,,,,,,S,T", "T,,,,,,,,,,,,,,T",
      "TGGGGGG,,GGGGGGT", "TGGGGGG,,GGGGGGT", "TFFF,,,,,,,,FFFT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 0, y: 8, to: "csp", tx: 14, ty: 8 }],
    heal: { x: 4, y: 11 },
    wild: [["pistonzo", 11, 13, 3], ["cinghialotto", 11, 13, 2], ["vaporella", 12, 12, 1], ["biciclone", 12, 13, 1]],
    signs: { "13,10": "IMOLA: qui si va forte. Anche al bar, anche a tavola." },
    npcs: [
      { id: "im_barista", x: 3, y: 11, name: "Barista dell'Autodromo", look: L("#c0392b", "#ffffff"), kind: "heal", lines: ["Caffè ristretto, gomme nuove e via! Al mio bar il pit-stop lo facciamo anche ai mostri.", "Fatto! Tutti al cento per cento. Il caffè però lo paghi."] },
      { id: "im_tifoso", x: 8, y: 5, name: "Tifoso in Tuta Rossa", look: L("#c0392b", "#c0392b"), kind: "trainer", lines: ["Vengo qui ogni weekend dal 1987. Mia moglie è convinta che lavoro la domenica."], team: [["pistonzo", 13], ["cinghialotto", 13]], reward: 160, after: ["Nooo! Va beh, la stagione prossima è quella buona. Lo dico da 37 anni."] },
      { id: "im_contadina", x: 5, y: 7, name: "Contadina dei Colli", look: L("#fbc02d", "#388e3c"), kind: "trainer", lines: ["Le mie albicocche sono le migliori del mondo. Chi dice il contrario se la vede coi miei mostri!"], team: [["cinghialotto", 12], ["piadinone", 13]], reward: 140, after: ["Brava gioventù. Ti darei un'albicocca, ma quest'anno le ha mangiate tutte il cinghiale."] },
      { id: "im_ivano", x: 11, y: 10, name: "Ivano detto Pistone", look: L("#fbc02d", "#c0392b"), kind: "boss", badge: "Sigillo del Rombo", lines: ["Avrei potuto essere un pilota. Davvero. Ho solo sbagliato... tutto il resto.", "Ma in lotta sono il più veloce della Romagna! ...Come, Imola è ancora un po' Emilia? Non importa. VRRRUUUM!"], team: [["pistonzo", 16], ["biciclone", 17]], reward: 500, after: ["Giù dal podio un'altra volta. Prendi il Sigillo del Rombo.", "Io torno a guardare le gare dal prato, con la mia sedia pieghevole."] },
    ],
  },
};

export const ALL_BADGES = ["Sigillo del Cantiere", "Sigillo della Via Emilia", "Sigillo delle Terme", "Sigillo del Rombo", "Sigillo Estense"];

export const INTRO_LINES = [
  "Benvenuto! Io sono il Dottor Balanzone, luminare dell'Università più antica del mondo. Sì, lo ripeto spesso.",
  "Queste terre, tra Bologna, Osteria Grande, Castel San Pietro, Imola e Ferrara, sono piene di MONSTRI: creature strane, golose e chiacchierone.",
  "Prima di partire, però, dimmi come ti chiami.",
];
