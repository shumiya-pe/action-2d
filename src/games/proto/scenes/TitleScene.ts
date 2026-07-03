import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, type ScrollMode } from '../constants';
import { SkinPalette } from '../skin';

/**
 * タイトル画面。スクロールモード（手動 / 自動）を選んでスタートする。
 */
export class TitleScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.started = false;
    EventBus.emit(GameEvent.PhaseChanged, 'title');

    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.22, 'ACTION PROTO', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: SkinPalette.text,
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        GAME_HEIGHT * 0.42,
        '移動: ←→（手動時） / ジャンプ: スペース / 斬撃: Z / 射撃: X\nアイテムで一時強化: ●飛行・●速度・●攻撃力 / ■爆弾・■弓',
        {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: SkinPalette.text,
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.58, 'スクロールモードを選んでスタート', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: SkinPalette.accent,
      })
      .setOrigin(0.5);

    this.makeModeButton(cx - 180, GAME_HEIGHT * 0.74, '手動スクロール\n（キー: 1）', 'manual');
    this.makeModeButton(cx + 180, GAME_HEIGHT * 0.74, '自動スクロール\n（キー: 2）', 'auto');

    this.input.keyboard?.on('keydown-ONE', () => this.startGame('manual'));
    this.input.keyboard?.on('keydown-TWO', () => this.startGame('auto'));
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame('manual'));
  }

  private makeModeButton(x: number, y: number, label: string, mode: ScrollMode): void {
    const rect = this.add
      .rectangle(x, y, 300, 92, 0xffffff, 0.1)
      .setStrokeStyle(2, 0x94b0c2)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: SkinPalette.text,
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    rect.on('pointerover', () => rect.setFillStyle(0xffffff, 0.22));
    rect.on('pointerout', () => rect.setFillStyle(0xffffff, 0.1));
    rect.on('pointerdown', () => this.startGame(mode));
  }

  private startGame(mode: ScrollMode): void {
    if (this.started) return;
    this.started = true;
    this.scene.start(SceneKey.Game, { mode });
  }
}
