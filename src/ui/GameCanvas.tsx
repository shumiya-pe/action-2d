import { useEffect, useRef } from 'react';

import { createGame } from '../core/createGame';
import { platformerGame } from '../games/platformer';

/**
 * Phaser のマウントポイント。
 * Phaser.Game の生成は初回マウント時に一度だけ行い、
 * React の再レンダリングがゲームループへ影響しないようにする。
 */
export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = createGame(containerRef.current, platformerGame);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="game-canvas" />;
}
