// Original 12x12 pixel art. '.' = transparent.
export const PAL: Record<string, string> = {
  k: "#1a1a1a", w: "#ffffff", y: "#f2c94c", o: "#e0913a", r: "#c0392b",
  p: "#f4a6b0", P: "#d9707f", g: "#4caf50", G: "#2e7d32", b: "#7b4a2a",
  B: "#4e2e18", s: "#9e9e9e", S: "#616161", c: "#cfd8dc", m: "#7b1f3a",
  t: "#8d6e63", e: "#f3e3b5", n: "#263238", h: "#ffcc80",
  A: "#c0392b", C: "#4caf50",
};

export const SPRITES: Record<string, string[]> = {
  tortellotto: [
    "............", "....kkkk....", "...kyyyyk...", "..kyyooyyk..", ".kyyk..kyyk.", ".kyk....kyk.",
    ".kyywyywyyk.", ".kyykyykyyk.", "..kyyyyyyk..", "..kyrrrryk..", "...kkkkkk...", "............",
  ],
  fanghino: [
    "............", "..kk....kk..", ".kwnk..kwnk.", ".kttkkkkttk.", "kttttttttttk", "ktteettteetk",
    "kttttttttttk", "ktkkkkkkkktk", ".kttrrrrttk.", "..kttttttk..", ".kttk..kttk.", ".kkk....kkk.",
  ],
  grappolino: [
    ".....gg.....", "....gGgk....", ".....kB.....", "...kmmmmk...", "..kmwmmwmk..", "..kmnmmnmk..",
    ".kmmmmmmmmk.", "..kmmrrmmk..", "...kmmmmk...", "....kmmk....", ".....kk.....", "............",
  ],
  mortazzone: [
    "............", "..kk....kk..", ".kPpk..kPpk.", ".kppppppppk.", "kppwppppgppk", "kpknppppknpk",
    "kppppPPppppk", "kpwpkPPkpgpk", "kppppppppppk", ".kppppwpppk.", ".kPk....kPk.", ".kkk....kkk.",
  ],
  umarellino: [
    "...kkkkkk...", "..kSSSSSSk..", ".kkkkkkkkkk.", "...khhhhk...", "...kwkkwk...", "...khhhhk...",
    "...kSccSk...", "..kbbbbbbk..", "..kbbbbbbk..", "..kbbbbbbk..", "...kSk.kSk..", "...kkk.kkk..",
  ],
  zanzarone: [
    "k..........k", ".k..cc.cc.k.", "..kccccccck.", "...kcnnck...", "..kSSnnSSk..", ".kSSSSSSSSk.",
    "kk.kSSSSk.kk", "...kSSSSk...", "....kSSk....", "...k.kk.k...", "..k..kk..k..", ".....kk.....",
  ],
  nebbiolone: [
    "....cccc....", "..cccccccc..", ".cccwccwccc.", ".cccnccnccc.", "cccccccccccc", "ccccckkccccc",
    "cccccccccccc", ".cccccccccc.", ".c.cccccc.c.", "...c.cc.c...", ".....c......", "............",
  ],
  salamone: [
    ".....kk.....", "....kbk.....", "...krrrk....", "..krrrrrk...", ".krrwrrwrrk.", ".krrnrrnrrk.",
    "krrrrrrrrrrk", "krrrrkkrrrrk", "krrPrrrrPrrk", ".krrrrrrrrk.", "..krrrrrrk..", "...kkkkkk...",
  ],
  biciclone: [
    "............", ".....kkk....", "....kgwgk...", "....kgnggk..", ".....kgk....", "..kkkkgkkk..",
    ".kSSkkgkSSk.", "kS..SkgS..Sk", "kS.kSkkS.kSk", "kS..Sk.S..Sk", ".kSSk..kSSk.", "..kk....kk..",
  ],
  pistonzo: [
    "............", "...k....k...", "....k..k....", "...kkkkkk...", "..krrrrrrk..", ".krwrrrrwrk.",
    ".krnrssrnrk.", "krrrrssrrrrk", "kSrrrssrrrSk", "kSkrrrrrrkSk", ".S.kkkkkk.S.", ".S........S.",
  ],
  vaporella: [
    "...c..c.....", "....c..c....", "....kkkk....", "...kwwwwk...", "..kwnwwwok..", "..kwwwwwwk..",
    ".kcwwwwwwck.", "kccwwwwwwcck", ".kcwwwwwwck.", "..kwwwwwwk..", "...kokkok...", "............",
  ],
  cinghialotto: [
    "............", ".kk......kk.", "kBBk....kBBk", "kBBBkkkkBBBk", "kBBBBBBBBBBk", "kBwnBBBBwnBk",
    "kBBBBBBBBBBk", "kBwBbbbbBwBk", ".kBbkbbkbBk.", "..kbbbbbbk..", ".kBBk..kBBk.", ".kkk....kkk.",
  ],
  squacquerone: [
    "............", "....kkkk....", "..kkwwwwkk..", ".kwwwwwwwwk.", ".kwwnwwnwwk.", "kwwwwwwwwwwk",
    "kwwwwkkwwwwk", "kewwwwwwwwek", "keewwwwwweek", ".keeeeeeeek.", "..kkkkkkkk..", "............",
  ],
  piadinone: [
    "............", "....kkkk....", "...keoeek...", "..keeeeoek..", ".keoeeeeeek.", ".keeeeoeeek.",
    "kkkkkkkkkkkk", "kgwk.gg.kggk", "kgnk.gg.kggk", ".kk..kk..kk.", "............", "............",
  ],
  passatellone: [
    "............", "........kkk.", ".......kowk.", ".......konk.", "......kook..", ".....kook...",
    "....kook....", "...kook.....", "..kook......", ".kook.......", "cccccccccccc", ".cccccccccc.",
  ],
  portichino: [
    "kkkkkkkkkkkk", "krrorrrorrok", "kwnorrrownok", "krrorrrorrok", "kkkkkkkkkkkk", "ko..o..o..ok",
    "ko..o..o..ok", "ko..o..o..ok", "kooooooooook", ".kok....kok.", ".kok....kok.", ".kkk....kkk.",
  ],
  person: [
    "...kkkkkk...", "..kAAAAAAk..", ".kAAAAAAAAk.", "..khhhhhhk..", "..khnhhnhk..", "..khhhhhhk..",
    "..kkCCCCkk..", ".khCCCCCChk.", ".khCCCCCChk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk..",
  ],
};
