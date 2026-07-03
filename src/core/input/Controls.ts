import Phaser from 'phaser';

/** アクションボタン1個の定義（ジャンプ・斬撃・射撃など） */
export interface ActionButtonDef {
  id: string;
  /** バーチャルボタンに表示するラベル */
  label: string;
  /** 対応するキーボードのキー（Phaser.Input.Keyboard.KeyCodes のキー名） */
  keys: (keyof typeof Phaser.Input.Keyboard.KeyCodes)[];
}

export interface ControlsConfig {
  /** 左右移動ボタン（◀▶）を使うか。自動走行のゲームでは false にする */
  moveButtons?: boolean;
  /** アクションボタン定義。画面右下に「右から順」に並ぶ */
  actions?: ActionButtonDef[];
  /** バーチャルボタンを表示するか（省略時はタッチデバイスなら表示） */
  virtualButtons?: boolean;
}

interface ActionState {
  def: ActionButtonDef;
  keys: Phaser.Input.Keyboard.Key[];
  touchHeld: boolean;
  queued: boolean;
}

/**
 * キーボードとタッチ（バーチャルボタン）を統合した入力の基盤クラス。
 * ゲーム側は論理入力（left / right / isHeld / consumePress）だけを見ればよく、
 * 入力デバイスの違いを意識しない。
 */
export class Controls {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly actions = new Map<string, ActionState>();
  private readonly useMoveButtons: boolean;
  private touchLeft = false;
  private touchRight = false;

  constructor(scene: Phaser.Scene, config: ControlsConfig = {}) {
    this.useMoveButtons = config.moveButtons ?? true;

    if (scene.input.keyboard) {
      if (this.useMoveButtons) {
        this.cursors = scene.input.keyboard.createCursorKeys();
      }
      for (const def of config.actions ?? []) {
        this.actions.set(def.id, {
          def,
          keys: def.keys.map((k) => scene.input.keyboard!.addKey(k)),
          touchHeld: false,
          queued: false,
        });
      }
    } else {
      for (const def of config.actions ?? []) {
        this.actions.set(def.id, { def, keys: [], touchHeld: false, queued: false });
      }
    }

    const showButtons = config.virtualButtons ?? scene.sys.game.device.input.touch;
    if (showButtons) {
      this.createVirtualButtons(scene);
    }
  }

  get left(): boolean {
    return this.useMoveButtons && (this.touchLeft || this.cursors?.left.isDown === true);
  }

  get right(): boolean {
    return this.useMoveButtons && (this.touchRight || this.cursors?.right.isDown === true);
  }

  /** アクションボタンが押しっぱなしか（可変ジャンプ・飛行などの判定用） */
  isHeld(id: string): boolean {
    const a = this.actions.get(id);
    if (!a) return false;
    return a.touchHeld || a.keys.some((k) => k.isDown);
  }

  /** 毎フレーム呼ぶ。キーボードの「押した瞬間」をキューに積む */
  update(): void {
    for (const a of this.actions.values()) {
      for (const key of a.keys) {
        if (Phaser.Input.Keyboard.JustDown(key)) {
          a.queued = true;
        }
      }
    }
  }

  /** アクション入力を1回分取り出す（押した瞬間のみ true） */
  consumePress(id: string): boolean {
    const a = this.actions.get(id);
    if (!a) return false;
    const queued = a.queued;
    a.queued = false;
    return queued;
  }

  private createVirtualButtons(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    const y = height - 76;
    const radius = 52;
    const gap = radius * 2 + 18;

    if (this.useMoveButtons) {
      this.makeButton(scene, 88, y, radius, '◀', (down) => {
        this.touchLeft = down;
      });
      this.makeButton(scene, 88 + gap, y, radius, '▶', (down) => {
        this.touchRight = down;
      });
    }

    // アクションボタンは右下に「定義順で右から」並べる
    let x = width - 96;
    for (const a of this.actions.values()) {
      const state = a;
      this.makeButton(scene, x, y, radius, a.def.label, (down) => {
        state.touchHeld = down;
        if (down) state.queued = true;
      });
      x -= gap;
    }
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    label: string,
    onChange: (down: boolean) => void,
  ): void {
    const circle = scene.add
      .circle(x, y, radius, 0xffffff, 0.16)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();
    scene.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '28px', color: '#ffffff' })
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
