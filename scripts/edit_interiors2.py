p = "/app/frontend/src/game/expansion.ts"
s = open(p).read()
s = s.replace('''  caramella: [''', '''  shop_bandana: ["..kkkkkkkk..", ".kAAAAAAAAkA", "..kAAAAAAkA.", "..khnhhnhk..", "..khhhhhhk..", "...khrrhk...", "..kCCCCCCk..", ".kCCCCCCCCk.", ".khCCCCCChk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_moustache: ["...kkkkkk...", "..khhhhhhk..", "..khhhhhhk..", "..khnhhnhk..", "..kBBBBBBk..", "...khhhhk...", "..kACCCCAk..", ".kAACCCCAAk.", ".khACCCCAhk.", "..kSSSSSSk..", "..kSk..kSk..", "..kkk..kkk.."],
  shop_glasses: ["...kkkkkk...", "..kBBBBBBk..", ".kBBBBBBBBk.", ".kBkckkckBk.", ".kBhhhhhhBk.", ".kBkhrrhkBk.", "..kAAAAAAk..", ".kCCAAAACCk.", ".khCCCCCChk.", "..kCCCCCCk..", "..kSk..kSk..", "..kkk..kkk.."],
  caramella: [''')
s = s.replace('cs_farmacia: "shop_apron", cm_ferramenta: "shop_apron"', 'cs_farmacia: "shop_glasses", cm_ferramenta: "shop_moustache"')
s = s.replace('ri_ambulante: "shop_straw"', 'ri_ambulante: "shop_bandana"').replace('ra_mosaicista: "shop_straw"', 'ra_mosaicista: "shop_glasses"')
s = s.replace('{ id: "me_fruttivendola", x: 3, y: 4,', '{ id: "me_fruttivendola", x: 3, y: 6,')
# Side walls: stone pilasters instead of stacked shelves.
import re
def side(block):
    rows = re.findall(r'"([A-Z]{16})"', block)
    out = block
    for i, r in enumerate(rows):
        if 0 < i < 15:
            out = out.replace(f'"{r}"', f'"J{r[1:15]}J"', 1)
    return out
for key in ("  acetaia: {", "  mercato: {"):
    a = s.index(key); b = s.index("],", s.index("tiles: [", a)) + 2
    s = s[:a] + side(s[a:b]) + s[b:]
open(p, "w").write(s)

p = "/app/frontend/src/game/data.ts"
s = open(p).read()
s = s.replace('"X", "K", "M", "N"]);', '"X", "K", "M", "N", "J"]);')
open(p, "w").write(s)

p = "/app/frontend/src/game/TileArt.tsx"
s = open(p).read()
s = s.replace('M: "#b8a68e", N: "#e9d8b4", V: "#9c2a2a",', 'M: "#b8a68e", N: "#e9d8b4", V: "#9c2a2a", J: "#b8a68e",')
s = s.replace('    case "V":\n', '''    case "J":
      // Side wall: stone pilaster with blocks, light edge and shadow edge.
      inner = (
        <>
          {[0, 2, 4, 6].map((ty) => (
            <React.Fragment key={ty}>
              <Px l={u * 0.4} t={ty * u + u * 0.2} w={u * 7.2} h={u * 1.6} c={(ty / 2 + y) % 2 ? "#c4b39a" : "#ab9a82"} />
              <Px l={u * 0.4} t={ty * u + u * 0.2} w={u * 7.2} h={u * 0.3} c="#dacbb4" />
            </React.Fragment>
          ))}
          <Px l={0} t={0} w={u * 0.4} h={s} c="#8f7f68" />
          <Px l={u * 7.6} t={0} w={u * 0.4} h={s} c="#6e604c" />
        </>
      );
      break;
    case "V":
''', 1)
open(p, "w").write(s)
print("ok")
