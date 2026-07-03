import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { GAME_HEIGHT, GAME_WIDTH, Palette, SceneKey } from '../constants';

export interface GameOverData {
  result: 'clear' | 'miss';
  score: number;
}

/**
 * クリア・ミス共通のリザルトシーン。タイトルへ戻って再スタートできる。
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.GameOver);
  }

  create(data: GameOverData): void {
    const isClear = data.result === 'clear';
    EventBus.emit(GameEvent.PhaseChanged, isClear ? 'clear' : 'gameover');

    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.32, isClear ? 'STAGE CLEAR!' : 'GAME OVER', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: isClear ? Palette.accent : Palette.text,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.5, `SCORE ${String(data.score).padStart(6, '0')}`, {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: Palette.text,
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, GAME_HEIGHT * 0.72, 'タップ / スペースキーでタイトルへ', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
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

    // シーン遷移直後の連打誤爆を避けるため、少し待ってから入力を受け付ける
    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => this.backToTitle());
      this.input.keyboard?.once('keydown-SPACE', () => this.backToTitle());
    });
  }

  private backToTitle(): void {
    this.scene.start(SceneKey.Title);
  }
}
