import type Phaser from 'phaser';

import { EventBus, GameEvent, type StatusPayload } from '../../../core/events';
import { BUFF_DURATION, WEAPON_DURATION } from '../constants';

export type BuffId = 'fly' | 'speed' | 'power';
export type WeaponId = 'bomb' | 'bow';
export type CurrentWeapon = WeaponId | 'normal';

const LABEL: Record<BuffId | WeaponId, string> = {
  fly: '飛行',
  speed: '速度',
  power: '攻撃力',
  bomb: '爆弾',
  bow: '弓',
};

/**
 * 一時的な強化（バフ）と武装強化の時限管理。
 * 取得で持続時間がリセットされ、期限切れで自動的に元へ戻る。
 * HUD へは EventBus の StatusChanged で通知する（残り秒数が変わったときのみ）。
 */
export class StatusSystem {
  private readonly buffs = new Map<BuffId, number>(); // 失効時刻 (scene time)
  private weapon: { id: WeaponId; until: number } | null = null;
  private lastEmitted = '';

  constructor(private readonly scene: Phaser.Scene) {}

  addBuff(id: BuffId): void {
    this.buffs.set(id, this.scene.time.now + BUFF_DURATION[id]);
    this.emitIfChanged();
  }

  setWeapon(id: WeaponId): void {
    this.weapon = { id, until: this.scene.time.now + WEAPON_DURATION };
    this.emitIfChanged();
  }

  has(id: BuffId): boolean {
    const until = this.buffs.get(id);
    return until !== undefined && until > this.scene.time.now;
  }

  get currentWeapon(): CurrentWeapon {
    if (this.weapon && this.weapon.until > this.scene.time.now) {
      return this.weapon.id;
    }
    return 'normal';
  }

  /** 毎フレーム呼ぶ。失効の反映と HUD 通知を行う */
  update(): void {
    const now = this.scene.time.now;
    for (const [id, until] of this.buffs) {
      if (until <= now) this.buffs.delete(id);
    }
    if (this.weapon && this.weapon.until <= now) this.weapon = null;
    this.emitIfChanged();
  }

  /** シーン終了時に HUD 表示を消す */
  clear(): void {
    this.buffs.clear();
    this.weapon = null;
    this.emitIfChanged();
  }

  private emitIfChanged(): void {
    const now = this.scene.time.now;
    const payload: StatusPayload = {
      buffs: [...this.buffs.entries()].map(([id, until]) => ({
        id,
        label: LABEL[id],
        remaining: Math.max(0, Math.ceil((until - now) / 1000)),
      })),
      weapon: this.weapon
        ? {
            id: this.weapon.id,
            label: LABEL[this.weapon.id],
            remaining: Math.max(0, Math.ceil((this.weapon.until - now) / 1000)),
          }
        : null,
    };
    const key = JSON.stringify(payload);
    if (key !== this.lastEmitted) {
      this.lastEmitted = key;
      EventBus.emit(GameEvent.StatusChanged, payload);
    }
  }
}
