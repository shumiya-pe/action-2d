# HP制・武装弾数制の実装調査と設計比較

作成日: 2026-09-09
更新日: 2026-09-09

## 目的

第1作 `proto` の既定方針である以下の仕様について、後から実装判断に使える形で調査・比較結果を残す。

- 被弾: HP制（ハート3つ）
- 武装: 爆弾・弓を弾数制に変更
- 未決定項目: スコア設計、ボス戦、HP回復、難易度カーブ

この文書は調査・設計比較の記録であり、実装変更そのものではない。

## 調査時点の前提

- 対象ゲームは `src/games/proto/`。`proto` は既定起動対象、`platformer` は参照用。根拠: `README.md:8-12`
- React と Phaser は `src/core/events.ts` の EventBus 経由で連携する。根拠: `docs/DESIGN.md:43-58`
- `src/ui/` は Phaser インスタンスやゲーム状態へ直接触れない。根拠: `docs/DESIGN.md:43-49`
- シーン再入時の状態は `create()` で初期化する方針。根拠: `docs/DESIGN.md:81-86`

## 1. 実装調査

### 1.1 変更対象サマリ

| 優先度 | 領域 | 主な変更対象 | 目的 | 根拠 |
| --- | --- | --- | --- | --- |
| A | HP状態管理・被弾処理 | `src/games/proto/scenes/GameScene.ts` | 横接触=即ミスから、HP-1 + 無敵 + ノックバックへ変更する | `src/games/proto/scenes/GameScene.ts:41-42`, `src/games/proto/scenes/GameScene.ts:357-367` |
| A | ハートHUD/EventBus | `src/core/events.ts`, `src/ui/Hud.tsx`, `src/styles.css` | Phaser側のHP変化をReact HUDへ通知し、ハート3つを表示する | `src/core/events.ts:10-17`, `src/ui/Hud.tsx:11-47`, `src/styles.css:43-76` |
| A | 武装の弾数状態 | `src/games/proto/systems/StatusSystem.ts`, `src/games/proto/constants.ts` | 爆弾・弓を時間制から残弾制に変更する | `src/games/proto/systems/StatusSystem.ts:24-60`, `src/games/proto/constants.ts:23-28` |
| A | 発射時の残弾消費 | `src/games/proto/scenes/GameScene.ts` | bomb/bow発射成功時だけ残弾を消費する | `src/games/proto/scenes/GameScene.ts:271-304` |
| B | アイテム取得・配置バランス | `src/games/proto/level.ts`, `src/games/proto/constants.ts` | 弾数制に合わせて取得時の弾数・配置を調整する | `src/games/proto/scenes/GameScene.ts:343-349`, `src/games/proto/level.ts:6`, `src/games/proto/level.ts:79-85` |
| B | 文言更新 | `README.md`, `docs/GAME_DESIGN.md`, `src/games/proto/scenes/TitleScene.ts` | 時間制武装の説明を残弾制へ更新する | `README.md:99-105`, `docs/GAME_DESIGN.md:11-18`, `src/games/proto/scenes/TitleScene.ts:36` |

### 1.2 HP制ハート3つ

#### 現状

- `GameScene` には `score` と `finished` はあるが、HP状態はない。根拠: `src/games/proto/scenes/GameScene.ts:41-42`
- `create()` は `score`、`finished`、斬撃/射撃タイマーを初期化しているが、HP初期化とHP emitはない。根拠: `src/games/proto/scenes/GameScene.ts:52-61`
- 初期状態のemitは `PhaseChanged` と `ScoreChanged` のみ。根拠: `src/games/proto/scenes/GameScene.ts:60-61`
- 敵との衝突は `this.physics.add.collider(this.player, this.enemies, ...)` から `onPlayerTouchEnemy()` を呼ぶ。根拠: `src/games/proto/scenes/GameScene.ts:130-133`
- `onPlayerTouchEnemy()` は、踏みつけなら敵へダメージ + バウンド、それ以外は即 `miss()`。HP減算、無敵時間、ノックバックはない。根拠: `src/games/proto/scenes/GameScene.ts:357-367`
- 踏みつけ条件は `this.player.body.touching.down && enemy.body.touching.up`。根拠: `src/games/proto/scenes/GameScene.ts:360-363`
- 落下は `player.y > KILL_Y` で即 `miss()`。根拠: `src/games/proto/scenes/GameScene.ts:106-108`
- `miss()` は `finished = true`、プレイヤーtint、`physics.pause()`、カメラshake、800ms後のGameOver遷移を担当する。根拠: `src/games/proto/scenes/GameScene.ts:374-385`

#### 主な変更箇所

| 観点 | 変更先 | 内容 | 根拠 |
| --- | --- | --- | --- |
| HP状態 | `GameScene.ts` | `playerHp`, `invincibleUntil` などを追加し、`create()` で初期化する | `src/games/proto/scenes/GameScene.ts:41-61`, `docs/DESIGN.md:81-86` |
| 被弾処理 | `GameScene.ts` | `onPlayerTouchEnemy()` を踏みつけ処理と横接触被弾処理に分ける | `src/games/proto/scenes/GameScene.ts:357-367` |
| 死亡処理 | `GameScene.ts` | HPが0になった場合だけ `miss()` を呼ぶ | `src/games/proto/scenes/GameScene.ts:374-385`, `docs/GAME_DESIGN.md:11` |
| 落下処理 | `GameScene.ts` | 落下はHP残量に関係なく即 `miss()` のまま維持する | `src/games/proto/scenes/GameScene.ts:106-108`, `docs/GAME_DESIGN.md:11` |
| 無敵時間 | `GameScene.ts` または `Player.ts` | 被弾直後の多段ヒットを防ぐ | 現状なし。接触処理の入口は `src/games/proto/scenes/GameScene.ts:130-133`, `src/games/proto/scenes/GameScene.ts:357-367` |
| ノックバック | `GameScene.ts` または `Player.ts` | 被弾時に敵から離す。必要なら入力抑制も入れる | `src/games/proto/objects/Player.ts:28-43`, `src/games/proto/scenes/GameScene.ts:96` |
| HUD | `Hud.tsx`, `styles.css` | ハート3つを表示し、HP変化に追従する | `src/ui/Hud.tsx:11-47`, `src/styles.css:43-76` |
| EventBus | `events.ts` | `HealthChanged` と `HealthPayload` を追加する | `src/core/events.ts:10-17`, `docs/DESIGN.md:51-58` |
| 定数 | `constants.ts` | `PLAYER_MAX_HP`, `PLAYER_INVINCIBLE_TIME`, `PLAYER_KNOCKBACK_X/Y` を追加する | `src/games/proto/constants.ts:9`, `src/games/proto/constants.ts:14-20`, `src/games/proto/constants.ts:22-37` |

#### 推奨実装方針

- `GameScene` に以下の状態を持たせる。
  - `playerHp = PLAYER_MAX_HP`
  - `invincibleUntil = 0`
  - 必要なら `knockbackUntil = 0`
- `create()` でHPと無敵状態を初期化し、初期HPをEventBusでemitする。既存の初期emitは `PhaseChanged` と `ScoreChanged`。根拠: `src/games/proto/scenes/GameScene.ts:60-61`
- `onPlayerTouchEnemy()` は次の順序にする。
  1. `finished` または敵撃破済みならreturn。根拠: `src/games/proto/scenes/GameScene.ts:357-358`
  2. 踏みつけなら敵へダメージ、プレイヤーをバウンド。根拠: `src/games/proto/scenes/GameScene.ts:360-364`
  3. 無敵中ならreturn。
  4. 横接触なら `takePlayerDamage(enemy)`。
- `takePlayerDamage(enemy)` で以下を処理する。
  - HPを1減らす。
  - HUDへHP変更を通知する。
  - HPが0なら `miss()`。根拠: `docs/GAME_DESIGN.md:11`
  - HPが残るなら無敵時間、ノックバック、点滅/tintを入れる。
- 落下は現在の即ミス仕様を維持する。根拠: `src/games/proto/scenes/GameScene.ts:106-108`, `docs/GAME_DESIGN.md:11`

#### 注意点

- Arcade Physicsのcolliderは接触中に継続発火し得るため、無敵時間チェックがないと1回の接触でHPが複数減る。接触処理の入口は `src/games/proto/scenes/GameScene.ts:130-133`。
- `ProtoPlayer.handleInput()` が毎フレーム `setVelocityX(...)` を設定するため、ノックバック速度が入力処理で上書きされる。根拠: `src/games/proto/objects/Player.ts:28-43`, `src/games/proto/scenes/GameScene.ts:96`
- `miss()` は `physics.pause()` を含むため、HPが残っている被弾時には呼ばない。根拠: `src/games/proto/scenes/GameScene.ts:374-385`
- 踏みつけ判定を先に評価しないと、正当な踏みつけが被弾扱いになる。根拠: `src/games/proto/scenes/GameScene.ts:360-364`

### 1.3 ハートHUDとEventBus

#### 現状

- `src/core/events.ts` の `GameEvent` は `PhaseChanged`、`ScoreChanged`、`StatusChanged` の3件のみで、HP系イベントはない。根拠: `src/core/events.ts:10-17`
- `StatusEffectInfo` は `id`、`label`、`remaining` を持ち、`remaining` は残り秒数として定義されている。根拠: `src/core/events.ts:21-27`
- `StatusPayload` は `buffs` と `weapon` だけで、HP用フィールドはない。根拠: `src/core/events.ts:29-32`
- `Hud.tsx` のstateは `score`、`phase`、`status` の3つで、HP用stateはない。根拠: `src/ui/Hud.tsx:11-13`
- `Hud.tsx` の購読対象は `ScoreChanged`、`PhaseChanged`、`StatusChanged` のみ。根拠: `src/ui/Hud.tsx:15-27`
- HUDは `phase !== 'playing'` では非表示。根拠: `src/ui/Hud.tsx:29`
- 表示内容はスコア、武器バッジ、バフバッジのみで、ハート表示はない。根拠: `src/ui/Hud.tsx:31-47`
- 既存CSSには `.hud`、`.hud__score`、`.hud__badges`、`.hud__badge`、`.hud__badge--weapon` があるが、ハート用スタイルはない。根拠: `src/styles.css:43-76`

#### 推奨設計

`src/core/events.ts` にHP専用イベントを追加する。

- `GameEvent.HealthChanged = 'health-changed'`
- `HealthPayload = { current: number; max: number }`

HUD側は以下を行う。

- `useState<HealthPayload>({ current: 3, max: 3 })`
- `HealthChanged` を購読する。購読パターンは既存の `ScoreChanged` / `PhaseChanged` / `StatusChanged` と同様。根拠: `src/ui/Hud.tsx:15-27`
- `phase !== 'playing'` では現状どおりHUD非表示。根拠: `src/ui/Hud.tsx:29`
- playing中はスコアと並べてハートを表示する。

HPはバフ/武装とは性質が違うため、`StatusPayload` に混ぜず、専用イベントにする方が見通しが良い。EventBusのイベント名は `GameEvent` に追加し、ペイロードは単純なオブジェクトにする。根拠: `docs/DESIGN.md:51-58`

### 1.4 武装の弾数制

#### 現状

- `StatusSystem` の説明コメントは「一時的な強化（バフ）と武装強化の時限管理」。根拠: `src/games/proto/systems/StatusSystem.ts:18-22`
- バフは `Map<BuffId, number>`、武装は `{ id: WeaponId; until: number } | null` で管理されている。根拠: `src/games/proto/systems/StatusSystem.ts:24-25`
- `setWeapon(id)` は `this.scene.time.now + WEAPON_DURATION` を `until` に設定する。根拠: `src/games/proto/systems/StatusSystem.ts:35-38`
- `currentWeapon` は `weapon.until > now` の間だけ武器IDを返し、それ以外は `normal` を返す。根拠: `src/games/proto/systems/StatusSystem.ts:45-50`
- `update()` はバフと武器の時間切れ処理を行い、武器の期限切れで `weapon = null` にする。根拠: `src/games/proto/systems/StatusSystem.ts:53-60`
- `emitIfChanged()` は武器を `remaining` 秒数付きの `StatusEffectInfo` としてemitする。根拠: `src/games/proto/systems/StatusSystem.ts:69-90`
- `constants.ts` には `BUFF_DURATION` と `WEAPON_DURATION = 12_000` がある。根拠: `src/games/proto/constants.ts:23-28`
- `WEAPON_AMMO` は未定義。武装関連定数の現状根拠: `src/games/proto/constants.ts:22-37`
- READMEには武装が「一定時間だけ有効」「12秒」と説明されている。根拠: `README.md:99-105`

#### 主な変更箇所

| 観点 | 変更先 | 内容 | 根拠 |
| --- | --- | --- | --- |
| 武器状態 | `StatusSystem.ts` | `weapon: { id, ammo } | null` へ変更する | `src/games/proto/systems/StatusSystem.ts:24-25` |
| 武器取得 | `StatusSystem.ts` | `setWeapon(id)` で `WEAPON_AMMO[id]` を設定する | `src/games/proto/systems/StatusSystem.ts:35-38`, `src/games/proto/constants.ts:28` |
| 残弾消費 | `StatusSystem.ts` | `consumeWeaponAmmo()` を追加する | 発射処理側に消費がない根拠: `src/games/proto/scenes/GameScene.ts:271-304` |
| 通常武器復帰 | `StatusSystem.ts` | 残弾0で `weapon = null` にする | 現在は期限切れで `weapon = null`。根拠: `src/games/proto/systems/StatusSystem.ts:58` |
| 発射処理 | `GameScene.ts` | bomb/bowの弾生成成功後に残弾を消費する | `src/games/proto/scenes/GameScene.ts:271-304` |
| HUD payload | `events.ts` | weaponは `remaining` ではなく `ammo` を持つ型に分ける | `src/core/events.ts:21-32` |
| HUD表示 | `Hud.tsx` | 武器だけ `残弾` または `xN` 表示にする | `src/ui/Hud.tsx:35-44` |
| 定数 | `constants.ts` | `WEAPON_DURATION` を `WEAPON_AMMO` に置き換える | `src/games/proto/constants.ts:23-28` |

#### 推奨実装方針

- バフは時間制のまま維持する。現状のバフ時間定数は `BUFF_DURATION`。根拠: `src/games/proto/constants.ts:23-27`, `docs/GAME_DESIGN.md:12`
- 武装だけ弾数制へ変更する。根拠: `docs/GAME_DESIGN.md:13`
- `StatusSystem` の内部表現を変更する。
  - 旧: `weapon: { id: WeaponId; until: number } | null`。根拠: `src/games/proto/systems/StatusSystem.ts:25`
  - 新: `weapon: { id: WeaponId; ammo: number } | null`
- `setWeapon(id)` は `WEAPON_AMMO[id]` をセットする。
- `consumeWeaponAmmo()` は以下を行う。
  - 通常武器なら何もしない、またはfalseを返す。
  - bomb/bowならammoを1減らす。
  - 0になったら `weapon = null`。
  - payload更新をemitする。
- `currentWeapon` は `weapon` があればそのID、なければ `normal` を返す。現在の戻り型は `CurrentWeapon = WeaponId | 'normal'`。根拠: `src/games/proto/systems/StatusSystem.ts:6-8`
- `update()` から武器の時間切れ処理を外す。ただしバフの時間切れ処理は維持する。現在の時間切れ処理根拠: `src/games/proto/systems/StatusSystem.ts:53-60`

#### 発射時の消費タイミング

残弾消費は「入力を受けた時」ではなく「実際に弾を生成した直後」が良い。

理由:

- クールダウン中の入力で弾を消費しない。クールダウン判定の根拠: `src/games/proto/scenes/GameScene.ts:271-275`
- 何らかの理由で発射できなかった場合に残弾だけ減らない。
- bomb/bowだけを消費し、normalは無限に保てる。現在の武器判定根拠: `src/games/proto/scenes/GameScene.ts:281-304`

発射処理の現状:

- `weapon = this.status.currentWeapon` を取得し、`SHOOT_COOLDOWN[weapon]` でクールダウンを見る。根拠: `src/games/proto/scenes/GameScene.ts:271-274`
- bombは爆弾spriteを生成し、遅延自爆を設定してreturnする。根拠: `src/games/proto/scenes/GameScene.ts:281-290`
- bow/normalはprojectileを生成し、bowだけ `pierce = true` にする。根拠: `src/games/proto/scenes/GameScene.ts:292-304`
- 現状、発射成功後に残弾を消費する箇所はない。根拠: `src/games/proto/scenes/GameScene.ts:271-304`

### 1.5 アイテム取得とバランス

- `ItemKind` は `fly | speed | power | bomb | bow`。根拠: `src/games/proto/level.ts:6`
- `applyItem(kind)` は、`bomb` / `bow` なら `status.setWeapon(kind)`、それ以外は `status.addBuff(kind)` へ振り分ける。根拠: `src/games/proto/scenes/GameScene.ts:343-349`
- 現在の `PROTO_LEVEL.items` には bomb 1個、bow 1個、buff系3個が配置されている。根拠: `src/games/proto/level.ts:79-85`
- 同じ武器を再取得した場合の仕様は未決定。
  - 残弾を初期値にリセット
  - 残弾を加算
  - 上限まで補充
- 初期実装では「上限まで補充」または「初期値へリセット」が分かりやすい。
- 弾数制導入後は `level.ts` の bomb/bow配置数と初期弾数のバランス確認が必要。根拠: `src/games/proto/level.ts:79-85`

### 1.6 影響範囲

| 層 | 影響 | 根拠 |
| --- | --- | --- |
| core | `events.ts` にHPイベントと武器残弾用payloadを追加する | `src/core/events.ts:10-32`, `docs/DESIGN.md:51-58` |
| ui | `Hud.tsx` と `styles.css` にハート/残弾表示を追加する | `src/ui/Hud.tsx:11-47`, `src/styles.css:43-76` |
| proto | `GameScene.ts`, `StatusSystem.ts`, `Player.ts`, `constants.ts`, `level.ts` に影響する | `src/games/proto/scenes/GameScene.ts:41-385`, `src/games/proto/systems/StatusSystem.ts:18-90`, `src/games/proto/objects/Player.ts:28-63`, `src/games/proto/constants.ts:9-37`, `src/games/proto/level.ts:6-85` |
| platformer | `StatusPayload` 変更に限れば直接利用は見当たらないが、`events.ts` と `Hud.tsx` は共有基盤なのでtypecheckで確認する | `src/ui/Hud.tsx:1-3`, `src/ui/GameCanvas.tsx:16-17`, `docs/DESIGN.md:43-49`, `docs/DESIGN.md:67-71` |
| docs | READMEやGAME_DESIGNの時間制武装説明を更新する必要がある | `README.md:99-105`, `docs/GAME_DESIGN.md:11-18`, `src/games/proto/scenes/TitleScene.ts:36` |

補足: `platformer` は共有の `core/events.ts` を使うが、利用しているのは主に `PhaseChanged` / `ScoreChanged`。根拠: `src/games/platformer/scenes/GameScene.ts:33-34`, `src/games/platformer/scenes/GameScene.ts:139`, `src/games/platformer/scenes/BootScene.ts:16`, `src/games/platformer/scenes/TitleScene.ts:12`, `src/games/platformer/scenes/GameOverScene.ts:21`

### 1.7 推奨実装順

1. `constants.ts`
   - HP、無敵時間、ノックバック、武器弾数を定義する。
   - 根拠: 既存のプレイヤー/武器調整値は `src/games/proto/constants.ts:14-28`, `src/games/proto/constants.ts:36-37` に集約されている。
2. `core/events.ts`
   - `HealthChanged` と `HealthPayload` を追加する。
   - weapon payloadを `ammo` 対応にする。
   - 根拠: EventBus契約は `src/core/events.ts:10-32`、設計方針は `docs/DESIGN.md:51-58`。
3. `StatusSystem.ts`
   - 武装を時間制から残弾制へ変更する。
   - `consumeWeaponAmmo()` を追加する。
   - 根拠: 現在の時間制管理は `src/games/proto/systems/StatusSystem.ts:24-60`。
4. `GameScene.ts`
   - HP初期化、HP変更emit、被弾処理、発射成功時の残弾消費を追加する。
   - 根拠: 初期化は `src/games/proto/scenes/GameScene.ts:52-64`、被弾は `src/games/proto/scenes/GameScene.ts:357-367`、発射は `src/games/proto/scenes/GameScene.ts:271-304`。
5. `Player.ts`
   - 必要ならノックバック中の入力抑制・点滅/無敵演出を持たせる。
   - 根拠: 毎フレーム速度を設定する既存入力処理は `src/games/proto/objects/Player.ts:28-43`。
6. `Hud.tsx` / `styles.css`
   - ハートと武器残弾を表示する。
   - 根拠: 既存HUD購読と表示は `src/ui/Hud.tsx:11-47`、HUD CSSは `src/styles.css:43-76`。
7. `level.ts`
   - 武器配置と弾数のバランスを調整する。
   - 根拠: 現在のアイテム配置は `src/games/proto/level.ts:79-85`。
8. 文書更新
   - README、GAME_DESIGN、CHANGELOG、TitleSceneの説明を実装内容に合わせる。
   - 根拠: `README.md:99-105`, `docs/GAME_DESIGN.md:11-18`, `src/games/proto/scenes/TitleScene.ts:36`

### 1.8 検証計画

自動チェック:

- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run build`

これらはリポジトリの品質ゲートとして定義されている。根拠: `docs/DESIGN.md:131-140`, `README.md:15-29`

手動確認:

- 敵横接触でHPが `3 → 2 → 1 → 0` と減る。
- HP0のときだけGameOverへ遷移する。
- 被弾直後に敵と重なっても無敵時間中は連続ダメージを受けない。
- 踏みつけではHPが減らない。踏みつけ処理の根拠: `src/games/proto/scenes/GameScene.ts:360-364`
- 落下はHP残量に関係なく即GameOver。落下処理の根拠: `src/games/proto/scenes/GameScene.ts:106-108`
- ノックバック方向が敵位置に対して自然。
- manual/auto両モードでノックバックが破綻しない。auto走行の根拠: `src/games/proto/objects/Player.ts:31-34`
- bomb/bow取得後、HUDに残弾が表示される。
- 発射成功ごとに残弾が1減る。発射処理の根拠: `src/games/proto/scenes/GameScene.ts:271-304`
- 残弾0で通常弾に戻る。現在の `CurrentWeapon` 型の根拠: `src/games/proto/systems/StatusSystem.ts:6-8`
- 通常弾は無限。
- バフは従来どおり秒数表示のまま動く。バフpayloadの根拠: `src/games/proto/systems/StatusSystem.ts:71-76`
- GameOver後の再スタートでHP、武装、scoreが初期化される。シーン初期化方針の根拠: `docs/DESIGN.md:81-86`

## 2. 設計比較

### 2.1 統合推奨

初期実装では、次の組み合わせが最も扱いやすい。

- スコア: 基本加点 + 軽いクリア時ボーナス
- ボス戦: 2〜3フェーズの段階変化型。ただし初回ボスは固定パターン寄り。
- HP回復: 回復は希少、弾薬補給はやや多め。ハートと弾薬箱は分離。
- 難易度: 新要素を段階導入する学習型カーブ。任意チャレンジを一部追加。

HP3つ制では、即死寄りにしすぎると初心者に厳しい。一方で回復を多くしすぎるとハート3つの緊張感が薄れる。弾数制は「制限」だけでなく、攻略・スコア・ボス戦での判断に接続すると価値が出る。

### 2.2 スコア設計

| 案 | 内容 | メリット | デメリット | 実装負荷 | 評価 |
| --- | --- | --- | --- | --- | --- |
| A | 敵撃破・アイテム取得中心の加算スコア | 分かりやすい。実装が軽い。初心者にも目的が明確。 | 上級者向けの伸びしろが少ない。プレイ内容の差が単調になりやすい。 | 低 | 基本として有効 |
| B | 基本加点 + 残HP/残弾/タイムなどのボーナス | HP制・弾数制と自然につながる。上達がスコアに反映される。 | ボーナス比率の調整が必要。残弾節約が強すぎると武器使用の爽快感と競合する。 | 低〜中 | 推奨 |
| C | コンボ・ノーダメージ・倍率型 | 上級者のリプレイ性が高い。動画映えしやすい。 | UIと調整が重い。ミス時の喪失感が強くなりやすい。 | 中〜高 | 後回し |
| D | スコアなし、クリアタイム/収集率中心 | アクション攻略に集中できる。UIが軽い。 | 敵撃破や弾数管理の動機が弱くなる。 | 低 | 別方向の設計 |

推奨はAを土台にBを軽く足す形。

初期案:

- 敵撃破点
- コイン/アイテム取得点
- クリアボーナス
- 残HPボーナス
- 残弾ボーナス
- タイムボーナスは小さめ、または初期は未導入

### 2.3 ボス戦

| 案 | 内容 | メリット | デメリット | 実装負荷 | 評価 |
| --- | --- | --- | --- | --- | --- |
| A | 固定パターン学習型 | 公平感が高い。3ハート制でも理不尽になりにくい。実装しやすい。 | 慣れると単調。再戦時の驚きが少ない。 | 低〜中 | 初期ボス向け |
| B | HP段階ごとに行動が変わるフェーズ型 | 山場を作りやすい。弾数制と相性が良い。達成感がある。 | フェーズ差が大きいと終盤だけ理不尽になる。 | 中 | 推奨 |
| C | 雑魚召喚・ギミック混合型 | 弾数制や補給ギミックを活かしやすい。個性が出る。 | 画面が混雑しやすい。実装・テスト負荷が高い。 | 中〜高 | 後回しまたは軽く採用 |

推奨:

- 2〜3フェーズ。
- 初期ボスは固定パターン寄り。
- フェーズごとに攻撃速度、密度、移動、弱点露出を少し変える。
- 攻撃前に予兆を出す。
- ボス前またはフェーズ間に弾薬補給の余地を残す。
- 視認性と被弾納得感を優先する。

避けたい設計:

- ボス前に弾が足りないと詰む。
- 予兆なし高密度攻撃。
- 最終フェーズだけ急激に難しい。

### 2.4 HP回復

| 案 | 内容 | メリット | デメリット | 実装負荷 | 評価 |
| --- | --- | --- | --- | --- | --- |
| A | 回復なし | ハート3つの緊張感が最大化される。設計が明快。 | 初心者に厳しい。後半で諦め感が出やすい。 | 低 | 短い高難度ステージなら可 |
| B | 固定配置ハート | 難易度制御しやすい。初心者救済になる。配置意図が明確。 | 場所を覚えると緊張感が下がる。 | 低 | 有効 |
| C | 敵撃破時に低確率ドロップ | 逆転感がある。敵を倒す動機が増える。 | 運に左右される。稼ぎ行動が発生しやすい。 | 低〜中 | 慎重採用 |
| D | チェックポイント/ボス前のみ回復 | 3ハートの重みを維持しやすい。区切りごとの難易度管理がしやすい。 | 道中で立て直しにくい。 | 低〜中 | 補助として有効 |
| E | 弾薬箱とハートを分離し、回復は希少・弾補給はやや多め | HP管理と弾数管理の役割が明確。弾数制の楽しさを維持しやすい。 | アイテム種別と配置ルールが増える。 | 中 | 推奨 |

推奨:

- 最大HPは3固定。
- 回復は1ハート単位。
- ハート回復は希少。
- 弾薬補給はハートより多め。
- ボス前に1ハート回復、または最低HP保証を検討する。
- ランダムドロップを入れる場合は完全ランダムではなく、固定配置と併用する。

### 2.5 難易度カーブ

| 案 | 内容 | メリット | デメリット | 実装負荷 | 評価 |
| --- | --- | --- | --- | --- | --- |
| A | 敵数・弾幕密度を直線的に増やす | 実装と調整が分かりやすい。 | 単調。HP3つでは急に理不尽になりやすい。 | 低 | 補助軸 |
| B | 新敵・新地形・新攻撃を段階導入する学習型 | 上達感がある。難度上昇に納得感が出る。 | ステージ設計に手間がかかる。 | 中 | 推奨 |
| C | 弾薬制限を徐々に厳しくするリソース管理型 | 弾数制を活かせる。節約判断が生まれる。 | 窮屈になりやすい。初心者が詰まりやすい。 | 中 | 副軸で採用 |
| D | 分岐・任意チャレンジで難度を分ける | 初心者と上級者を両立しやすい。スコア設計と噛み合う。 | ステージ設計コストが増える。 | 中〜高 | 一部採用 |
| E | プレイヤー成績に応じた動的難易度 | 幅広い腕前に対応しやすい。 | 検証が重い。スコア競争の公平性と相性が悪い。 | 高 | 初期は非推奨 |

推奨カーブ:

1. 導入: 敵1種、通常攻撃、HP制に慣れる。
2. 練習: 武装アイテムを安全な場所で試せる。
3. 応用: 敵配置、足場、弾数判断を組み合わせる。
4. ボス前: 1ハート回復または弾薬補給。
5. ボス: フェーズ型で習得内容を確認する。
6. 任意チャレンジ: 高スコア、隠しルート、収集要素で上級者向けにする。

## 3. 実装前に決めるべき項目

1. 同種武器再取得時の弾数扱い
   - 初期値へリセット
   - 現在値に加算
   - 上限まで補充
2. ボス戦で弾切れした場合の救済
   - 通常弾/近接だけで倒せる
   - 雑魚撃破で補給
   - 時間経過で補給
   - フェーズ間に補給
3. 回復ハートの配置方針
   - 固定配置
   - 低確率ドロップ
   - ボス前/中間地点のみ
   - 固定配置 + 疑似ランダム
4. スコアの主軸
   - クリア重視
   - スコアアタック重視
   - 収集/タイム重視
5. 残弾ボーナスの強さ
   - 強いと節約寄りになる
   - 弱いと武器を使う爽快感を保てる
6. 被弾後無敵時間の長さ
   - 短いと連続被弾しやすい
   - 長いと難度が下がる
7. ボスHP表示
   - 表示あり: 戦略的
   - 表示なし: 演出寄り
8. 難易度選択
   - 単一難度 + 任意チャレンジ
   - 難易度選択あり

## 4. 次フェーズの推奨スコープ

まずは基礎仕様として以下に絞るのが安全。

1. HP制3ハート
2. 被弾後無敵時間
3. ハートHUD
4. 武装の弾数制
5. 残弾HUD

初回実装では後回しにする候補:

- ボス戦
- コンボ倍率
- 複雑なスコア評価
- ランダム回復ドロップ
- 動的難易度

理由:

- HP制と弾数制だけで、`GameScene`、`StatusSystem`、`Hud`、`events` に十分な変更が入る。
- まず基礎仕様を安定させた方が、後続のスコア・回復・ボス調整がしやすい。
- 仕様が安定するまでボスや複雑なスコアを入れると、バランス調整の原因切り分けが難しくなる。

## 5. 参照すべき既存文書

- `README.md`: 現在の操作方法、ルール、武装の時間制説明。
- `docs/DESIGN.md`: React/Phaser分離、EventBus契約、品質ゲート。
- `docs/GAME_DESIGN.md`: HP制ハート3つ、武装弾数制、未決定項目の元方針。
- `CHANGELOG.md`: 方針決定と作業履歴。
