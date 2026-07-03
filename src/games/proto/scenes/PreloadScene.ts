import Phaser from 'phaser';

import { SceneKey } from '../constants';
import { registerProtoTextures } from '../skin';

/**
 * アセット準備シーン。現状は skin.ts のプレースホルダー生成のみ。
 * 外部アセット導入時はここで this.load.* を使い、ASSETS.md に記載する。
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  create(): void {
    registerProtoTextures(this);
    this.scene.start(SceneKey.Title);
  }
}
