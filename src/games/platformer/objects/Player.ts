import Phaser from 'phaser';

import type { Controls } from '../../../core/input/Controls';
import { PLAYER_JUMP_VELOCITY, PLAYER_SPEED, TextureKey } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKey.Player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // 左右は世界の端で止める。下は開けておき、落下死判定に任せる
    this.setCollideWorldBounds(true);
  }

  /** 毎フレームの操作反映。二段ジャンプはなし（接地時のみジャンプ可） */
  handleInput(controls: Controls): void {
    if (controls.left) {
      this.setVelocityX(-PLAYER_SPEED);
    } else if (controls.right) {
      this.setVelocityX(PLAYER_SPEED);
    } else {
      this.setVelocityX(0);
    }

    const onGround = this.body.blocked.down;
    if (controls.consumeJump() && onGround) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
    }

    // ボタンを早く離すとジャンプが低くなる（可変ジャンプ）
    if (!controls.jumpHeld && this.body.velocity.y < -240) {
      this.setVelocityY(-240);
    }
  }
}
