p = "/app/frontend/src/game/expansion.ts"
s = open(p).read()
old_ac = s[s.index('    tiles: room(["BBBBBBBBBBBBBBBB", "BHHHHHHHHHHHHHHB", "BPPPPPPPPPPPPPPB", "BPBBPPBB'):]
old_ac = old_ac[:old_ac.index("\n")]
s = s.replace(old_ac, '''    tiles: [
      "NNNNNNNNNNNNNNNN", "NKKKKLLLLLLKKKKN", "NLLLLLLLLLLLLLLN", "NLKKLLKKLLKKLLLN", "NLLLLLLLLLLLLLLN", "NLKKLLKKLLKKLLLN",
      "NLLLLLLLLLLLLLLN", "NLLLLVVVVVLLLLLN", "NLLLLVVVVVLLLLLN", "NLKKLLLLLLLLKKLN", "NLLLLLLLLLLLLLLN", "NLKKLLLLLLLLKKLN",
      "NLLLLLLLLLLLLLLN", "NLLLLLLLLLLLLLLN", "NLLLLLLLLLLLLLLN", "NNNNNNNLNNNNNNNN",
    ],''')
old_me = s[s.index('    tiles: room(["BBBBBBBBBBBBBBBB", "BHHHHHHHHHHHHHHB", "BPPPPPPPPPPPPPPB", "BPRRRPP'):]
old_me = old_me[:old_me.index("\n")]
s = s.replace(old_me, '''    tiles: [
      "NNNNNNNNNNNNNNNN", "NMMMCCMMMCCMMMCN", "NCCCCCCCCCCCCCCN", "NCCCCCCCCCCCCCCN", "NCCCCCCCCCCCCCCN", "NMMMCCMMMCCMMMCN",
      "NCCCCCCCCCCCCCCN", "NCCCCCCCCCCCCCCN", "NCCCVVVVVVVVCCCN", "NCCCVVVVVVVVCCCN", "NCCCCCCCCCCCCCCN", "NMMMCCMMMCCMMMCN",
      "NCCCCCCCCCCCCCCN", "NCCCCCCCCCCCCCCN", "NCCCCCCCCCCCCCCN", "NNNNNNNCNNNNNNNN",
    ],''')
s = s.replace('exits: [{ x: 7, y: 11, to: "modena", tx: 12, ty: 3 }]', 'exits: [{ x: 7, y: 15, to: "modena", tx: 12, ty: 3 }]')
s = s.replace('exits: [{ x: 7, y: 11, to: "bologna", tx: 2, ty: 6 }]', 'exits: [{ x: 7, y: 15, to: "bologna", tx: 2, ty: 6 }]')
s = s.replace('{ x: 12, y: 2, to: "acetaia", tx: 7, ty: 10 }', '{ x: 12, y: 2, to: "acetaia", tx: 7, ty: 14 }')
s = s.replace('{ x: 2, y: 5, to: "mercato", tx: 7, ty: 10 }', '{ x: 2, y: 5, to: "mercato", tx: 7, ty: 14 }')
s = s.replace('const ROOM_FOOT = ["XXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXX", "XXXXXXXXXXXXXXXX"];\n', '')
s = s.replace('const room = (top: string[]) => [...top, ...ROOM_FOOT];\n\n', '')
assert "room(" not in s and "ROOM_FOOT" not in s

# Unique outfits: every capopalestra has its own drawing, shopkeepers get a trade outfit.
s = s.replace('''  caramella: [''', '''  boss_umarell: ["..kkkkkkkk..", ".kAAAAAAAAk.", "..khhhhhhk..", "..kwkhhkwk..", "..khhhhhhk..", "...khhhhk...", "..kCCCCCCk..", ".kCCCCCCCCk.", ".kChCCCCCCk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
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
  caramella: [''')
s = s.replace('''export const X_BADGES''', '''// Which drawing each capopalestra / shopkeeper uses (everyone else is a regular person).
export const NPC_SPRITES: Record<string, string> = {
  bo_gino: "boss_umarell", fe_contessa: "boss_contessa", og_loris: "boss_camionista", cs_ivonne: "boss_nonna", im_ivano: "boss_pilota",
  ri_romeo: "boss_romeo", ac_ferruccio: "boss_aceto", pa_duchessa: "boss_duchessa", ra_teodora: "boss_teodora",
  bo_bottega: "shop_apron", fe_fornaio: "shop_baker", cs_farmacia: "shop_apron", cm_ferramenta: "shop_apron", al_banco: "shop_straw",
  ri_ambulante: "shop_straw", mo_salumiere: "shop_apron", pa_casaro: "shop_baker", ra_mosaicista: "shop_straw", me_fruttivendola: "shop_straw",
};

export const X_BADGES''')
open(p, "w").write(s)

p = "/app/frontend/src/game/data.ts"
s = open(p).read()
s = s.replace('export const BLOCKING = new Set(["T", "W", "R", "H", "D", "B", "S", "O", "U", "X"]);', 'export const BLOCKING = new Set(["T", "W", "R", "H", "D", "B", "S", "O", "U", "X", "K", "M", "N"]);')
open(p, "w").write(s)

p = "/app/frontend/src/game/TileMap.tsx"
s = open(p).read()
s = s.replace('const TALL = new Set(["T", "R", "H", "B", "D"]);', 'const TALL = new Set(["T", "R", "H", "B", "D", "N", "K", "M"]);')
s = s.replace('<PixelSprite name="person" size={size} look={npc.look} />', '<PixelSprite name={NPC_SPRITES[npc.id] ?? "person"} size={size} look={npc.look} />')
s = s.replace('import { GameMap, ITEMS } from "./data";', 'import { GameMap, ITEMS } from "./data";\nimport { NPC_SPRITES } from "./expansion";')
open(p, "w").write(s)

p = "/app/frontend/src/game/TileArt.tsx"
s = open(p).read()
s = s.replace('A: "#4a4a4a", Y: "#f0d9a0", Q: "#f0d9a0", U: "#f0d9a0", X: "#0b0b0b",', 'A: "#4a4a4a", Y: "#f0d9a0", Q: "#f0d9a0", U: "#f0d9a0", X: "#0b0b0b",\n    L: "#a0703c", K: "#a0703c", M: "#b8a68e", N: "#e9d8b4", V: "#9c2a2a",')
indoor = '''    case "L":
    case "K":
      // Wooden floor planks; "K" adds an oak barrel on top.
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={0} t={ty * u} w={s} h={u * 0.35} c="#b8844a" />
              <Px l={0} t={ty * u + u * 1.7} w={s} h={u * 0.3} c="#6e4626" />
              <Px l={(((ty + x * 3 + y) % 5) + 1.5) * u} t={ty * u} w={u * 0.3} h={u * 2} c="#6e4626" />
            </React.Fragment>
          ))}
          {ch === "K" && (
            <>
              <Px l={u * 0.8} t={u * 6.6} w={u * 6.4} h={u * 1.2} c="rgba(0,0,0,0.3)" r={u * 3} />
              <Px l={u * 0.8} t={u * 0.6} w={u * 6.4} h={u * 6.8} c="#5a3418" r={u * 2.4} />
              <Px l={u * 1.2} t={u * 0.9} w={u * 5.6} h={u * 6.2} c="#7a4a24" r={u * 2.2} />
              <Px l={u * 2} t={u * 1.2} w={u * 1} h={u * 5.6} c="#9a6434" />
              <Px l={u * 0.8} t={u * 1.8} w={u * 6.4} h={u * 0.6} c="#3e3e3e" />
              <Px l={u * 0.8} t={u * 5.4} w={u * 6.4} h={u * 0.6} c="#3e3e3e" />
              <Px l={u * 1} t={u * 1.8} w={u * 6} h={u * 0.2} c="#8a8a8a" />
              <Px l={u * 3.6} t={u * 3.5} w={u * 0.8} h={u * 0.8} c="#2a1608" r={u} />
            </>
          )}
        </>
      );
      break;
    case "M": {
      // Market stall: striped awning over a crate of fresh produce.
      const fruit = [["#d32f2f", "#e53935"], ["#fbc02d", "#f9a825"], ["#7cb342", "#558b2f"], ["#ef6c00", "#fb8c00"]][hv % 4];
      inner = (
        <>
          {[0, 1, 2, 3].map((i) => <Px key={i} l={i * 2 * u} t={0} w={u} h={u * 3} c={hv % 2 ? "#c0392b" : "#2e7d32"} />)}
          {[0, 1, 2, 3].map((i) => <Px key={`w${i}`} l={(i * 2 + 1) * u} t={0} w={u} h={u * 3} c="#fff8e1" />)}
          {[0.5, 2.5, 4.5, 6.5].map((l) => <Px key={`sc${l}`} l={l * u} t={u * 2.8} w={u * 1.2} h={u * 0.6} c={hv % 2 ? "#8e2a1f" : "#1f5a24"} r={u} />)}
          <Px l={u * 0.5} t={u * 4} w={u * 7} h={u * 3.6} c="#8d5a2b" />
          <Px l={u * 0.5} t={u * 4} w={u * 7} h={u * 0.4} c="#b07a42" />
          <Px l={u * 0.5} t={u * 5.8} w={u * 7} h={u * 0.3} c="#5e3a1a" />
          {[[1, 4.6], [2.6, 4.4], [4.2, 4.7], [5.8, 4.4], [1.8, 5.2], [3.4, 5.2], [5, 5.2]].map(([l, t], i) => (
            <React.Fragment key={`f${i}`}>
              <Px l={l * u} t={t * u} w={u * 1.3} h={u * 1.2} c={fruit[i % 2]} r={u} />
              <Px l={(l + 0.3) * u} t={(t + 0.2) * u} w={u * 0.4} h={u * 0.3} c="#ffffff" />
            </React.Fragment>
          ))}
          <Px l={u * 0.6} t={u * 6.2} w={u * 0.5} h={u * 1.8} c="#5e3a1a" />
          <Px l={u * 6.9} t={u * 6.2} w={u * 0.5} h={u * 1.8} c="#5e3a1a" />
        </>
      );
      break;
    }
    case "N":
      // Indoor wall: plaster, cornice and wood wainscot; some walls have shelves with bottles.
      inner = (
        <>
          <Px l={0} t={0} w={s} h={u * 0.7} c="#c9b48c" />
          <Px l={0} t={u * 4.2} w={s} h={u * 3.8} c="#7a4a24" />
          <Px l={0} t={u * 4.2} w={s} h={u * 0.4} c="#9a6434" />
          <Px l={u * 0.8} t={u * 5.2} w={u * 2.6} h={u * 2.2} c="#6a3e1e" />
          <Px l={u * 4.6} t={u * 5.2} w={u * 2.6} h={u * 2.2} c="#6a3e1e" />
          {hv % 3 === 0 && (
            <>
              <Px l={u * 0.6} t={u * 3.2} w={u * 6.8} h={u * 0.4} c="#5e3a1a" />
              {[1, 2.4, 3.8, 5.2].map((l, i) => <Px key={l} l={l * u} t={u * 1.6} w={u * 0.8} h={u * 1.6} c={["#2e5e2a", "#7b1f3a", "#3e2a20", "#c49a2c"][i]} r={u * 0.2} />)}
            </>
          )}
          {hv % 3 === 1 && (
            <>
              <Px l={u * 2.2} t={u * 1.1} w={u * 3.6} h={u * 2.6} c="#c49a2c" />
              <Px l={u * 2.6} t={u * 1.5} w={u * 2.8} h={u * 1.8} c="#5d8aa8" />
              <Px l={u * 2.6} t={u * 2.6} w={u * 2.8} h={u * 0.7} c="#6f9a3a" />
            </>
          )}
        </>
      );
      break;
    case "V":
      // Red carpet with a golden border.
      inner = (
        <>
          <Px l={0} t={u * 0.4} w={s} h={u * 0.5} c="#e0b040" />
          <Px l={0} t={u * 7.1} w={s} h={u * 0.5} c="#e0b040" />
          <Px l={u * 3.4} t={u * 3.4} w={u * 1.2} h={u * 1.2} c="#e0b040" />
          <Px l={u * 1} t={u * 2} w={u * 0.6} h={u * 0.6} c="#7a1d1d" />
          <Px l={u * 6.4} t={u * 5.4} w={u * 0.6} h={u * 0.6} c="#7a1d1d" />
        </>
      );
      break;
'''
s = s.replace('    case "A":\n', indoor + '    case "A":\n', 1)
open(p, "w").write(s)
print("ok")
