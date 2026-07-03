import { useEffect, useState } from 'react';

import { EventBus, GameEvent, type GamePhase, type StatusPayload } from '../core/events';

/**
 * スコアと強化状態の HUD。
 * Phaser 側から EventBus 経由で通知を受け取って表示するだけで、
 * ゲームの状態には一切干渉しない（React↔Phaser 連携のリファレンス実装）。
 */
export function Hud() {
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('boot');
  const [status, setStatus] = useState<StatusPayload>({ buffs: [], weapon: null });

  useEffect(() => {
    const onScore = (value: number) => setScore(value);
    const onPhase = (next: GamePhase) => setPhase(next);
    const onStatus = (payload: StatusPayload) => setStatus(payload);
    EventBus.on(GameEvent.ScoreChanged, onScore);
    EventBus.on(GameEvent.PhaseChanged, onPhase);
    EventBus.on(GameEvent.StatusChanged, onStatus);
    return () => {
      EventBus.off(GameEvent.ScoreChanged, onScore);
      EventBus.off(GameEvent.PhaseChanged, onPhase);
      EventBus.off(GameEvent.StatusChanged, onStatus);
    };
  }, []);

  if (phase !== 'playing') return null;

  return (
    <div className="hud">
      <div className="hud__score">SCORE {String(score).padStart(6, '0')}</div>
      <div className="hud__badges">
        {status.weapon && (
          <span className="hud__badge hud__badge--weapon">
            {status.weapon.label} {status.weapon.remaining}s
          </span>
        )}
        {status.buffs.map((buff) => (
          <span key={buff.id} className="hud__badge">
            {buff.label} {buff.remaining}s
          </span>
        ))}
      </div>
    </div>
  );
}
