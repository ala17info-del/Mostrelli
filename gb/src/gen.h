#ifndef GEN_H
#define GEN_H
#include <gb/gb.h>
#include <stdint.h>
#define N_SPECIES 44
#define N_MOVES 28
#define N_MAPS 8
#define N_TRAINERS 23
#define N_BADGES 6
#define N_ITEMS 6
#define N_TEXT 136
#define DESC0 89
#define INTRO0 133
#define N_INTRO 3
#define N_MUSIC 10
#define MUS_BATTLE 9
#define OBJ_BASE 0
#define META_BASE 12
#define UI_BASE 84
#define FONT_BASE 104
#define N_META 18
#define MT_TALL 1
#define MT_BEACHGRASS 7
#define STARTER0 0
#define STARTER1 1
#define STARTER2 2
#define IT_VASETTO 0
typedef struct { uint8_t type, hp, atk, def, spd, catchp, evo_to, evo_lv, ml0, nml; } SpeciesD;
typedef struct { uint8_t type, power, acc, fxk, fxp; } MoveD;
typedef struct { uint8_t price, kind, amount; } ItemD;
typedef struct { uint8_t x, y, to, tx, ty; } ExitD;
typedef struct { uint8_t x, y, kind, pal; const char *name; uint16_t l0; uint8_t nl; uint16_t a0; uint8_t na, t0, nt; uint16_t reward; uint8_t badge, tid; } NpcD;
typedef struct { uint8_t x, y; uint16_t txt; } SignD;
typedef struct { uint8_t s, lo, hi, w; } WildD;
typedef struct { const char *name; uint8_t ex0, nex, npc0, nnpc, sign0, nsign, wild0, nwild, hx, hy, music, beach; } MapD;
extern const SpeciesD SPECIES[]; extern const char * const SP_NAME[]; extern const uint8_t LEARN[][2]; extern const uint16_t MONPAL[][4];
extern const MoveD MOVES[]; extern const char * const MV_NAME[]; extern const char * const TYPE_NAME[]; extern const uint8_t EFF[6][6];
extern const ItemD ITEMS[]; extern const char * const IT_NAME[]; extern const ExitD EXITS[]; extern const NpcD NPCS[]; extern const SignD SIGNS[];
extern const WildD WILD[]; extern const uint8_t TEAM[][2]; extern const MapD MAPS[]; extern const uint8_t MAPTILES[][256]; extern const char * const BADGE[];
extern const uint8_t META_PAL[]; extern const uint8_t META_FLAGS[]; extern const uint8_t TILES_META[]; extern const uint8_t TILES_UI[]; extern const uint8_t TILES_FONT[];
extern const uint8_t TILES_OBJ[]; extern const uint16_t BG_PALS[]; extern const uint16_t OBJ_PALS[];
extern const uint8_t MONGFX[][64]; extern const uint16_t TXTOFF[]; extern const char TXT[];
extern const uint16_t * const MUS_A[]; extern const uint16_t * const MUS_B[];
BANKREF_EXTERN(MONGFX) BANKREF_EXTERN(TXT) BANKREF_EXTERN(BIGDATA) extern const uint8_t BIGDATA;
#endif
