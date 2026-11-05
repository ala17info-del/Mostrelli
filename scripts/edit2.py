import re
def edit(p, R):
    s = open(p).read()
    for a, b in R:
        assert a in s, (p, a[:70])
        s = s.replace(a, b)
    open(p, 'w').write(s)

G = '/app/frontend/app/game.tsx'
edit(G, [
('''import { ALL_BADGES, BLOCKING, ITEMS, ItemId, MAPS, Npc } from "@/src/game/data";''', '''import { initAudio, isMuted, playBgm, setMuted, sfx } from "@/src/game/audio";
import { ALL_BADGES, BLOCKING, ENCOUNTER_TILES, ITEMS, ItemId, MAPS, Npc } from "@/src/game/data";'''),
('''import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";''', '''import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";'''),
('''  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);''', '''  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [flash, setFlash] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const mapId = save?.map;
  const inBattle = !!battle;
  useEffect(() => {
    initAudio().then(() => {
      setMutedState(isMuted());
      if (!mapId) return;
      playBgm(inBattle ? "battle" : mapId === "riviera" ? "beach" : "town");
    });
  }, [mapId, inBattle]);'''),
('''    if (ch === "G" && Math.random() < ENCOUNTER && s.party.some((p) => p.hp > 0)) {
      stopHold();
      busyRef.current = true;
      hap("heavy");
      setBattle({ kind: "wild", enemies: [rollWild(s.map)] });
    }''', '''    sfx("step", 0.25);
    if (ENCOUNTER_TILES.has(ch) && Math.random() < ENCOUNTER && s.party.some((p) => p.hp > 0)) {
      stopHold();
      busyRef.current = true;
      hap("heavy");
      sfx("encounter");
      setFlash(true);
      const enemy = rollWild(s.map);
      setTimeout(() => {
        setFlash(false);
        setBattle({ kind: "wild", enemies: [enemy], field: s.map === "riviera" ? "beach" : "grass" });
      }, 550);
    }'''),
('''        hap("success");
        setToast("Squadra curata!");''', '''        hap("success");
        sfx("heal");
        setToast("Squadra curata!");'''),
('''        setBattle({ kind: "trainer", trainerName: npc.name, npc, enemies''', '''        sfx("encounter");
        setBattle({ kind: "trainer", trainerName: npc.name, npc, field: save.map === "riviera" ? "beach" : "grass", enemies'''),
('''items: { ...s.items, vasetto: s.items.vasetto - r.vasettiUsed } };''', '''items: { ...s.items } };
      for (const [k, v] of Object.entries(r.itemsUsed)) n.items[k] = (n.items[k] ?? 0) - (v ?? 0);'''),
('''"Hai tutti e 5 i Sigilli!''', '''`Hai tutti e ${ALL_BADGES.length} i Sigilli!'''),
('''Per anni. Ogni giorno.");''', '''Per anni. Ogni giorno.`);'''),
('''items: { ...p.items, [id]: p.items[id] + 1 } }));''', '''items: { ...p.items, [id]: (p.items[id] ?? 0) + 1 } }));'''),
('''Sigilli {save.badges.length}/5''', '''Sigilli {save.badges.length}/{ALL_BADGES.length}'''),
('''vasetti={save.items.vasetto}''', '''items={save.items}'''),
('''label={`Zaino: ${save.items.vasetto} vasetti · ${save.items.brodino} brodini`}''', '''label={`Zaino: ${save.items.vasetto ?? 0} vasetti · ${save.items.brodino ?? 0} brodini · ${save.items.tortellini ?? 0} tortellini · ${save.items.caffe ?? 0} caffè`}'''),
('''            <MenuItem icon="home" label="Schermata iniziale"''', '''            <MenuItem icon={muted ? "volume-off" : "volume-high"} label={muted ? "Audio: spento" : "Audio: acceso"} testID="menu-audio" onPress={() => { setMuted(!muted); setMutedState(!muted); }} />
            <MenuItem icon="home" label="Schermata iniziale"'''),
('''({save.items[id]})''', '''({save.items[id] ?? 0})'''),
('''      {battle && <Battle''', '''      {flash && <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(200)} style={styles.flash} pointerEvents="none" testID="encounter-flash" />}
      {battle && <Battle'''),
('''  root: { flex: 1, backgroundColor: colors.surface },''', '''  root: { flex: 1, backgroundColor: colors.surface },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.onSurface },'''),
])
s = open(G).read()
s = s.replace('if (!user || !save) return <Redirect', 'if (!user || !save) return <Redirect')
open(G, 'w').write(s)

edit('/app/frontend/src/game/GameContext.tsx', [
('''  items: { vasetto: number; brodino: number };''', '''  items: Record<string, number>;'''),
('''items: { vasetto: 5, brodino: 3 },''', '''items: { vasetto: 5, brodino: 3, tortellini: 1, caffe: 1 },'''),
])
edit('/app/frontend/src/game/TileMap.tsx', [
('''import React, { memo } from "react";''', '''import React, { memo, useEffect, useState } from "react";'''),
('''import { PixelSprite } from "./PixelSprite";''', '''import { PixelSprite } from "./PixelSprite";
import { ANIMATED_TILES, TileArt } from "./TileArt";'''),
])
s = open('/app/frontend/src/game/TileMap.tsx').read()
a = s.index('const TILE_BG'); b = s.index('type Props')
s = s[:a] + s[b:]
s = s.replace('import React, { memo, useEffect, useState } from "react";', 'import React, { useEffect, useState } from "react";')
open('/app/frontend/src/game/TileMap.tsx', 'w').write(s)

edit('/app/frontend/app/team.tsx', [
('const useItem = (i: number, id: ItemId)', 'const giveItem = (i: number, id: ItemId)'),
])
s = open('/app/frontend/app/team.tsx').read()
s = s.replace('useItem(i, ', 'giveItem(i, ')
s = s.replace('import { MOVES, SPECIES, TYPES } from "@/src/game/data";', 'import { sfx } from "@/src/game/audio";\nimport { ITEMS, ItemId, MOVES, SPECIES, TYPES } from "@/src/game/data";')
s = s.replace('import { knownMoves, Mon, monName, stats } from "@/src/game/engine";', 'import { applyItem, knownMoves, Mon, monName, stats } from "@/src/game/engine";')
open('/app/frontend/app/team.tsx', 'w').write(s)
print("ok")
