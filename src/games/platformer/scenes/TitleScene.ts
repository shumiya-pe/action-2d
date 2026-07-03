import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { GAME_HEIGHT, GAME_WIDTH, Palette, SceneKey } from '../constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    EventBus.emit(GameEvent.PhaseChanged, 'title');

    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.3, 'ACTION 2D', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: Palette.text,
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        GAME_HEIGHT * 0.52,
        'タッチ: 画面のボタンで移動・ジャンプ\nキーボード: ← → 移動 / スペース ジャンプ',
        {
          fontFamily: 'sans-serif',
          fontSize: '22px',
          color: Palette.text,
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, GAME_HEIGHT * 0.74, 'タップ / スペースキーでスタート', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: Palette.accent,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start(SceneKey.Game);
  }
}
