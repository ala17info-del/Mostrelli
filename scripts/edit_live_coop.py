p = "/app/frontend/src/game/LiveBattle.tsx"
s = open(p).read()
rep = [
('import { FX_LABEL, ITEMS, ItemId, MOVES, SPECIES, TYPES } from "./data";', 'import { FX_LABEL, ITEMS, ItemId, MAPS, MOVES, Npc, SPECIES, TYPES } from "./data";'),
('import { knownMoves, Mon, monName, stats } from "./engine";', 'import { knownMoves, makeMon, Mon, monName, stats } from "./engine";'),
('  log: TurnEntry[]; my_action: boolean; their_action: boolean; winner: Side | "draw" | null;\n};',
 '''  log: TurnEntry[]; my_action: boolean; their_action: boolean; winner: Side | "draw" | null;
  mode: "pvp" | "coop" | "trade"; boss: string | null;
  offers: Partial<Record<Side, Mon>>; confirms: Partial<Record<Side, boolean>>; trade_done: boolean;
};
export const ROOM_BOSSES: Npc[] = Object.values(MAPS).flatMap((m) => m.npcs.filter((n) => n.kind === "boss"));
const bossTeam = (id: string | null) => {
  const n = ROOM_BOSSES.find((b) => b.id === id);
  // Two players at once: the opponent gets +3 levels to stay a real challenge.
  return { npc: n, team: (n?.team ?? []).map(([sp, lv], i) => ({ ...makeMon(sp, Math.min(50, lv + 3)), uid: `b${i}` })) };
};'''),
('  const side = live.side, foeSide = other(side);\n  const names = useMemo(() => ({ host: live.host.name, guest: live.guest?.name ?? "Sfidante" }), [live.host.name, live.guest?.name]);',
 '''  const coop = live.mode === "coop";
  const side = live.side, foeSide: Side = coop ? "boss" : other(side);
  const boss = useMemo(() => bossTeam(live.boss), [live.boss]);
  const names = useMemo(() => ({ host: live.host.name, guest: live.guest?.name ?? "Sfidante", boss: boss.npc?.name ?? "Capo" }), [live.host.name, live.guest?.name, boss]);'''),
('    const st = initDuel(live.host.party, live.guest!.party);', '    const st = initDuel(live.host.party, live.guest!.party, coop ? boss.team : undefined);'),
('  }, [live.log, live.host.party, live.guest, names]);', '  }, [live.log, live.host.party, live.guest, names, coop, boss]);'),
('  const lineNow = (text: string): DLine => ({ text, hp: { host: st.P.host[st.act.host].hp, guest: st.P.guest[st.act.guest].hp }, act: { ...st.act } });',
 '  const lineNow = (text: string): DLine => ({ text, hp: { host: st.P.host[st.act.host].hp, guest: st.P.guest[st.act.guest].hp, boss: st.P.boss[st.act.boss]?.hp ?? 0 }, act: { ...st.act } });'),
('      ? [lineNow(`Sfida in diretta contro ${names[foeSide]}!`),',
 '      ? [lineNow(coop ? `${names.host} e ${names.guest} sfidano insieme ${names.boss}!` : `Sfida in diretta contro ${names[foeSide]}!`),'),
('    if (st.winner && live.status === "active") api<Live>', '''    if (coop && st.winner === "host" && boss.npc) setSave((s) => ({ ...s, money: s.money + (boss.npc!.reward ?? 0), items: { ...s.items, caramella: (s.items.caramella ?? 0) + 1 } }));
    if (st.winner && live.status === "active") api<Live>'''),
('  }, [phase, winner, side, st.winner, live.status, live.code, setLive]);', '  }, [phase, winner, side, st.winner, live.status, live.code, setLive, coop, boss, setSave]);'),
('    setPhase(live.my_action ? "wait" : "menu");\n  };', '''    if (live.my_action) return setPhase("wait");
    // In coop a player with no Mostrelli left just passes while the friend keeps fighting.
    if (st.out[side]) return send({ kind: "pass" });
    setPhase("menu");
  };'''),
('  const resultText =\n    winner === "draw"', '''  const resultText = coop
    ? (winner === "host" ? `Vittoria di squadra contro ${names.boss}! Ricevete ${boss.npc?.reward ?? 0} € e una Caramella Rara.` : winner === "boss" ? `${names.boss} vi ha battuti. Riprovate insieme!` : `${names[other(side)]} ha lasciato la stanza.`)
    : winner === "draw"'''),
('''        <View style={styles.row}>
          <View style={styles.spriteWrap}>
            <View style={styles.ground} />
            <PixelSprite name={me.s}''', '''        {coop && (() => {
          const ally = other(side), am = st.P[ally][act[ally]];
          return (
            <View style={styles.ally} testID="live-ally-info">
              <PixelSprite name={am.s} size={28} />
              <PixelText style={styles.meta} numberOfLines={1}>Alleato {names[ally]}: {monName(am)} {st.out[ally] ? "· fuori" : `${showing ? showing.hp[ally] : am.hp}/${stats(am).hp} PV`}</PixelText>
            </View>
          );
        })()}
        <View style={styles.row}>
          <View style={styles.spriteWrap}>
            <View style={styles.ground} />
            <PixelSprite name={me.s}'''),
("  root: { flex: 1, backgroundColor: colors.surface },", '  root: { flex: 1, backgroundColor: colors.surface },\n  ally: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.onSurface, paddingHorizontal: 6, paddingVertical: 2, maxWidth: "90%" },'),
]
for a, b in rep:
    assert a in s, a[:70]
    s = s.replace(a, b)
open(p, "w").write(s)
print("ok")
