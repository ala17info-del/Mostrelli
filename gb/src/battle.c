#pragma bank 3
#include "common.h"

static Mon E[6];
static uint8_t ne, ei, pi, trainer, tnpc;
static Mon *A[2];
static int8_t stg[2][3];
static uint8_t conf[2], burn[2];
static uint8_t mv[4], nmv;
static uint16_t shown[2];

#define FT(c) (FONT_BASE + (uint8_t)(c) - 32)

static void nm(uint8_t s) {
  ma(SP_NAME[A[s]->s]);
  if (s) ma(trainer ? " nemico" : " selvatico");
}
static void info(uint8_t s) {
  Mon *m = A[s];
  uint8_t x = s ? 0 : 8, y = s ? 0 : 7, i;
  uint16_t max = st_hp(m);
  for (i = 0; i < 12; i++) { btile(x + i, y, FT(' '), 5); btile(x + i, y + 1, FT(' '), 5); btile(x + i, y + 2, FT(' '), 5); }
  btxt(x, y, SP_NAME[m->s]);
  m0("Lv"); mn(m->lv); btxt(x + 1, y + 1, M);
  btxt(x + 6, y + 1, TYPE_NAME[SPECIES[m->s].type]);
  hp_bar(0, x, y + 2, shown[s], max);
  if (!s) { m0(""); mn(shown[s]); ma("/"); mn(max); ma(" PV"); btxt(x + 1, y + 3, "           "); btxt(x + 1, y + 3, M); }
}
static void anim_hp(uint8_t s) {
  uint16_t target = A[s]->hp, max = st_hp(A[s]);
  uint8_t stp = max / 40 + 1;
  while (shown[s] != target) {
    if (shown[s] > target) shown[s] = shown[s] - target > stp ? shown[s] - stp : target;
    else shown[s] = target - shown[s] > stp ? shown[s] + stp : target;
    info(s);
    wait_vbl_done();
  }
  info(s);
}
static void place(uint8_t s) {
  if (s) { load_mon_tiles(A[1]->s, META_BASE, 0); set_mon_pal(6, A[1]->s); draw_mon(0, 13, 0, META_BASE, 6); }
  else { load_mon_tiles(A[0]->s, META_BASE + 36, 1); set_mon_pal(7, A[0]->s); draw_mon(0, 1, 6, META_BASE + 36, 7); }
  shown[s] = A[s]->hp;
  info(s);
}
static void shake(uint8_t target) {
  uint8_t i;
  sfx(SFX_HIT);
  for (i = 0; i < 8; i++) { move_bkg((i & 1) ? (target ? 252 : 4) : 0, 0); if (cgb && target) BGP_REG = (i & 1) ? 0x1B : 0xE4; wait_vbl_done(); wait_vbl_done(); }
  move_bkg(0, 0); BGP_REG = 0xE4;
}
static void scene(void) {
  uint8_t x, y;
  DISPLAY_OFF;
  HIDE_SPRITES;
  move_bkg(0, 0);
  for (y = 0; y < 18; y++) for (x = 0; x < 20; x++) btile(x, y, FT(' '), 5);
  for (x = 12; x < 20; x++) btile(x, 6, UI_BASE + 6, 5);
  for (x = 0; x < 8; x++) btile(x, 12, UI_BASE + 1, 5);
  place(1); place(0);
  DISPLAY_ON;
}
static uint16_t stage(uint16_t v, int8_t st) { return st >= 0 ? v * (2 + st) / 2 : v * 2 / (2 - st); }
static uint16_t espd(uint8_t s) { return stage(st_x(A[s], 2), stg[s][2]); }
static void reset_side(uint8_t s) { stg[s][0] = stg[s][1] = stg[s][2] = 0; conf[s] = 0; burn[s] = 0; }

static void burn_tick(uint8_t s) {
  uint16_t d;
  if (!burn[s] || !A[s]->hp) return;
  d = st_hp(A[s]) / 12; if (!d) d = 1;
  A[s]->hp = A[s]->hp > d ? A[s]->hp - d : 0;
  m0(""); nm(s); ma(" si scotta ancora... che bruciore!"); say(M);
  anim_hp(s);
}
static void bump(uint8_t t, uint8_t k, int8_t d) {
  static const char *const LB[3] = {"L'attacco di ", "La difesa di ", "La velocita' di "};
  m0(LB[k]); nm(t);
  if ((d < 0 && stg[t][k] <= -3) || (d > 0 && stg[t][k] >= 3)) ma(" non puo' cambiare oltre!");
  else { stg[t][k] += d; ma(d < 0 ? " cala!" : " aumenta!"); sfx(d < 0 ? SFX_FAIL : SFX_LEVEL); }
  say(M);
}
static void attack(uint8_t s, uint8_t move) {
  uint8_t o = s ^ 1, e, crit;
  Mon *a = A[s], *d = A[o];
  const MoveD *mvd = &MOVES[move];
  uint32_t base;
  uint16_t dmg;
  if (conf[s]) {
    conf[s]--;
    m0(""); nm(s); ma(" e' confuso..."); say(M);
    if (rand() % 3 == 0) {
      dmg = st_hp(a) / 10; if (!dmg) dmg = 1;
      a->hp = a->hp > dmg ? a->hp - dmg : 0;
      shake(s); anim_hp(s);
      say("Si colpisce da solo per la confusione!");
      if (!conf[s]) { m0(SP_NAME[a->s]); ma(" si e' ripreso dalla confusione!"); say(M); }
      burn_tick(s);
      return;
    }
    if (!conf[s]) { m0(SP_NAME[a->s]); ma(" si e' ripreso dalla confusione!"); say(M); }
  }
  m0(""); nm(s); ma(" usa "); ma(MV_NAME[move]); ma("!"); say(M);
  if (rand() % 100 >= mvd->acc) { say("Ma lo manca clamorosamente!"); burn_tick(s); return; }
  base = (uint32_t)(2 * a->lv / 5 + 2) * mvd->power * stage(st_x(a, 0), stg[s][0]) / stage(st_x(d, 1), stg[o][1]) / 50 + 2;
  if (mvd->type == SPECIES[a->s].type) base = base * 3 / 2;
  e = EFF[mvd->type][SPECIES[d->s].type];
  base = base * e / 2;
  crit = (rand() & 15) == 0;
  if (crit) base = base * 3 / 2;
  base = base * (85 + rand() % 16) / 100;
  dmg = base ? (uint16_t)base : 1;
  d->hp = d->hp > dmg ? d->hp - dmg : 0;
  shake(o); anim_hp(o);
  if (crit) say("Colpo critico!");
  if (e > 2) say("E' superefficace!");
  if (e < 2) say("Non e' molto efficace...");
  if (mvd->fxk && rand() % 100 < mvd->fxp) {
    uint8_t self = mvd->fxk >= 6, t = self ? s : o, k = mvd->fxk;
    if (A[t]->hp) {
      if (k == 1) bump(t, 0, -1);
      if (k == 2) bump(t, 1, -1);
      if (k == 3) bump(t, 2, -1);
      if (k == 6) bump(t, 0, 1);
      if (k == 7) bump(t, 1, 1);
      if (k == 8) bump(t, 2, 1);
      if (k == 4 && !conf[t]) { conf[t] = 2 + rand() % 3; m0(""); nm(t); ma(" e' confuso da tutte quelle chiacchiere!"); sfx(SFX_FAIL); say(M); }
      if (k == 5 && !burn[t]) { burn[t] = 1; m0(""); nm(t); ma(" si scotta! Perdera' PV ogni turno."); sfx(SFX_FAIL); say(M); }
    }
  }
  burn_tick(s);
}
static void enemy_turn(void) {
  uint8_t em[4], n = known_moves(A[1], em);
  if (A[1]->hp && A[0]->hp) attack(1, em[rand() % n]);
}
static void gain_xp(Mon *m, uint16_t amt) {
  uint8_t before[4], nb, after[4], na, i, j, f;
  m0(SP_NAME[m->s]); ma(" guadagna "); mn(amt); ma(" punti esperienza!"); say(M);
  m->xp += amt;
  while (m->lv < 50 && m->xp >= (uint32_t)(m->lv + 1) * (m->lv + 1) * (m->lv + 1)) {
    uint16_t old = st_hp(m);
    nb = known_moves(m, before);
    m->lv++;
    m->hp += st_hp(m) - old;
    sfx(SFX_LEVEL);
    shown[0] = m->hp; info(0);
    m0(SP_NAME[m->s]); ma(" sale al livello "); mn(m->lv); ma("!"); say(M);
    na = known_moves(m, after);
    for (i = 0; i < na; i++) {
      f = 0; for (j = 0; j < nb; j++) if (before[j] == after[i]) f = 1;
      if (!f) { m0(SP_NAME[m->s]); ma(" impara "); ma(MV_NAME[after[i]]); ma("!"); say(M); }
    }
  }
  if (SPECIES[m->s].evo_to != 255 && m->lv >= SPECIES[m->s].evo_lv) {
    uint16_t old = st_hp(m);
    m0("Cosa? "); ma(SP_NAME[m->s]); ma(" si sta evolvendo!"); say(M);
    sfx(SFX_EVO);
    for (i = 0; i < 12; i++) { BGP_REG = (i & 1) ? 0x00 : 0xE4; if (cgb) set_bkg_palette(7, 1, MONPAL[(i & 1) ? SPECIES[m->s].evo_to : m->s]); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); }
    BGP_REG = 0xE4;
    m0("Incredibile! "); ma(SP_NAME[m->s]); ma(" e' diventato ");
    m->s = SPECIES[m->s].evo_to;
    m->hp += st_hp(m) - old;
    bit_set(G.seen, m->s); bit_set(G.caught, m->s);
    ma(SP_NAME[m->s]); ma("!");
    place(0);
    say(M);
  }
}
/* 0 continue, 1 win, 2 lose */
static uint8_t resolve(void) {
  uint8_t i;
  if (!A[1]->hp) {
    m0(""); nm(1); ma(" e' esausto!"); say(M);
    if (A[0]->hp) gain_xp(A[0], trainer ? A[1]->lv * 15 : A[1]->lv * 10);
    for (i = 0; i < ne; i++) if (E[i].hp) break;
    if (i == ne) {
      if (trainer) { m0("Hai sconfitto "); ma(NPCS[tnpc].name); ma("!"); say(M); }
      else { m0("Trovi "); mn(10 + A[1]->lv * 8); ma(" # tra l'erba!"); G.money += 10 + A[1]->lv * 8; say(M); }
      return 1;
    }
    ei = i; A[1] = &E[ei]; reset_side(1);
    bit_set(G.seen, A[1]->s);
    m0(NPCS[tnpc].name); ma(" manda in campo "); ma(SP_NAME[A[1]->s]); ma("!");
    place(1);
    say(M);
  }
  if (!A[0]->hp) {
    m0(SP_NAME[A[0]->s]); ma(" e' esausto!"); say(M);
    if (!alive_count()) { say("Non hai piu' mostrelli in grado di lottare..."); return 2; }
    while (1) {
      i = team_screen(1);
      if (i != 255 && G.party[i].hp) break;
    }
    scene();
    box_show();
    pi = i; A[0] = &G.party[pi]; reset_side(0);
    place(0);
    m0("Vai, "); ma(SP_NAME[A[0]->s]); ma("!"); say(M);
  }
  return 0;
}
static uint8_t menu2x2(void) {
  static const char *const L[4] = {"LOTTA", "ZAINO", "MOSTRI", "FUGA"};
  static uint8_t c = 0;
  uint8_t i, k;
  box_show();
  m0("Cosa fa "); ma(SP_NAME[A[0]->s]); ma("?"); wtxt(1, 1, M);
  for (i = 0; i < 4; i++) wtxt(3 + (i & 1) * 9, 3 + (i >> 1), L[i]);
  while (1) {
    for (i = 0; i < 4; i++) wtile(2 + (i & 1) * 9, 3 + (i >> 1), i == c ? FT('<') : FT(' '));
    wait_vbl_done();
    k = pad();
    if (k & (J_LEFT | J_RIGHT)) c ^= 1;
    if (k & (J_UP | J_DOWN)) c ^= 2;
    if (k & J_A) { sfx(SFX_SEL); return c; }
  }
}
static uint8_t pick_move(void) {
  uint8_t i, c = 0, k;
  nmv = known_moves(A[0], mv);
  box_show();
  for (i = 0; i < nmv; i++) {
    strncpy(M, MV_NAME[mv[i]], 13); M[13] = 0; wtxt(2, 1 + i, M);
    wnum(16, 1 + i, MOVES[mv[i]].power, 3);
  }
  while (1) {
    for (i = 0; i < nmv; i++) wtile(1, 1 + i, i == c ? FT('<') : FT(' '));
    for (i = 1; i < 19; i++) wtile(i, 0, UI_BASE + 1);
    m0(" "); ma(TYPE_NAME[MOVES[mv[c]].type]); ma(" Prec "); mn(MOVES[mv[c]].acc); ma(" "); wtxt(1, 0, M);
    wait_vbl_done();
    k = pad();
    if (k & J_UP) c = c ? c - 1 : nmv - 1;
    if (k & J_DOWN) c = (c + 1) % nmv;
    if (k & J_A) { sfx(SFX_SEL); return mv[c]; }
    if (k & J_B) return 255;
  }
}
static void turn_with(uint8_t move) {
  if (espd(0) >= espd(1)) { attack(0, move); if (A[1]->hp && A[0]->hp) enemy_turn(); }
  else { enemy_turn(); if (A[0]->hp && A[1]->hp) attack(0, move); }
}
static uint8_t try_catch(void) {
  uint16_t max = st_hp(A[1]), r100 = (uint16_t)((uint32_t)A[1]->hp * 100 / max);
  uint16_t ch = (uint16_t)SPECIES[A[1]->s].catchp * (110 - r100 * 80 / 100) / 100 + 5;
  uint8_t i;
  if (ch > 95) ch = 95;
  G.items[IT_VASETTO]--;
  say("Lanci un Vasetto di Vetro...");
  for (i = 0; i < 3; i++) { move_bkg(i & 1 ? 2 : 254, 0); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); }
  move_bkg(0, 0);
  if (rand() % 100 < ch) {
    sfx(SFX_CATCH);
    m0("Preso! "); ma(SP_NAME[A[1]->s]); ma(" e' nel vasetto. Chiudi bene il coperchio!"); say(M);
    if (G.np == 6) { if (G.nb < BOX_MAX) say("La squadra e' piena: lo mandi in Cantina."); else say("Anche la Cantina e' piena... lo lasci libero."); }
    add_caught(A[1]);
    return 1;
  }
  sfx(SFX_FAIL);
  m0("Accidenti! "); ma(SP_NAME[A[1]->s]); ma(" e' uscito dal vasetto!"); say(M);
  return 0;
}

uint8_t battle(uint8_t npc) BANKED {
  uint8_t i, c, r, it;
  trainer = npc != 255; tnpc = npc;
  if (trainer) {
    const NpcD *n = &NPCS[npc];
    ne = n->nt;
    for (i = 0; i < ne; i++) mon_make(&E[i], TEAM[n->t0 + i][0], TEAM[n->t0 + i][1]);
  } else { ne = 1; E[0] = wild_mon; }
  ei = 0;
  for (pi = 0; pi < G.np; pi++) if (G.party[pi].hp) break;
  A[0] = &G.party[pi]; A[1] = &E[0];
  reset_side(0); reset_side(1);
  bit_set(G.seen, E[0].s);
  music(MUS_BATTLE);
  scene();
  if (trainer) { m0(NPCS[npc].name); ma(" ti sfida! Manda in campo "); ma(SP_NAME[E[0].s]); ma("!"); }
  else { m0("Salta fuori un "); ma(SP_NAME[E[0].s]); ma(" selvatico!"); }
  box_show(); say(M);
  m0("Vai, "); ma(SP_NAME[A[0]->s]); ma("!"); say(M);
  while (1) {
    c = menu2x2();
    if (c == 0) {
      uint8_t m = pick_move();
      if (m == 255) continue;
      box_show();
      turn_with(m);
    } else if (c == 1) {
      it = bag_pick(1);
      scene(); box_show();
      if (it == 255) continue;
      if (it == IT_VASETTO) {
        if (trainer) { say("Non si rubano i mostrelli degli altri! Qui siamo gente onesta (quasi)."); continue; }
        if (try_catch()) { box_hide(); return 3; }
        enemy_turn();
      } else {
        uint8_t ok = 0, kind = ITEMS[it].kind;
        if (kind == 2 || kind == 3) {
          uint8_t *f = kind == 2 ? &conf[0] : &burn[0];
          m0(SP_NAME[A[0]->s]);
          if (*f) { *f = 0; ok = 1; ma(kind == 2 ? " non e' piu' confuso! Recupera la lucidita'." : " si rinfresca col gelato! Niente piu' scottatura."); }
          else ma(kind == 2 ? " non e' confuso." : " non e' scottato.");
        } else {
          uint8_t t = team_screen(2);
          scene(); box_show();
          if (t == 255) continue;
          ok = use_heal(&G.party[t], it);
          if (ok && t == pi) { sfx(SFX_HEAL); }
        }
        if (!ok) { say(M); continue; }
        G.items[it]--;

        { char tmp[100]; strcpy(tmp, M); m0("Usi "); ma(IT_NAME[it]); ma("! "); ma(tmp); }
        say(M);
        anim_hp(0);
        enemy_turn();
      }
    } else if (c == 2) {
      i = team_screen(1);
      scene(); box_show();
      if (i == 255 || i == pi) continue;
      if (!G.party[i].hp) { say("E' esausto, lascialo riposare."); continue; }
      reset_side(0);
      pi = i; A[0] = &G.party[pi];
      place(0);
      m0("Vai, "); ma(SP_NAME[A[0]->s]); ma("!"); say(M);
      enemy_turn();
    } else {
      if (trainer) { say("Non si scappa da un emiliano che ti ha sfidato! Sarebbe un disonore per tre generazioni."); continue; }
      if (espd(0) >= espd(1) || rand() % 10 < 7) { say("Te la sei svignata. Con eleganza, piu' o meno."); box_hide(); return 2; }
      say("Non riesci a scappare!");
      enemy_turn();
    }
    r = resolve();
    if (r == 1) { box_hide(); return 1; }
    if (r == 2) { box_hide(); return 0; }
  }
}
