/** 論理解像度（16:9 横画面） */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** ステージの横幅（横2画面分） */
export const LEVEL_WIDTH = 1920;

/** ここより下に落ちたらミス */
export const KILL_Y = GAME_HEIGHT + 120;

export const GRAVITY_Y = 1500;
export const PLAYER_SPEED = 240;
export const PLAYER_JUMP_VELOCITY = -640;
/** 敵を踏んだときの跳ね返り */
export const STOMP_BOUNCE_VELOCITY = -420;
export const ENEMY_SPEED = 60;

export const SCORE_PER_COIN = 100;
export const SCORE_PER_ENEMY = 50;

/** シーンのキー */
export const SceneKey = {
  Boot: 'Boot',
  Preload: 'Preload',
  Title: 'Title',
  Game: 'Game',
  GameOver: 'GameOver',
} as const;

/** 生成テクスチャのキー */
export const TextureKey = {
  Player: 'player',
  Enemy: 'enemy',
  Coin: 'coin',
} as const;

/** プレースホルダーの配色 */
export const Palette = {
  background: 0x1a1c2c,
  platform: 0x38b764,
  platformEdge: 0x257953,
  player: 0x41a6f6,
  enemy: 0xef7d57,
  coin: 0xffcd75,
  goalPole: 0x94b0c2,
  goalFlag: 0xffcd75,
  text: '#f4f4f4',
  accent: '#ffcd75',
} as const;
