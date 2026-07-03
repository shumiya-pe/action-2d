# 設計仕様書

2D アクションゲーム開発基盤の設計仕様。
「なぜこの構造なのか」と「新しいコードをどこに置くべきか」を判断するための基準を示す。

## 1. 目的と前提

- 第1作（横スクロールアクション）を開発しつつ、第2作以降（弾幕 STG など）を
  同じ基盤で開発できるよう、**ゲーム固有ロジックと基盤を分離**する
- 完成後は **PWA → PWABuilder で TWA 化 → Google Play 公開** のパイプラインに乗せる
- 将来のネイティブ機能（AdMob・課金）は Capacitor 移行で対応する予定のため、
  移行の障害になる実装（特定ブラウザ API への強い依存など）は避ける

## 2. 技術スタック

| 領域           | 技術                       | 備考                        |
| -------------- | -------------------------- | --------------------------- |
| ビルド         | Vite 8                     |                             |
| 言語           | TypeScript 6（strict）     | `verbatimModuleSyntax` 有効 |
| UI シェル      | React 19                   | UI 層のみ                   |
| ゲームエンジン | Phaser 3.90                | Arcade Physics              |
| PWA            | vite-plugin-pwa（Workbox） | autoUpdate 方式             |
| 品質           | ESLint 10 + Prettier + tsc | CI（GitHub Actions）で強制  |

## 3. レイヤー構造

```
┌──────────────────── React（UI 層）────────────────────┐
│  責務: 起動シェル / メニュー / DOM ベースの HUD・案内   │
│  禁止: ゲームループ・物理・描画への関与                │
└───────────────△────────────────────────────────────────┘
                │ EventBus（Phaser.Events.EventEmitter）
┌───────────────▽──────────── Phaser（ゲーム層）─────────┐
│  src/core/   … ゲーム共通基盤（全タイトルで再利用）     │
│  src/games/  … タイトル固有のシーン・オブジェクト       │
└─────────────────────────────────────────────────────────┘
```

### 3.1 依存ルール

依存は必ず一方向にする。違反を見つけたらリファクタリング対象。

- `src/ui/`（React）→ `src/core/events.ts` の EventBus **のみ** 参照可
  （例外: `GameCanvas` は `createGame` と `GameDefinition` を参照して起動する）
- `src/games/*` → `src/core/*` に依存してよい
- `src/core/*` → `src/games/*` に依存しては**ならない**
- `src/games/A` → `src/games/B` に依存しては**ならない**（共通化したいものは core へ昇格）
- React コンポーネントから `Phaser.Scene` や `Phaser.Game` のインスタンスを
  直接触らない。状態のやり取りはすべて EventBus 経由

### 3.2 React↔Phaser 連携（EventBus）

- `src/core/events.ts` にシングルトンの `EventBus` とイベント名定義 `GameEvent` を置く
- Phaser 側（シーン）が emit、React 側（フック）が購読するのが基本方向
- React → Phaser 方向の指示（例: ポーズ）も同じ EventBus を使う
- イベント名は `GameEvent` 定数に必ず追加し、文字列リテラルの直書きをしない
- ペイロードはプリミティブか単純なオブジェクトに限定（Phaser オブジェクトを渡さない）

現在のイベント:

| イベント         | 方向           | ペイロード      | 用途                      |
| ---------------- | -------------- | --------------- | ------------------------- |
| `phase-changed`  | Phaser → React | `GamePhase`     | シーン遷移の通知          |
| `score-changed`  | Phaser → React | `number`        | HUD のスコア更新          |
| `status-changed` | Phaser → React | `StatusPayload` | バフ・武装の HUD 表示更新 |

### 3.3 ゲームの追加方法

1. `src/games/<新作>/` を作成し、`GameDefinition`（解像度・重力・シーン一覧）を export
2. `src/ui/GameCanvas.tsx` で `createGame(parent, <新作定義>)` に差し替える
3. `src/core/` は原則変更しない。共通機能が足りなければ core に汎用機能として追加する

## 4. シーン設計

シーン構成は全タイトル共通の骨格として以下に従う:

```
Boot → Preload → Title → Game → GameOver（クリア/ミス共用）→ Title …
```

- **Boot**: アセットロード前の初期化のみ。処理は最小限
- **Preload**: テクスチャ生成・アセットロードをすべてここで済ませる
  （60fps 維持のため、プレイ中の動的生成を避ける）
- **Game**: プレイ本体。シーン再入で状態が完全リセットされるよう、
  すべての状態を `create()` で初期化する（メンバ初期値に依存しない）
- **GameOver**: `{ result: 'clear' | 'miss', score }` を受け取る共用リザルト

シーン間のデータ受け渡しは `scene.start(key, data)` の data 引数を使う。
グローバル変数や registry の濫用は避ける。

## 5. 入力設計

`src/core/input/Controls.ts` がキーボードとタッチを統合し、
ゲーム側は論理入力（`left` / `right` / `jumpHeld` / `consumeJump()`）だけを見る。

- キーボード: ←→ 移動、スペースまたは ↑ ジャンプ（PC デバッグ用）
- タッチ: バーチャルボタン（左下に ◀▶、右下に ▲）。マルチタッチ対応
  （`activePointers: 3`）
- 「押した瞬間」はキュー方式（`consumeJump`）で表現し、フレーム落ちで取りこぼさない
- 新しいアクションが必要になったら Controls に論理入力を追加する
  （デバイス判定をゲーム側に書かない）

## 6. 描画・アセット方針

- 現段階はすべてプレースホルダー: Graphics 生成テクスチャ
  （`src/core/gfx/textures.ts`）と Rectangle/Triangle
- テクスチャキーは各ゲームの `constants.ts` の `TextureKey` に集約し、
  スプライト差し替え時はテクスチャ生成部だけを変更すればよい構造を保つ
- 外部アセット導入時は Preload シーンでロードし、**ASSETS.md にライセンスを記載**（必須）
- 論理解像度は 960x540（16:9 横画面）固定、`Scale.FIT` + `CENTER_BOTH` で全画面適合

## 7. パフォーマンス方針（60fps 目標）

- テクスチャ生成・オブジェクト生成はシーン `create()` までに済ませる
- `update()` 内でのオブジェクト生成・破棄を避ける（弾などは将来プール化する）
- 物理は Arcade Physics のみ（Matter は使わない）
- React の再レンダリングがゲームループへ影響しない構造を維持する
  （EventBus 購読による state 更新は HUD 等の低頻度なものに限る）

## 8. PWA / リリースパイプライン

1. **PWA**: vite-plugin-pwa（`registerType: 'autoUpdate'`）で
   manifest / Service Worker を生成。オフライン動作可能
2. **ホスティング**: Vercel（ダッシュボードから手動連携。ビルド: `npm run build`、
   出力: `dist/`）
3. **TWA 化**: PWABuilder に本番 URL を入力して Android パッケージを生成
4. **Google Play**: AAB を Play Console から公開

manifest は `vite.config.ts` 内で定義（orientation: landscape、maskable アイコン同梱）。

## 9. 品質ゲート

| チェック     | コマンド               | CI  |
| ------------ | ---------------------- | --- |
| Lint         | `npm run lint`         | ✔   |
| フォーマット | `npm run format:check` | ✔   |
| 型           | `npm run typecheck`    | ✔   |
| ビルド       | `npm run build`        | ✔   |

- push / PR ごとに GitHub Actions（`.github/workflows/ci.yml`）で全チェックを実行
- コミットメッセージは日本語

## 10. スコープ外（現時点）

音・BGM、ステージエディタ、セーブ機能、AdMob・課金、テスト自動化（ユニット/E2E）
