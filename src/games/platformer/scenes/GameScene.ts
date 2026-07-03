import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { Controls } from '../../../core/input/Controls';
import {
  GAME_HEIGHT,
  KILL_Y,
  LEVEL_WIDTH,
  Palette,
  SCORE_PER_COIN,
  SCORE_PER_ENEMY,
  SceneKey,
  TextureKey,
} from '../constants';
import { LEVEL_1 } from '../level';
import { Enemy } from '../objects/Enemy';
import { Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private score = 0;
  private finished = false;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    this.score = 0;
    this.finished = false;
    EventBus.emit(GameEvent.PhaseChanged, 'playing');
    EventBus.emit(GameEvent.ScoreChanged, this.score);

    // 左右の壁のみ有効。下は開けて落下死を成立させる
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT, true, true, false, false);

    const platforms = this.createPlatforms();
    this.createPlayer();
    this.createEnemies(platforms);
    this.createCoins();
    this.createGoal();

    this.physics.add.collider(this.player, platforms);

    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.controls = new Controls(this);
  }

  update(): void {
    if (this.finished) return;

    this.controls.update();
    this.player.handleInput(this.controls);

    for (const enemy of this.enemies.getChildren() as Enemy[]) {
      enemy.patrol();
    }

    if (this.player.y > KILL_Y) {
      this.miss();
    }
  }

  // ---- レベル構築 ----

  private createPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup();
    for (const p of LEVEL_1.platforms) {
      const rect = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, Palette.platform);
      rect.setStrokeStyle(2, Palette.platformEdge);
      platforms.add(rect);
    }
    return platforms;
  }

  private createPlayer(): void {
    this.player = new Player(this, LEVEL_1.playerStart.x, LEVEL_1.playerStart.y);
  }

  private createEnemies(platforms: Phaser.Physics.Arcade.StaticGroup): void {
    this.enemies = this.add.group({ runChildUpdate: false });
    for (const e of LEVEL_1.enemies) {
      const enemy = new Enemy(this, e.x, e.y, e.minX, e.maxX);
      this.enemies.add(enemy);
      this.physics.add.collider(enemy, platforms);
      this.physics.add.collider(this.player, enemy, (_player, hit) => {
        this.onPlayerTouchEnemy(hit as Enemy);
      });
    }
  }

  private createCoins(): void {
    const coins = this.physics.add.staticGroup();
    for (const c of LEVEL_1.coins) {
      coins.create(c.x, c.y, TextureKey.Coin);
    }
    this.physics.add.overlap(this.player, coins, (_player, coin) => {
      (coin as Phaser.Physics.Arcade.Image).destroy();
      this.addScore(SCORE_PER_COIN);
    });
  }

  private createGoal(): void {
    const { x, y } = LEVEL_1.goal; // y は地面の上端
    const poleHeight = 140;
    this.add.rectangle(x, y - poleHeight / 2, 8, poleHeight, Palette.goalPole);
    this.add.triangle(x + 26, y - poleHeight + 18, 0, -14, 0, 14, 44, 0, Palette.goalFlag);

    const zone = this.add.zone(x, y - poleHeight / 2, 48, poleHeight);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => this.clearStage());
  }

  // ---- ゲームルール ----

  private onPlayerTouchEnemy(enemy: Enemy): void {
    if (this.finished || enemy.isDefeated) return;

    // 落下中に敵の頭に触れていれば「踏んだ」と判定
    const stomped = this.player.body.touching.down && enemy.body.touching.up;
    if (stomped) {
      enemy.squash();
      this.player.setVelocityY(-420);
      this.addScore(SCORE_PER_ENEMY);
    } else {
      this.miss();
    }
  }

  private addScore(amount: number): void {
    this.score += amount;
    EventBus.emit(GameEvent.ScoreChanged, this.score);
  }

  private miss(): void {
    if (this.finished) return;
    this.finished = true;

    this.player.setTint(0xff5566);
    this.physics.pause();
    this.cameras.main.shake(250, 0.01);

    this.time.delayedCall(800, () => {
      this.scene.start(SceneKey.GameOver, { result: 'miss', score: this.score });
    });
  }

  private clearStage(): void {
    if (this.finished) return;
    this.finished = true;

    this.player.setVelocityX(0);
    this.cameras.main.flash(400, 255, 255, 255);

    this.time.delayedCall(900, () => {
      this.scene.start(SceneKey.GameOver, { result: 'clear', score: this.score });
    });
  }
}
