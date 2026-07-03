import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { SceneKey } from '../constants';

/**
 * 起動直後の初期化だけを行う最小シーン。
 * 外部アセットのロード前に済ませたい設定があればここに書く。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    EventBus.emit(GameEvent.PhaseChanged, 'boot');
    this.scene.start(SceneKey.Preload);
  }
}
