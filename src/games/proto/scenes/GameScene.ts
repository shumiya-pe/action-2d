import Phaser from 'phaser';

import { EventBus, GameEvent } from '../../../core/events';
import { Controls } from '../../../core/input/Controls';
import {
  GAME_HEIGHT,
  KILL_Y,
  LEVEL_WIDTH,
  PROJECTILE_TTL,
  SCORE_PER_COIN,
  SCORE_PER_ITEM,
  SHOOT_COOLDOWN,
  SLASH_ACTIVE_TIME,
  SLASH_COOLDOWN,
  STOMP_BOUNCE_VELOCITY,
  SceneKey,
  type ScrollMode,
} from '../constants';
import { PROTO_LEVEL, type ItemKind } from '../level';
import { ProtoEnemy } from '../objects/Enemy';
import { ProtoPlayer } from '../objects/Player';
import { SkinPalette, SpriteKey } from '../skin';
import { StatusSystem } from '../systems/StatusSystem';

export class GameScene extends Phaser.Scene {
  private mode: ScrollMode = 'manual';
  private controls!: Controls;
  private status!: StatusSystem;
  private player!: ProtoPlayer;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private bombs!: Phaser.Physics.Arcade.Group;
  private blasts!: Phaser.Physics.Arcade.Group;
  private slashSprite!: Phaser.Physics.Arcade.Sprite;
  private slashBody!: Phaser.Physics.Arcade.Body;
  private slashHits = new Set<ProtoEnemy>();
  private slashActiveUntil = 0;
  private lastSlashAt = -Infinity;
  private lastShotAt = -Infinity;
  private score = 0;
  private finished = false;

  constructor() {
    super(SceneKey.Game);
  }

  init(data: { mode?: ScrollMode }): void {
    this.mode = data.mode ?? 'manual';
  }

  create(): void {
    this.score = 0;
    this.finished = false;
    this.slashActiveUntil = 0;
    this.lastSlashAt = -Infinity;
    this.lastShotAt = -Infinity;
    this.slashHits.clear();

    EventBus.emit(GameEvent.PhaseChanged, 'playing');
    EventBus.emit(GameEvent.ScoreChanged, this.score);

    this.status = new StatusSystem(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.status.clear());

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT, true, true, false, false);

    this.createPlatforms();
    this.player = new ProtoPlayer(this, PROTO_LEVEL.playerStart.x, PROTO_LEVEL.playerStart.y);
    this.createEnemies();
    this.createCoins();
    this.createItems();
    this.createGoal();
    this.createWeapons();

    this.physics.add.collider(this.player, this.platforms);

    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.controls = new Controls(this, {
      moveButtons: this.mode === 'manual',
      actions: [
        { id: 'jump', label: '▲', keys: ['SPACE', 'UP'] },
        { id: 'slash', label: '斬', keys: ['Z'] },
        { id: 'shoot', label: '射', keys: ['X'] },
      ],
    });
  }

  update(time: number): void {
    if (this.finished) return;

    this.controls.update();
    this.status.update();
    this.player.handleInput(this.controls, this.status, this.mode);

    for (const enemy of this.enemies.getChildren() as ProtoEnemy[]) {
      enemy.patrol();
    }

    this.updateSlash(time);
    this.updateShoot(time);
    this.expireProjectiles(time);

    if (this.player.y > KILL_Y) {
      this.miss();
    }
  }

  // ---- レベル構築 ----

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    for (const p of PROTO_LEVEL.platforms) {
      const rect = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, SkinPalette.platform);
      rect.setStrokeStyle(2, SkinPalette.platformEdge);
      this.platforms.add(rect);
    }
  }

  private createEnemies(): void {
    // 物理グループにしないと空間木の検索対象にならず、衝突判定が機能しない
    this.enemies = this.physics.add.group();
    for (const e of PROTO_LEVEL.enemies) {
      const enemy = new ProtoEnemy(this, e.x, e.y, e.type, e.minX, e.maxX);
      this.enemies.add(enemy);
      this.physics.add.collider(enemy, this.platforms);
    }
    this.physics.add.collider(this.player, this.enemies, (a, b) => {
      this.onPlayerTouchEnemy(this.enemyOf(a, b));
    });
  }

  /**
   * 衝突コールバックの引数から敵を特定する。
   * Phaser はグループの組み合わせによって引数の順序が入れ替わることがあるため、
   * 登録順に依存せず instanceof で解決する。
   */
  private enemyOf(a: unknown, b: unknown): ProtoEnemy {
    return (b instanceof ProtoEnemy ? b : a) as ProtoEnemy;
  }

  private otherOf<T>(a: unknown, b: unknown): T {
    return (b instanceof ProtoEnemy ? a : b) as T;
  }

  private createCoins(): void {
    const coins = this.physics.add.staticGroup();
    for (const c of PROTO_LEVEL.coins) {
      coins.create(c.x, c.y, SpriteKey.Coin);
    }
    this.physics.add.overlap(this.player, coins, (_p, coin) => {
      (coin as Phaser.Physics.Arcade.Image).destroy();
      this.addScore(SCORE_PER_COIN);
    });
  }

  private createItems(): void {
    const textureByKind: Record<ItemKind, string> = {
      fly: SpriteKey.ItemFly,
      speed: SpriteKey.ItemSpeed,
      power: SpriteKey.ItemPower,
      bomb: SpriteKey.ItemBomb,
      bow: SpriteKey.ItemBow,
    };
    const items = this.physics.add.staticGroup();
    for (const def of PROTO_LEVEL.items) {
      const item = items.create(def.x, def.y, textureByKind[def.kind]) as Phaser.GameObjects.Image;
      item.setData('kind', def.kind);
      // 目立つように上下にゆっくり揺らす（body は動かさない）
      this.tweens.add({
        targets: item,
        y: def.y - 6,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }
    this.physics.add.overlap(this.player, items, (_p, hit) => {
      const item = hit as Phaser.GameObjects.Image;
      this.applyItem(item.getData('kind') as ItemKind);
      item.destroy();
      this.addScore(SCORE_PER_ITEM);
    });
  }

  private createGoal(): void {
    const { x, y } = PROTO_LEVEL.goal;
    const poleHeight = 140;
    this.add.rectangle(x, y - poleHeight / 2, 8, poleHeight, SkinPalette.goalPole);
    this.add.triangle(x + 26, y - poleHeight + 18, 0, -14, 0, 14, 44, 0, SkinPalette.goalFlag);

    const zone = this.add.zone(x, y - poleHeight / 2, 48, poleHeight);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => this.clearStage());
  }

  private createWeapons(): void {
    // 斬撃の当たり判定（未使用時は無効化しておき、スイング中だけ有効化）
    this.slashSprite = this.physics.add.sprite(0, 0, SpriteKey.Slash);
    this.slashBody = this.slashSprite.body as Phaser.Physics.Arcade.Body;
    this.slashBody.setAllowGravity(false);
    this.slashBody.enable = false;
    this.slashSprite.setAlpha(0);
    this.physics.add.overlap(this.slashSprite, this.enemies, (a, b) => {
      const enemy = this.enemyOf(a, b);
      if (enemy.isDefeated || this.slashHits.has(enemy)) return;
      this.slashHits.add(enemy);
      this.damageEnemy(enemy, this.attackPower(1));
    });

    // 直進弾・矢
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.projectiles, this.enemies, (a, b) => {
      const p = this.otherOf<Phaser.Physics.Arcade.Sprite>(a, b);
      const enemy = this.enemyOf(a, b);
      if (!p.active || enemy.isDefeated) return;
      const hitSet = p.getData('hitSet') as Set<ProtoEnemy> | undefined;
      if (!hitSet || hitSet.has(enemy)) return;
      hitSet.add(enemy);
      this.damageEnemy(enemy, p.getData('damage') as number);
      if (!(p.getData('pierce') as boolean)) p.destroy();
    });

    // 爆弾（重力あり、着弾で爆発）
    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.bombs, this.platforms, (bomb) => {
      this.explodeBomb(bomb as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.bombs, this.enemies, (a, b) => {
      this.explodeBomb(this.otherOf<Phaser.Physics.Arcade.Sprite>(a, b));
    });

    // 爆風（短時間の範囲当たり判定）
    this.blasts = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.blasts, this.enemies, (a, b) => {
      const blast = this.otherOf<Phaser.Physics.Arcade.Sprite>(a, b);
      const enemy = this.enemyOf(a, b);
      if (!blast.active || enemy.isDefeated) return;
      const hitSet = blast.getData('hitSet') as Set<ProtoEnemy> | undefined;
      if (!hitSet || hitSet.has(enemy)) return;
      hitSet.add(enemy);
      this.damageEnemy(enemy, blast.getData('damage') as number);
    });
  }

  // ---- 攻撃 ----

  /** 攻撃力バフで威力2倍 */
  private attackPower(base: number): number {
    return base * (this.status.has('power') ? 2 : 1);
  }

  private updateSlash(time: number): void {
    if (this.controls.consumePress('slash') && time >= this.lastSlashAt + SLASH_COOLDOWN) {
      this.lastSlashAt = time;
      this.slashActiveUntil = time + SLASH_ACTIVE_TIME;
      this.slashHits.clear();
    }

    const active = time < this.slashActiveUntil;
    this.slashBody.enable = active;
    this.slashSprite.setAlpha(active ? 0.55 : 0);
    if (active) {
      this.slashSprite.setPosition(this.player.x + this.player.facing * 34, this.player.y);
    }
  }

  private updateShoot(time: number): void {
    const weapon = this.status.currentWeapon;
    const cooldown = SHOOT_COOLDOWN[weapon];
    if (!this.controls.consumePress('shoot') || time < this.lastShotAt + cooldown) return;
    this.lastShotAt = time;

    const dir = this.player.facing;
    const x = this.player.x + dir * 24;
    const y = this.player.y - 4;

    if (weapon === 'bomb') {
      const bomb = this.bombs.create(x, y, SpriteKey.Bomb) as Phaser.Physics.Arcade.Sprite;
      bomb.setVelocity(dir * 280, -380);
      bomb.setData('spawnedAt', time);
      // 不発対策: 一定時間で自爆
      this.time.delayedCall(1500, () => {
        if (bomb.active) this.explodeBomb(bomb);
      });
      return;
    }

    const isBow = weapon === 'bow';
    const proj = this.projectiles.create(
      x,
      y,
      isBow ? SpriteKey.Arrow : SpriteKey.Bullet,
    ) as Phaser.Physics.Arcade.Sprite;
    proj.setVelocityX(dir * (isBow ? 720 : 520));
    proj.setFlipX(dir < 0);
    proj.setData('damage', this.attackPower(1));
    proj.setData('pierce', isBow); // 弓は貫通する
    proj.setData('hitSet', new Set<ProtoEnemy>());
    proj.setData('spawnedAt', time);
  }

  private explodeBomb(bomb: Phaser.Physics.Arcade.Sprite): void {
    if (!bomb.active) return;
    const { x, y } = bomb;
    bomb.destroy();

    const blast = this.blasts.create(x, y, SpriteKey.Blast) as Phaser.Physics.Arcade.Sprite;
    blast.setAlpha(0.7);
    blast.setCircle(40);
    blast.setScale(0.5);
    blast.setData('damage', this.attackPower(2));
    blast.setData('hitSet', new Set<ProtoEnemy>());
    this.tweens.add({
      targets: blast,
      scale: 1.8,
      alpha: 0,
      duration: 250,
      onComplete: () => blast.destroy(),
    });
  }

  private expireProjectiles(time: number): void {
    for (const group of [this.projectiles, this.bombs]) {
      for (const child of group.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
        const spawnedAt = child.getData('spawnedAt') as number | undefined;
        if (spawnedAt !== undefined && time > spawnedAt + PROJECTILE_TTL && child.active) {
          if (group === this.bombs) {
            this.explodeBomb(child);
          } else {
            child.destroy();
          }
        }
      }
    }
  }

  // ---- ゲームルール ----

  private applyItem(kind: ItemKind): void {
    if (kind === 'bomb' || kind === 'bow') {
      this.status.setWeapon(kind);
    } else {
      this.status.addBuff(kind);
    }
  }

  private damageEnemy(enemy: ProtoEnemy, amount: number): void {
    if (enemy.damage(amount)) {
      this.addScore(enemy.score);
    }
  }

  private onPlayerTouchEnemy(enemy: ProtoEnemy): void {
    if (this.finished || enemy.isDefeated) return;

    const stomped = this.player.body.touching.down && enemy.body.touching.up;
    if (stomped) {
      this.damageEnemy(enemy, this.attackPower(1));
      this.player.setVelocityY(STOMP_BOUNCE_VELOCITY);
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
