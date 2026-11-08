#include "common.h"

Save G;
Mon wild_mon;
uint8_t cgb;
char buf[260];
char M[140];
static char sbuf[260];
static uint8_t keys, prevk;

#define FT(c) (FONT_BASE + (uint8_t)(c) - 32)
#define SPACE FT(' ')

/* ---------------- input */
uint8_t pad(void) {
  prevk = keys;
  keys = joypad();
  if (keys & ~prevk) initrand(DIV_REG ^ (keys << 4) ^ rand());
  return keys & ~prevk;
}

/* ---------------- sound: two-channel tune player + short effects */
static const uint16_t *ma_, *mb_, *pa_, *pb_;
static uint8_t ca_, cb_, sfx_t;
static const uint16_t SFX_DATA[8][16] = {
  {0, 0},                                       /* hit (noise) */
  {1547, 6, 1602, 6, 1650, 6, 1673, 12, 0, 0},  /* heal */
  {1650, 5, 1650, 5, 1650, 5, 1798, 16, 0, 0},  /* level */
  {1547, 6, 1602, 6, 1650, 6, 1798, 18, 0, 0},  /* catch */
  {1650, 8, 1575, 8, 1547, 16, 0, 0},           /* fail */
  {1547, 3, 1590, 3, 1633, 3, 1673, 3, 1547, 3, 1590, 3, 1673, 6, 0, 0},
  {1798, 3, 1849, 4, 0, 0},                     /* select */
  {1547, 8, 1602, 8, 1650, 8, 1798, 8, 1825, 8, 1849, 20},
};
static const uint16_t *sp_;
static uint8_t sc_;
static void tone1(uint16_t f, uint8_t env) {
  if (!f) { NR12_REG = 0; NR14_REG = 0x80; return; }
  NR10_REG = 0; NR11_REG = 0x80; NR12_REG = env; NR13_REG = f & 0xFF; NR14_REG = 0x80 | (f >> 8);
}
static void mus_tick(void) {
  if (sp_) {
    if (--sc_ == 0) {
      uint16_t f = *sp_++;
      if (!f || sp_ > &SFX_DATA[7][15]) { sp_ = 0; sfx_t = 0; }
      else { sc_ = (uint8_t)*sp_++; tone1(f, 0xA2); }
    }
  }
  if (!ma_) return;
  if (--ca_ == 0) {
    uint16_t f = *pa_++;
    if (f == 0xFFFF) { pa_ = ma_; f = *pa_++; }
    ca_ = (uint8_t)*pa_++;
    if (!sp_) tone1(f, 0x63);
  }
  if (--cb_ == 0) {
    uint16_t f = *pb_++;
    if (f == 0xFFFF) { pb_ = mb_; f = *pb_++; }
    cb_ = (uint8_t)*pb_++;
    if (!f) { NR22_REG = 0; NR24_REG = 0x80; }
    else { NR21_REG = 0x40; NR22_REG = 0x41; NR23_REG = f & 0xFF; NR24_REG = 0x80 | (f >> 8); }
  }
}
static uint16_t tuneA[400], tuneB[400];
static uint8_t cur_tune = 255;
static void copy_tune(uint16_t *dst, const uint16_t *src) {
  uint16_t i = 0;
  while (i < 398 && src[i] != 0xFFFF) { dst[i] = src[i]; dst[i + 1] = src[i + 1]; i += 2; }
  dst[i] = 0xFFFF;
}
void music(uint8_t id) {
  uint8_t b;
  if (id == cur_tune) return;
  cur_tune = id;
  __critical { ma_ = 0; }
  NR12_REG = 0; NR22_REG = 0;
  b = _current_bank;
  SWITCH_ROM(BANK(BIGDATA));
  copy_tune(tuneA, MUS_A[id]);
  copy_tune(tuneB, MUS_B[id]);
  SWITCH_ROM(b);
  __critical {
    mb_ = tuneB; pa_ = tuneA; pb_ = tuneB; ca_ = 1; cb_ = 1; ma_ = tuneA;
  }
}
void sfx(uint8_t k) {
  if (k == SFX_HIT) { NR41_REG = 0; NR42_REG = 0xF2; NR43_REG = 0x61; NR44_REG = 0x80; return; }
  __critical { sp_ = SFX_DATA[k]; sc_ = 1; sfx_t = 1; }
}

/* ---------------- tiles / text */
void wtile(uint8_t x, uint8_t y, uint8_t t) { set_win_tile_xy(x, y, t); }
void btile(uint8_t x, uint8_t y, uint8_t t, uint8_t pal) {
  set_bkg_tile_xy(x, y, t);
  if (cgb) { VBK_REG = 1; set_bkg_tile_xy(x, y, pal); VBK_REG = 0; }
}
void wtxt(uint8_t x, uint8_t y, const char *s) { while (*s && x < 20) set_win_tile_xy(x++, y, FT(*s++)); }
void btxt(uint8_t x, uint8_t y, const char *s) { while (*s && x < 20) btile(x++, y, FT(*s++), 5); }
void wnum(uint8_t x, uint8_t y, uint16_t v, uint8_t w) {
  uint8_t i = w;
  do { set_win_tile_xy(x + --i, y, FT('0' + v % 10)); v /= 10; } while (v && i);
  while (i) set_win_tile_xy(x + --i, y, SPACE);
}
void win_clear(uint8_t y, uint8_t h) {
  uint8_t x, r;
  for (r = y; r < y + h; r++)
    for (x = 0; x < 20; x++) {
      set_win_tile_xy(x, r, SPACE);
      if (cgb) { VBK_REG = 1; set_win_tile_xy(x, r, 5); VBK_REG = 0; }
    }
}
void win_frame(uint8_t x, uint8_t y, uint8_t w, uint8_t h) {
  uint8_t i;
  wtile(x, y, UI_BASE); wtile(x + w - 1, y, UI_BASE + 2); wtile(x, y + h - 1, UI_BASE + 5); wtile(x + w - 1, y + h - 1, UI_BASE + 7);
  for (i = 1; i < w - 1; i++) { wtile(x + i, y, UI_BASE + 1); wtile(x + i, y + h - 1, UI_BASE + 6); }
  for (i = 1; i < h - 1; i++) { wtile(x, y + i, UI_BASE + 3); wtile(x + w - 1, y + i, UI_BASE + 4); }
}
void box_show(void) {
  HIDE_SPRITES;
  win_clear(0, 6);
  win_frame(0, 0, 20, 6);
  move_win(7, 96);
  SHOW_WIN;
}
void box_hide(void) { HIDE_WIN; move_win(7, 144); }
void full_win(void) {
  HIDE_SPRITES;
  win_clear(0, 18);
  move_win(7, 0);
  SHOW_WIN;
}
void wait_a(void) {
  uint8_t t = 0;
  while (1) {
    wait_vbl_done();
    t++;
    wtile(18, 5, (t & 16) ? FT('>') : UI_BASE + 6);
    if (pad() & (J_A | J_B)) break;
  }
  wtile(18, 5, UI_BASE + 6);
  sfx(SFX_SEL);
}
static void type_out(const char *s, uint8_t name) {
  uint8_t col = 0, line = 0, wl, i;
  const char *p = s;
  (void)name;
  while (*p) {
    wl = 0;
    while (p[wl] && p[wl] != ' ') wl++;
    if (col && col + wl > 18) { col = 0; line++; }
    for (i = 0; i < wl; i++) {
      if (col >= 18) { col = 0; line++; }
      if (line >= 4) {
        wait_a();
        for (line = 1; line < 5; line++) for (col = 1; col < 19; col++) wtile(col, line, SPACE);
        line = 0; col = 0;
      }
      wtile(1 + col, 1 + line, FT(p[i]));
      col++;
      if (!(joypad() & (J_A | J_B))) wait_vbl_done();
    }
    p += wl;
    if (*p == ' ') { if (col && col < 18) col++; p++; }
  }
  wait_a();
}
void say_n(const char *name, const char *s) {
  strncpy(sbuf, s, 259); sbuf[259] = 0;
  box_show();
  if (name) { wtile(1, 0, FT(' ')); wtxt(2, 0, name); wtile(2 + strlen(name), 0, FT(' ')); }
  type_out(sbuf, 0);
}
void say(const char *s) { say_n(0, s); }
const char *txt(uint16_t id) {
  uint8_t b = _current_bank;
  SWITCH_ROM(BANK(TXT));
  strncpy(buf, TXT + TXTOFF[id], 259);
  buf[259] = 0;
  SWITCH_ROM(b);
  return buf;
}
void wprint(uint8_t x, uint8_t y, uint8_t w, const char *s) {
  uint8_t col = 0, wl, i;
  while (*s && y < 18) {
    wl = 0;
    while (s[wl] && s[wl] != ' ') wl++;
    if (col && col + wl > w) { col = 0; y++; }
    for (i = 0; i < wl; i++) { if (col >= w) { col = 0; y++; } wtile(x + col, y, FT(s[i])); col++; }
    s += wl;
    if (*s == ' ') { if (col) col++; s++; }
  }
}
uint8_t list_menu(uint8_t x, uint8_t y, uint8_t n, uint8_t cur, uint8_t step) {
  uint8_t k;
  if (cur >= n) cur = 0;
  while (1) {
    wtile(x, y + cur * step, FT('<'));
    wait_vbl_done();
    k = pad();
    if (k & (J_UP | J_DOWN)) {
      wtile(x, y + cur * step, SPACE);
      if (k & J_UP) cur = cur ? cur - 1 : n - 1; else cur = (cur + 1) % n;
      sfx(SFX_SEL);
    }
    if (k & J_A) { sfx(SFX_SEL); return cur; }
    if (k & J_B) { wtile(x, y + cur * step, SPACE); return 255; }
  }
}
void m0(const char *s) { strcpy(M, s); }
void ma(const char *s) { strcat(M, s); }
void mn(uint16_t v) {
  char t[6]; uint8_t i = 5; t[5] = 0;
  do { t[--i] = '0' + v % 10; v /= 10; } while (v);
  strcat(M, t + i);
}
void hp_bar(uint8_t win, uint8_t x, uint8_t y, uint16_t hp, uint16_t max) {
  uint16_t px = max ? (uint16_t)(((uint32_t)hp * 48) / max) : 0;
  uint8_t i, f;
  if (hp && !px) px = 1;
  for (i = 0; i < 8; i++) {
    uint8_t t;
    if (i == 0) t = UI_BASE + 17;
    else if (i == 7) t = UI_BASE + 18;
    else { f = px >= 8 ? 8 : (uint8_t)px; px -= f; t = UI_BASE + 8 + f; }
    if (win) wtile(x + i, y, t); else btile(x + i, y, t, 5);
  }
}

/* ---------------- monsters */
uint16_t st_hp(Mon *m) { return (uint16_t)SPECIES[m->s].hp * 2 * m->lv / 100 + m->lv + 10; }
uint16_t st_x(Mon *m, uint8_t which) {
  const SpeciesD *b = &SPECIES[m->s];
  uint8_t v = which == 0 ? b->atk : which == 1 ? b->def : b->spd;
  return (uint16_t)v * 2 * m->lv / 100 + 5;
}
void mon_make(Mon *m, uint8_t s, uint8_t lv) {
  m->s = s; m->lv = lv; m->xp = (uint32_t)lv * lv * lv; m->hp = st_hp(m);
}
uint8_t known_moves(Mon *m, uint8_t *out) {
  const SpeciesD *b = &SPECIES[m->s];
  uint8_t i, n = 0;
  for (i = 0; i < b->nml; i++) {
    if (LEARN[b->ml0 + i][1] > m->lv) continue;
    if (n == 4) { out[0] = out[1]; out[1] = out[2]; out[2] = out[3]; n = 3; }
    out[n++] = LEARN[b->ml0 + i][0];
  }
  return n;
}
void load_mon_tiles(uint8_t s, uint8_t base, uint8_t flip) {
  static uint8_t g[64];
  uint8_t t[16], tx, ty, r, c, b = _current_bank;
  SWITCH_ROM(BANK(MONGFX));
  memcpy(g, MONGFX[s], 64);
  SWITCH_ROM(b);
  for (ty = 0; ty < 6; ty++)
    for (tx = 0; tx < 6; tx++) {
      for (r = 0; r < 8; r++) {
        uint8_t sy = (ty * 8 + r) / 3, lo = 0, hi = 0;
        for (c = 0; c < 8; c++) {
          uint8_t sx = (tx * 8 + c) / 3, v;
          if (flip) sx = 15 - sx;
          v = (g[sy * 4 + (sx >> 2)] >> ((3 - (sx & 3)) * 2)) & 3;
          lo |= (v & 1) << (7 - c); hi |= (v >> 1) << (7 - c);
        }
        t[r * 2] = lo; t[r * 2 + 1] = hi;
      }
      set_bkg_data(base + ty * 6 + tx, 1, t);
    }
}
void set_mon_pal(uint8_t slot, uint8_t s) { if (cgb) set_bkg_palette(slot, 1, MONPAL[s]); }
void draw_mon(uint8_t win, uint8_t x, uint8_t y, uint8_t base, uint8_t pal) {
  uint8_t i, j;
  for (j = 0; j < 6; j++)
    for (i = 0; i < 6; i++) {
      if (win) {
        set_win_tile_xy(x + i, y + j, base + j * 6 + i);
        if (cgb) { VBK_REG = 1; set_win_tile_xy(x + i, y + j, pal); VBK_REG = 0; }
      } else btile(x + i, y + j, base + j * 6 + i, pal);
    }
}
void bit_set(uint8_t *a, uint8_t i) { a[i >> 3] |= 1 << (i & 7); }
uint8_t bit_get(uint8_t *a, uint8_t i) { return a[i >> 3] & (1 << (i & 7)); }
uint8_t alive_count(void) { uint8_t i, n = 0; for (i = 0; i < G.np; i++) if (G.party[i].hp) n++; return n; }
void heal_all(void) { uint8_t i; for (i = 0; i < G.np; i++) G.party[i].hp = st_hp(&G.party[i]); }
uint8_t use_heal(Mon *m, uint8_t item) {
  const ItemD *it = &ITEMS[item];
  uint16_t max = st_hp(m), before = m->hp;
  m0(SP_NAME[m->s]);
  if (it->kind == 1) {
    if (!m->hp) { ma(" e' esausto: serve un Caffe' o un'osteria."); return 0; }
    if (m->hp >= max) { ma(" e' gia' sazio."); return 0; }
    m->hp += it->amount; if (m->hp > max) m->hp = max;
    ma(" mangia e recupera "); mn(m->hp - before); ma(" PV!");
    return 1;
  }
  if (it->kind == 4) {
    if (m->hp) { ma(" e' gia' sveglio, non esagerare col caffe'."); return 0; }
    m->hp = (uint16_t)((uint32_t)max * it->amount / 100);
    ma(" beve il Caffe' Ristretto e riprende i sensi!");
    return 1;
  }
  m0("Si usa solo durante le lotte.");
  return 0;
}
void add_caught(Mon *m) {
  bit_set(G.caught, m->s); bit_set(G.seen, m->s);
  if (G.np < 6) G.party[G.np++] = *m;
  else if (G.nb < BOX_MAX) G.box[G.nb++] = *m;
}

/* ---------------- graphics setup */
void load_meta(void) {
  uint8_t b = _current_bank;
  SWITCH_ROM(BANK(BIGDATA));
  set_bkg_data(META_BASE, N_META * 4, TILES_META);
  SWITCH_ROM(b);
}
static void load_gfx(void) {
  uint8_t b = _current_bank;
  SWITCH_ROM(BANK(BIGDATA));
  set_sprite_data(OBJ_BASE, 12, TILES_OBJ);
  set_bkg_data(META_BASE, N_META * 4, TILES_META);
  set_bkg_data(UI_BASE, 20, TILES_UI);
  set_bkg_data(FONT_BASE, 95, TILES_FONT);
  SWITCH_ROM(b);
  if (cgb) { set_bkg_palette(0, 8, BG_PALS); set_sprite_palette(0, 8, OBJ_PALS); }
  BGP_REG = 0xE4; OBP0_REG = 0xE4; OBP1_REG = 0xE4;
}

/* ---------------- save */
void save_game(void) {
  memcpy(G.magic, "MOS1", 4);
  ENABLE_RAM; SWITCH_RAM(0);
  memcpy((uint8_t *)0xA000, &G, sizeof(Save));
  DISABLE_RAM;
}
uint8_t load_game(void) {
  uint8_t ok;
  ENABLE_RAM; SWITCH_RAM(0);
  ok = memcmp((uint8_t *)0xA000, "MOS1", 4) == 0;
  if (ok) memcpy(&G, (uint8_t *)0xA000, sizeof(Save));
  DISABLE_RAM;
  return ok;
}

/* ---------------- overworld */
static uint8_t cam_x, cam_y;
static uint8_t row[32];
static uint8_t frame, step_t;
static uint8_t mt[256];
static void draw_map(void) {
  uint8_t x, y, i, b = _current_bank;
  SWITCH_ROM(BANK(BIGDATA));
  memcpy(mt, MAPTILES[G.map], 256);
  SWITCH_ROM(b);
  DISPLAY_OFF;
  HIDE_WIN;
  for (y = 0; y < 16; y++) {
    for (i = 0; i < 2; i++) {
      for (x = 0; x < 16; x++) {
        uint8_t t = META_BASE + mt[y * 16 + x] * 4 + i * 2;
        row[x * 2] = t; row[x * 2 + 1] = t + 1;
      }
      set_bkg_tiles(0, y * 2 + i, 32, 1, row);
      if (cgb) {
        for (x = 0; x < 16; x++) row[x * 2] = row[x * 2 + 1] = META_PAL[mt[y * 16 + x]];
        VBK_REG = 1; set_bkg_tiles(0, y * 2 + i, 32, 1, row); VBK_REG = 0;
      }
    }
  }
  DISPLAY_ON;
}
static uint8_t npc_at(uint8_t x, uint8_t y) {
  const MapD *m = &MAPS[G.map];
  uint8_t i;
  for (i = 0; i < m->nnpc; i++) if (NPCS[m->npc0 + i].x == x && NPCS[m->npc0 + i].y == y) return m->npc0 + i;
  return 255;
}
static void place_actors(uint8_t px, uint8_t py) {
  const MapD *m = &MAPS[G.map];
  int16_t cx = (int16_t)px - 72, cy = (int16_t)py - 64;
  uint8_t i, f;
  if (cx < 0) cx = 0; if (cx > 96) cx = 96;
  if (cy < 0) cy = 0; if (cy > 112) cy = 112;
  cam_x = cx; cam_y = cy;
  move_bkg(cam_x, cam_y);
  f = G.dir == 1 ? 2 : (frame & 1);
  set_sprite_tile(0, f * 4); set_sprite_tile(1, f * 4 + 2);
  set_sprite_prop(0, 0); set_sprite_prop(1, 0);
  move_sprite(0, px - cam_x + 8, py - cam_y + 16);
  move_sprite(1, px - cam_x + 16, py - cam_y + 16);
  for (i = 0; i < m->nnpc && i < 18; i++) {
    const NpcD *n = &NPCS[m->npc0 + i];
    int16_t sx = (int16_t)n->x * 16 - cam_x, sy = (int16_t)n->y * 16 - cam_y;
    uint8_t o = 2 + i * 2;
    set_sprite_tile(o, 0); set_sprite_tile(o + 1, 2);
    set_sprite_prop(o, n->pal); set_sprite_prop(o + 1, n->pal);
    if (sx < -16 || sx > 160 || sy < -16 || sy > 144) { move_sprite(o, 0, 0); move_sprite(o + 1, 0, 0); }
    else { move_sprite(o, sx + 8, sy + 16); move_sprite(o + 1, sx + 16, sy + 16); }
  }
  for (i = 2 + m->nnpc * 2; i < 40; i++) move_sprite(i, 0, 0);
}
static void enter_map(void) {
  draw_map();
  place_actors(G.x * 16, G.y * 16);
  SHOW_SPRITES;
  music(MAPS[G.map].music);
}
static void after_battle(uint8_t res) {
  load_meta();
  if (cgb) set_bkg_palette(0, 8, BG_PALS);
  if (res == 0) {
    heal_all();
    G.map = G.hmap; G.x = G.hx; G.y = G.hy; G.dir = 0;
    G.money = G.money - G.money / 4;
    enter_map();
    say("Ti gira la testa e svieni... Ti risvegli all'osteria. Hai perso un po' di soldi per il conto.");
    box_hide(); SHOW_SPRITES;
    return;
  }
  enter_map();
}
static void talk_npc(uint8_t ni) {
  const NpcD *n = &NPCS[ni];
  uint8_t i, beaten = n->tid != 255 && bit_get(G.defeated, n->tid);
  if (n->kind >= 3 && beaten) {
    say_n(n->name, txt(n->na ? n->a0 + n->na - 1 : n->l0));
    return;
  }
  if (n->kind >= 3 && !alive_count()) { say_n(n->name, "La tua squadra e' a pezzi! Vai prima a mangiare qualcosa, poi ne riparliamo."); return; }
  for (i = 0; i < n->nl; i++) say_n(n->name, txt(n->l0 + i));
  if (n->kind == 1) {
    heal_all();
    G.hmap = G.map; G.hx = MAPS[G.map].hx; G.hy = MAPS[G.map].hy;
    sfx(SFX_HEAL);
    save_game();
    say("Squadra curata! (Partita salvata)");
  } else if (n->kind == 2) {
    shop_screen();
  } else if (n->kind >= 3) {
    uint8_t r;
    box_hide();
    sfx(SFX_ENC);
    r = battle(ni);
    after_battle(r);
    if (r == 1) {
      bit_set(G.defeated, n->tid);
      G.money += n->reward * 2;
      for (i = 0; i < n->na; i++) say_n(n->name, txt(n->a0 + i));
      m0("Hai ricevuto "); mn(n->reward * 2); ma(" #."); say(M);
      if (n->badge != 255) {
        G.badges |= 1 << n->badge;
        sfx(SFX_LEVEL);
        m0("Ottieni il "); ma(BADGE[n->badge]); ma("!"); say(M);
        if (G.badges == (1 << N_BADGES) - 1 && !G.champion) ending();
      }
    }
  }
}
static void interact(void) {
  static const int8_t DX[4] = {0, 0, -1, 1}, DY[4] = {1, -1, 0, 0};
  int8_t tx = G.x + DX[G.dir], ty = G.y + DY[G.dir];
  const MapD *m = &MAPS[G.map];
  uint8_t i, ni;
  if (tx < 0 || ty < 0 || tx > 15 || ty > 15) return;
  for (i = 0; i < m->nsign; i++)
    if (SIGNS[m->sign0 + i].x == tx && SIGNS[m->sign0 + i].y == ty) { say_n("Cartello", txt(SIGNS[m->sign0 + i].txt)); box_hide(); SHOW_SPRITES; return; }
  ni = npc_at(tx, ty);
  if (ni == 255) return;
  talk_npc(ni);
  box_hide();
  SHOW_SPRITES;
}
static void roll_wild(void) {
  const MapD *m = &MAPS[G.map];
  uint8_t i, tot = 0, r;
  for (i = 0; i < m->nwild; i++) tot += WILD[m->wild0 + i].w;
  r = rand() % tot;
  for (i = 0; i < m->nwild; i++) {
    const WildD *w = &WILD[m->wild0 + i];
    if (r < w->w) { mon_make(&wild_mon, w->s, w->lo + rand() % (w->hi - w->lo + 1)); return; }
    r -= w->w;
  }
}
static void try_move(uint8_t dir, uint8_t run) {
  static const int8_t DX[4] = {0, 0, -1, 1}, DY[4] = {1, -1, 0, 0};
  int8_t nx = G.x + DX[dir], ny = G.y + DY[dir];
  uint8_t i, t, sp = run ? 4 : 2;
  const MapD *m = &MAPS[G.map];
  G.dir = dir;
  if (nx < 0 || ny < 0 || nx > 15 || ny > 15) { place_actors(G.x * 16, G.y * 16); return; }
  t = mt[ny * 16 + nx];
  if ((META_FLAGS[t] & 1) || npc_at(nx, ny) != 255) { place_actors(G.x * 16, G.y * 16); return; }
  frame++;
  for (i = sp; i <= 16; i += sp) {
    place_actors(G.x * 16 + DX[dir] * i, G.y * 16 + DY[dir] * i);
    if (i == 8) frame++;
    wait_vbl_done();
  }
  G.x = nx; G.y = ny;
  place_actors(G.x * 16, G.y * 16);
  for (i = 0; i < m->nex; i++) {
    const ExitD *e = &EXITS[m->ex0 + i];
    if (e->x == nx && e->y == ny) {
      G.map = e->to; G.x = e->tx; G.y = e->ty;
      enter_map();
      m0(MAPS[G.map].name);
      return;
    }
  }
  if ((META_FLAGS[t] & 2) && alive_count() && rand() % 10 == 0) {
    uint8_t r;
    sfx(SFX_ENC);
    for (i = 0; i < 6; i++) { BGP_REG = (i & 1) ? 0x1B : 0xE4; if (cgb) move_bkg(cam_x + ((i & 1) ? 3 : 0), cam_y); wait_vbl_done(); wait_vbl_done(); wait_vbl_done(); }
    BGP_REG = 0xE4;
    roll_wild();
    r = battle(255);
    after_battle(r);
  }
}
void main(void) {
  uint8_t k, hold = 0;
  cgb = (_cpu == CGB_TYPE);
  if (cgb) cpu_fast();
  DISPLAY_OFF;
  NR52_REG = 0x80; NR50_REG = 0x77; NR51_REG = 0xFF;
  SPRITES_8x16;
  load_gfx();
  win_clear(0, 18);
  move_win(7, 0);
  SHOW_BKG; SHOW_WIN;
  add_VBL(mus_tick);
  set_interrupts(VBL_IFLAG);
  DISPLAY_ON;
  if (title() == 0) new_game();
  load_meta();
  box_hide();
  enter_map();
  while (1) {
    wait_vbl_done();
    k = pad();
    if (k & J_START) { start_menu(); continue; }
    if (k & J_A) { interact(); continue; }
    if (keys & (J_UP | J_DOWN | J_LEFT | J_RIGHT)) {
      uint8_t d = (keys & J_DOWN) ? 0 : (keys & J_UP) ? 1 : (keys & J_LEFT) ? 2 : 3;
      if (G.dir != d && hold < 3 && !(prevk & (J_UP | J_DOWN | J_LEFT | J_RIGHT))) { G.dir = d; place_actors(G.x * 16, G.y * 16); hold++; continue; }
      try_move(d, keys & J_B);
      keys = joypad();
    } else hold = 0;
  }
}
