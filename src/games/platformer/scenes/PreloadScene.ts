import Phaser from 'phaser';

import { makeCircleTexture, makeRectTexture } from '../../../core/gfx/textures';
import { Palette, SceneKey, TextureKey } from '../constants';

/**
 * アセット準備シーン。
 * 現状はプレースホルダー（Graphics 生成テクスチャ）のみ。
 * 外部アセットを導入する場合はここで this.load.* を使い、ASSETS.md に記載する。
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  create(): void {
    // 60fps 維持のため、テクスチャ生成は起動時に一度だけ行う
    makeRectTexture(this, TextureKey.Player, 32, 40, Palette.player);
    makeRectTexture(this, TextureKey.Enemy, 32, 28, Palette.enemy);
    makeCircleTexture(this, TextureKey.Coin, 10, Palette.coin);

    this.scene.start(SceneKey.Title);
  }
}
