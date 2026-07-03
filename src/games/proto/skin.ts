import type Phaser from 'phaser';

import { makeCircleTexture, makeRectTexture } from '../../core/gfx/textures';

/**
 * 見た目（スキン）の集約点。
 *
 * スプライトやデザインの方向性は仮決めであり、ストーリー性が固まった段階で
 * 差し替える前提。ゲームロジックは SpriteKey という論理名だけを参照するので、
 * デザイン変更時はこのファイル（テクスチャ生成 or アセットロード）だけを
 * 差し替えればよい。
 */

export const SpriteKey = {
  Hero: 'proto-hero',
  Walker: 'proto-walker',
  Brute: 'proto-brute',
  Coin: 'proto-coin',
  Bullet: 'proto-bullet',
  Arrow: 'proto-arrow',
  Bomb: 'proto-bomb',
  Blast: 'proto-blast',
  Slash: 'proto-slash',
  ItemFly: 'proto-item-fly',
  ItemSpeed: 'proto-item-speed',
  ItemPower: 'proto-item-power',
  ItemBomb: 'proto-item-bomb',
  ItemBow: 'proto-item-bow',
} as const;

/** 仮デザインの配色（差し替え時はここごと変える） */
export const SkinPalette = {
  background: '#1a1c2c',
  hero: 0x41a6f6,
  walker: 0xef7d57,
  brute: 0xb13e53,
  coin: 0xffcd75,
  bullet: 0xf4f4f4,
  arrow: 0xa7f070,
  bomb: 0x333c57,
  blast: 0xffcd75,
  slash: 0xf4f4f4,
  itemFly: 0x73eff7,
  itemSpeed: 0x38b764,
  itemPower: 0xff5566,
  itemBomb: 0xef7d57,
  itemBow: 0x9a6cb9,
  platform: 0x38b764,
  platformEdge: 0x257953,
  goalPole: 0x94b0c2,
  goalFlag: 0xffcd75,
  text: '#f4f4f4',
  accent: '#ffcd75',
} as const;

/**
 * 全テクスチャをプレースホルダーとして生成する。
 * 外部アセットへ移行する際は、この関数を this.load.* によるロードへ置き換え、
 * ASSETS.md にライセンスを記載すること。
 *
 * 形の使い分け（仮ルール）: バフ系アイテム＝円 / 武装系アイテム＝四角
 */
export function registerProtoTextures(scene: Phaser.Scene): void {
  makeRectTexture(scene, SpriteKey.Hero, 28, 40, SkinPalette.hero);
  makeRectTexture(scene, SpriteKey.Walker, 30, 26, SkinPalette.walker);
  makeRectTexture(scene, SpriteKey.Brute, 46, 40, SkinPalette.brute);
  makeCircleTexture(scene, SpriteKey.Coin, 10, SkinPalette.coin);

  makeRectTexture(scene, SpriteKey.Bullet, 12, 6, SkinPalette.bullet);
  makeRectTexture(scene, SpriteKey.Arrow, 20, 4, SkinPalette.arrow);
  makeCircleTexture(scene, SpriteKey.Bomb, 8, SkinPalette.bomb);
  makeCircleTexture(scene, SpriteKey.Blast, 40, SkinPalette.blast);
  makeRectTexture(scene, SpriteKey.Slash, 44, 40, SkinPalette.slash);

  makeCircleTexture(scene, SpriteKey.ItemFly, 12, SkinPalette.itemFly);
  makeCircleTexture(scene, SpriteKey.ItemSpeed, 12, SkinPalette.itemSpeed);
  makeCircleTexture(scene, SpriteKey.ItemPower, 12, SkinPalette.itemPower);
  makeRectTexture(scene, SpriteKey.ItemBomb, 22, 22, SkinPalette.itemBomb);
  makeRectTexture(scene, SpriteKey.ItemBow, 22, 22, SkinPalette.itemBow);
}
