import Phaser from 'phaser';

/**
 * React（UI 層）と Phaser（ゲーム層）をつなぐ唯一の窓口。
 * 両者はこの EventEmitter 経由でのみやり取りし、直接参照し合わない。
 */
export const EventBus = new Phaser.Events.EventEmitter();

/** EventBus で使うイベント名の定義 */
export const GameEvent = {
  /** ゲームの進行フェーズが変わった (payload: GamePhase) */
  PhaseChanged: 'phase-changed',
  /** スコアが変わった (payload: number) */
  ScoreChanged: 'score-changed',
} as const;

export type GamePhase = 'boot' | 'title' | 'playing' | 'clear' | 'gameover';
