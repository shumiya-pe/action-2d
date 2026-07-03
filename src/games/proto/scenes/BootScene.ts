import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { SceneKey } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    EventBus.emit(GameEvent.PhaseChanged, 'boot');
    this.scene.start(SceneKey.Preload);
  }
}
