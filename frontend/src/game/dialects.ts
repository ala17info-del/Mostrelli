// What people say inside houses, shops and osterie: a greeting in the local dialect (always with the
// Italian meaning next to it), a line about local habits and food, and a useful game tip.
// Dialect is written simply and kept to well-known expressions.

type Bank = { hello: string[]; life: string[] };

const EMILIA_BO: Bank = {
  hello: [
    "\"Socc'mel, chi s'vadd!\" (Accidenti, chi si vede!)",
    "\"Mo csa fèt?\" (Ma cosa fai?)",
    "\"Brisa sgumbrèr, vén dentr!\" (Non stare lì impalato, entra!)",
    "\"Mo dai, mo va là!\" (Ma dai, ma va là!)",
  ],
  life: [
    "Qui la domenica si fa il ragù: comincia a sobbollire alle otto e a mezzogiorno è pronto. Forse.",
    "I tortellini si mangiano in brodo. Con la panna? In questa casa non si nomina nemmeno.",
    "Il portico di San Luca ha 666 archi. Mio nonno li ha contati tutti, due volte.",
    "La misura giusta della tagliatella è depositata alla Camera di Commercio. Qui non si scherza.",
    "Mio marito passa le mattine a guardare i cantieri. Dice che controlla i lavori.",
  ],
};
const EMILIA_MO: Bank = {
  hello: ["\"Mo sè, vén pur!\" (Ma sì, vieni pure!)", "\"Mo dai!\" (Ma dai!)", "\"Ciò, chi gh'è?\" (Ehi, chi c'è?)"],
  life: [
    "In soffitta ho le botti dell'aceto balsamico: le ha cominciate la mia bisnonna.",
    "Le tigelle qui le chiamiamo crescentine. Col pesto di lardo e il parmigiano, ovviamente.",
    "Un bicchiere di Lambrusco a tavola non manca mai. Frizzante, sennò non vale.",
    "Dal campanile della Ghirlandina si vede tutta la pianura, fino alle colline.",
    "Qui la gente sogna le auto rosse. Io intanto vado in bicicletta.",
  ],
};
const EMILIA_RE: Bank = {
  hello: ["\"Mo vén dénter!\" (Ma vieni dentro!)", "\"Mo dai, s'et fat?\" (Ma dai, cos'hai fatto?)", "\"Ciò, bèla zéint!\" (Ehi, bella gente!)"],
  life: [
    "Una fetta di erbazzone? Bietole, parmigiano e pasta sottile: la ricetta è di casa nostra.",
    "Il formaggio del territorio si chiama Parmigiano Reggiano. Reggiano, ci tengo.",
    "Qui è nato il Tricolore: ce lo ricordiamo ogni sette gennaio.",
    "I cappelletti di Natale li chiudiamo tutti insieme attorno al tavolo grande.",
  ],
};
const EMILIA_PR: Bank = {
  hello: ["\"Csa gh'é?\" (Cosa c'è?)", "\"Sónt un pramzan dal sas!\" (Sono un parmigiano vero, di quelli di una volta!)", "\"Vén, vén!\" (Vieni, vieni!)"],
  life: [
    "Gli anolini in brodo si fanno a Natale, e la casa profuma per tre giorni.",
    "Qui il gnocco fritto si chiama torta fritta. Chiamalo come vuoi, basta che lo mangi.",
    "Il culatello stagiona nelle cantine umide della Bassa: la nebbia è un ingrediente.",
    "Al Teatro Regio il loggione fischia anche i tenori famosi. Siamo esigenti.",
    "Giuseppe Verdi è nato da queste parti. Mia zia canticchia le sue arie stendendo i panni.",
  ],
};
const EMILIA_PC: Bank = {
  hello: ["\"Ciò, vén chì!\" (Ehi, vieni qui!)", "\"A g'ho mia tèmp, ma t'ascolti\" (Non ho tempo, ma ti ascolto)", "\"Ma va là!\" (Ma va là!)"],
  life: [
    "Stasera pisarei e fasö: gnocchetti di pane e fagioli. Piatto povero, cuore ricco.",
    "I tortelli con la coda si chiudono a treccia. Io ci metto mezz'ora, mia madre dieci minuti.",
    "Lombardi o emiliani? Noi siamo piacentini, e la questione è chiusa.",
    "Coppa, salame e pancetta: qui gli antipasti sono una cosa seria.",
  ],
};
const EMILIA_FE: Bank = {
  hello: ["\"Ciò, ad Frara!\" (Ehi, di Ferrara!)", "\"Csa vót?\" (Cosa vuoi?)", "\"Vén dentar, ch'a gh'è la nébia!\" (Entra, che c'è la nebbia!)"],
  life: [
    "I cappellacci di zucca col ragù o burro e salvia: qui si discute solo su questo.",
    "La salama da sugo cuoce ore e ore. Si mangia col purè, con calma.",
    "Il pane qui è la coppia ferrarese, con le sue punte croccanti.",
    "In città si va in bicicletta: anche la nonna, anche sotto la nebbia.",
    "D'estate le zanzare sono così grandi che chiedono il permesso prima di entrare.",
  ],
};
const ROMAGNA: Bank = {
  hello: [
    "\"Ciò burdèl, vén dentar!\" (Ehi ragazzo, entra!)",
    "\"Cs'ut?\" (Cosa vuoi?)",
    "\"Dai mo', ch'a fasèm du ciacri\" (Dai, facciamo due chiacchiere)",
    "\"Ma t'si un pataca!\" (Sei un sempliciotto! Detto con affetto, eh)",
  ],
  life: [
    "La piadina la fa l'azdora, la donna di casa: sottile o spessa dipende dal paese.",
    "Cappelletti in brodo a Natale e passatelli quando fa freddo.",
    "Un bicchiere di Sangiovese e una mazurka: la balera la domenica è sacra.",
    "D'estate qui affittiamo le stanze ai turisti. Sono tornati gli stessi da trent'anni.",
    "Quando c'è la sagra il paese intero si mette il grembiule.",
  ],
};
const BANKS: Record<string, Bank> = { BO: EMILIA_BO, MO: EMILIA_MO, RE: EMILIA_RE, PR: EMILIA_PR, PC: EMILIA_PC, FE: EMILIA_FE, RA: ROMAGNA, FC: ROMAGNA, RN: ROMAGNA };

const TIPS = [
  "Consiglio: i Mostrelli Sugo battono i Campi, ma soffrono le Terme. Ogni tipo ha il suo punto debole.",
  "Consiglio: ogni tanto un Mostrello brilla di colori strani. È un cromatico: non fartelo scappare!",
  "Consiglio: ogni giorno c'è una sagra in un paese diverso. Lì i cromatici escono molto più spesso.",
  "Consiglio: quando la Carica è piena, nel menu delle mosse compare il Colpo Emiliano.",
  "Consiglio: di notte la nebbia sale e i Mostrelli Nebbia e Chiacchiera escono di più.",
  "Consiglio: i Mostrelli si evolvono salendo di livello. Le Caramelle Rare aiutano parecchio.",
  "Consiglio: nella schermata Trofei trovi le missioni e i premi che ti mancano.",
  "Consiglio: i Mostrelli rari a volte si incontrano già evoluti. Tieni pronti i vasetti!",
];

function pick<T>(a: T[], n: number) {
  return a[Math.abs(n) % a.length];
}

/** Three lines for a person inside a building: greeting, local life, tip. */
export function localTalk(prov: string, n: number): string[] {
  const b = BANKS[prov] ?? EMILIA_BO;
  return [pick(b.hello, n), pick(b.life, n * 7 + 3), pick(TIPS, n * 13 + 5)];
}

/** Just the greeting, used before quest text. */
export function localHello(prov: string, n: number): string {
  return pick((BANKS[prov] ?? EMILIA_BO).hello, n);
}
