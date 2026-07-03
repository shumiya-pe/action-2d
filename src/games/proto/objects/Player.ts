import Phaser from 'phaser';

import type { Controls } from '../../../core/input/Controls';
import {
  AUTO_RUN_SPEED,
  FLY_ASCEND_VELOCITY,
  PLAYER_JUMP_VELOCITY,
  PLAYER_SPEED,
  SPEED_BUFF_MULTIPLIER,
  type ScrollMode,
} from '../constants';
import { SpriteKey } from '../skin';
import type { StatusSystem } from '../systems/StatusSystem';

export class ProtoPlayer extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** 向いている方向（斬撃・射撃の発射方向） */
  facing: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, SpriteKey.Hero);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
  }

  handleInput(controls: Controls, status: StatusSystem, mode: ScrollMode): void {
    const speedMul = status.has('speed') ? SPEED_BUFF_MULTIPLIER : 1;

    if (mode === 'auto') {
      // オートラン: 常に右へ走り続ける（移動操作なし）
      this.setVelocityX(AUTO_RUN_SPEED * speedMul);
      this.facing = 1;
    } else if (controls.left) {
      this.setVelocityX(-PLAYER_SPEED * speedMul);
      this.facing = -1;
    } else if (controls.right) {
      this.setVelocityX(PLAYER_SPEED * speedMul);
      this.facing = 1;
    } else {
      this.setVelocityX(0);
    }

    const onGround = this.body.blocked.down;
    const flying = status.has('fly');

    if (controls.consumePress('jump') && onGround) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
    }

    if (flying && controls.isHeld('jump') && !onGround) {
      // 飛行バフ: 空中でジャンプ長押しすると上昇し続ける
      this.setVelocityY(FLY_ASCEND_VELOCITY);
    } else if (!controls.isHeld('jump') && this.body.velocity.y < -240) {
      // 可変ジャンプ: 早く離すと低いジャンプになる
      this.setVelocityY(-240);
    }

    // 飛行中は見た目で分かるように少し透ける（仮演出）
    this.setAlpha(flying ? 0.8 : 1);
  }
}
