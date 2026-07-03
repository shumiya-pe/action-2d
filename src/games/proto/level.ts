/**
 * 試作ステージのレベルデータ。
 * 座標は論理解像度（960x540、横3画面分で幅2880）基準。矩形は左上座標＋幅高さ。
 */

export type ItemKind = 'fly' | 'speed' | 'power' | 'bomb' | 'bow';
export type EnemyType = 'walker' | 'brute';

export interface RectDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PointDef {
  x: number;
  y: number;
}

export interface ItemDef extends PointDef {
  kind: ItemKind;
}

export interface EnemyDef extends PointDef {
  type: EnemyType;
  minX: number;
  maxX: number;
}

export interface LevelData {
  playerStart: PointDef;
  platforms: RectDef[];
  coins: PointDef[];
  items: ItemDef[];
  enemies: EnemyDef[];
  goal: PointDef;
}

export const PROTO_LEVEL: LevelData = {
  playerStart: { x: 80, y: 420 },

  platforms: [
    // 地面（隙間＝落下死ポイントを3箇所）
    { x: 0, y: 500, w: 640, h: 40 },
    { x: 730, y: 500, w: 500, h: 40 },
    { x: 1330, y: 500, w: 640, h: 40 },
    { x: 2120, y: 500, w: 760, h: 40 },
    // 浮遊足場
    { x: 320, y: 390, w: 130, h: 20 },
    { x: 590, y: 320, w: 120, h: 20 },
    { x: 850, y: 380, w: 150, h: 20 },
    { x: 1090, y: 300, w: 130, h: 20 },
    { x: 1400, y: 380, w: 170, h: 20 },
    { x: 1660, y: 290, w: 130, h: 20 },
    // 3つ目の隙間（1970..2120、幅150）は飛行バフ or 足場経由で越える
    { x: 1900, y: 360, w: 120, h: 20 },
    { x: 2060, y: 280, w: 110, h: 20 },
    { x: 2320, y: 380, w: 150, h: 20 },
    { x: 2560, y: 300, w: 130, h: 20 },
  ],

  coins: [
    { x: 260, y: 460 },
    { x: 385, y: 350 },
    { x: 650, y: 280 },
    { x: 685, y: 430 },
    { x: 925, y: 340 },
    { x: 1155, y: 260 },
    { x: 1280, y: 430 },
    { x: 1485, y: 340 },
    { x: 1725, y: 250 },
    { x: 2040, y: 420 }, // 3つ目の隙間の上（飛行で取りやすい）
    { x: 2395, y: 340 },
    { x: 2625, y: 260 },
    { x: 2750, y: 460 },
  ],

  items: [
    { x: 500, y: 460, kind: 'speed' },
    { x: 915, y: 340, kind: 'bomb' },
    { x: 1440, y: 340, kind: 'power' },
    { x: 1860, y: 460, kind: 'fly' }, // 直後の大きい隙間を飛行で越えられる
    { x: 2380, y: 340, kind: 'bow' },
  ],

  enemies: [
    { x: 950, y: 470, type: 'walker', minX: 760, maxX: 1190 },
    { x: 1480, y: 350, type: 'walker', minX: 1410, maxX: 1560 },
    { x: 1700, y: 470, type: 'walker', minX: 1360, maxX: 1930 },
    { x: 2500, y: 460, type: 'brute', minX: 2150, maxX: 2760 },
  ],

  goal: { x: 2820, y: 500 },
};
