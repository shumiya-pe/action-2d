import Phaser from 'phaser';

import type { EnemyType } from '../level';
import { SpriteKey } from '../skin';

interface EnemySpec {
  texture: string;
  hp: number;
  speed: number;
  score: number;
}

const SPECS: Record<EnemyType, EnemySpec> = {
  walker: { texture: SpriteKey.Walker, hp: 1, speed: 60, score: 200 },
  brute: { texture: SpriteKey.Brute, hp: 3, speed: 30, score: 500 },
};

/**
 * 左右往復パトロールの敵。
 * walker: 弱い雑魚 / brute: HP が高い大型（攻撃力バフや爆弾で早く倒せる）
 */
export class ProtoEnemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  readonly score: number;
  private hp: number;
  private readonly speed: number;
  private readonly minX: number;
  private readonly maxX: number;
  private defeated = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType,
    minX: number,
    maxX: number,
  ) {
    const spec = SPECS[type];
    super(scene, x, y, spec.texture);
    this.hp = spec.hp;
    this.speed = spec.speed;
    this.score = spec.score;
    this.minX = minX;
    this.maxX = maxX;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVelocityX(-this.speed);
  }

  get isDefeated(): boolean {
    return this.defeated;
  }

  patrol(): void {
    if (this.defeated) return;
    if ((this.x <= this.minX || this.body.blocked.left) && this.body.velocity.x <= 0) {
      this.setVelocityX(this.speed);
    } else if ((this.x >= this.maxX || this.body.blocked.right) && this.body.velocity.x >= 0) {
      this.setVelocityX(-this.speed);
    }
  }

  /** ダメージを与える。倒したら true を返す */
  damage(amount: number): boolean {
    if (this.defeated) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    // 被弾フラッシュ（仮演出）
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.defeated) this.clearTint();
    });
    return false;
  }

  private die(): void {
    this.defeated = true;
    this.body.enable = false;
    this.setTint(0x888888);
    this.setScale(this.scaleX, 0.4);
    this.y += this.displayHeight * 0.5;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}
