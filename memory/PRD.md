# Bologna Monstri – PRD

## Original request
The user uploaded a Pokémon Red ROM and asked for a modified Italian .gb version set around Bologna, Castel San Pietro, Osteria Grande, Ferrara and Imola, with stereotyped local characters and new monsters. We declined to modify the ROM because it is Nintendo's copyrighted code. Instead we built an ORIGINAL Expo mobile game. Nothing from the ROM is used: all monsters, art, maps and text are new.

## User choices
Map adventure with turn-based battles · modern colourful pixel art · strong satire · online saves with an account.

## Architecture
- Backend: FastAPI + MongoDB, JWT email/password login (bcrypt), routes /api/auth/register, /login, /me and /api/save (GET, PUT, DELETE), one save per user.
- Frontend: Expo Router screens: index (title), auth, intro, game (overworld + battle overlay + menu + shop), team, mostrario.
- src/game holds the game code: data (16 original monsters, 6 types, 18 moves, 5 maps, NPCs), engine (stats, damage, XP, catching), GameContext (save that syncs to the cloud 2.5 s after changes), PixelSprite (12x12 pixel art), TileMap, Battle.

## Implemented (2026-06)
- Account sign-in, cloud save that autosaves and can be continued, new game.
- 5 connected towns, a D-pad you can hold to keep walking, tall-grass encounters, signs, healers, shops, trainers and 5 bosses that give 5 Sigilli (badges), Campione ending.
- Turn-based battles: Lotta, Cattura (Vasetto di Vetro), Mostri, Fuga, type effectiveness, levelling up and new moves, losing sends you back to the last healer.
- Team screen (Brodino healing item, set lead, Cantina storage box) and Mostrario with filters.

## Backlog

## Iteration 2 (2026-06)
- 5 evolutions (Tortellone, Fangone, Vendemmione, Umarellone, Cinghialone).
- Zaino (bag) in battle with 4 items: Vasetto, Brodino, Tortellini, Caffè.
- Original chiptune music and sound effects (expo-audio), with an audio on/off toggle.
- New Riviera Romagnola map: 5 monsters, 3 trainers, a healer, a shop and boss Romeo, who gives the 6th Sigillo.
- Shaded sprites and detailed, animated tiles.

## Iteration 6 (2026-06)
- The game is now called "MOSTRELLI", and the creatures are called Mostrelli everywhere in the text.
- Original chiptune for each place: Bologna (liscio waltz), Osteria Grande (polka), Castel San Pietro (calm, spa-style), Imola (racing rock), Ferrara (Renaissance-style), Castel Maggiore (mazurka), Altedo (country-fair tune), Riviera (beach).
- 12 new evolutions (17 in total; 44 species). The new forms reuse the base drawing in new colours (SKINS in sprites.ts), with a flashing animation when a monster evolves.
- New towns Castel Maggiore and Altedo between Bologna and Ferrara (Bologna ↔ Castel Maggiore ↔ Altedo ↔ Ferrara), each with a healer, a shop, 2 trainers and a sign.

- Fixes after testing: the evolution reveal keeps the old form until the "è diventato" message, duels no longer show XP, duel result counting is atomic, `lv: true` is rejected, evolved species now appear in boss teams, and the Zanzarazza, Lambruscone and Squacquerona colours are clearer.

## Iteration 5 (2026-06)
- World map screen (/mappa): every town with its healer, shop, boss status and how many trainers are left.
- Sfida tra Amici (/sfida): the backend saves your team under a 6-character code. A friend enters the code and fights that team, played by the computer. Your monsters take no damage and wins/losses are counted.
- New items Digestivo (cures confusion) and Gelato (cures burns), both usable only in battle.
- 6 new monsters (32 in total) and 6 new moves.
- Smoother walking: the camera and the player slide between tiles.
- Buttons: A is now green, B is now red and switches run mode, and a new centre MENU button opens the menu.
- Animations when healing (sparkles) and when throwing a jar (it flies, the monster is sucked in, the jar wobbles, or the monster breaks out).
- Sign in with Apple (iOS only): POST /api/auth/apple, which logs in with the same token as the email/password login.

## Iteration 4 (2026-06)
- Move side effects (21 moves): lowering an enemy stat, raising your own stat, confusion (can hit itself) and Scottato (loses HP each turn). The battle info boxes show status chips, and the move buttons show each effect's chance.

## Iteration 3 (2026-06)
- Lower prices. Trainer rewards doubled, wild wins now pay money, and losing costs 25% of money instead of 50%.
- CURA and MARKET markers above healers and shops on the map.
- Trainer markers (crossed swords, crown for bosses) that turn into a check mark once beaten.
- Battle effects: particles, damage numbers, lunges, blinking, screen shake, flash and animated HP bars.
- Sprites drawn at double resolution with smaller pixels, plus finer tile detail.
- New trainer Tonello at Osteria Grande.
- Fixes: evolved monsters added to the Mostrario, A button advances dialogs, faster saving, no 401 error on startup.

- P1: use items during battle, monster evolutions, sound and music
- P2: trade or battle with friends, more areas (the Romagna coast, the Apennines), daily events

## Iteration 7 (2026-06)
- Sfida in Diretta (/diretta, reached from Sfida tra Amici): two friends battle live turn by turn with no time limit. Backend `live_duels` stores both picks; once both are in, the turn gets a random seed and both phones work out the same result (duelEngine.ts). Moves, switching and bag items (they are used up) are allowed; fainted monsters are swapped automatically; there is a Surrender button. Endpoints: POST /api/live, POST /api/live/{code}/join, GET /api/live/{code}, POST /api/live/{code}/action, POST /api/live/{code}/end.
- The 12 evolved forms that used to be recolours now have their own 16x16 drawings (SKINS removed), and evolved forms are drawn 20% bigger in battle.

## Iteration 8 (2026-06): smoother play, look, content, online rooms
- Smoother walking: TileMap draws the whole 16x16 map once (memo) and only moves the camera and player with reanimated transforms. The player has 4-direction sprites, a walk cycle and a small bob. On web (iPhone Safari) text selection, the long-press callout and the context menu are turned off (+html.tsx).
- Look: a warmer, more saturated tile palette (REMAP in TileArt) and a dialog box with a name tab.
- Content: all new data is in src/game/expansion.ts and merged into data.ts and sprites.ts. Modena (west of Bologna), Parma (west of Modena), Ravenna (north of the Riviera), interiors Acetaia Ducale (Modena door 12,2) and Mercato di Mezzo (Bologna door 2,5). 9 new Mostrelli (4 evolution lines plus Rossocorsa), 5 moves, 3 new bosses/badges, the Caramella Rara (kind "level", not sold in shops), map pickups (save.picked) and trainer prizes (npc.prize, or the default: bosses give a caramella, trainers give a basic item).
- Online rooms (/diretta, menu "Stanze Online"): live_duels has `mode` pvp|coop|trade. Coop: 2 players vs a boss team (+3 lv), worked out the same way on both phones (duelEngine with a "boss" side), with a "pass" action when a player has no Mostrelli left. Trade: POST /api/live/{code}/offer {uid}, then /confirm by both; the server swaps the Mostrelli in both saves (the room is locked during the swap) and clients reload their save.
- Game Boy ROM (/app/gb, build.sh) is a separate experiment; it compiles but has not been tested.

## Iteration 10 (2026-06): smooth walking on iPhone browser, detailed pixel art
- Walking on web uses CSS transitions (compositor) for camera and player; d-pad/A/B/MENU use delayPressIn=0 (quick taps were ignored before).
- Detailed tiles: terracotta coppi roofs, plaster walls with green shutters, arched doors, varied bricks, cobblestones, portico arches, water depth, soft shadows under tall tiles.
- UI: Logo component (gold outline + red ribbon) on title, button shine, card-style scrollable game menu, dialog name tab. Title background is the original pixel-art Emilia-Romagna panorama (TitleScene.tsx).

## Iteration 11 (2026-06): interiors and unique NPC looks
- New indoor tiles in TileArt: L wood floor, K oak barrel, M market stall (awning + produce crate), N indoor wall (wainscot, shelves, painting), V red carpet. K, M and N block movement. Acetaia and Mercato are now full 16x16 rooms with no black void; their exit moved to (7,15) and you enter at (7,14).
- NPC_SPRITES (expansion.ts): each capopalestra has its own drawing (umarell, contessa, duchessa, camionista, nonna, pilota, romeo, aceto, teodora). Shopkeepers wear an apron, a baker's hat or a straw hat, coloured by their look.
- Side walls inside are stone pilasters (J, blocking). Shopkeepers now use 6 outfits (apron, baker, straw hat, bandana, moustache+vest, glasses+long hair). The Fruttivendola moved in front of her stall (3,6).

## Iteration 12 (Jun 2026)
- Giorno/Notte in tempo reale (alba 5-8, giorno 8-18, tramonto 18-21, notte 21-5) su mappe esterne; interni (acetaia, mercato) sempre illuminati. File: src/game/Alive.tsx
- Mostrelli animati: respiro + saltello in Battle e LiveBattle; NPC respirano sulla mappa.
- Backlog: Apple Sign-In da verificare su build nativa.

## Iteration 12 (2026-11): fluid walking and livelier overworld
- Walking: drift-corrected step clock (setTimeout scheduled on absolute times) instead of setInterval; the slide lasts 12% longer than the step so a late timer never leaves a pause. Changing direction while walking applies on the next step; releasing an old arrow no longer stops the new one (DBtn passes its own dir to stopHold).
- TileMap no longer re-renders the 256 tiles every 0.9 s: the second frame of animated tiles is drawn once in AnimLayer and only its opacity flips.
- Player: stand + two walk poses (up/down mirror the walk drawing so legs alternate) mounted together and switched with opacity; whole-pixel camera on native.
- Effects: tall grass covers the legs, leaf burst in tall grass, dust puffs when running, bump nudge when walking into walls, fade to black between maps and fade-in on entry, drifting cloud shadows by day, warm door lights at night.

## Iteration 13 (2026-11): all of Emilia-Romagna, dynamic battles, better multiplayer
- World (src/game/world.ts): 167 generated places (32 frazioni) in all 9 provinces, each one line in ROUTES ("Name[@PROV]|terrain|*|fz:Comune|fact"). buildWorld() draws 16x16 maps by terrain (c town, p plain, h hills, a Apennines, m seaside, f valleys), wild tables by type, trainers, sign with the local fact, healer+shop in bigger towns, and links routes to the hand-drawn maps (carving edge passages). Reggio Emilia now sits between Modena and Parma; Castel Bolognese–Faenza–Forlì–Forlimpopoli–Cesena–Savignano sit between Imola and the Riviera; Mordano–Lugo–Russi lead to Ravenna. Levels capped at 45 (Mostrelli stop at 50). 4 new bosses/badges: Reggio Emilia, Piacenza, Forlì, Rimini (13 Sigilli). GameMap has prov, terrain, fraz, field. Verified with a script: every exit/NPC/sign/pickup reachable, links both ways, all 180 maps reachable from Bologna.
- World map (/mappa): provinces you can open, search by name or frazione, visited places (save.visited).
- Battles: timed commands (BattleQte.tsx): attack bar with a gold band (x1.35 perfect, x1.15 good) and a guard ring (x0.5 / x0.75 damage taken); can be turned off ("A tempo: SÌ/NO"). Charge gauge: perfect hits and guards fill it; at 3 the "Colpo Emiliano" (best move x1.8, never misses, high crit). Weather by place (Weather.tsx): nebbia (accuracy -10, Nebbia x1.25), sole, neve, vento, afa, each boosting one type, with animated overlay. engine.attack() takes AttackOpts.
- Multiplayer: GET /api/live/{code}/wait long poll (rev bumped on every room change via live_update) replaces 1.5 s polling. Quick match: POST/GET/DELETE /api/match (similar team level, anyone after 20 s). Presence: POST /api/presence every 2 s shows other players on the same map (TileMap Ghost with name tag), A in front of one sends an invite (POST /api/invite, DELETE /api/invite/{id}); banner to accept. "Visibile online" toggle (save.online). Quick chat in live battles (12 preset phrases, POST /api/live/{code}/chat). Timed commands also in live duels: grade/guard travel with the sealed actions so both phones resolve the same result.

## Iteration 14 (2026-11): ready for free web hosting, outside Emergent
- Web speed: the map is drawn once per map into a single image (mapImage.ts replays TileArt's rectangles on a canvas) and sprites become small cached images (PixelSprite on web). In the browser the map went from thousands of DOM nodes to ~95; whole game page ~280.
- PWA: public/index.html (Expo SPA template: the old +html.tsx was not used by `output: single`), manifest.json, icons (Tortellotto pixel art), apple-mobile-web-app tags, no pinch/double-tap zoom, service worker (cache-first for hashed files, network-first for the page, never /api).
- Keyboard: arrows/WASD, Z/Enter/Space = A (also battle text and timed commands), X/Shift = B, Esc/M = menu. On computers the app is a centred phone-width column (max 520 px).
- App name "Mostrelli", new icons. backend/requirements.txt reduced to what server.py uses (emergentintegrations removed; old list kept as requirements-emergent.txt); APPLE_AUDIENCES optional.
- Hosting files: netlify.toml (frontend, SPA redirect, cache headers), render.yaml (backend, free plan), .env.example files, frontend/.npmrc (legacy-peer-deps). README rewritten in Italian with the steps.
- Checked in headless Chromium against the real backend (mongomock): two players see each other, keyboard walking, wild battle with timed command, world map search, no JS errors.

## Iteration 15 (2026-11): livelier look, no battle minigame, reasons to come back
- Look: vivid indigo/violet UI palette (theme.ts) with candy accents; vivid() boosts saturation of every tile and sprite colour; brighter battle backgrounds.
- Battles: timed commands off (QTE_ON = false, toggle removed; also off in live duels). Charge fills by itself: +1 per hit that lands, +2 for a hit worth 30% of the foe's HP.
- Cromatici: 1/64 wild chance (x5 in today's feast town), hue-rotated colours (PixelSprite shiny), golden flash and message; shown in team, Mostrario and battle. Rari: 3% chance to meet the evolved form in the wild.
- Sagre (events.ts): 14 village feasts, one per day from the real date, cycling through all of them; feast town has 3x its type and 5x cromatici; first visit of the day gives a gift. Banner under the town name, tag on the world map, next 3 feasts on the Trofei screen.
- Trofei (trophies.ts, app/trofei.tsx): 17 goals (catches, cromatici, wins, trainers, Sigilli, places visited, sagre) collected automatically with a banner and prizes (money, Caramelle Rare, items). save.stats / trophies / sagraDays.
- Test version: EXPO_PUBLIC_DEMO=1 (demoApi.ts answers instead of the server, localStorage) + app.config.js (one bundle) → single HTML published as a claude.ai artifact.

## Iteration 16 (2026-11): story, side quests, buildings, more Mostrelli, Prof. Albe, new start
- 39 new Mostrelli (92 total, 42 evolutions) in 18 regional lines (bestiary.ts), pixel art from spriteGen.ts; each province's own species always live in its generated places (N_HOME). Server SPECIES_IDS updated.
- Every door leads inside (towns.ts): 187 interiors (casa, osteria = healer, bottega = shop, bar) with 250 locals speaking the province's dialect (with translation), local habits and game tips (dialects.ts). 131 side quests (catch / visit / win N), tracked in save.quests and listed on the Trofei screen.
- Main story "Il Ricettario Rubato" (story.ts): 9 chapters vs the Banda della Panna; goal always shown under the town name; gang members placed with findSpot (never blocking paths), visible only in their chapter.
- 929 street lamps (tile I, blocking, placed only where every exit/NPC/arrival stays reachable), lit at night; real clock with phase icon in the header; at night Nebbia and Chiacchiera Mostrelli x2.
- Prof. Albe (prof_albe sprite, portrait next to his lines) replaces Dottor Balanzone as the mentor. New intro: name, boy/girl (person*_f sprites), starting province with its local starter (start.ts) at a level fitting the zone.
- Running: position kept in a ref so quick steps are never lost, two steps in one render slide instead of teleporting, per-step hop removed, run step 120 ms.
- Look: softer handheld-adventure palette for grass, trees, paths and water; rounded modern buttons, grid menu with coloured icons, rounded battle panels.

## Iteration 17 (2026-11): soft handheld-style tiles, rounded everything
- New tile set in TileArt.softTile (exact "!#rrggbb" colours): grass with tufts, four-petal flowers, pointed tall grass that sways, round trees with highlight and ground shadow, sandy paths and cobbled squares, water with ripples, striped red roofs with ridge and eave, cream walls with white-framed windows, red arched doors, rounded wooden signs; Bologna's portici (P) keep their arches.
- Tiles know their neighbours (neighbours(), nb prop): paths/squares and water round their corners where they meet grass. Px supports per-corner radii; mapImage draws them with roundRect radii arrays.
- Rounded corners on every boxed style in all screens (36 styles), soft outlines instead of white borders.

## Iteration 18 (2026-11): new movement engine
- TileMap glides the player at a constant speed computed every frame (requestAnimationFrame); no per-step timers, no CSS transitions or withTiming retargeting (which sped up / slowed down to catch up).
- Next step is requested by the map itself when 0.4 tile is left (onNear); the game pushes the new target straight into the glide (drive.current.go) before React re-renders, so slow renders can't stop the player. onIdle marks the stop; blocked steps retry while the button is held; a 600 ms safety stops the controls from getting stuck.
- Web: camera and player positions are written directly to the DOM (translate3d, whole pixels) after each frame and each render; native: shared values set per frame.
- Measured in headless Chromium with 4x CPU slowdown, on Reggio Emilia's main street: 0 mid-way stops, 0 jumps walking and running.

## Iteration 19 (2026-11): calmer, precise walking
- Running removed (B now only moves dialogs on); walking 215 ms per tile.
- The next step is decided only on arrival on a tile, inside the same frame, and the unused part of the frame is spent on the next tile (TileMap.glide): no overshoot when the button is released, no pause between tiles.
- No step sound on the web and no haptic per step (both can make iPhone Safari stutter).
- Measured (headless Chromium, 4x CPU slowdown): 0 pauses and 0 jumps across four directions with quick turns; holding 0.5 s moves exactly 3 tiles.

## Iteration 20 (2026-11): level 100
- MAX_LV = 100 (engine.ts). xpFor(lv): lv^3 up to 50 (old saves unchanged), then 125000 + 2000k + 30k(k+1) with k = lv - 50 (2060 XP for lv 51, 5000 for lv 100). Used by makeMon, gainXp, Caramella Rara, team screen; server clean_party accepts 1..100 with the same curve (xp_for).
- After the story (chapter >= STORY_END) wild Mostrelli get +5..+25 levels based on the lead's level (rollWild boost); Prof. Albe announces it. Simulated: 266 post-game wild battles from 50 to 100 without candies.
- Trophies "Bello robusto" (lv 50) and "Al massimo!" (lv 100).

- Iteration 20b: XP from 50 to 100 halved: xpFor = 125000 + 1000k + 15k(k+1) (game and server).

## Iteration 21 (2026-11): big d-pad, taps, wider view
- DPad: one 186 px cross (64 px arms) driven by the responder system: touch anywhere on an arm or slide the thumb to change direction; small dead zone in the middle; pressed arm turns gold; light haptic on each direction change. (dpad-up/down/left/right testIDs kept as markers.)
- Web haptics in ui.hap: Vibration API on Android; on iPhone Safari (iOS 18+) a hidden <input type="checkbox" switch> is clicked, which gives a light tap.
- COLS 9 -> 11: smaller tiles, more of the map on screen.

## Iteration 22 (2026-11): starter choice in the trattoria
- Intro: name and boy/girl, then the "Trattoria da Albe" scene (app/intro.tsx): back wall with sign and shelves of bottles, checkered floor, Prof. Albe behind a counter with a white-and-red tablecloth, three plates under silver cloches that bob; tapping one lifts the cloche (spring) and the starter hops out; a framed dialog box shows name, type, description and "Scelgo X!" / "Ci penso". Starters: tortellotto, fanghino, grappolino; the game always starts in Bologna at level 5. Province choice removed (start.ts left unused).

## Iteration 23 (2026-11): visual world map
- worldLayout.ts: every outdoor place gets a grid position by walking the exits from Bologna (2 units per step; on a collision the place moves half a step sideways before going further), so east on the map = east exit. route(from, to) gives the shortest chain of places and exit sides.
- app/mappa.tsx rewritten as a pannable metro-style map (178 places, province colours + legend): pulsing "Sei qui" marker (buildings count as their town), 🚩 story goal (Chapter.target), 🎉 today's sagra, 👑 unbeaten capopalestra, names for bigger towns. Tap or search a place: the way there is drawn in gold and a card shows province, levels, services, boss and grouped directions ("Esci 5 volte a Est fino a Faenza"). Buttons: centre on me, go to goal.

## Iteration 24 (2026-11): zoomable world map
- Custom pan & zoom on the world map (no ScrollViews): one finger pans, two fingers pinch (live scale on the canvas, then the layout is redone at the new zoom so text stays sharp), +/- buttons, mouse wheel on computers; zoom 0.6–2.6; pan clamped to the map. A drag never ends in an accidental tap on a place.
- Level of detail: far (< 0.75) only province names (placed without overlapping) plus selected place/goal; middle (< 1.35) main towns; close up every village. Town labels are placed by priority (you, selected, goal, route end, capoluoghi, towns with a healer, the rest) and skipped when they would touch one already placed.

## Iteration 25 (2026-11): geographic world map
- geo.ts: approximate longitude/latitude for all 178 places, region outline, Via Emilia, Po, Adriatic coast. regionImage() draws the region once on a canvas (web): neighbouring land, Adriatic with waves and beach, plain with fields, hills, low mountains and the Apennine ridge in bands south of the Via Emilia with peaks (snow on Cimone/Corno alle Scale/Cusna), Comacchio lagoons, the Po, the border.
- World map places now sit at their real position (project() lon/lat → px), roads drawn between them; routes and directions unchanged (they follow the game's exits). Zoom 0.32 (whole region) – 4.5; labels: provinces < 0.9, main towns < 1.9, all villages above; opens at 1.4 on the player.

## Iteration 26 (2026-11): type-specific moves
- 24 new moves (4 per type, all with an effect) in movesets.ts: every type now has 9-10 moves (57 total).
- typeMovesets() rewrites every learnset after the species list is built: a Mostrello learns only moves of its own type (Sberla only for Chiacchiera). Each evolution line gets 5 moves (weakest of the type + the same-type moves it already had + a seeded mix), at levels 1/1/9/18/28; evolved forms add signature moves (the type's strongest, rotated among the lines of that type so every move is learnable) at evolution level + 4. knownMoves() derives from the learnset, so existing saves update by themselves.
- Fixed a duplicate id: the new Piadinetta line's middle form is now "piadinona" (the original "piadinazza", Campi, is untouched). Server SPECIES_IDS updated.

## Iteration 27 (2026-11): companion, animated attacks, evolution scene
- Follower: the first healthy Mostrello of the party walks one tile behind the player on every map (TileMap follower prop). It moves along the path the player walked, driven by the same per-frame glide (trail of the last two tiles), with a little hop and facing left/right; on a new map it appears right behind the player.
- BattleFx.TypeShow: a scene per move type under the particles: sauce blobs splatting (Sugo), whirl of leaves (Campi), steam and bubbles rising (Terme), speed lines and an exhaust puff (Motore), fog banks closing in (Nebbia), speech bubbles "Bla!", "Mo' dai!", "Ciò!" (Chiacchiera).
- EvolveScene: dark backdrop with turning rays, old/new silhouettes swapping faster and faster, white flash, new form in colour with sparkles; shown from "si sta evolvendo" through "è diventato".

## Iteration 28 (2026-11): gyms, strolling locals, live title
- gyms.ts: the 12 capipalestra standing outdoors now have a hall (`<map>__palestra`, interior + gym flag): long red carpet, barrels along the sides, two apprentices with Mostrelli of the boss's types (levels just below), the boss at the far end. In town a doorman (kind "gym", red PALESTRA badge) stands where the boss was; talking to him fades into the hall; the hall exit leads back next to him. World map finds bosses inside gyms (bossOf). verify.ts treats gyms as reachable through their doorman.
- Strolling locals: every 1.4 s one "talk" NPC of the current map may take a step (max 2 tiles from home), never onto blocking/tall grass/exits/arrival tiles, next to the player, onto other people or items, and nobody moves during dialogs, battles, menu or shop. Positions live in game.tsx (npcPos) and drive collisions, talking and the Stroll glide in TileMap.
- Title screen: TitleLive pans slowly over the real Riccione map (web) with the boy/girl walking with Tortellotto/Fanghino; the MOSTRELLI logo letters hop in a wave. Native falls back to the painted panorama.

## Iteration 29 (2026-11): Predappio and Zio DUC
- Predappio (FC, hills, big town) reached from Castrocaro Terme to the east; sign with a dry note ("il resto della sua storia lo trovi nei libri, non nei negozi di souvenir").
- Capopalestra "Zio DUC" (satire: a pompous bald man in black who speaks from the balcony to nobody and loses; no slogans, salutes or symbols), Chiacchiera team, badge "Sigillo del Balcone" (14 badges now). Sprite zio_duc. His gym hall plays "duc": an original 8-bit comic march composed for the game (B-flat brass-band theme, oom-pah bass, snare, deflating trombone slide at the end). Gym apprentices of Chiacchiera bosses are "Chiacchierone allievo di ...".

## Iteration 30 (2026-11): fast travel
- World map card: "✈️ Vola a <place>" button. FREE_TRAVEL = EXPO_PUBLIC_DEMO === "1": in the test build every place is open; in the official build only places in save.visited (others show "Visitalo almeno una volta per sbloccare il volo"). Landing on the place's healer spot or the free tile nearest the middle (checked for all 179 places); the place is added to visited; the view flies to it, then the game opens there with the usual fade-in.

## Iteration 31 (2026-11): a real-looking Predappio
- Hand-drawn places (world.ts CRAFT/applyCraft): Predappio now has a cobbled square with a fountain, porticoes, the church of Sant'Antonio with its bell tower, the gym palace with a balcony (new blocking tile "=", soft style), houses, the souvenir shop (locals joke about it) and lamps. NPCs, healer spot and sign moved to fit; pickups removed.
- The gym palace door leads straight into Predappio's gym hall (no doorman); Zio DUC watches from the balcony (decorative, never strolls) and tells you to come in; the real fight is inside. verify.ts: gyms may be reached by a door; NPCs standing on buildings are decorative.
- Follower now starts on the player's tile at launch (it could appear inside a fountain).
- Music: "Canto degli Arditi" not added (squadrismo anthem, melody not known reliably); the original march stays.
- Iteration 31b: people standing on a balcony tile are drawn from the waist up, higher, behind the railing (railing and stone slab drawn over the sprite), with no ground shadow.

## Iteration 32 (2026-11): field moves and secret corners
- secrets.ts: three obstacles, each cleared by a field move: crowd "%" (Ciabattata, Chiacchiera), hedge "&" (Potatura, Campi), boulder "^" (Sfondamento, Motore). The moves are learned at level 8 by every Mostrello of that type (movesets.ts) and can be used outside battle as long as they were learned (fieldUser), even if no longer among the 4 battle moves. Face the obstacle and press A: it is cleared for good (save.cleared "map:x,y"; mapView turns it into open ground); without the move the game says which move and type are needed.
- Secret corners behind the obstacles: Bologna's alley by the north gate (crowd) and 27 generated places (1 in 5, bottom-left corner closed by trees; crowd in towns, boulder in the Apennines, hedge elsewhere; not by the sea). Inside: a special Mostrello (an evolved form, place level + 4, 1 in 4 cromatico) shown bobbing with a glow, to fight and catch (BattleSetup.spot; it leaves once beaten or caught), plus a Caramella Rara and another treat.
- Lamps never block a secret entrance (towns.reachable passes through clearable obstacles); story villains never stand inside a corner. verify.ts treats obstacles as passable.
- Iteration 32b: the crowd obstacle is now a protest march: three people with eyes, two raising white placards with red writing (short sticks behind the heads); dialog "Un corteo di manifestanti blocca il vicolo coi cartelli: «Giù le mani dai tortellini! No alla panna!»", cleared with "I manifestanti si spostano più in là, continuando a cantare cori".

## Iteration 33 (2026-11): Predappio's secret courtyard and Inutilino
- New species Inutilino (Chiacchiera, very weak, catch rate 1) whose only move is "Saluto" (power 5): it waves its little hand and says "Ciao!". Its learnset is hand-made (movesets KEEP); "saluto" never appears in other learnsets. Server SPECIES_IDS updated.
- Nonno Tonino on Predappio's square (kind "gift") gives Inutilino once (party, or box when full).
- Predappio's bottom-right house replaced by a tree-walled courtyard closed by a solemn padlocked gate (new obstacle "!", brick wall with an arched wooden door and a gold padlock). Using Saluto opens it ("il portone, spiazzato da tanta gentilezza, si apre da solo"). Inside: a special Mostrello that is always cromatico, a Caramella Rara and another treat. Predappio is excluded from the random secret corners.

## Iteration 34 (2026-11): nicer Mostrelli, clothes and boutiques
- Creature shading (PixelSprite.creatureColor, species sprites only): volume with light from the top-left, two-tone coloured outline (dark versions of the nearest body colour instead of flat black; inner lines and eyes stay black), small highlight. spritePixels() returns a sprite's colours for previews/tests.
- outfits.ts: 22 accessories (hats, glasses/masks, scarves, shirts), each sold only in its town's boutique (21 towns: Bologna, Modena, Maranello, Parma, Reggio, Piacenza, Ferrara, Ravenna, Rimini, Riccione, Cesenatico, Comacchio, Faenza, Forlì, Imola, Cento, Vignola, Salsomaggiore, Predappio, Sestola, Cattolica). dressed() builds the player drawing with the hat rows (7 hat styles), glasses and scarf in all directions (cached in SPRITES); shirts recolour C/P via look. Boutique NPC (kind "outfit", placed by findSpot) opens a sheet with previews, buy-and-wear, wear/remove. Menu "Guardaroba": front/side/back preview, owned items by slot, tap to wear/remove. save.outfit / save.wardrobe.
