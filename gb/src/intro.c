#pragma bank 6
#include "common.h"
#define FT(c) (FONT_BASE + (uint8_t)(c) - 32)
void ending(void) BANKED {
  G.champion = 1;
  say_n("Dott. Balanzone", "Incredibile! Hai tutti i Sigilli dell'Emilia-Romagna!");
  say_n("Dott. Balanzone", "Da oggi sei CAMPIONE DEI MOSTRELLI. Lo scrivero' nel mio prossimo trattato, in latino.");
  say("Grazie per aver giocato a MOSTRELLI! Puoi continuare a esplorare e completare il Mostrario.");
}
void start_menu(void) BANKED {
  static const char *const items[] = {"MOSTRELLI", "ZAINO", "MOSTRARIO", "CANTINA", "SALVA", "ESCI"};
  uint8_t i, c = 0;
  while (1) {
    full_win();
    win_frame(0, 0, 20, 18);
    wtxt(2, 1, G.name);
    m0(MAPS[G.map].name); wtxt(2, 2, M);
    for (i = 0; i < 6; i++) wtxt(3, 4 + i * 2, items[i]);
    wtxt(2, 15, "Soldi:"); wnum(9, 15, G.money, 5); wtile(15, 15, FONT_BASE + '#' - 32);
    wtxt(2, 16, "Sigilli:"); { uint8_t b = 0; for (i = 0; i < N_BADGES; i++) if (G.badges & (1 << i)) b++; wnum(11, 16, b, 1); wtxt(12, 16, "/"); wnum(13, 16, N_BADGES, 1); }
    c = list_menu(2, 4, 6, c, 2);
    if (c == 255 || c == 5) break;
    if (c == 0) team_screen(0);
    if (c == 1) bag_screen();
    if (c == 2) dex_screen();
    if (c == 3) box_screen();
    if (c == 4) { save_game(); box_show(); say("Partita salvata sulla cartuccia."); }
  }
  load_meta();
  box_hide();
  SHOW_SPRITES;
}

/* ---------------- title / new game */
static void name_entry(void) {
  static const char AL[] = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  uint8_t pos = 0, i, k, idx[7] = {18, 15, 19, 19, 9, 0, 0}; /* ROSSI */
  full_win();
  win_frame(0, 0, 20, 18);
  wtxt(2, 2, "Come ti chiami?");
  wtxt(2, 12, "Su/Giu': lettera");
  wtxt(2, 13, "Sx/Dx: sposta");
  wtxt(2, 14, "START: conferma");
  while (1) {
    for (i = 0; i < 7; i++) { wtile(5 + i, 6, FONT_BASE + AL[idx[i]] - 32); wtile(5 + i, 7, i == pos ? FONT_BASE + '-' - 32 : FONT_BASE); }
    wait_vbl_done();
    k = pad();
    if (k & J_UP) idx[pos] = (idx[pos] + 1) % 27;
    if (k & J_DOWN) idx[pos] = idx[pos] ? idx[pos] - 1 : 26;
    if (k & (J_RIGHT | J_A)) pos = pos < 6 ? pos + 1 : 6;
    if (k & (J_LEFT | J_B)) pos = pos ? pos - 1 : 0;
    if (k & J_START) break;
  }
  k = 0;
  for (i = 0; i < 7; i++) if (idx[i]) { G.name[k++] = AL[idx[i]]; } else if (k) G.name[k++] = ' ';
  while (k && G.name[k - 1] == ' ') k--;
  if (!k) { strcpy(G.name, "ROSSI"); k = 5; }
  G.name[k] = 0;
}
static uint8_t pick_starter(void) {
  static const uint8_t ST[3] = {STARTER0, STARTER1, STARTER2};
  uint8_t c = 0, k, i;
  full_win();
  win_frame(0, 0, 20, 18);
  wtxt(2, 1, "Scegli il tuo");
  wtxt(2, 2, "primo Mostrello:");
  while (1) {
    load_mon_tiles(ST[c], META_BASE, 0);
    set_mon_pal(6, ST[c]);
    draw_mon(1, 7, 4, META_BASE, 6);
    for (i = 0; i < 3; i++) { wtxt(3, 11 + i * 2, "            "); wtxt(3, 11 + i * 2, SP_NAME[ST[i]]); wtile(2, 11 + i * 2, i == c ? FONT_BASE + '<' - 32 : FONT_BASE); }
    wtxt(3, 17, "          "); m0("Tipo "); ma(TYPE_NAME[SPECIES[ST[c]].type]); wtxt(10, 10, "        "); wtxt(10, 10, TYPE_NAME[SPECIES[ST[c]].type]);
    do { wait_vbl_done(); k = pad(); } while (!k);
    if (k & J_UP) c = c ? c - 1 : 2;
    if (k & J_DOWN) c = (c + 1) % 3;
    if (k & J_A) { sfx(SFX_CATCH); return ST[c]; }
  }
}
void new_game(void) BANKED {
  uint8_t i, s;
  memset(&G, 0, sizeof(Save));
  box_show();
  for (i = 0; i < N_INTRO; i++) say_n("Dott. Balanzone", txt(INTRO0 + i));
  name_entry();
  box_show();
  m0("Piacere, "); ma(G.name); ma("! Ora scegli il Mostrello che ti accompagnera'."); say_n("Dott. Balanzone", M);
  s = pick_starter();
  mon_make(&G.party[0], s, 5); G.np = 1;
  bit_set(G.seen, s); bit_set(G.caught, s);
  G.map = 0; G.x = 7; G.y = 7; G.dir = 0;
  G.money = 150;
  G.items[0] = 5; G.items[1] = 3; G.items[2] = 1; G.items[5] = 1;
  G.hmap = 0; G.hx = MAPS[0].hx; G.hy = MAPS[0].hy;
  load_meta();
  box_show();
  m0("Ottima scelta! "); ma(SP_NAME[s]); ma(" e' tuo. Batti i Capi delle citta' e prendi tutti i Sigilli!"); say_n("Dott. Balanzone", M);
  save_game();
}
uint8_t title(void) BANKED {
  uint8_t has = load_game(), c;
  full_win();
  load_mon_tiles(0, META_BASE, 0);
  set_mon_pal(6, 0);
  draw_mon(1, 7, 4, META_BASE, 6);
  wtxt(5, 1, "M O S T R E L L I");
  wtxt(2, 2, "Emilia-Romagna Ed.");
  wtxt(5, 12, "NUOVA PARTITA");
  if (has) wtxt(5, 14, "CONTINUA");
  wtxt(3, 17, "Gioco originale");
  music(1);
  do { c = list_menu(4, 12, has ? 2 : 1, has ? 1 : 0, 2); } while (c == 255);
  return c;
}

