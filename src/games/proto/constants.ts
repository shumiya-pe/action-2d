/** 論理解像度（16:9 横画面） */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** ステージの横幅（横3画面分） */
export const LEVEL_WIDTH = 2880;

/** ここより下に落ちたらミス */
export const KILL_Y = GAME_HEIGHT + 120;

export const GRAVITY_Y = 1500;

// ---- プレイヤー ----
export const PLAYER_SPEED = 240;
/** 自動スクロール（オートラン）時の走行速度 */
export const AUTO_RUN_SPEED = 190;
export const PLAYER_JUMP_VELOCITY = -640;
/** 飛行バフ中にジャンプ長押しで得られる上昇速度 */
export const FLY_ASCEND_VELOCITY = -240;
export const STOMP_BOUNCE_VELOCITY = -420;

// ---- バフ・武装の持続時間 (ms) ----
export const BUFF_DURATION = {
  fly: 10_000,
  speed: 8_000,
  power: 8_000,
} as const;
export const WEAPON_DURATION = 12_000;

/** 速度バフの倍率 */
export const SPEED_BUFF_MULTIPLIER = 1.5;

// ---- 攻撃 ----
export const SLASH_COOLDOWN = 300;
export const SLASH_ACTIVE_TIME = 150;
export const SHOOT_COOLDOWN = { normal: 280, bow: 350, bomb: 650 } as const;
export const PROJECTILE_TTL = 1_200;

// ---- スコア ----
export const SCORE_PER_COIN = 100;
export const SCORE_PER_ITEM = 50;

/** スクロールモード（タイトルで選択） */
export type ScrollMode = 'manual' | 'auto';

export const SceneKey = {
  Boot: 'ProtoBoot',
  Preload: 'ProtoPreload',
  Title: 'ProtoTitle',
  Game: 'ProtoGame',
  GameOver: 'ProtoGameOver',
} as const;
