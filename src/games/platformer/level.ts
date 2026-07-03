/**
 * ステージ1のレベルデータ。
 * 座標はすべて論理解像度（960x540、横2画面分で幅1920）基準。
 * 矩形は左上座標＋幅高さで指定する。
 */

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

export interface EnemyDef {
  /** 出現位置 */
  x: number;
  y: number;
  /** パトロール範囲（この x 区間を左右に往復する） */
  minX: number;
  maxX: number;
}

export interface LevelData {
  playerStart: PointDef;
  platforms: RectDef[];
  coins: PointDef[];
  enemies: EnemyDef[];
  /** ゴール旗を立てる位置（地面の上端 y を指定） */
  goal: PointDef;
}

export const LEVEL_1: LevelData = {
  playerStart: { x: 80, y: 420 },

  platforms: [
    // 地面（落下死用の隙間を2箇所空ける）
    { x: 0, y: 500, w: 600, h: 40 },
    { x: 690, y: 500, w: 470, h: 40 },
    { x: 1260, y: 500, w: 660, h: 40 },
    // 浮遊足場
    { x: 300, y: 390, w: 130, h: 20 },
    { x: 560, y: 320, w: 120, h: 20 },
    { x: 800, y: 380, w: 150, h: 20 },
    { x: 1030, y: 300, w: 130, h: 20 },
    { x: 1300, y: 380, w: 170, h: 20 },
    { x: 1560, y: 290, w: 130, h: 20 },
  ],

  coins: [
    { x: 250, y: 460 },
    { x: 365, y: 350 },
    { x: 620, y: 280 },
    { x: 645, y: 430 }, // 1つ目の隙間の上
    { x: 875, y: 340 },
    { x: 1095, y: 260 },
    { x: 1210, y: 430 }, // 2つ目の隙間の上
    { x: 1385, y: 340 },
    { x: 1625, y: 250 },
    { x: 1750, y: 460 },
  ],

  enemies: [
    { x: 900, y: 470, minX: 720, maxX: 1120 },
    { x: 1380, y: 350, minX: 1310, maxX: 1460 },
    { x: 1550, y: 470, minX: 1300, maxX: 1700 },
  ],

  goal: { x: 1860, y: 500 },
};
