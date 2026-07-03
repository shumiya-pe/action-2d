import type { GameDefinition } from '../../core/createGame';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './constants';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';

/**
 * 横スクロールアクション試作（1ボタンアクション＋強化アイテム）のゲーム定義。
 * - コマンド: ジャンプ / 斬撃 / 射撃（各1ボタン）
 * - スクロール: タイトルで手動 / 自動を選択
 * - アイテム: 一時バフ（飛行・速度・攻撃力）と一時武装（爆弾・弓）
 * - 見た目は skin.ts に集約した仮デザイン（後から差し替え可能）
 */
export const protoGame: GameDefinition = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1c2c',
  gravityY: GRAVITY_Y,
  scenes: [BootScene, PreloadScene, TitleScene, GameScene, GameOverScene],
};
