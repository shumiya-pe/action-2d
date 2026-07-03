import Phaser from 'phaser';

import { ENEMY_SPEED, TextureKey } from '../constants';

/**
 * 左右往復パトロールの敵。踏むと倒せる。
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly minX: number;
  private readonly maxX: number;
  private defeated = false;

  constructor(scene: Phaser.Scene, x: number, y: number, minX: number, maxX: number) {
    super(scene, x, y, TextureKey.Enemy);
    this.minX = minX;
    this.maxX = maxX;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVelocityX(-ENEMY_SPEED);
  }

  get isDefeated(): boolean {
    return this.defeated;
  }

  patrol(): void {
    if (this.defeated) return;
    // パトロール範囲の端、または壁に当たったら反転する
    if ((this.x <= this.minX || this.body.blocked.left) && this.body.velocity.x <= 0) {
      this.setVelocityX(ENEMY_SPEED);
    } else if ((this.x >= this.maxX || this.body.blocked.right) && this.body.velocity.x >= 0) {
      this.setVelocityX(-ENEMY_SPEED);
    }
  }

  /** 踏まれたときの演出（つぶれてから消える） */
  squash(): void {
    if (this.defeated) return;
    this.defeated = true;
    this.body.enable = false;
    this.setScale(1, 0.4);
    this.y += this.displayHeight * 0.5;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 350,
      onComplete: () => this.destroy(),
    });
  }
}
