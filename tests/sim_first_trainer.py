# Monte-Carlo sim of starter (Lv5, alone, no items) vs Studente Fuorisede (Squacquerone L4, Mortazzone L5), mirrors engine.ts
import random
SP = {"tortellotto": ("sugo", 45, 52, 43, 60, [("sberla", 1), ("ragu", 1)]),
      "fanghino": ("terme", 50, 45, 55, 45, [("sberla", 1), ("fango", 1)]),
      "grappolino": ("campi", 48, 49, 50, 50, [("sberla", 1), ("grappolo", 1)]),
      "squacquerone": ("chiacchiera", 60, 40, 45, 35, [("sberla", 1), ("fango", 4)]),
      "mortazzone": ("chiacchiera", 70, 50, 55, 30, [("sberla", 1)])}
MV = {"sberla": ("chiacchiera", 40, 100), "ragu": ("sugo", 45, 100), "fango": ("terme", 45, 100), "grappolo": ("campi", 45, 100)}
EFF = {"sugo": {"campi": 2, "terme": .5, "nebbia": .5}, "campi": {"terme": 2, "sugo": .5}, "terme": {"sugo": 2, "motore": 2, "campi": .5},
       "chiacchiera": {"motore": 2, "nebbia": .5}}
def st(s, lv):
    t, hp, a, d, sp, _ = SP[s]; f = lambda v: (v * 2 * lv) // 100 + 5
    return {"hp": (hp * 2 * lv) // 100 + lv + 10, "atk": f(a), "def": f(d), "spd": f(sp)}
def known(s, lv): return [m for m, l in SP[s][5] if l <= lv]
def dmg(a, al, d, dl, mv):
    t, p, acc = MV[mv]
    if random.random() * 100 > acc: return 0
    A, D = st(a, al), st(d, dl)
    eff = EFF.get(t, {}).get(SP[d][0], 1); stab = 1.5 if t == SP[a][0] else 1; crit = 1.5 if random.random() < 1 / 16 else 1
    base = ((2 * al) // 5 + 2) * p * A["atk"] // D["def"] // 50 + 2
    return max(1, int(base * stab * eff * crit * (0.85 + random.random() * .15)))
def best(a, al, d, dl):
    return max(known(a, al), key=lambda m: MV[m][1] * (1.5 if MV[m][0] == SP[a][0] else 1) * EFF.get(MV[m][0], {}).get(SP[d][0], 1))
def fight(starter):
    php = st(starter, 5)["hp"]
    for e, el in [("squacquerone", 4), ("mortazzone", 5)]:
        ehp = st(e, el)["hp"]
        while ehp > 0:
            mefirst = st(starter, 5)["spd"] >= st(e, el)["spd"]
            mv = best(starter, 5, e, el)
            if mefirst:
                ehp -= dmg(starter, 5, e, el, mv)
                if ehp > 0: php -= dmg(e, el, starter, 5, random.choice(known(e, el)))
            else:
                php -= dmg(e, el, starter, 5, random.choice(known(e, el)))
                if php > 0: ehp -= dmg(starter, 5, e, el, mv)
            if php <= 0: return False
    return True
for s in ["tortellotto", "fanghino", "grappolino"]:
    print(s, "win rate %.1f%%" % (100 * sum(fight(s) for _ in range(20000)) / 20000))
