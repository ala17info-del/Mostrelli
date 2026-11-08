#!/bin/sh
# Builds mostrelli.gbc (MBC5 + battery save, Game Boy Color with classic Game Boy fallback)
set -e
cd "$(dirname "$0")"
python3 tools/gen.py
LCC=${LCC:-/tmp/gbdk/bin/lcc}
$LCC -Wa-l -Wl-m -Wm-yc -Wm-yt0x1B -Wm-ya1 -Wm-yn"MOSTRELLI" -Wl-yo8 -Wl-ya1 -autobank \
  -o mostrelli.gbc src/main.c src/battle.c src/menus.c src/intro.c src/gen0.c src/gen1.c src/gen2.c src/gen5.c
ls -la mostrelli.gbc
