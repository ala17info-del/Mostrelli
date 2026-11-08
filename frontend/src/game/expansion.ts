// Expansion content (original): new places west (Modena, Parma) and north of the coast (Ravenna),
// two explorable interiors, new Mostrelli, moves, the Caramella Rara and items to pick up.
// Everything is plain data merged into data.ts / sprites.ts, so the engine code stays the same.
import type { GameMap, Move, Species } from "./data";

const L = (A: string, C: string) => ({ A, C });

export const X_MOVES: Record<string, Move> = {
  aceto: { name: "Aceto Invecchiato", type: "terme", power: 75, acc: 95, fx: { k: "defDown", p: 30 } },
  affettatrice: { name: "Affettatrice", type: "sugo", power: 80, acc: 90, fx: { k: "atkDown", p: 20 } },
  grattugia: { name: "Grattugiata Reggiana", type: "campi", power: 75, acc: 95, fx: { k: "defDown", p: 30 } },
  tessera: { name: "Tessera di Mosaico", type: "nebbia", power: 75, acc: 95, fx: { k: "confuse", p: 25 } },
  cavalli: { name: "Cavalli Rampanti", type: "motore", power: 90, acc: 85, fx: { k: "selfSpdUp", p: 30 } },
};

const sp = (s: Omit<Species, "num">): Species => ({ ...s, num: 0 });
export const X_SPECIES: Species[] = [
  sp({ id: "balsamino", name: "Balsamino", type: "terme", hp: 55, atk: 60, def: 55, spd: 65, catchRate: 0.35, moves: [["sberla", 1], ["fango", 1], ["aceto", 12], ["vapore", 18], ["sauna", 26]], desc: "Goccia di aceto balsamico di Modena. Ha 12 anni ma ne dimostra 25: per lui è un complimento.", evo: { to: "balsamone", lv: 30 } }),
  sp({ id: "balsamone", name: "Balsamone", type: "terme", hp: 80, atk: 85, def: 75, spd: 85, catchRate: 0.15, moves: [["fango", 1], ["aceto", 12], ["vapore", 18], ["sauna", 26]], desc: "Botte di rovere che invecchia da sola. Guai a chi lo mette sull'insalata del supermercato." }),
  sp({ id: "prosciuttino", name: "Prosciuttino", type: "sugo", hp: 60, atk: 65, def: 50, spd: 60, catchRate: 0.35, moves: [["sberla", 1], ["ragu", 1], ["affettatrice", 14], ["brodo", 20], ["forno", 28]], desc: "Prosciutto di Parma tagliato sottile. Se lo tagli spesso piange e chiama il consorzio.", evo: { to: "prosciuttone", lv: 32 } }),
  sp({ id: "prosciuttone", name: "Prosciuttone", type: "sugo", hp: 85, atk: 95, def: 70, spd: 75, catchRate: 0.15, moves: [["ragu", 1], ["affettatrice", 14], ["brodo", 20], ["forno", 28]], desc: "Coscia stagionata 24 mesi. Profuma tutta la valle e lo sa benissimo." }),
  sp({ id: "parmigianino", name: "Parmigianino", type: "campi", hp: 70, atk: 55, def: 75, spd: 35, catchRate: 0.35, moves: [["sberla", 1], ["grappolo", 1], ["grattugia", 14], ["zucca", 18], ["trattore", 24]], desc: "Spicchio di formaggio stagionato. Discute per ore se sia meglio di Parma o di Reggio.", evo: { to: "parmigione", lv: 32 } }),
  sp({ id: "parmigione", name: "Parmigione", type: "campi", hp: 100, atk: 75, def: 105, spd: 40, catchRate: 0.15, moves: [["grappolo", 1], ["grattugia", 14], ["zucca", 18], ["trattore", 24]], desc: "Forma intera da quaranta chili. Le banche lo accettano come garanzia." }),
  sp({ id: "mosaichino", name: "Mosaichino", type: "nebbia", hp: 55, atk: 65, def: 60, spd: 75, catchRate: 0.35, moves: [["foschia", 1], ["sberla", 1], ["tessera", 12], ["nebbione", 20], ["puntura", 28]], desc: "Tessera dorata di un mosaico bizantino. Brilla anche nella nebbia di Ravenna.", evo: { to: "mosaicone", lv: 34 } }),
  sp({ id: "mosaicone", name: "Mosaicone", type: "nebbia", hp: 80, atk: 90, def: 85, spd: 95, catchRate: 0.15, moves: [["foschia", 1], ["tessera", 12], ["nebbione", 20], ["puntura", 28]], desc: "Imperatore di mille tessere. Pretende di essere guardato col naso all'insù." }),
  sp({ id: "rossocorsa", name: "Rossocorsa", type: "motore", hp: 60, atk: 95, def: 55, spd: 110, catchRate: 0.2, moves: [["rombo", 1], ["clacson", 1], ["sgommata", 10], ["cavalli", 22], ["girovel", 28]], desc: "Bolide rosso della pianura modenese. Costa più della tua casa e consuma come un camion." }),
];

export const X_SPRITES: Record<string, string[]> = {
  balsamino: [".....kk.....", "....kbbk....", "....kbbk....", "...kkkkkk...", "..kmmmmmmk..", ".kmwnmmwnmk.", ".kmmmmmmmmk.", ".kmmmrrmmmk.", ".kmmmmmmmmk.", "..kmmmmmmk..", "...kkkkkk...", "....c..c...."],
  balsamone: ["................", "....kkkkkkkk....", "...kbbbbbbbbk...", "..kbBBBBBBBBbk..", "..kbbbbbbbbbbk..", ".kbbwnbbbbwnbbk.", ".kbbbbbbbbbbbbk.", ".kBBBBBBBBBBBBk.", ".kbbbbrrrrbbbbk.", ".kbbbbbbbbbbbbk.", "..kBBBBBBBBBBk..", "..kbbbbbbbbbbk..", "...kkkkkkkkkk...", "......kmmk......", ".......mm.......", "................"],
  prosciuttino: ["............", "..kkkk......", ".kppppkk....", "kpppPppPk...", "kpwnppwnpk..", "kppppppppPk.", ".kpprrppppk.", "..kpppppPk..", "...kkppPk...", ".....kkwwk..", "......kwwk..", ".......kk..."],
  prosciuttone: ["................", "...kkkkkk.......", "..kppppppkk.....", ".kppPpppPppk....", "kppwnpppwnppk...", "kpppppppppppPk..", "kpPppprrrppppk..", ".kpppppppppPPk..", ".kppPpppppPpk...", "..kpppppppPk....", "...kkpppPPk.....", ".....kkkkwwk....", "........kwwk....", ".........kwwk...", "..........kk....", "................"],
  parmigianino: ["............", ".........kk.", ".......kkyk.", ".....kkyyyk.", "...kkyyyyyk.", ".kkyyyyyyyk.", "kooooooooook", "kywnyyywnyyk", "kyyyyyyyyyyk", "kyyyyrryyyyk", "kooooooooook", ".kkkkkkkkkk."],
  parmigione: ["................", "....kkkkkkkk....", "..kkooooooookk..", ".kooyyyyyyyyook.", "kooyyyyyyyyyyook", "koyywnyyyywnyyok", "koyyyyyyyyyyyyok", "koyyyyrrrryyyyok", "kooooooooooooook", "koyyyyyyyyyyyyok", "koyyyyyyyyyyyyok", "kooyyyyyyyyyyook", ".kooooooooooook.", "..kkkkkkkkkkkk..", "................", "................"],
  mosaichino: ["............", "..kkkkkkkk..", ".kzlvzlvzlk.", ".klvzlvzlvk.", ".kwnzlvwnzk.", ".kvzlvzlvzk.", ".kzlvrrvzlk.", ".klvzlvzlvk.", "..kkkkkkkk..", "...kz..zk...", "...kk..kk...", "............"],
  mosaicone: ["......zzzz......", ".....zkkkkz.....", "...kkkkkkkkkk...", "..kzlvzlvzlvzk..", ".kzlvzlvzlvzlvk.", ".klvwnvzlvwnzlk.", ".kvzlvzlvzlvzlk.", ".kzlvzlrrlvzlvk.", ".klvzlvzlvzlvzk.", "..kvzlvzlvzlvk..", "...kkkkkkkkkk...", "..kz.k....k.zk..", ".kz..k....k..zk.", ".kk..kk..kk..kk.", "................", "................"],
  rossocorsa: ["............", "............", "....kkkkk...", "...krrwwrk..", "..krrrwnrrk.", ".krrrrrrrrrk", "krryrrrrryrk", "krrrrrrrrrrk", "kkSSkkkkSSkk", ".kSnk..kSnk.", "..kk....kk..", "............"],
  boss_umarell: ["..kkkkkkkk..", ".kAAAAAAAAk.", "..khhhhhhk..", "..kwkhhkwk..", "..khhhhhhk..", "...khhhhk...", "..kCCCCCCk..", ".kCCCCCCCCk.", ".kChCCCCCCk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  boss_contessa: ["....kAAk....", "...kAAAAk...", "..kAAAAAAk..", "..kAhhhhAk..", "..khnhhnhk..", "..khhrrhhk..", "...kCCCCk...", "..kCCwwCCk..", ".kCCCCCCCCk.", "kCCCCCCCCCCk", "kCCCCCCCCCCk", "kkkkkkkkkkkk"],
  boss_duchessa: ["...zkzzkz...", "...kAAAAk...", "..kAAAAAAk..", "..kAhhhhAk..", "..khnhhnhk..", "..khhrrhhk..", "...kzzzzk...", "..kCCwwCCk..", ".kCCCCCCCCk.", "kCCCCCCCCCCk", "kCzCCzCCzCCk", "kkkkkkkkkkkk"],
  boss_camionista: ["..kkkkkkkk..", ".kAAAAAAAAkk", "..kAAAAAAk..", "..khhhhhhk..", "..khnhhnhk..", "..kBBBBBBk..", "...kBBBBk...", ".kCCCCCCCCk.", "kCCwCCCCwCCk", "kh.kSSSSk.hk", "...kSkkSk...", "...kk..kk..."],
  boss_nonna: ["....kwwk....", "...kwwwwk...", "..kwwwwwwk..", "..kckhhkck..", "..khhhhhhk..", "...khrrhk...", "..kAAAAAAk..", ".kAACCCCAAk.", ".kCCCCCCCCk.", ".kCCCCCCCCk.", "..kCCCCCCk..", "..kkkkkkkk.."],
  boss_pilota: ["...kkkkkk...", "..kAAAAAAk..", ".kAAAAAAAAk.", ".kAnnnnnnAk.", ".kAnwnnnnAk.", "..kAAAAAAk..", "..kCCzzCCk..", ".kCCCCCCCCk.", ".khCCCCCChk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  boss_romeo: ["...zkzzkz...", "...kzzzzk...", "..kBBBBBBk..", "..khhhhhhk..", "..knnhhnnk..", "..khhrrhhk..", "...khhhhk...", ".khkCCCCkhk.", ".khkCCCCkhk.", "..kSSSSSSk..", "..khk..khk..", "..kkk..kkk.."],
  boss_aceto: ["..kkkkkkk...", ".kAAAAAAAk..", "..khhhhhhk..", "..khnhhnhk..", "..kBBBBBBk..", "...khhhhk...", "..kCwwwwCk..", ".kCCwwwwCCk.", ".khCwwwwChk.", "..kSwwwwSk..", "..kSk..kSk..", "..kkk..kkk.."],
  boss_teodora: ["..kzkzzkzk..", "..kzzzzzzk..", "..kBhhhhBk..", "..yBnhhnBy..", "..kBhrrhBk..", "...khhhhk...", "..kzzzzzzk..", ".kCCzCCzCCk.", ".kCCCCCCCCk.", "kCCCCCCCCCCk", "kCCCCCCCCCCk", "kkkkkkkkkkkk"],
  shop_apron: ["..kkkkkkkk..", ".kAAAAAAAAk.", "..khhhhhhk..", "..khnhhnhk..", "..khhhhhhk..", "...khrrhk...", "..kCwwwwCk..", ".kCCwwwwCCk.", ".khCwwwwChk.", "..kSwwwwSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_baker: ["...kkkkkk...", "..kwwwwwwk..", "..kwwwwwwk..", "..kkkkkkkk..", "..khnhhnhk..", "..khhhhhhk..", "..kCCCCCCk..", ".kCCwwwwCCk.", ".khCwwwwChk.", "..kSwwwwSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_straw: ["....kkkk....", "...kyyyyk...", "kkkyyyyyykkk", "kyyyAAAAyyyk", "kkkhhhhhhkkk", "..khnhhnhk..", "..khhhhhhk..", "..kCCCCCCk..", ".khCCCCCChk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_bandana: ["..kkkkkkkk..", ".kAAAAAAAAkA", "..kAAAAAAkA.", "..khnhhnhk..", "..khhhhhhk..", "...khrrhk...", "..kCCCCCCk..", ".kCCCCCCCCk.", ".khCCCCCChk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_moustache: ["...kkkkkk...", "..khhhhhhk..", "..khhhhhhk..", "..khnhhnhk..", "..kBBBBBBk..", "...khhhhk...", "..kACCCCAk..", ".kAACCCCAAk.", ".khACCCCAhk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_glasses: ["...kkkkkk...", "..kBBBBBBk..", ".kBBBBBBBBk.", ".kBkckkckBk.", ".kBhhhhhhBk.", ".kBkhrrhkBk.", "..kAAAAAAk..", ".kCCAAAACCk.", ".khCCCCCChk.", "..kCCCCCCk..", "..kSk..kSk..", "..kkk..kkk.."],
  caramella: ["............", "............", "............", "kk..kkkk..kk", "kpkkrrrrkkpk", "kppkrwrrkppk", "kpkkrrrrkkpk", "kk..kkkk..kk", "............", "............", "............", "............"],
};

export const X_MAPS: Record<string, GameMap> = {
  modena: {
    id: "modena", name: "Modena", music: "maggiore",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TGGGGG,,,,RRRR,T", "TGGGGG,,,,HHDH,T", "T,,,,,,..,,,,,,T",
      "TRRRT,,..,,,GGGT", "THDHT,,..,,,GGGT", "T,,,,,PPPPP,,,,T", "T,,,,,PCCCP,,,,T",
      "..........C.....", "T,,S,,PCCCP,,,,T", "T,,,,,PPPPP,AAAT", "TGGG,,,,,,,,AAAT",
      "TGGG,,FF,,,,AAAT", "TGGGG,FF,,GGGGGT", "TGGGG,,,,,GGGGGT", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 15, y: 8, to: "bologna", tx: 1, ty: 8 }, { x: 0, y: 8, to: "parma", tx: 14, ty: 8 }, { x: 12, y: 2, to: "acetaia", tx: 7, ty: 14 }],
    heal: { x: 3, y: 7 },
    wild: [["balsamino", 24, 27, 3], ["rossocorsa", 25, 27, 1], ["mortazzone", 24, 26, 2], ["crescentino", 24, 26, 2], ["pistonzo", 25, 27, 2]],
    signs: { "3,9": "MODENA: Ghirlandina, aceto e motori. Qui si va piano solo a tavola." },
    pickups: [{ id: "mo_caramella", x: 14, y: 14, item: "caramella" }, { id: "mo_tortellini", x: 1, y: 11, item: "tortellini" }],
    npcs: [
      { id: "mo_rezdora", x: 2, y: 6, name: "Rezdora Iole", look: L("#ffffff", "#c0392b"), kind: "heal", lines: ["Tigelle, gnocco fritto e un goccio di lambrusco: la medicina migliore dell'Emilia.", "Ecco fatto, squadra rimessa in sesto. E porta un saluto a tua madre, anche se non la conosco."] },
      { id: "mo_salumiere", x: 13, y: 4, name: "Salumiere della Ghirlandina", look: L("#ffffff", "#7b4a2a"), kind: "shop", lines: ["Vuoi un etto di cotechino? No? Allora prendi qualcosa di utile, che qui non si perde tempo."] },
      { id: "mo_meccanico", x: 13, y: 9, name: "Meccanico del Cavallino", look: L("#c0392b", "#fbc02d"), kind: "trainer", lines: ["Senti questo motore? Dodici cilindri! Io ne capisco solo tre, ma faccio finta di niente."], team: [["rossocorsa", 25], ["pistonzo", 26]], reward: 260, prize: ["caffe", 1], after: ["Mi hai fatto il pieno di sconfitta. Servono altri due anni di garanzia."] },
      { id: "mo_tenore", x: 8, y: 4, name: "Tenore di Provincia", look: L("#1a1a1a", "#ffffff"), kind: "trainer", lines: ["Nessun dormaaa! Scusa, faccio le prove per la sagra. Vuoi sentire l'acuto? Prima la lotta!"], team: [["balsamino", 26], ["mortazzone", 26]], reward: 260, after: ["Ho steccato. Succede anche ai migliori, ma a me succede sempre."] },
    ],
  },
  acetaia: {
    id: "acetaia", name: "Acetaia Ducale", music: "terme",
    tiles: [
      "NNNNNNNNNNNNNNNN", "JKKKKLLLLLLKKKKJ", "JLLLLLLLLLLLLLLJ", "JLKKLLKKLLKKLLLJ", "JLLLLLLLLLLLLLLJ", "JLKKLLKKLLKKLLLJ",
      "JLLLLLLLLLLLLLLJ", "JLLLLVVVVVLLLLLJ", "JLLLLVVVVVLLLLLJ", "JLKKLLLLLLLLKKLJ", "JLLLLLLLLLLLLLLJ", "JLKKLLLLLLLLKKLJ",
      "JLLLLLLLLLLLLLLJ", "JLLLLLLLLLLLLLLJ", "JLLLLLLLLLLLLLLJ", "NNNNNNNLNNNNNNNN",
    ],
    exits: [{ x: 7, y: 15, to: "modena", tx: 12, ty: 3 }],
    heal: { x: 3, y: 7 },
    wild: [],
    signs: {},
    pickups: [{ id: "ac_caramella", x: 14, y: 9, item: "caramella" }],
    npcs: [
      { id: "ac_assaggiatore", x: 12, y: 7, name: "Assaggiatore DOP", look: L("#7b1f3a", "#ffffff"), kind: "trainer", lines: ["Una goccia sul dorso della mano... sento rovere, ciliegio e un po' di arroganza. La tua."], team: [["balsamino", 27], ["lambruschino", 27]], reward: 280, after: ["Troppo acido per me. Torno ai miei tappi di sughero."] },
      { id: "ac_ferruccio", x: 8, y: 2, name: "Ferruccio, Maestro dell'Aceto", look: L("#4e2e18", "#7b4a2a"), kind: "boss", badge: "Sigillo del Balsamico", prize: ["caramella", 2], lines: ["Questo aceto ha più anni di te e di tuo padre messi insieme. Lo chiamano oro nero, io lo chiamo famiglia.", "Vuoi il mio Sigillo? Devi dimostrare di avere pazienza... e un buon palato!"], team: [["balsamino", 28], ["rossocorsa", 29], ["balsamone", 30]], reward: 320, after: ["Hai la stoffa del maestro. Ecco il Sigillo del Balsamico.", "Una goccia al giorno, eh. Non di più, che poi ti monti la testa."] },
    ],
  },
  parma: {
    id: "parma", name: "Parma", music: "osteria",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TRRRT,,,,,,RRRRT", "THDHT,,..,,HHHHT", "T,,,,,,..,,,,,,T",
      "TGGGG,PPPPP,GGGT", "TGGGG,PCCCP,GGGT", "TGGGG,PCCCP,,,,T", "T,,,,,PPPPP,,,,T",
      "T,,,,,,.........", "T,S,,,,..,,,,,,T", "TFFF,,,..,,GGGGT", "TFFF,,,..,,GGGGT",
      "TWWWW,,..,,GGGGT", "TWWWW,,..,,,,,,T", "TWWWW,,,,,,,,,,T", "TTTTTTTTTTTTTTTT",
    ],
    exits: [{ x: 15, y: 8, to: "modena", tx: 1, ty: 8 }],
    heal: { x: 3, y: 4 },
    wild: [["prosciuttino", 28, 31, 3], ["parmigianino", 28, 31, 3], ["cappellaccio", 28, 30, 2], ["nebbiolone", 28, 30, 1]],
    signs: { "2,9": "PARMA: prosciutto, formaggio e melodramma. Sempre in quest'ordine." },
    pickups: [{ id: "pa_caramella", x: 14, y: 14, item: "caramella" }, { id: "pa_vasetti", x: 1, y: 8, item: "vasetto" }],
    npcs: [
      { id: "pa_nonna", x: 2, y: 3, name: "Nonna dei Tortelli d'Erbetta", look: L("#cfd8dc", "#4caf50"), kind: "heal", lines: ["Tortelli d'erbetta con burro fuso e parmigiano. Di quello vero, mica la polverina!", "Ecco, siete come nuovi. Adesso però fate il bis."] },
      { id: "pa_casaro", x: 13, y: 3, name: "Casaro del Consorzio", look: L("#ffffff", "#f2c94c"), kind: "shop", lines: ["Benvenuto! Le forme qui le battiamo col martelletto. Anche i clienti indecisi."] },
      { id: "pa_loggionista", x: 9, y: 10, name: "Loggionista del Regio", look: L("#7b1f3a", "#1a1a1a"), kind: "trainer", lines: ["Ho fischiato tre tenori e un direttore d'orchestra. Tu non sarai certo un problema!"], team: [["parmigianino", 30], ["prosciuttino", 30]], reward: 300, prize: ["tortellini", 2], after: ["Bravo, bis! Anzi no, una volta basta."] },
      { id: "pa_stagionatore", x: 4, y: 8, name: "Stagionatore di Langhirano", look: L("#4e2e18", "#ffffff"), kind: "trainer", lines: ["Ventiquattro mesi di attesa per un prosciutto. Per una lotta posso aspettare anche meno."], team: [["prosciuttino", 31], ["cappellaccio", 30]], reward: 300, after: ["Mi hai stagionato tu, stavolta."] },
      { id: "pa_duchessa", x: 8, y: 7, name: "Duchessa Luigia del Crudo", look: L("#fbc02d", "#8e24aa"), kind: "boss", badge: "Sigillo Ducale", prize: ["caramella", 2], lines: ["Parma ha avuto una duchessa, un teatro e il prosciutto più famoso del mondo. Tu cosa hai? Un vasetto?", "In guardia! Ti affetto sottile sottile."], team: [["parmigianino", 32], ["prosciuttone", 34], ["parmigione", 34]], reward: 360, after: ["Che eleganza nella vittoria. Prendi il Sigillo Ducale.", "E ricorda: il crudo non si cuoce. Mai."] },
    ],
  },
  ravenna: {
    id: "ravenna", name: "Ravenna", music: "ferrara",
    tiles: [
      "TTTTTTTTTTTTTTTT", "TGGGGG,,,,RRRRRT", "TGGGGG,,,,HHDHHT", "T,,,,,,..,,,,,,T",
      "TRRRT,,..,PPPPPT", "THDHT,,..,PCCCPT", "T,,,,,,..,PCCCPT", "T,S,,,,..,PPPPPT",
      "T,,,,,,..,,,,,,T", "TWWWW,,..,,GGGGT", "TOOOW,,..,,GGGGT", "TOOOW,,..,,GGGGT",
      "TWWWW,,..,,,,,,T", "TFF,,,,..,,,FF,T", "T,,,,,,..,,,,,,T", "TTTTTTT.TTTTTTTT",
    ],
    exits: [{ x: 7, y: 15, to: "riviera", tx: 7, ty: 1 }],
    heal: { x: 3, y: 6 },
    wild: [["mosaichino", 31, 34, 3], ["medusella", 31, 33, 2], ["canalino", 31, 33, 2], ["zanzarone", 31, 33, 2], ["gabbianone", 31, 33, 1]],
    signs: { "2,7": "RAVENNA: tre volte capitale. Lo ricorda a tutti, tre volte al giorno." },
    pickups: [{ id: "ra_caramella", x: 14, y: 14, item: "caramella" }, { id: "ra_caffe", x: 1, y: 13, item: "caffe" }],
    npcs: [
      { id: "ra_cameriera", x: 2, y: 6, name: "Cameriera dei Cappelletti", look: L("#ffffff", "#e0913a"), kind: "heal", lines: ["Cappelletti in brodo, piadina e una tazzina di caffè. Qui si riparte sempre col sorriso.", "Fatto! Squadra in forma. La mancia? Mettila nel mosaico, porta fortuna."] },
      { id: "ra_mosaicista", x: 13, y: 8, name: "Mosaicista Bottegaio", look: L("#fbc02d", "#1565c0"), kind: "shop", lines: ["Ogni oggetto in vendita è un'opera d'arte. Il prezzo pure."] },
      { id: "ra_guida", x: 5, y: 8, name: "Guida Turistica Bizantina", look: L("#1565c0", "#ffffff"), kind: "trainer", lines: ["A destra San Vitale, a sinistra Sant'Apollinare, davanti a te una sconfitta annunciata!"], team: [["mosaichino", 33], ["canalino", 32]], reward: 320, prize: ["caramella", 1], after: ["Il giro turistico finisce qui. Uscita dal negozio di souvenir."] },
      { id: "ra_poeta", x: 12, y: 13, name: "Poeta in Esilio", look: L("#2e7d32", "#7b4a2a"), kind: "trainer", lines: ["Nel mezzo del cammin di nostra lotta, mi ritrovai per una selva oscura... ah no, è la pineta."], team: [["zanzarone", 33], ["mosaichino", 33]], reward: 320, after: ["Lasciate ogni speranza, voi che sfidate me. Cioè, io."] },
      { id: "ra_teodora", x: 12, y: 6, name: "Teodora dei Mosaici", look: L("#ffb300", "#7e57c2"), kind: "boss", badge: "Sigillo dei Mosaici", prize: ["caramella", 3], lines: ["Sono stata imperatrice, attrice e ora capopalestra. Il curriculum più lungo della Romagna.", "Mille tessere d'oro contro il tuo vasetto. Vediamo chi brilla di più!"], team: [["mosaichino", 35], ["medusella", 35], ["mosaicone", 37]], reward: 400, after: ["Splendido! Prendi il Sigillo dei Mosaici.", "Ora sei degno di stare su un muro di San Vitale. Accanto a me, ovviamente."] },
    ],
  },
  mercato: {
    id: "mercato", name: "Mercato di Mezzo", music: "bologna",
    tiles: [
      "NNNNNNNNNNNNNNNN", "JMMMCCMMMCCMMMCJ", "JCCCCCCCCCCCCCCJ", "JCCCCCCCCCCCCCCJ", "JCCCCCCCCCCCCCCJ", "JMMMCCMMMCCMMMCJ",
      "JCCCCCCCCCCCCCCJ", "JCCCCCCCCCCCCCCJ", "JCCCVVVVVVVVCCCJ", "JCCCVVVVVVVVCCCJ", "JCCCCCCCCCCCCCCJ", "JMMMCCMMMCCMMMCJ",
      "JCCCCCCCCCCCCCCJ", "JCCCCCCCCCCCCCCJ", "JCCCCCCCCCCCCCCJ", "NNNNNNNCNNNNNNNN",
    ],
    exits: [{ x: 7, y: 15, to: "bologna", tx: 2, ty: 6 }],
    heal: { x: 2, y: 6 },
    wild: [],
    signs: {},
    pickups: [{ id: "me_caramella", x: 14, y: 9, item: "caramella" }, { id: "me_brodini", x: 1, y: 9, item: "brodino" }],
    npcs: [
      { id: "me_fruttivendola", x: 3, y: 6, name: "Fruttivendola Loredana", look: L("#2e7d32", "#fbc02d"), kind: "shop", lines: ["Pesche, ciliegie, vasetti! Tutto di stagione, soprattutto i prezzi."] },
      { id: "me_tigelle", x: 13, y: 4, name: "Venditore di Tigelle", look: L("#ffffff", "#7b4a2a"), kind: "talk", lines: ["Le crescentine a Modena le chiamano tigelle. Io le chiamo pranzo, merenda e cena.", "Dicono che a ovest, oltre Modena, ci sia una Duchessa che affetta i forestieri. Io non ci vado senza tortellini."] },
      { id: "me_pensionato", x: 9, y: 7, name: "Pensionato al Banco", look: L("#616161", "#8d6e63"), kind: "trainer", lines: ["Sono qui dalle sei per avere le zucchine migliori. Nessuno passa prima di me. Nemmeno tu!"], team: [["umarellino", 10], ["crescentino", 11]], reward: 120, prize: ["caramella", 1], after: ["Va bene, passa pure. Ma le zucchine sono mie."] },
    ],
  },
};

// Which drawing each capopalestra / shopkeeper uses (everyone else is a regular person).
export const NPC_SPRITES: Record<string, string> = {
  bo_gino: "boss_umarell", fe_contessa: "boss_contessa", og_loris: "boss_camionista", cs_ivonne: "boss_nonna", im_ivano: "boss_pilota",
  ri_romeo: "boss_romeo", ac_ferruccio: "boss_aceto", pa_duchessa: "boss_duchessa", ra_teodora: "boss_teodora",
  bo_bottega: "shop_apron", fe_fornaio: "shop_baker", cs_farmacia: "shop_glasses", cm_ferramenta: "shop_moustache", al_banco: "shop_straw",
  ri_ambulante: "shop_bandana", mo_salumiere: "shop_apron", pa_casaro: "shop_baker", ra_mosaicista: "shop_glasses", me_fruttivendola: "shop_straw",
};

export const X_BADGES = ["Sigillo del Balsamico", "Sigillo Ducale", "Sigillo dei Mosaici"];
export const X_TRAINER_PRIZES: [string, number][] = [["brodino", 2], ["vasetto", 2], ["tortellini", 1]];

// Doors/edges in the original maps that now lead to the new areas.
export function linkExpansion(maps: Record<string, GameMap>) {
  const open = (m: GameMap, x: number, y: number) => { m.tiles[y] = m.tiles[y].slice(0, x) + "." + m.tiles[y].slice(x + 1); };
  open(maps.bologna, 0, 8);
  maps.bologna.exits.push({ x: 0, y: 8, to: "modena", tx: 14, ty: 8 }, { x: 2, y: 5, to: "mercato", tx: 7, ty: 14 });
  open(maps.riviera, 7, 0);
  maps.riviera.exits.push({ x: 7, y: 0, to: "ravenna", tx: 7, ty: 14 });
}
