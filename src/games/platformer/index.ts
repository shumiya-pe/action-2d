import type { GameDefinition } from '../../core/createGame';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './constants';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';

/**
 * 横スクロールアクション（第1作）のゲーム定義。
 * 第2作（弾幕 STG）は同様の定義を src/games/ 配下に追加し、
 * createGame() に渡すだけで同じ基盤の上で動かせる。
 */
export const platformerGame: GameDefinition = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1c2c',
  gravityY: GRAVITY_Y,
  scenes: [BootScene, PreloadScene, TitleScene, GameScene, GameOverScene],
};
