def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

F = '/app/frontend/src/game/'

EVO = [  # base, newId, name, lv, look, desc
    ("mortazzone", "mortadellone", "Mortadellone", 20, {"p": "#e57373", "P": "#b71c1c", "w": "#fff3e0", "g": "#1b5e20"}, "Mortadella gigante IGP. Pesa come un'utilitaria e profuma come la domenica."),
    ("squacquerone", "squacquerona", "Squacquerona", 18, {"w": "#fffde7", "e": "#fbc02d"}, "Squacquerone stagionato in chiacchiere. Ormai conosce i segreti di tutta la Romagna."),
    ("passatellone", "passatellaccio", "Passatellaccio", 20, {"o": "#c77800", "c": "#ffe0b2"}, "Passatello robusto cotto in brodo di cappone. Si annoda per farti paura."),
    ("piadinone", "piadinazza", "Piadinazza", 20, {"e": "#ffe082", "o": "#8d4e00", "g": "#1b5e20"}, "Tartaruga con piadina doppia farcita. Corazza alta, opinioni ancora più alte."),
    ("zanzarone", "zanzarazza", "Zanzarazza", 24, {"S": "#37474f", "c": "#90a4ae", "n": "#b71c1c"}, "Regina delle zanzare del Po. L'autan le fa il solletico."),
    ("pistonzo", "turbonzo", "Turbonzo", 22, {"r": "#ffeb3b", "s": "#212121", "S": "#b71c1c"}, "Scarabeo col turbo. Fa il giro dell'autodromo in un minuto e mezzo, pit-stop compreso."),
    ("vaporella", "vaporiera", "Vaporiera", 22, {"w": "#e0f7fa", "c": "#80deea", "o": "#ff7043"}, "Uccello di vapore bollente. Quando passa, tutti si sentono in sauna."),
    ("biciclone", "tandemone", "Tandemone", 24, {"g": "#c62828", "S": "#fbc02d"}, "Bicicletta a due posti con la testa di serpente. Pedala controvento e non si lamenta mai."),
    ("crescentino", "crescentone", "Crescentone", 20, {"e": "#ffcc80", "o": "#bf360c", "r": "#e91e63"}, "Crescentina gigante farcita di salumi. Il re dei taglieri bolognesi."),
    ("gabbianone", "gabbianazzo", "Gabbianazzo", 28, {"w": "#eceff1", "S": "#263238", "y": "#ff6f00"}, "Il terrore dei lidi. Ruba piadine, gelati e pure gli occhiali da sole."),
    ("lambruschino", "lambruscone", "Lambruscone", 22, {"m": "#4a0e2e", "P": "#ad1457"}, "Fiasco di frizzante dei colli. Le sue bollicine stordiscono anche i più sobri."),
    ("zuppone", "zuppissima", "Zuppissima", 21, {"p": "#f06292", "y": "#ffd54f", "P": "#880e4f"}, "Zuppa inglese a dieci strati con alchermes doppio. Sa i segreti di ogni paese."),
]

p = F + 'data.ts'
s = open(p).read()
new_species = []
for base, nid, name, lv, look, desc in EVO:
    import re
    # attach evo to base species
    pat = re.compile(r'(sp\(\{ id: "' + base + r'",[^\n]*?desc: "[^"]*")( \}\),)')
    assert pat.search(s), base
    s = pat.sub(lambda m: m.group(1) + f', evo: {{ to: "{nid}", lv: {lv} }}' + m.group(2), s, count=1)
    bm = re.search(r'sp\(\{ id: "' + base + r'", num: \d+, name: "[^"]+", type: "(\w+)", hp: (\d+), atk: (\d+), def: (\d+), spd: (\d+), catchRate: [\d.]+, moves: (\[.*?\]\]),', s)
    t, hp, atk, df, spd, moves = bm.groups()
    new_species.append(f'  sp({{ id: "{nid}", num: 0, name: "{name}", type: "{t}", hp: {int(hp)+25}, atk: {int(atk)+25}, def: {int(df)+22}, spd: {int(spd)+18}, catchRate: 0.15, moves: {moves}, desc: "{desc}" }}),')
s = s.replace('''];
export const SPECIES: Record''', "\n".join(new_species) + '''
];
SPECIES_LIST.forEach((x, i) => (x.num = i + 1));
export const SPECIES: Record''', 1)
s = s.replace('''  wild: [string, number, number, number][];''', '''  wild: [string, number, number, number][];
  music?: string;''')
open(p, 'w').write(s)

# skins
skins = ",\n".join(f'  {nid}: {{ base: "{base}", look: {look} }}'.replace("'", '"') for base, nid, _, _, look, _ in EVO)
s = open(F + 'sprites.ts').read()
s += f'''
// Evolved forms that reuse a base drawing with a new palette.
export const SKINS: Record<string, {{ base: string; look: Record<string, string> }}> = {{
{skins},
}};
'''
open(F + 'sprites.ts', 'w').write(s)

edit(F + 'PixelSprite.tsx', [
('import { PAL, SPRITES } from "./sprites";', 'import { PAL, SKINS, SPRITES } from "./sprites";'),
('''function PixelSpriteBase({ name, size, look, silhouette, flip, testID }: Props) {''', '''function PixelSpriteBase({ name: rawName, size, look: rawLook, silhouette, flip, testID }: Props) {
  const skin = SKINS[rawName];
  const name = skin?.base ?? rawName;
  const look = skin ? { ...skin.look, ...rawLook } : rawLook;'''),
])

# new towns between Bologna and Ferrara
TPL = ["TTTTTTT.TTTTTTTT", "TGGGG,,.,,GGGGGT", "TGGGG,,.,,GGGGGT", "T,RRR,,.,,RRRR,T", "T,HDH,,.,,HHDH,T", "T,,,,,,.,,,,,,,T",
       "T,,,,,,.,,,,,,,T", "TCCCCCCCCCCCCCCT", "T,,,,,,.,,,S,,,T", "TGGGGG,.,GGGGGGT", "TGGGGG,.,GGGGGGT", "T,,,,,,.,,,,,,,T",
       "TWWWW,,.,,FFFFFT", "TWWWW,,.,,FFFFFT", "T,,,,,,.,,,,,,,T", "TTTTTTT.TTTTTTTT"]
ALT = TPL[:12] + ["TGGGG,,.,,GGGGGT", "TGGGG,,.,,GGGGGT"] + TPL[14:]
newmaps = f'''  maggiore: {{
    id: "maggiore", name: "Castel Maggiore", music: "maggiore",
    tiles: {TPL},
    exits: [{{ x: 7, y: 15, to: "bologna", tx: 7, ty: 1 }}, {{ x: 7, y: 0, to: "altedo", tx: 7, ty: 14 }}],
    heal: {{ x: 4, y: 5 }},
    wild: [["canalino", 9, 12, 2], ["crescentino", 9, 12, 2], ["zuppone", 9, 12, 2], ["umarellino", 10, 12, 2]],
    signs: {{ "11,8": "CASTEL MAGGIORE: a due passi da Bologna, ma guai a dire che è periferia." }},
    npcs: [
      {{ id: "cm_barista", x: 3, y: 5, name: "Barista della Piazza", look: L("#ffffff", "#1a1a1a"), kind: "heal", lines: ["Un caffè, un toast e due chiacchiere sul Bologna. Ecco fatto, squadra come nuova!"] }},
      {{ id: "cm_ferramenta", x: 12, y: 5, name: "Ferramenta Eugenio", look: L("#7b4a2a", "#9e9e9e"), kind: "shop", lines: ["Viti, bulloni, vasetti e brodini. Da Eugenio c'è tutto, basta saperlo cercare."] }},
      {{ id: "cm_pendolare", x: 5, y: 8, name: "Pendolare delle 7:12", look: L("#424242", "#1565c0"), kind: "trainer", lines: ["Il mio treno per Bologna ha 40 minuti di ritardo. Ho tutto il tempo per batterti!"], team: [["canalino", 10], ["umarellino", 11]], reward: 140, after: ["Ecco, è arrivato il treno. Anzi no, è soppresso. Che giornata."] }},
      {{ id: "cm_mamma", x: 10, y: 11, name: "Mamma del Gruppo WhatsApp", look: L("#e91e63", "#f4a6b0"), kind: "trainer", lines: ["Ho 47 notifiche non lette sul gruppo della scuola e una lotta da vincere. Facciamo in fretta!"], team: [["zuppone", 11], ["crescentino", 11]], reward: 150, after: ["Ho perso, ma lo scrivo sul gruppo come se avessi vinto io."] }},
    ],
  }},
  altedo: {{
    id: "altedo", name: "Altedo", music: "altedo",
    tiles: {ALT},
    exits: [{{ x: 7, y: 15, to: "maggiore", tx: 7, ty: 1 }}, {{ x: 7, y: 0, to: "ferrara", tx: 7, ty: 14 }}],
    heal: {{ x: 4, y: 5 }},
    wild: [["cappellaccio", 11, 14, 3], ["cinghialotto", 11, 14, 2], ["zanzarone", 12, 14, 2], ["lambruschino", 11, 13, 2]],
    signs: {{ "11,8": "ALTEDO: capitale dell'asparago verde. Qui l'asparago è una religione." }},
    npcs: [
      {{ id: "al_nonna", x: 3, y: 5, name: "Nonna dell'Asparago", look: L("#cfd8dc", "#4caf50"), kind: "heal", lines: ["Risotto agli asparagi per tutti! Fa bene, purifica, e ti fa fare la pipì profumata. Lo dice la scienza."] }},
      {{ id: "al_banco", x: 12, y: 5, name: "Banco della Sagra", look: L("#fbc02d", "#2e7d32"), kind: "shop", lines: ["Prezzi da sagra! Vasetti, brodini e un mazzo di asparagi in omaggio. Gli asparagi no, quelli sono finiti."] }},
      {{ id: "al_coltivatore", x: 5, y: 8, name: "Coltivatore di Asparagi", look: L("#2e7d32", "#8d6e63"), kind: "trainer", lines: ["Asparago verde, mica bianco come quelli del nord! Ti insegno io il rispetto per l'ortaggio!"], team: [["cappellaccio", 12], ["cinghialotto", 13]], reward: 170, after: ["Va bene, hai vinto. Ma l'asparago resta il re della tavola."] }},
      {{ id: "al_ciclista", x: 10, y: 11, name: "Ciclista in Lycra della Domenica", look: L("#ffeb3b", "#00acc1"), kind: "trainer", lines: ["Bici da 8000 euro, maglia aderente, 40 km di pianura. Mi sento al Giro d'Italia!"], team: [["biciclone", 13], ["zanzarone", 13]], reward: 180, after: ["Ho perso perché la bici pesa 50 grammi di troppo. Sicuro."] }},
    ],
  }},
'''
s = open(p).read()
s = s.replace('''  riviera: {''', newmaps + '''  riviera: {''', 1)
s = s.replace('''exits: [{ x: 7, y: 0, to: "ferrara", tx: 7, ty: 14 }, { x: 15, y: 8, to: "osteria", tx: 1, ty: 8 }],''', '''exits: [{ x: 7, y: 0, to: "maggiore", tx: 7, ty: 14 }, { x: 15, y: 8, to: "osteria", tx: 1, ty: 8 }],''', 1)
s = s.replace('''exits: [{ x: 7, y: 15, to: "bologna", tx: 7, ty: 1 }],''', '''exits: [{ x: 7, y: 15, to: "altedo", tx: 7, ty: 1 }],''', 1)
for mid, mus in [("bologna", "bologna"), ("ferrara", "ferrara"), ("osteria", "osteria"), ("csp", "terme"), ("imola", "imola"), ("riviera", "beach")]:
    a = f'id: "{mid}", name: '
    i = s.index(a)
    j = s.index(",", s.index('name: "', i) + 7)
    s = s[:j] + f', music: "{mus}"' + s[j:]
open(p, 'w').write(s)

edit(F + 'audio.ts', [
('''  beach: require("../../assets/audio/beach.wav"),
};''', '''  beach: require("../../assets/audio/beach.wav"),
  bologna: require("../../assets/audio/bologna.wav"),
  osteria: require("../../assets/audio/osteria.wav"),
  terme: require("../../assets/audio/terme.wav"),
  imola: require("../../assets/audio/imola.wav"),
  ferrara: require("../../assets/audio/ferrara.wav"),
  maggiore: require("../../assets/audio/maggiore.wav"),
  altedo: require("../../assets/audio/altedo.wav"),
};'''),
])
edit('/app/frontend/app/game.tsx', [
('''playBgm(inBattle ? "battle" : mapId === "riviera" ? "beach" : "town");''', '''playBgm(inBattle ? "battle" : ((MAPS[mapId].music ?? "town") as BgmName));'''),
('''import { initAudio, isMuted, playBgm, setMuted, sfx } from "@/src/game/audio";''', '''import { BgmName, initAudio, isMuted, playBgm, setMuted, sfx } from "@/src/game/audio";'''),
])
edit('/app/frontend/app/mappa.tsx', [
('''const ORDER = ["ferrara", "bologna",''', '''const ORDER = ["ferrara", "altedo", "maggiore", "bologna",'''),
])
print("ok")
