import { GameCanvas } from './ui/GameCanvas';
import { Hud } from './ui/Hud';
import { RotateHint } from './ui/RotateHint';

/**
 * React はゲームを載せる「シェル」に徹する。
 * ゲームループ・描画・物理はすべて Phaser 側（src/games/）にあり、
 * React とは core/events.ts の EventBus 経由でのみやり取りする。
 */
export function App() {
  return (
    <div className="app">
      <GameCanvas />
      <Hud />
      <RotateHint />
    </div>
  );
}
