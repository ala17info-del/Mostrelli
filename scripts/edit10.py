def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:80])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

F = '/app/frontend/src/game/'
edit(F + 'Battle.tsx', [
('''trainerName?: string; field?: "grass" | "beach" };''', '''trainerName?: string; field?: "grass" | "beach"; duel?: boolean };'''),
('''type Step = { text: string; php: number; ehp: number;''', '''type Step = { text: string; php: number; ehp: number; ps?: string;'''),
('''      for (const t of gainXp(meNow, xpReward(foeNow, setup.kind === "trainer"))) snap(list, t, a, e);''', '''      if (!setup.duel) {
        const oldS = meNow.s;
        let evolved = false;
        for (const t of gainXp(meNow, xpReward(foeNow, setup.kind === "trainer"))) {
          if (t.includes("è diventato")) evolved = true;
          snap(list, t, a, e);
          list[list.length - 1].ps = evolved ? meNow.s : oldS;
        }
      }'''),
('''<PixelSprite name={me.s} size={120} flip testID="battle-player-sprite" />''', '''<PixelSprite name={showing?.ps ?? me.s} size={120} flip testID="battle-player-sprite" />'''),
('''<PixelText style={styles.monName} numberOfLines={1}>{monName(me)}</PixelText>''', '''<PixelText style={styles.monName} numberOfLines={1}>{monName({ ...me, s: showing?.ps ?? me.s })}</PixelText>'''),
])
edit('/app/frontend/app/game.tsx', [
('''trainerName: `${duel.name} (sfida)`, field: "grass",''', '''trainerName: `${duel.name} (sfida)`, field: "grass", duel: true,'''),
])
edit('/app/frontend/app/index.tsx', [
('''Tortellini, nebbia e mostrelli selvatici tra Bologna, Osteria Grande, Castel San Pietro, Imola e Ferrara.''', '''Tortellini, nebbia e mostrelli selvatici tra Bologna, Castel Maggiore, Altedo, Ferrara, Osteria Grande, Castel San Pietro, Imola e la Riviera.'''),
])
edit('/app/backend/server.py', [
('''not isinstance(lv, int) or not 1 <= lv <= 50:''', '''not isinstance(lv, int) or isinstance(lv, bool) or not 1 <= lv <= 50:'''),
('''    if uid in d.get("reported_by", []):
        return {"ok": True, "counted": False}
    await db.duels.update_one({"_id": d["_id"]}, {"$inc": {"losses" if body.won else "wins": 1}, "$push": {"reported_by": uid}})''', '''    res = await db.duels.update_one({"_id": d["_id"], "reported_by": {"$ne": uid}}, {"$inc": {"losses" if body.won else "wins": 1}, "$push": {"reported_by": uid}})
    if res.modified_count == 0:
        return {"ok": True, "counted": False}'''),
])
edit(F + 'sprites.ts', [
('''{"S": "#37474f", "c": "#90a4ae", "n": "#b71c1c"}''', '''{"S": "#7e57c2", "c": "#e1f5fe", "n": "#ff1744", "k": "#311b92"}'''),
('''{"m": "#4a0e2e", "P": "#ad1457"}''', '''{"m": "#d81b60", "P": "#ff80ab", "k": "#560027"}'''),
('''{"w": "#fffde7", "e": "#fbc02d"}''', '''{"w": "#fff59d", "e": "#ff8f00", "n": "#1b5e20", "k": "#5d4037"}'''),
])
# evolved species in boss teams
edit(F + 'data.ts', [
('''team: [["nebbiolone", 19], ["zanzarone", 19], ["salamone", 21]]''', '''team: [["nebbiolone", 19], ["zanzarazza", 22], ["salamone", 21]]'''),
('''team: [["pistonzo", 16], ["biciclone", 17]]''', '''team: [["turbonzo", 18], ["biciclone", 17]]'''),
('''team: [["gabbianone", 22], ["medusella", 22], ["discotecco", 24]]''', '''team: [["gabbianazzo", 26], ["medusella", 22], ["discotecco", 24]]'''),
('''team: [["passatellone", 10], ["cinghialotto", 11]]''', '''team: [["passatellone", 10], ["cinghialotto", 11], ["crescentone", 12]]'''),
])
print("ok")
