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
- P1: use items during battle, monster evolutions, sound and music
- P2: trade or battle with friends, more areas (the Romagna coast, the Apennines), daily events
