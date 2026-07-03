import Phaser from 'phaser';

/**
 * ゲーム1本分の定義。タイトルごと（プラットフォーマー、弾幕 STG など）に
 * この定義を用意すれば、同じ基盤の上で起動できる。
 */
export interface GameDefinition {
  /** 論理解像度（Scale.FIT でウィンドウに合わせて拡縮される） */
  width: number;
  height: number;
  backgroundColor?: string;
  /** Arcade Physics の重力（トップビューや STG は 0 にする） */
  gravityY?: number;
  scenes: Phaser.Types.Scenes.SceneType[];
}

/**
 * Phaser.Game を生成する。React 側はこの関数を呼ぶだけで、
 * シーンや物理などゲームの中身には関与しない。
 */
export function createGame(parent: HTMLElement, def: GameDefinition): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: def.width,
    height: def.height,
    backgroundColor: def.backgroundColor ?? '#0f0f1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: def.gravityY ?? 0 },
        debug: false,
      },
    },
    // マルチタッチ対応（移動ボタン＋ジャンプボタンの同時押し）
    input: { activePointers: 3 },
    scene: def.scenes,
  });
}
