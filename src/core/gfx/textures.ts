import type Phaser from 'phaser';

/**
 * Graphics で描いた図形をテクスチャとして登録するヘルパー群。
 * 外部アセットを使わないプレースホルダー運用のための基盤機能。
 */

/** 塗りつぶし矩形のテクスチャを生成する（既存キーはスキップ） */
export function makeRectTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  color: number,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(0, 0, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}

/** 塗りつぶし円のテクスチャを生成する（既存キーはスキップ） */
export function makeCircleTexture(
  scene: Phaser.Scene,
  key: string,
  radius: number,
  color: number,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}
