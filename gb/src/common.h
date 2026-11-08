#ifndef COMMON_H
#define COMMON_H
#include <gb/gb.h>
#include <gb/cgb.h>
#include <stdint.h>
#include <string.h>
#include <rand.h>
#include "gen.h"

typedef struct { uint8_t s, lv; uint16_t hp; uint32_t xp; } Mon;
#define BOX_MAX 30
typedef struct {
  char magic[4]; char name[8];
  uint8_t map, x, y, dir;
  Mon party[6]; uint8_t np;
  Mon box[BOX_MAX]; uint8_t nb;
  uint8_t seen[6], caught[6], defeated[3];
  uint16_t money; uint8_t items[N_ITEMS]; uint8_t badges;
  uint8_t hmap, hx, hy, champion;
} Save;

extern Save G;
extern Mon wild_mon;
extern uint8_t cgb;
extern char buf[];
extern char M[];

/* text + ui (bank 0) */
uint8_t pad(void);
void wait_a(void);
void win_clear(uint8_t y, uint8_t h);
void win_frame(uint8_t x, uint8_t y, uint8_t w, uint8_t h);
void wtxt(uint8_t x, uint8_t y, const char *s);
void wnum(uint8_t x, uint8_t y, uint16_t v, uint8_t w);
void wtile(uint8_t x, uint8_t y, uint8_t t);
void btxt(uint8_t x, uint8_t y, const char *s);
void btile(uint8_t x, uint8_t y, uint8_t t, uint8_t pal);
void box_show(void);
void box_hide(void);
void full_win(void);
void say(const char *s);
void say_n(const char *name, const char *s);
const char *txt(uint16_t id);
void wprint(uint8_t x, uint8_t y, uint8_t w, const char *s);
uint8_t list_menu(uint8_t x, uint8_t y, uint8_t n, uint8_t cur, uint8_t step);
void m0(const char *s);
void ma(const char *s);
void mn(uint16_t v);
void hp_bar(uint8_t win, uint8_t x, uint8_t y, uint16_t hp, uint16_t max);

/* monsters */
uint16_t st_hp(Mon *m);
uint16_t st_x(Mon *m, uint8_t which);
void mon_make(Mon *m, uint8_t s, uint8_t lv);
uint8_t known_moves(Mon *m, uint8_t *out);
void load_mon_tiles(uint8_t s, uint8_t base, uint8_t flip);
void set_mon_pal(uint8_t slot, uint8_t s);
void draw_mon(uint8_t win, uint8_t x, uint8_t y, uint8_t base, uint8_t pal);
void bit_set(uint8_t *a, uint8_t i);
uint8_t bit_get(uint8_t *a, uint8_t i);
uint8_t alive_count(void);
void heal_all(void);
uint8_t use_heal(Mon *m, uint8_t item);
void add_caught(Mon *m);

/* sound */
void sfx(uint8_t k);
void music(uint8_t id);
#define SFX_HIT 0
#define SFX_HEAL 1
#define SFX_LEVEL 2
#define SFX_CATCH 3
#define SFX_FAIL 4
#define SFX_ENC 5
#define SFX_SEL 6
#define SFX_EVO 7

void load_meta(void);
void save_game(void);

/* banked screens */
uint8_t battle(uint8_t npc) BANKED;
uint8_t team_screen(uint8_t mode) BANKED;
uint8_t bag_pick(uint8_t inbattle) BANKED;
void bag_screen(void) BANKED;
void dex_screen(void) BANKED;
void box_screen(void) BANKED;
void shop_screen(void) BANKED;
uint8_t load_game(void);
void ending(void) BANKED;
void start_menu(void) BANKED;
void new_game(void) BANKED;
uint8_t title(void) BANKED;
#endif
