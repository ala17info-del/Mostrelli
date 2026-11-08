# Builds all Game Boy data (C sources) from the Expo game's own original content.
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from font import F, ACCENTS, tile as font_tile

D = json.load(open("/app/gb/data.json"))
OUT = "/app/gb/src"
os.makedirs(OUT, exist_ok=True)

def rgb(h):
    h = h.lstrip("#"); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r, g, b
def c555(h):
    r, g, b = rgb(h); return (r >> 3) | ((g >> 3) << 5) | ((b >> 3) << 10)
def lum(h):
    r, g, b = rgb(h); return 0.3 * r + 0.59 * g + 0.11 * b

def gbtext(s):
    out = ""
    for ch in s:
        ch = ACCENTS.get(ch, ch)
        for c in ch:
            out += c if (c in F) else "?"
    return out
def cstr(s):
    return '"' + gbtext(s).replace("\\", "").replace('"', '\\"') + '"'

def tiles_from_grid(g):  # g: list of rows with values 0..3, w,h multiples of 8 -> list of tiles (bytes) row-major by tile
    h, w = len(g), len(g[0]); out = []
    for ty in range(h // 8):
        for tx in range(w // 8):
            t = []
            for r in range(8):
                lo = hi = 0
                for c in range(8):
                    v = g[ty * 8 + r][tx * 8 + c]
                    lo |= (v & 1) << (7 - c); hi |= ((v >> 1) & 1) << (7 - c)
                t += [lo, hi]
            out.append(t)
    return out

# ---------------- metatiles (16x16), procedurally drawn, original art
def hsh(x, y, s=0): return ((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) & 0xFFFF
def blank(v): return [[v] * 16 for _ in range(16)]
def dots(g, v, n, seed):
    for i in range(n):
        h = hsh(i, seed, 7); g[(h >> 4) % 16][h % 16] = v
    return g
def grass():
    g = blank(1); dots(g, 2, 7, 1); dots(g, 0, 4, 2)
    for x, y in [(3, 4), (11, 10), (7, 13)]:
        g[y][x] = 2; g[y - 1][x - 1] = 2; g[y - 1][x + 1] = 2
    return g
def tallgrass():
    g = blank(1)
    for bx in (0, 8):
        for by in (0, 8):
            for i in range(7):
                for x, y in [(bx + 1 + i, by + 7), (bx + 2, by + 2 + (i % 5)), (bx + 5, by + 1 + (i % 6))]:
                    pass
            for x in range(8):
                g[by + 7][bx + x] = 3 if x % 2 else 2
            for k, (x0, top) in enumerate([(1, 2), (3, 0), (5, 1)]):
                for y in range(top, 7):
                    g[by + y][bx + x0] = 2
                    if y == top: g[by + y][bx + x0] = 0
                    if y > top + 2: g[by + y][bx + x0 + 1] = 3
    return g
def tree():
    g = grass()
    for y in range(16):
        for x in range(16):
            d = (x - 7.5) ** 2 + (y - 6.5) ** 2
            if d < 44: g[y][x] = 2
            elif d < 56: g[y][x] = 3
    for y, x in [(3, 4), (3, 5), (4, 4), (2, 6), (4, 6), (5, 9), (8, 3), (6, 11)]: g[y][x] = 0 if (y < 5) else 1
    for y in range(12, 16):
        for x in range(6, 10): g[y][x] = 3
    return g
def flowers():
    g = grass()
    for (x, y) in [(3, 3), (11, 4), (6, 9), (13, 12), (2, 13)]:
        for dx, dy in [(0, -1), (-1, 0), (1, 0), (0, 1)]: g[y + dy][x + dx] = 0
        g[y][x] = 3
    return g
def sign():
    g = grass()
    for y in range(3, 10):
        for x in range(2, 14): g[y][x] = 3 if y in (3, 9) or x in (2, 13) else 0
    for y in (5, 7):
        for x in range(4, 12): g[y][x] = 2
    for y in range(10, 16):
        for x in (7, 8): g[y][x] = 3
    return g
def path():
    g = blank(1); dots(g, 2, 10, 3); dots(g, 0, 8, 4); return g
def sand():
    g = blank(0); dots(g, 1, 10, 5); dots(g, 2, 3, 6); return g
def beachgrass():
    g = sand()
    for x0, top in [(2, 5), (5, 2), (8, 4), (11, 1), (13, 5)]:
        for y in range(top, 15): g[y][x0] = 2 if y < 12 else 3
        g[top][x0] = 1
    return g
def cobble():
    g = blank(1)
    for y in range(16):
        for x in range(16):
            off = 4 if (y // 4) % 2 else 0
            if y % 4 == 3 or (x + off) % 8 == 7: g[y][x] = 2
            elif y % 4 == 0 and (x + off) % 8 < 3: g[y][x] = 0
    return g
def portico():
    g = blank(1)
    for y in range(16):
        for x in range(16):
            if (x // 4 + y // 4) % 2: g[y][x] = 2
    for y in (0, 15):
        for x in range(16): g[y][x] = 3
    return g
def roof():
    g = blank(2)
    for y in range(16):
        for x in range(16):
            if y % 4 == 3: g[y][x] = 3
            elif y % 4 == 0 and (x + (y // 4) * 2) % 6 < 2: g[y][x] = 1
    return g
def brick():
    g = blank(2)
    for y in range(16):
        for x in range(16):
            off = 4 if (y // 4) % 2 else 0
            if y % 4 == 3 or (x + off) % 8 == 0: g[y][x] = 1
    return g
def umbrella():
    g = blank(0); dots(g, 1, 6, 9)
    for y in range(1, 8):
        for x in range(16):
            if abs(x - 7.5) <= y * 1.1 + 0.5:
                g[y][x] = 2 if (int(x) // 3) % 2 == 0 else 1
    for x in range(16): g[8][x] = 3 if abs(x - 7.5) < 8 else 0
    for y in range(8, 16): g[y][7] = 3; g[y][8] = 3
    return g
def water(deep):
    g = blank(2 if deep else 1)
    for y in (3, 10):
        for x in range(16):
            if (x + y) % 8 < 3: g[y][x] = 1 if deep else 0
    if deep: g[6][12] = 0
    return g
def wallwin():
    g = blank(1)
    for y in range(3, 11):
        for x in range(4, 12): g[y][x] = 3 if y in (3, 10) or x in (4, 11) or x == 8 else 2
    g[4][5] = 0; g[5][5] = 0; g[4][6] = 0
    for x in range(16): g[15][x] = 2
    return g
def door():
    g = blank(1)
    for y in range(3, 16):
        for x in range(4, 12): g[y][x] = 3 if y == 3 or x in (4, 11) else 2
    g[10][9] = 0
    return g
def asphalt():
    g = blank(2); dots(g, 3, 6, 11)
    for x in list(range(1, 6)) + list(range(10, 15)): g[7][x] = 0; g[8][x] = 0
    return g

PALS = [  # light -> dark
    ["#e8f5a0", "#7cb342", "#33691e", "#1b2e12"],  # 0 green
    ["#f3e3b5", "#d7b98a", "#a1887f", "#4e342e"],  # 1 ground
    ["#c8ecfa", "#4fc3f7", "#0277bd", "#01385a"],  # 2 water
    ["#f6e3c0", "#e57373", "#a83a2a", "#3e1008"],  # 3 red
    ["#fff8e1", "#ecdcb8", "#8a8a8a", "#212121"],  # 4 building
    ["#ffffff", "#4caf50", "#707070", "#000000"],  # 5 UI
    ["#ffffff", "#aaaaaa", "#555555", "#000000"],  # 6 mon A (runtime)
    ["#ffffff", "#aaaaaa", "#555555", "#000000"],  # 7 mon B (runtime)
]
META = [  # char, drawer, palette
    (",", grass, 0), ("G", tallgrass, 0), ("T", tree, 0), ("F", flowers, 0), ("S", sign, 0),
    (".", path, 1), ("Y", sand, 1), ("Q", beachgrass, 1), ("C", cobble, 1),
    ("P", portico, 3), ("R", roof, 3), ("B", brick, 3), ("U", umbrella, 3),
    ("W", lambda: water(False), 2), ("O", lambda: water(True), 2),
    ("H", wallwin, 4), ("D", door, 4), ("A", asphalt, 4),
]
MID = {c: i for i, (c, _, _) in enumerate(META)}
OBJ_BASE, META_BASE, UI_BASE, FONT_BASE = 0, 12, 84, 104
meta_tiles = []
for c, fn, p in META:
    t = tiles_from_grid(fn())  # TL, TR, BL, BR
    meta_tiles += t

# ---------------- UI tiles (20): frame 0-7, hp fill 8-16, caps 17-18, solid 19
def ui_tiles():
    T = []
    def g8(rows): return tiles_from_grid([[int(ch) for ch in r] for r in rows])[0]
    T.append(g8(["00000000", "00333333", "03322222", "03200000", "03200000", "03200000", "03200000", "03200000"]))
    T.append(g8(["00000000", "33333333", "22222222", "00000000", "00000000", "00000000", "00000000", "00000000"]))
    T.append(g8(["00000000", "33333300", "22222330", "00000230", "00000230", "00000230", "00000230", "00000230"]))
    T.append(g8(["03200000"] * 8))
    T.append(g8(["00000230"] * 8))
    T.append(g8(["03200000", "03200000", "03200000", "03200000", "03200000", "03322222", "00333333", "00000000"]))
    T.append(g8(["00000000", "00000000", "00000000", "00000000", "00000000", "22222222", "33333333", "00000000"]))
    T.append(g8(["00000230", "00000230", "00000230", "00000230", "00000230", "22222330", "33333300", "00000000"]))
    for n in range(9):
        row = "".join("1" if i < n else "0" for i in range(8))
        T.append(g8(["33333333", row, row, row, row, "33333333", "00000000", "00000000"]))
    T.append(g8(["00000003", "00000003", "00000003", "00000003", "00000003", "00000003", "00000000", "00000000"]))
    T.append(g8(["30000000", "30000000", "30000000", "30000000", "30000000", "30000000", "00000000", "00000000"]))
    T.append(g8(["33333333"] * 8))
    return T
ui = ui_tiles()
font = [font_tile(chr(c)) for c in range(32, 127)]

# ---------------- people (OBJ) 3 frames, 8x16 order TL, BL, TR, BR
def person(name):
    src = D["SPRITES"][name]; g = blank(0)
    cmap = {"k": 3, "h": 1, "S": 3, "B": 3, "A": 2, "C": 2, "n": 3, "w": 1}
    for y, row in enumerate(src):
        for x, ch in enumerate(row):
            if ch != ".": g[y + 4][x + 2] = cmap.get(ch, 2)
    t = tiles_from_grid(g)
    return [t[0], t[2], t[1], t[3]]
obj = person("person") + person("person_walk") + person("person_back")
OBJPALS = ["#c0392b", "#ffffff", "#7b4a2a", "#2e7d32", "#1565c0", "#616161", "#fbc02d", "#8e24aa"]

# ---------------- monsters: 16x16 index grid + 4-colour palette
def mon_pack(name):
    src = D["SPRITES"][name]; n = len(src); off = (16 - n) // 2
    cols = {}
    for row in src:
        for ch in row:
            if ch not in ".k": cols[ch] = cols.get(ch, 0) + 1
    rank = sorted(cols, key=lambda c: -cols[c])
    picks = [D["PAL"][c] for c in rank[:2]] or ["#aaaaaa"]
    if len(picks) == 1: picks.append(picks[0])
    picks.sort(key=lambda h: -lum(h))
    pal = ["#ffffff", picks[0], picks[1], "#1a1a1a"]
    def near(h):
        best, bi = 1e9, 1
        for i in (1, 2, 3):
            a, b = rgb(h), rgb(pal[i]); d = sum((x - y) ** 2 for x, y in zip(a, b))
            if d < best: best, bi = d, i
        return bi
    g = blank(0)
    for y, row in enumerate(src):
        for x, ch in enumerate(row):
            if ch == ".": continue
            g[y + off][x + off] = 3 if ch == "k" else (1 if D["PAL"][ch] == pal[1] else 2 if D["PAL"][ch] == pal[2] else near(D["PAL"][ch]))
    data = []
    for y in range(16):
        for x in range(0, 16, 4):
            data.append(g[y][x] << 6 | g[y][x + 1] << 4 | g[y][x + 2] << 2 | g[y][x + 3])
    return data, [c555(c) for c in pal]

SP = D["SPECIES"]; SID = {s["id"]: i for i, s in enumerate(SP)}
MV = list(D["MOVES"].keys()); MVID = {m: i for i, m in enumerate(MV)}
TY = list(D["TYPES"].keys()); TYID = {t: i for i, t in enumerate(TY)}
FXK = ["", "atkDown", "defDown", "spdDown", "confuse", "burn", "selfAtkUp", "selfDefUp", "selfSpdUp"]
IT = list(D["ITEMS"].keys())
KINDS = {"catch": 0, "heal": 1, "cureConf": 2, "cureBurn": 3, "revive": 4}

# ---------------- text blob (bank 2)
texts = []
def T(s):
    texts.append(gbtext(s)); return len(texts) - 1

# ---------------- music: reuse the original place tunes (note lists) from the audio scripts
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
def midi(n):
    m = re.match(r"([A-G]#?)(\d)", n); return 12 * (int(m.group(2)) + 1) + NOTE[m.group(1)]
def gbfreq(mid):
    f = 440 * 2 ** ((mid - 69) / 12); v = round(2048 - 131072 / f); return max(0, min(2047, v))
tunes = {}
def capture(path, extra_mel=None):
    src = open(path).read()
    src = src.replace("def render(", "def _r0(").replace("def save(", "def _s0(")
    src = re.sub(r"^spec = .*$|^g = importlib.*$|^render, save = .*$", "", src, flags=re.M)
    def render(tracks, bpm, beats): return (tracks, bpm)
    def save(name, x): tunes[name.replace(".wav", "")] = x
    gl = {"render": render, "save": save, "__name__": "x"}
    exec(compile(src, path, "exec"), gl)
    gl["render"], gl["save"] = render, save
capture("/app/scripts/gen_audio.py")
capture("/app/scripts/gen_audio2.py")
def track(seq, bpm, lo=False):
    out = []
    fpb = 3600 / bpm
    for n, d in seq:
        fr = max(1, round(d * fpb))
        if n in ("-", "x", "r"): out.append((0, fr)); continue
        m = midi(n)
        if lo: m += 12
        out.append((gbfreq(m), fr))
    return out
MUSIC = ["town", "bologna", "osteria", "terme", "imola", "ferrara", "maggiore", "altedo", "beach", "battle"]
music_c = []
for name in MUSIC:
    tracks, bpm = tunes[name]
    mel = next((t[1] for t in tracks if t[0].startswith("sq")), tracks[0][1])
    bass = next((t[1] for t in tracks if t[0] == "tri"), None)
    if name == "ferrara":
        mel = next(t[1] for t in tracks if t[0] == "tri"); bass = next(t[1] for t in tracks if t[0].startswith("sq"))
    if name == "imola":  # riff is the first square track, melody the second
        sq = [t[1] for t in tracks if t[0].startswith("sq")]; mel = sq[1]; bass = sq[0]
    music_c.append((name, track(mel, bpm), track(bass, bpm, True) if bass else [(0, 255)]))

# ---------------- maps
maps = list(D["MAPS"].keys())
MAPID = {m: i for i, m in enumerate(maps)}
trainer_ids = []
badges = []
npcs_c, exits_c, signs_c, wild_c, team_c, maps_c = [], [], [], [], [], []
def npc_pal(n):
    if n["kind"] == "heal": return 1
    if n["kind"] == "shop": return 2
    best, bi = 1e9, 3
    for i in range(3, 8):
        a, b = rgb(n["look"]["C"]), rgb(OBJPALS[i]); d = sum((x - y) ** 2 for x, y in zip(a, b))
        if d < best: best, bi = d, i
    return bi
KIND = {"talk": 0, "heal": 1, "shop": 2, "trainer": 3, "boss": 4}
for mk in maps:
    m = D["MAPS"][mk]
    rec = dict(name=m["name"], ex0=len(exits_c), npc0=len(npcs_c), sign0=len(signs_c), wild0=len(wild_c))
    for e in m["exits"]: exits_c.append((e["x"], e["y"], MAPID[e["to"]], e["tx"], e["ty"]))
    for n in m["npcs"]:
        l0 = len(texts)
        for l in n["lines"]: T(l)
        a0 = len(texts)
        for l in n.get("after", []): T(l)
        t0 = len(team_c)
        for s, lv in n.get("team", []): team_c.append((SID[s], lv))
        tid = 255
        if n["kind"] in ("trainer", "boss"): tid = len(trainer_ids); trainer_ids.append(n["id"])
        b = 255
        if n.get("badge"): b = len(badges); badges.append(n["badge"])
        npcs_c.append(dict(x=n["x"], y=n["y"], kind=KIND[n["kind"]], pal=npc_pal(n), name=n["name"], l0=l0, nl=len(n["lines"]), a0=a0, na=len(n.get("after", [])),
                           t0=t0, nt=len(n.get("team", [])), reward=n.get("reward", 0), badge=b, tid=tid))
    for k, v in m["signs"].items():
        x, y = map(int, k.split(",")); signs_c.append((x, y, T(v)))
    for s, a, b, w in m["wild"]: wild_c.append((SID[s], a, b, w))
    rec.update(nex=len(m["exits"]), nnpc=len(m["npcs"]), nsign=len(m["signs"]), nwild=len(m["wild"]), hx=m["heal"]["x"], hy=m["heal"]["y"],
               music=MUSIC.index({"csp": "terme", "riviera": "beach"}.get(mk, m.get("music") or "town")) if ({"csp": "terme", "riviera": "beach"}.get(mk, m.get("music") or "town")) in MUSIC else 0,
               beach=1 if mk == "riviera" else 0, tiles=[MID[c] for r in m["tiles"] for c in r])
    maps_c.append(rec)
desc0 = len(texts)
for s in SP: T(s["desc"])
intro0 = len(texts)
for l in D["INTRO"]: T(l)

# ---------------- write C
def arr(vals, per=16):
    vals = list(vals); return ",\n".join(", ".join(str(v) for v in vals[i:i + per]) for i in range(0, len(vals), per))
H = [f"#define N_SPECIES {len(SP)}", f"#define N_MOVES {len(MV)}", f"#define N_MAPS {len(maps)}", f"#define N_TRAINERS {len(trainer_ids)}",
     f"#define N_BADGES {len(badges)}", f"#define N_ITEMS {len(IT)}", f"#define N_TEXT {len(texts)}", f"#define DESC0 {desc0}", f"#define INTRO0 {intro0}", f"#define N_INTRO {len(D['INTRO'])}",
     f"#define N_MUSIC {len(MUSIC)}", "#define MUS_BATTLE 9",
     f"#define OBJ_BASE {OBJ_BASE}", f"#define META_BASE {META_BASE}", f"#define UI_BASE {UI_BASE}", f"#define FONT_BASE {FONT_BASE}", f"#define N_META {len(META)}",
     f"#define MT_TALL {MID['G']}", f"#define MT_BEACHGRASS {MID['Q']}",
     "#define STARTER0 " + str(SID[D["STARTERS"][0]]), "#define STARTER1 " + str(SID[D["STARTERS"][1]]), "#define STARTER2 " + str(SID[D["STARTERS"][2]]),
     "#define IT_VASETTO 0"]
assert IT[0] == "vasetto"
H += ["typedef struct { uint8_t type, hp, atk, def, spd, catchp, evo_to, evo_lv, ml0, nml; } SpeciesD;",
      "typedef struct { uint8_t type, power, acc, fxk, fxp; } MoveD;",
      "typedef struct { uint8_t price, kind, amount; } ItemD;",
      "typedef struct { uint8_t x, y, to, tx, ty; } ExitD;",
      "typedef struct { uint8_t x, y, kind, pal; const char *name; uint16_t l0; uint8_t nl; uint16_t a0; uint8_t na, t0, nt; uint16_t reward; uint8_t badge, tid; } NpcD;",
      "typedef struct { uint8_t x, y; uint16_t txt; } SignD;",
      "typedef struct { uint8_t s, lo, hi, w; } WildD;",
      "typedef struct { const char *name; uint8_t ex0, nex, npc0, nnpc, sign0, nsign, wild0, nwild, hx, hy, music, beach; } MapD;",
      "extern const SpeciesD SPECIES[]; extern const char * const SP_NAME[]; extern const uint8_t LEARN[][2]; extern const uint16_t MONPAL[][4];",
      "extern const MoveD MOVES[]; extern const char * const MV_NAME[]; extern const char * const TYPE_NAME[]; extern const uint8_t EFF[6][6];",
      "extern const ItemD ITEMS[]; extern const char * const IT_NAME[]; extern const ExitD EXITS[]; extern const NpcD NPCS[]; extern const SignD SIGNS[];",
      "extern const WildD WILD[]; extern const uint8_t TEAM[][2]; extern const MapD MAPS[]; extern const uint8_t MAPTILES[][256]; extern const char * const BADGE[];",
      "extern const uint8_t META_PAL[]; extern const uint8_t META_FLAGS[]; extern const uint8_t TILES_META[]; extern const uint8_t TILES_UI[]; extern const uint8_t TILES_FONT[];",
      "extern const uint8_t TILES_OBJ[]; extern const uint16_t BG_PALS[]; extern const uint16_t OBJ_PALS[];",
      "extern const uint8_t MONGFX[][64]; extern const uint16_t TXTOFF[]; extern const char TXT[];",
      "extern const uint16_t * const MUS_A[]; extern const uint16_t * const MUS_B[];",
      "BANKREF_EXTERN(MONGFX) BANKREF_EXTERN(TXT) BANKREF_EXTERN(BIGDATA) extern const uint8_t BIGDATA;"]
open(f"{OUT}/gen.h", "w").write("#ifndef GEN_H\n#define GEN_H\n#include <gb/gb.h>\n#include <stdint.h>\n" + "\n".join(H) + "\n#endif\n")

L = ['#include "gen.h"']
learn = []
sp_rows = []
for s in SP:
    ml0 = len(learn)
    for mv, lv in s["moves"]: learn.append((MVID[mv], lv))
    evo = s.get("evo")
    sp_rows.append(f"{{{TYID[s['type']]},{s['hp']},{s['atk']},{s['def']},{s['spd']},{round(s['catchRate'] * 100)},{SID[evo['to']] if evo else 255},{evo['lv'] if evo else 0},{ml0},{len(s['moves'])}}}")
L.append("const SpeciesD SPECIES[] = {" + ",".join(sp_rows) + "};")
L.append("const char * const SP_NAME[] = {" + ",".join(cstr(s["name"]) for s in SP) + "};")
L.append("const uint8_t LEARN[][2] = {" + ",".join(f"{{{a},{b}}}" for a, b in learn) + "};")
mons = [mon_pack(s["id"]) for s in SP]
L.append("const uint16_t MONPAL[][4] = {" + ",".join("{" + ",".join(str(c) for c in p) + "}" for _, p in mons) + "};")
mrows = []
for k in MV:
    m = D["MOVES"][k]; fx = m.get("fx")
    mrows.append(f"{{{TYID[m['type']]},{m['power']},{m['acc']},{FXK.index(fx['k']) if fx else 0},{fx['p'] if fx else 0}}}")
L.append("const MoveD MOVES[] = {" + ",".join(mrows) + "};")
L.append("const char * const MV_NAME[] = {" + ",".join(cstr(D["MOVES"][k]["name"]) for k in MV) + "};")
L.append("const char * const TYPE_NAME[] = {" + ",".join(cstr(D["TYPES"][t]["name"]) for t in TY) + "};")
eff = [[{0.5: 1, 2: 4}.get(D["EFF"].get(a, {}).get(b, 1), 2) for b in TY] for a in TY]
L.append("const uint8_t EFF[6][6] = {" + ",".join("{" + ",".join(map(str, r)) + "}" for r in eff) + "};")
L.append("const ItemD ITEMS[] = {" + ",".join(f"{{{D['ITEMS'][i]['price']},{KINDS[D['ITEMS'][i]['kind']]},{round(D['ITEMS'][i]['amount'] * (100 if D['ITEMS'][i]['kind'] == 'revive' else 1))}}}" for i in IT) + "};")
L.append("const char * const IT_NAME[] = {" + ",".join(cstr(D["ITEMS"][i]["name"]) for i in IT) + "};")
L.append("const ExitD EXITS[] = {" + ",".join("{%d,%d,%d,%d,%d}" % e for e in exits_c) + "};")
L.append("const NpcD NPCS[] = {" + ",".join(f"{{{n['x']},{n['y']},{n['kind']},{n['pal']},{cstr(n['name'])},{n['l0']},{n['nl']},{n['a0']},{n['na']},{n['t0']},{n['nt']},{n['reward']},{n['badge']},{n['tid']}}}" for n in npcs_c) + "};")
L.append("const SignD SIGNS[] = {" + (",".join("{%d,%d,%d}" % s for s in signs_c) or "{0,0,0}") + "};")
L.append("const WildD WILD[] = {" + ",".join("{%d,%d,%d,%d}" % w for w in wild_c) + "};")
L.append("const uint8_t TEAM[][2] = {" + ",".join("{%d,%d}" % t for t in team_c) + "};")
L.append("const MapD MAPS[] = {" + ",".join(f"{{{cstr(m['name'])},{m['ex0']},{m['nex']},{m['npc0']},{m['nnpc']},{m['sign0']},{m['nsign']},{m['wild0']},{m['nwild']},{m['hx']},{m['hy']},{m['music']},{m['beach']}}}" for m in maps_c) + "};")
L.append("const uint8_t MAPTILES[][256] = {" + ",".join("{" + arr(m["tiles"], 64) + "}" for m in maps_c) + "};")
L.append("const char * const BADGE[] = {" + ",".join(cstr(b) for b in badges) + "};")
blocking = set(D["BLOCKING"]); enc = set(D["ENC"])
L.append("const uint8_t META_PAL[] = {" + ",".join(str(p) for _, _, p in META) + "};")
L.append("const uint8_t META_FLAGS[] = {" + ",".join(str((1 if c in blocking else 0) | (2 if c in enc else 0)) for c, _, _ in META) + "};")
L.append("const uint8_t TILES_META[] = {" + arr(b for t in meta_tiles for b in t) + "};")
L.append("const uint8_t TILES_UI[] = {" + arr(b for t in ui for b in t) + "};")
L.append("const uint8_t TILES_FONT[] = {" + arr(b for t in font for b in t) + "};")
L.append("const uint8_t TILES_OBJ[] = {" + arr(b for t in obj for b in t) + "};")
L.append("const uint16_t BG_PALS[] = {" + ",".join(str(c555(c)) for p in PALS for c in p) + "};")
L.append("const uint16_t OBJ_PALS[] = {" + ",".join(",".join(str(c555(c)) for c in ["#000000", "#ffcc80", oc, "#1a1a1a"]) for oc in OBJPALS) + "};")
for i, (name, a, b) in enumerate(music_c):
    L.append(f"static const uint16_t MA{i}[] = {{" + ",".join(f"{f},{d}" for f, d in a) + ",0xFFFF};")
    L.append(f"static const uint16_t MB{i}[] = {{" + ",".join(f"{f},{d}" for f, d in b) + ",0xFFFF};")
L.append("const uint16_t * const MUS_A[] = {" + ",".join(f"MA{i}" for i in range(len(music_c))) + "};")
L.append("const uint16_t * const MUS_B[] = {" + ",".join(f"MB{i}" for i in range(len(music_c))) + "};")
BIG = ("const uint8_t MAPTILES", "const uint8_t TILES_", "static const uint16_t MA", "static const uint16_t MB", "const uint16_t * const MUS_")
L0 = [l for l in L if not l.startswith(BIG)]
L5 = ['#pragma bank 5', '#include "gen.h"', 'BANKREF(BIGDATA)', 'const uint8_t BIGDATA = 0;'] + [l for l in L if l.startswith(BIG)]
open(f"{OUT}/gen0.c", "w").write("\n".join(L0) + "\n")
open(f"{OUT}/gen5.c", "w").write("\n".join(L5) + "\n")

open(f"{OUT}/gen1.c", "w").write('#pragma bank 1\n#include "gen.h"\nBANKREF(MONGFX)\nconst uint8_t MONGFX[][64] = {' + ",".join("{" + ",".join(map(str, d)) + "}" for d, _ in mons) + "};\n")
blob, offs = "", []
for t in texts:
    offs.append(len(blob)); blob += t + "\0"
assert len(blob) < 16000, len(blob)
esc = "".join("\\0" if c == "\0" else ("\\\"" if c == '"' else c) for c in blob)
open(f"{OUT}/gen2.c", "w").write('#pragma bank 2\n#include "gen.h"\nBANKREF(TXT)\nconst uint16_t TXTOFF[] = {' + ",".join(map(str, offs)) + '};\nconst char TXT[] = "' + esc.replace("\\0", '\\x00""') + '";\n')
print("species", len(SP), "moves", len(MV), "npcs", len(npcs_c), "trainers", len(trainer_ids), "badges", badges, "text bytes", len(blob), "music", [ (n, len(a), len(b)) for n, a, b in music_c])
