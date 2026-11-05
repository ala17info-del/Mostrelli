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
