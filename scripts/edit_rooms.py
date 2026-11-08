p = "/app/frontend/app/diretta.tsx"
s = open(p).read()
rep = [
('import { Live, LiveBattle } from "@/src/game/LiveBattle";', 'import { Live, LiveBattle, ROOM_BOSSES } from "@/src/game/LiveBattle";\nimport { TradeRoom } from "@/src/game/TradeRoom";'),
('  const [busy, setBusy] = useState(false);', '  const [busy, setBusy] = useState(false);\n  const [mode, setMode] = useState<"pvp" | "coop" | "trade">("pvp");\n  const [boss, setBoss] = useState(ROOM_BOSSES[0]?.id ?? "");'),
('  const body = () => JSON.stringify({ name: save.name, party: save.party });', '  const body = () => JSON.stringify({ name: save.name, party: save.party, mode, boss: mode === "coop" ? boss : undefined });'),
('  if (live && live.guest) return <LiveBattle live={live} setLive={setLive} onExit={() => router.back()} />;',
 '  if (live && live.guest && live.mode !== "trade") return <LiveBattle live={live} setLive={setLive} onExit={() => router.back()} />;'),
('<PixelText style={styles.title}>SFIDA IN DIRETTA</PixelText>', '<PixelText style={styles.title}>STANZE ONLINE</PixelText>'),
("Lotta contro un amico in tempo reale: ognuno sceglie la sua mossa e il turno parte quando avete scelto entrambi. Le sfide non danneggiano i tuoi mostrelli, ma gli strumenti usati si consumano.",
 "Crea una stanza e condividi il codice. Sfida: uno contro uno. Coppia: tu e un amico contro un Capopalestra (vittoria = soldi e Caramella Rara). Scambio: vi scambiate un Mostrello, solo se confermate entrambi."),
('        {live ? (\n          <View style={styles.card} testID="live-waiting-room">', '''        {live && live.guest && live.mode === "trade" ? (
          <TradeRoom live={live} setLive={setLive} onExit={() => router.back()} setMsg={setMsg} />
        ) : live ? (
          <View style={styles.card} testID="live-waiting-room">'''),
('              <PixelText style={styles.h}>Crea una sfida</PixelText>', '''              <PixelText style={styles.h}>Crea una stanza</PixelText>
              <View style={styles.team}>
                {([["pvp", "Sfida"], ["coop", "In coppia"], ["trade", "Scambio"]] as const).map(([k, l]) => (
                  <Pressable key={k} testID={`room-mode-${k}`} onPress={() => { hap("selection"); setMode(k); }} style={[styles.chip, mode === k && styles.chipOn]}>
                    <PixelText style={{ fontSize: 12 }}>{l}</PixelText>
                  </Pressable>
                ))}
              </View>
              {mode === "coop" && (
                <View style={{ gap: 6 }}>
                  <PixelText style={styles.meta}>Contro chi lottate?</PixelText>
                  {ROOM_BOSSES.map((b) => (
                    <Pressable key={b.id} testID={`room-boss-${b.id}`} onPress={() => setBoss(b.id)} style={[styles.chip, boss === b.id && styles.chipOn]}>
                      <PixelText style={{ fontSize: 12 }}>{b.name} · Lv{Math.max(...(b.team ?? []).map((t) => t[1])) + 3}</PixelText>
                    </Pressable>
                  ))}
                </View>
              )}'''),
('  waitRow: { flexDirection: "row", alignItems: "center", gap: 10 },', '  waitRow: { flexDirection: "row", alignItems: "center", gap: 10 },\n  chip: { borderWidth: 2, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, minHeight: 44, justifyContent: "center", backgroundColor: colors.surface },\n  chipOn: { borderColor: colors.brandSecondary, backgroundColor: colors.surfaceTertiary },'),
]
for a, b in rep:
    assert a in s, a[:70]
    s = s.replace(a, b)
open(p, "w").write(s)
print("ok")
