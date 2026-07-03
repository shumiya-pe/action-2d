import { useEffect, useState } from 'react';

import { EventBus, GameEvent, type GamePhase } from '../core/events';

/**
 * スコア表示 HUD。
 * Phaser 側から EventBus 経由で通知を受け取って表示するだけで、
 * ゲームの状態には一切干渉しない（React↔Phaser 連携のリファレンス実装）。
 */
export function Hud() {
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('boot');

  useEffect(() => {
    const onScore = (value: number) => setScore(value);
    const onPhase = (next: GamePhase) => setPhase(next);
    EventBus.on(GameEvent.ScoreChanged, onScore);
    EventBus.on(GameEvent.PhaseChanged, onPhase);
    return () => {
      EventBus.off(GameEvent.ScoreChanged, onScore);
      EventBus.off(GameEvent.PhaseChanged, onPhase);
    };
  }, []);

  if (phase !== 'playing') return null;

  return <div className="hud">SCORE {String(score).padStart(6, '0')}</div>;
}
