import Phaser from 'phaser';

export interface ControlsConfig {
  /** バーチャルボタンを表示するか（省略時はタッチデバイスなら表示） */
  virtualButtons?: boolean;
}

/**
 * キーボード（←→＋スペース/↑）とタッチ（バーチャルボタン）を統合した入力。
 * ゲーム側は left / right / jumpHeld / consumeJump() だけを見ればよく、
 * 入力デバイスの違いを意識しない。
 */
export class Controls {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private touchLeft = false;
  private touchRight = false;
  private touchJumpHeld = false;
  private jumpQueued = false;

  constructor(scene: Phaser.Scene, config: ControlsConfig = {}) {
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
    }
    const showButtons = config.virtualButtons ?? scene.sys.game.device.input.touch;
    if (showButtons) {
      this.createVirtualButtons(scene);
    }
  }

  get left(): boolean {
    return this.touchLeft || this.cursors?.left.isDown === true;
  }

  get right(): boolean {
    return this.touchRight || this.cursors?.right.isDown === true;
  }

  /** ジャンプボタンが押しっぱなしか（可変ジャンプの判定用） */
  get jumpHeld(): boolean {
    return (
      this.touchJumpHeld || this.cursors?.space.isDown === true || this.cursors?.up.isDown === true
    );
  }

  /** 毎フレーム呼ぶ。キーボードの「押した瞬間」をキューに積む */
  update(): void {
    if (!this.cursors) return;
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up)
    ) {
      this.jumpQueued = true;
    }
  }

  /** ジャンプ入力を1回分取り出す（押した瞬間のみ true） */
  consumeJump(): boolean {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  private createVirtualButtons(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    const y = height - 76;

    this.makeButton(scene, 88, y, '◀', (down) => {
      this.touchLeft = down;
    });
    this.makeButton(scene, 208, y, '▶', (down) => {
      this.touchRight = down;
    });
    this.makeButton(scene, width - 96, y, '▲', (down) => {
      this.touchJumpHeld = down;
      if (down) this.jumpQueued = true;
    });
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onChange: (down: boolean) => void,
  ): void {
    const radius = 52;
    const circle = scene.add
      .circle(x, y, radius, 0xffffff, 0.16)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();
    scene.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0.75)
      .setScrollFactor(0)
      .setDepth(1000);

    const press = () => {
      circle.setFillStyle(0xffffff, 0.32);
      onChange(true);
    };
    const release = () => {
      circle.setFillStyle(0xffffff, 0.16);
      onChange(false);
    };
    circle.on('pointerdown', press);
    circle.on('pointerup', release);
    circle.on('pointerout', release);
  }
}
