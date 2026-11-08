#pragma bank 4
#include "common.h"

#define FT(c) (FONT_BASE + (uint8_t)(c) - 32)

static void mon_row(uint8_t y, Mon *m) {
  uint16_t max = st_hp(m);
  wtxt(2, y, SP_NAME[m->s]);
  m0("Lv"); mn(m->lv); wtxt(15, y, M);
  hp_bar(1, 2, y + 1, m->hp, max);
  m0(""); mn(m->hp); ma("/"); mn(max); wtxt(11, y + 1, M);
}
static void mon_info(Mon *m) {
  uint8_t mv[4], n, i;
  full_win();
  win_frame(0, 0, 20, 18);
  load_mon_tiles(m->s, META_BASE, 0);
  set_mon_pal(6, m->s);
  draw_mon(1, 1, 1, META_BASE, 6);
  wtxt(8, 2, SP_NAME[m->s]);
  m0("Lv"); mn(m->lv); ma(" "); ma(TYPE_NAME[SPECIES[m->s].type]); wtxt(8, 3, M);
  m0("ATT "); mn(st_x(m, 0)); wtxt(8, 4, M);
  m0("DIF "); mn(st_x(m, 1)); wtxt(8, 5, M);
  m0("VEL "); mn(st_x(m, 2)); wtxt(8, 6, M);
  wtxt(2, 8, "Mosse:");
  n = known_moves(m, mv);
  for (i = 0; i < n; i++) wtxt(2, 9 + i, MV_NAME[mv[i]]);
  if (SPECIES[m->s].evo_to != 255) { m0("Si evolve al Lv"); mn(SPECIES[m->s].evo_lv); wtxt(2, 14, M); }
  do wait_vbl_done(); while (!(pad() & (J_A | J_B)));
}

/* mode 0: manage, 1: pick to send out, 2: pick item target */
uint8_t team_screen(uint8_t mode) BANKED {
  uint8_t i, c = 0;
  while (1) {
    full_win();
    wtxt(1, 0, mode ? "Scegli un Mostrello" : "LA TUA SQUADRA");
    for (i = 0; i < G.np; i++) mon_row(2 + i * 2, &G.party[i]);
    wtxt(1, 15, "A: scegli  B: esci");
    c = list_menu(1, 2, G.np, c, 2);
    if (c == 255) { load_meta(); return 255; }
    if (mode) { load_meta(); return c; }
    {
      static const char *const O[4] = {"Info", "Metti in testa", "Manda in cantina", "Indietro"};
      uint8_t o;
      box_show();
      for (i = 0; i < 4; i++) wtxt(2, 1 + i, O[i]);
      o = list_menu(1, 1, 4, 0, 1);
      if (o == 0) mon_info(&G.party[c]);
      if (o == 1 && c) { Mon t = G.party[0]; G.party[0] = G.party[c]; G.party[c] = t; c = 0; }
      if (o == 2) {
        if (G.np < 2) { say("Ti serve almeno un Mostrello in squadra!"); }
        else if (G.nb >= BOX_MAX) say("La Cantina e' piena.");
        else { G.box[G.nb++] = G.party[c]; for (i = c; i < G.np - 1; i++) G.party[i] = G.party[i + 1]; G.np--; c = 0; }
      }
    }
  }
}

uint8_t bag_pick(uint8_t inbattle) BANKED {
  uint8_t ids[N_ITEMS], n = 0, i, c;
  (void)inbattle;
  full_win();
  wtxt(1, 0, "ZAINO");
  for (i = 0; i < N_ITEMS; i++) if (G.items[i]) {
    ids[n] = i;
    wtxt(2, 2 + n * 2, IT_NAME[i]);
    m0("x"); mn(G.items[i]); wtxt(16, 3 + n * 2, M);
    n++;
  }
  if (!n) { wtxt(2, 2, "Lo zaino e' vuoto."); do wait_vbl_done(); while (!(pad() & (J_A | J_B))); return 255; }
  c = list_menu(1, 2, n, 0, 2);
  return c == 255 ? 255 : ids[c];
}
void bag_screen(void) BANKED {
  uint8_t it, t;
  while (1) {
    it = bag_pick(0);
    if (it == 255) return;
    if (ITEMS[it].kind != 1 && ITEMS[it].kind != 4) { box_show(); say(it == IT_VASETTO ? "Il Vasetto si lancia ai mostrelli selvatici durante le lotte." : "Si usa solo durante le lotte."); continue; }
    t = team_screen(2);
    if (t == 255) continue;
    box_show();
    if (use_heal(&G.party[t], it)) { G.items[it]--; sfx(SFX_HEAL); }
    say(M);
  }
}

void dex_screen(void) BANKED {
  uint8_t top = 0, c = 0, i, k, seen = 0, got = 0;
  for (i = 0; i < N_SPECIES; i++) { if (bit_get(G.seen, i)) seen++; if (bit_get(G.caught, i)) got++; }
  while (1) {
    full_win();
    m0("MOSTRARIO  Visti "); mn(seen); ma(" Presi "); mn(got); wtxt(0, 0, M);
    for (i = 0; i < 16 && top + i < N_SPECIES; i++) {
      uint8_t s = top + i;
      wnum(2, 2 + i, s + 1, 2);
      if (bit_get(G.caught, s)) wtile(4, 2 + i, FT('*'));
      wtxt(5, 2 + i, bit_get(G.seen, s) ? SP_NAME[s] : "??????");
    }
    while (1) {
      wtile(1, 2 + c - top, FT('<'));
      wait_vbl_done();
      k = pad();
      if (k & (J_UP | J_DOWN)) {
        wtile(1, 2 + c - top, FT(' '));
        if ((k & J_UP) && c) c--;
        if ((k & J_DOWN) && c < N_SPECIES - 1) c++;
        if (c < top || c >= top + 16) { top = c < top ? c : c - 15; break; }
      }
      if (k & J_B) { load_meta(); return; }
      if ((k & J_A) && bit_get(G.seen, c)) {
        full_win();
        win_frame(0, 0, 20, 18);
        load_mon_tiles(c, META_BASE, 0);
        set_mon_pal(6, c);
        draw_mon(1, 1, 1, META_BASE, 6);
        wtxt(8, 2, SP_NAME[c]);
        wtxt(8, 3, TYPE_NAME[SPECIES[c].type]);
        wtxt(8, 4, bit_get(G.caught, c) ? "Preso" : "Visto");
        wprint(1, 8, 18, txt(DESC0 + c));
        do wait_vbl_done(); while (!(pad() & (J_A | J_B)));
        break;
      }
    }
  }
}

void box_screen(void) BANKED {
  uint8_t i, c;
  while (1) {
    full_win();
    wtxt(1, 0, "CANTINA (A: prendi)");
    if (!G.nb) { wtxt(2, 2, "La cantina e' vuota."); do wait_vbl_done(); while (!(pad() & (J_A | J_B))); return; }
    for (i = 0; i < G.nb && i < 16; i++) { wtxt(2, 2 + i, SP_NAME[G.box[i].s]); m0("Lv"); mn(G.box[i].lv); wtxt(15, 2 + i, M); }
    c = list_menu(1, 2, G.nb < 16 ? G.nb : 16, 0, 1);
    if (c == 255) return;
    box_show();
    if (G.np >= 6) { say("La squadra e' piena: prima manda qualcuno in cantina."); continue; }
    G.party[G.np++] = G.box[c];
    for (i = c; i < G.nb - 1; i++) G.box[i] = G.box[i + 1];
    G.nb--;
    m0(SP_NAME[G.party[G.np - 1].s]); ma(" torna in squadra!"); say(M);
  }
}

void shop_screen(void) BANKED {
  uint8_t i, c = 0;
  while (1) {
    full_win();
    wtxt(1, 0, "BOTTEGA");
    for (i = 0; i < N_ITEMS; i++) {
      wtxt(2, 2 + i * 2, IT_NAME[i]);
      m0(""); mn(ITEMS[i].price); ma("#  hai "); mn(G.items[i]); wtxt(4, 3 + i * 2, M);
    }
    m0("Soldi: "); mn(G.money); ma("#"); wtxt(1, 16, M);
    c = list_menu(1, 2, N_ITEMS, c, 2);
    if (c == 255) return;
    if (G.money < ITEMS[c].price || G.items[c] >= 99) { sfx(SFX_FAIL); continue; }
    G.money -= ITEMS[c].price;
    G.items[c]++;
    sfx(SFX_CATCH);
  }
}
