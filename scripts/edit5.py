def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

edit('/app/frontend/src/game/Battle.tsx', [
# snapshot conditions per step
('''type Step = { text: string; php: number; ehp: number; fx?: Fx };''', '''type CondSnap = Record<string, { atk: number; def: number; spd: number; conf: number; burn: boolean }>;
type Step = { text: string; php: number; ehp: number; fx?: Fx; conds?: CondSnap };'''),
('''  const snap = (list: Step[], text: string, a = act, e = ei) => list.push({ text, php: P.current[a].hp, ehp: E.current[e].hp });''', '''  const snap = (list: Step[], text: string, a = act, e = ei) =>
    list.push({ text, php: P.current[a].hp, ehp: E.current[e].hp, conds: JSON.parse(JSON.stringify(cond.current)) });'''),
('''  const chips = (m: Mon, tid: string) => {
    const c = cond.current[m.uid];''', '''  const chips = (m: Mon, tid: string, snapC?: CondSnap) => {
    const c = (snapC ?? cond.current)[m.uid];'''),
('''{chips(foe, "battle-enemy-status")}''', '''{chips(foe, "battle-enemy-status", showing?.conds)}'''),
('''{chips(me, "battle-player-status")}''', '''{chips(me, "battle-player-status", showing?.conds)}'''),
# side labels on effect messages
('''        const n = monName(who);''', '''        const n = `${monName(who)} ${E.current.includes(who) ? "nemico" : "(tuo)"}`;'''),
# recovered message even after self-hit
('''        snap(list, `Si colpisce da solo per la confusione!`, a);
        burnTick(list, att, a);''', '''        snap(list, `Si colpisce da solo per la confusione!`, a);
        if (ca.conf === 0) snap(list, `${monName(att)} si è ripreso dalla confusione!`, a);
        burnTick(list, att, a);'''),
# clear old damage popup on non-hit steps
('''    if (!curFx) return;
    const lungeAtt''', '''    if (!curFx) {
      setFxShow(null);
      return;
    }
    const lungeAtt'''),
# double faint handling
('''      const next = E.current.findIndex((m) => m.hp > 0);
      if (next >= 0) {
        if (!seen.current.includes(E.current[next].s)) seen.current.push(E.current[next].s);
        play(list, () => {
          setEi(next);
          play([{ text: `${setup.trainerName} manda in campo ${monName(E.current[next])}!`, php: meNow.hp, ehp: E.current[next].hp }], () => setPhase("menu"));
        });''', '''      const next = E.current.findIndex((m) => m.hp > 0);
      const meDown = meNow.hp <= 0;
      if (meDown) snap(list, `Anche ${monName(meNow)} è esausto!`, a, e);
      const anyAlive = P.current.some((m) => m.hp > 0);
      if (next >= 0 && meDown && !anyAlive) {
        snap(list, "Non hai più mostri in grado di lottare... Ti gira la testa e svieni.", a, e);
        play(list, () => finish("lose"));
        return;
      }
      if (next >= 0) {
        if (!seen.current.includes(E.current[next].s)) seen.current.push(E.current[next].s);
        play(list, () => {
          setEi(next);
          play([{ text: `${setup.trainerName} manda in campo ${monName(E.current[next])}!`, php: meNow.hp, ehp: E.current[next].hp }], () => setPhase(meDown ? "forceSwitch" : "menu"));
        });'''),
# flee uses speed stages
('''    if (stats(me).spd >= stats(foe).spd || Math.random() < 0.7) {''', '''    if (effSpd(me) >= effSpd(foe) || Math.random() < 0.7) {'''),
# bigger text
('''  chipTxt: { fontSize: 9, color: colors.onBrandPrimary },
  fxHint: { fontSize: 9, color: colors.muted, marginTop: 2 },''', '''  chipTxt: { fontSize: 11, color: colors.onBrandPrimary },
  fxHint: { fontSize: 11, color: colors.muted, marginTop: 2 },'''),
])
print("ok")
