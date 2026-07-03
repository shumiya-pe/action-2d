import { useEffect, useRef } from 'react';

import { createGame } from '../core/createGame';
import { protoGame } from '../games/proto';

/**
 * Phaser のマウントポイント。
 * Phaser.Game の生成は初回マウント時に一度だけ行い、
 * React の再レンダリングがゲームループへ影響しないようにする。
 */
export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // 起動するゲームをここで選ぶ（platformer に戻す場合は import を差し替える）
    const game = createGame(containerRef.current, protoGame);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="game-canvas" />;
}
