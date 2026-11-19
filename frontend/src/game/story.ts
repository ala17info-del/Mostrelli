// Main story: "Il Ricettario Rubato". The Banda della Panna (people who put cream in tortellini)
// stole the Great Recipe Book of Emilia-Romagna. Each chapter has one goal shown on screen; members of
// the gang appear on the map only during their chapter.
import type { GameMap, Npc } from "./data";
import { findSpot } from "./towns";

type SaveLike = { badges: string[]; defeated: string[]; map: string; visited?: string[]; story?: number };
export type Chapter = {
  title: string;
  goal: string;
  done: (s: SaveLike) => boolean;
  /** Shown when the chapter is completed. */
  after: { speaker: string; lines: string[] };
  reward?: { money?: number; caramella?: number };
  /** Where the goal is (shown with a flag on the world map). */
  target?: string;
  /** A gang member to beat in this chapter. */
  villain?: { map: string; name: string; look: [string, string]; team: [string, number][]; lines: string[]; after: string[] };
};

const PANNA: [string, string] = ["#ffffff", "#f4a6b0"];
const beat = (id: string) => (s: SaveLike) => s.defeated.includes(id);
const badges = (n: number) => (s: SaveLike) => s.badges.length >= n;

export const CHAPTERS: Chapter[] = [
  {
    target: "bologna", title: "Capitolo 1 · Il furto", goal: "Vai a Bologna e batti Gino l'Umarell per il Sigillo del Cantiere",
    done: (s) => s.badges.includes("Sigillo del Cantiere"),
    after: { speaker: "Prof. Albe", lines: [
      "Disastro! Mentre lottavi, qualcuno ha rubato il Grande Ricettario dell'Emilia-Romagna dal mio laboratorio!",
      "Sul pavimento c'era una scia di... panna. PANNA! Nei tortellini! È la Banda della Panna, senza dubbio.",
      "Un loro tirapiedi è scappato verso Osteria Grande. Seguilo!",
    ] },
    reward: { money: 200 },
  },
  {
    target: "osteria", title: "Capitolo 2 · La scia di panna", goal: "Trova e batti il Tirapiedi della Panna a Osteria Grande",
    done: beat("story_2"),
    villain: { map: "osteria", name: "Tirapiedi della Panna", look: PANNA, team: [["mortazzone", 9], ["squacquerone", 10]],
      lines: ["Ehi tu! Il Ricettario adesso è nostro. Da domani tortellini alla panna in tutta la regione!", "Prima però devi battermi!"],
      after: ["Va bene, va bene! Il Ricettario l'hanno portato verso Imola. Io non ho detto niente!"] },
    after: { speaker: "Tirapiedi della Panna", lines: ["La Caporale ti aspetta a Imola. E non è simpatica come me."] },
    reward: { money: 300 },
  },
  {
    target: "imola", title: "Capitolo 3 · Rombo di motori", goal: "Batti la Caporale della Panna a Imola",
    done: beat("story_3"),
    villain: { map: "imola", name: "Caporale della Panna", look: PANNA, team: [["pistonzo", 14], ["mortazzone", 15], ["vaporella", 15]],
      lines: ["Panna nella carbonara, panna nei tortellini, panna nel caffè! È il futuro, ragazzino.", "E il futuro non si ferma!"],
      after: ["Hai vinto, ma il Ricettario ormai è lontano. Il Luogotenente l'ha portato nelle valli di Comacchio!"] },
    after: { speaker: "Prof. Albe", lines: ["Comacchio! Passa da Ferrara: prendi il Sigillo Estense e poi segui il canale verso est."] },
    reward: { money: 500, caramella: 1 },
  },
  {
    target: "ferrara", title: "Capitolo 4 · Le mura di Ferrara", goal: "Ottieni il Sigillo Estense a Ferrara",
    done: (s) => s.badges.includes("Sigillo Estense"),
    after: { speaker: "Contessa Nebbia d'Este", lines: ["Banda della Panna, dici? Li ho visti passare verso Comacchio, con un librone sotto il braccio."] },
    reward: { money: 400 },
  },
  {
    target: "comacchio", title: "Capitolo 5 · Nelle valli", goal: "Batti il Luogotenente della Panna a Comacchio",
    done: beat("story_5"),
    villain: { map: "comacchio", name: "Luogotenente della Panna", look: PANNA, team: [["anguillina", 22], ["nebbiolone", 23], ["zanzarazza", 24]],
      lines: ["Nella nebbia nessuno vede la panna. È il nascondiglio perfetto!", "Ma tu vedi un po' troppo. Lottiamo!"],
      after: ["Il Ricettario? Ne abbiamo strappato una pagina e l'abbiamo mandata a Parma. Il resto... chissà!"] },
    after: { speaker: "Prof. Albe", lines: ["Parma! Ma per arrivarci servono più Sigilli: diventa più forte, poi vai a ovest."] },
    reward: { money: 800, caramella: 1 },
  },
  {
    title: "Capitolo 6 · Più forte", goal: "Raccogli almeno 7 Sigilli in tutta la regione",
    done: badges(7),
    after: { speaker: "Prof. Albe", lines: ["Sette Sigilli! Ora sei pronto. A Reggio Emilia qualcuno ha visto gente vestita di bianco e rosa..."] },
    reward: { money: 1000 },
  },
  {
    target: "reggio_emilia", title: "Capitolo 7 · Il Tricolore", goal: "Ottieni il Sigillo del Tricolore a Reggio Emilia",
    done: (s) => s.badges.includes("Sigillo del Tricolore"),
    after: { speaker: "Erminia dell'Erbazzone", lines: ["La Banda della Panna? Volevano mettere la panna nell'erbazzone! Sono andati verso Parma."] },
    reward: { money: 600 },
  },
  {
    target: "parma", title: "Capitolo 8 · La pagina perduta", goal: "Batti la Generalessa della Panna a Parma",
    done: beat("story_8"),
    villain: { map: "parma", name: "Generalessa della Panna", look: PANNA, team: [["anolone", 33], ["culatellone", 34], ["prosciuttone", 35]],
      lines: ["Anolini alla panna, culatello alla panna: Parma sarà la nostra capitale!", "Il Ricettario è al sicuro sulla rupe di San Leo. Non ci arriverai mai!"],
      after: ["Impossibile... Ecco la pagina strappata. Ma il Capo ti aspetta a San Leo, nella fortezza."] },
    after: { speaker: "Prof. Albe", lines: ["San Leo, all'estremo sud-est, oltre Rimini e Verucchio. Ultimo sforzo, apprendista!"] },
    reward: { money: 1500, caramella: 2 },
  },
  {
    target: "san_leo", title: "Capitolo 9 · La fortezza", goal: "Batti Don Pannacotta, capo della Banda, a San Leo",
    done: beat("story_9"),
    villain: { map: "san_leo", name: "Don Pannacotta", look: ["#fbc02d", "#ffffff"], team: [["bombolone", 40], ["liscione", 41], ["motorissimo", 42], ["piadinissima", 44]],
      lines: ["Benvenuto nella mia fortezza. Qui fu rinchiuso un famoso imbroglione, e qui finirai anche tu.", "Un mondo intero alla panna! Morbido, dolce, uguale ovunque. Non è bellissimo?"],
      after: ["No... il mondo non è pronto per la mia panna. Prendi il tuo Ricettario."] },
    after: { speaker: "Prof. Albe", lines: [
      "Il Grande Ricettario è salvo! I tortellini restano in brodo, l'erbazzone con le bietole, la piadina come la fa l'azdora.",
      "Sei un eroe dell'Emilia-Romagna. Ora va', completa il Mostrario e raccogli tutti i Sigilli!",
      "Ah, un'ultima cosa: da oggi i Mostrelli selvatici si fanno più forti. Allenati fino al livello 100!",
    ] },
    reward: { money: 5000, caramella: 5 },
  },
];

export const STORY_END = CHAPTERS.length;
export const chapterNow = (s: { story?: number }) => s.story ?? 0;

/** Gang members are on the map only during their own chapter. */
export const npcVisible = (n: Npc, s: { story?: number }) => n.story === undefined || n.story === chapterNow(s);

export function placeStory(maps: Record<string, GameMap>) {
  CHAPTERS.forEach((c, i) => {
    const v = c.villain;
    if (!v || !maps[v.map]) return;
    const spot = findSpot(maps[v.map]);
    if (!spot) return;
    maps[v.map].npcs.push({
      id: `story_${i + 1}`, x: spot[0], y: spot[1], name: v.name, look: { A: v.look[0], C: v.look[1] }, kind: "trainer",
      lines: v.lines, after: v.after, team: v.team, reward: 150 + i * 120, story: i,
    });
  });
}
