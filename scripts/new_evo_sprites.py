import json, re

S = {
 "mortadellone": ["................","..kkk......kkk..",".kPpPk....kPpPk.",".kppPkkkkkkPppk.","kppppppppppppppk","kpwppgppppwppgpk","kppwnppppppwnppk","kpppppkkkkpppppk","kpgppkPPPPkppgpk","kppppkPkkPkppppk","kpwpppkkkkpppwpk","kppprrrrrrrrpppk",".kppprryyrrpppk.","..kkppppppppkk..",".kPPk......kPPk.",".kkkk......kkkk."],
 "squacquerona": ["...z...zz...z...","...zzzzzzzzzz...","..kkkkkkkkkkkk..",".kwwwwwwwwwwwwk.","kwwwwwwwwwwwwwwk","kwwwnwwwwwwnwwwk","kwwwnwwwwwwnwwwk","kwwpwwwwwwwwpwwk","kwwwwwkkkkwwwwwk","kewwwwwrrwwwwwek","keewwwwwwwwwweek","keeewwwwwwwweeek",".keeeeeeeeeeeek.","kooooooooooooook",".kooeooeooeoook.","..kkkkkkkkkkkk.."],
 "passatellaccio": ["...c......c.....","....c....c......","..........kkkk..",".........kownok.",".........koooook","..kkkkk...kook..",".kooooook.kook..","kookkkkook.kook.","kok....kook.kok.","kook....koooook.",".kooookkooookk..","..kkkkkkkkkkk...","kcccccccccccccck",".kssssssssssssk.","..kssssssssssk..","....kkkkkkkk...."],
 "piadinazza": ["................","....kkkkkkkk....","...keeoeeoeek...","..keoeeeeeeoek..",".kggrggrrggrggk.",".keeeeoeeeoeeek.","keoeeeeeeeeeoeek","kkkkkkkkkkkkkkkk","kgwnk.kgggk.kggk","kggkk.kgggk.kggk",".kk...kgggk..kk.","......kgggk.....","......kkkkk.....","................","................","................"],
 "zanzarazza": ["......z..z......","......zzzz......","ll...kkkkkk...ll","lll.kvrvvrvk.lll",".lllkvvvvvvklll.","..llkkvkkvkkll..","...lkvvnnvvkl...","....kvSvvSvk....","...kvvSvvSvvk...","...kvSvvvvSvk...","....kvvSSvvk....","....kvSvvSvk....",".....kvvvvk.....","...k..kvvk..k...","..k...k..k...k..",".k....k..k....k."],
 "turbonzo": ["................",".kkkkkk.........",".kSSSSk.........","...kk...kkkk....","...kk.kkrrrrkk..","..kkkkrrrrwwrrk.",".krrrrrrrrwnrrrk","krryyrrrrrrrrrrk","krrrrrrrrrrrrrrk","kyyyyyyyyyyyyyyk","ookkSSkkkkkkSSkk","o.kSnnSk..kSnnSk","...kSSk....kSSk.","....kk......kk..","................","................"],
 "vaporiera": [".......oo.......","......oyyo......",".......kk.......","c....kwwwwk....c","cc..kwnwwnwk..cc","ccc.kwwyywwk.ccc","cwcckwwwwwwkccwc",".cwwckwwwwkcwwc.","..cwwkwwwwkwwc..","...ckwwwwwwkc...","....kcwwwwck....",".....kcwwck.....","....ko.kk.ok....","...c..c..c..c...","....c..cc..c....","................"],
 "tandemone": ["................","..kkk.....kkk...",".kgwgk...kgwgk..",".kgnggk..kgnggk.","..kgk.....kgk...","..kgkkkkkkkgk...","...kggggggggk...","..kkkkgkkkgkkk..",".kSSk.k..k.kSSk.","kS..Sk.kk.kS..Sk","kS.zSkkkkkkSz.Sk","kS..Sk....kS..Sk",".kSSk......kSSk.","..kk........kk..","................","................"],
 "crescentone": ["................","....kkkkkkkk....","..kkeeoeeeoekk..",".keeeeeeeeeeeek.","keeoeeeeeeeeoeek","keewnkeeeewnkeek","keeeeeeeeeeeeeek","keeeerrrrrreeeek","kppppppppppppppk","kpgppwppppgppwpk","krrrdrrrrdrrrrdk","keeeeeeeeeeeeeek","keoeeeeoeeeeoeek",".keeeeeeeeeeeek.","..kkkkkkkkkkkk..","................"],
 "gabbianazzo": ["................",".....kkkkk......","....kwwwwwk.....","...kwnnnnwwk....","...kwwwwwwwyyyk.","...kwwwwwwkkkk..","..kSwwwwwwk.....",".kSSwwwwwwwk....","kSSSwwwwwwwwk...","kSSSSwwwwwwwwk..",".kSSSwwwwwwwwk..","..kSSwwwwwwwk...","...kkwwwwwkk....",".....kykyk......","....kyk.kyk.....","...kkk..kkk....."],
 "lambruscone": ["......kkkk......","......kbbk......","......kmmk......",".c....kmmk....c.","....kkmmmmkk....","...kmmmmmmmmk...","..kmmwnmmwnmmk..",".kmmmmmmmmmmmmk.",".kmmmPkkkkPmmmk.","kyyyyyyyyyyyyyyk","kybybybybybybybk","kyyyyyyyyyyyyyyk","kbybybybybybybyk",".kyyyyyyyyyyyyk.","..kkkkkkkkkkkk..","c..c........c..c"],
 "zuppissima": [".......rr.......","......krrk......","...kkkkwwkkkk...","..kwwwwwwwwwwk..",".kwwwnwwwwnwwwk.",".kwwwwwrrwwwwwk.",".kppppppppppppk.",".kyyyyyyyyyyyyk.",".kPPPPPPPPPPPPk.","..kppppppppppk..","..kyyyyyyyyyyk..","..kPPPPPPPPPPk..","...kppppppppk...","....kkkkkkkk....","......kssk......","....kssssssk...."],
}
bad = [(n, i, len(r)) for n, g in S.items() for i, r in enumerate(g) if len(r) != 16] + [(n, "rows", len(g)) for n, g in S.items() if len(g) != 16]
if bad:
    print("BAD", bad); raise SystemExit(1)

p = "/app/frontend/src/game/sprites.ts"
src = open(p).read()
src = src[: src.index("// Evolved forms that reuse")].rstrip() + "\n"
block = "  // --- Iteration 7: unique evolved forms (16x16)\n" + "".join(f"  {n}: {json.dumps(g)},\n" for n, g in S.items())
src = src.replace("  vasetto: [", block + "  vasetto: [", 1)
src = src.replace('  A: "#c0392b", C: "#4caf50",', '  A: "#c0392b", C: "#4caf50",\n  z: "#ffb300", v: "#7e57c2", l: "#b3e5fc", d: "#7f1d1d",', 1)
open(p, "w").write(src)
print("ok")
