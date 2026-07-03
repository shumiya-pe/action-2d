# Action 2D

Vite + TypeScript + React + Phaser 3 による 2D アクションゲーム開発基盤。
第1作としてマリオ風の横スクロールアクションを実装している。
ゲーム固有ロジックと基盤を分離しており、同じ基盤の上で第2作（弾幕 STG など）も開発できる。

## 開発コマンド

| コマンド               | 内容                                             |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | 開発サーバー起動（HMR 付き）                     |
| `npm run build`        | 本番ビルド（`dist/` に出力、PWA アセットも生成） |
| `npm run preview`      | 本番ビルドをローカル配信（PWA の動作確認用）     |
| `npm run lint`         | ESLint                                           |
| `npm run typecheck`    | TypeScript 型チェック（`tsc --noEmit`）          |
| `npm run format`       | Prettier で整形                                  |
| `npm run format:check` | Prettier チェックのみ                            |
| `npm run icons`        | PWA アイコン（プレースホルダー）を再生成         |

Node.js 22 以上を推奨。CI（GitHub Actions）では push / PR ごとに
lint → format:check → typecheck → build を実行する。

詳細な設計仕様は [docs/DESIGN.md](./docs/DESIGN.md) を参照。

## アーキテクチャ

React は「起動シェルと DOM ベースの UI」だけを担当し、
ゲームループ・描画・物理はすべて Phaser のシーンとして実装する。
両者は EventBus（`Phaser.Events.EventEmitter`）経由でのみやり取りし、直接結合しない。

```
┌──────────────────── React（UI 層）────────────────────┐
│  App                                                   │
│  ├─ GameCanvas   … Phaser.Game を1度だけ生成・破棄     │
│  ├─ Hud          … スコア表示（EventBus 購読のみ）     │
│  └─ RotateHint   … 縦持ち時の回転案内（CSS 制御）      │
└───────────────△────────────────────────────────────────┘
                │ EventBus（score-changed / phase-changed）
┌───────────────▽──────────── Phaser（ゲーム層）─────────┐
│  src/core/      … ゲーム共通基盤（第2作でも再利用）    │
│  │   createGame  … Game 生成（Scale.FIT / 物理設定）   │
│  │   events      … EventBus とイベント定義             │
│  │   input       … キーボード＋バーチャルボタン統合    │
│  │   gfx         … Graphics→テクスチャ生成ヘルパー     │
│  └─ src/games/platformer/ … 第1作固有のロジック        │
│      scenes: Boot → Preload → Title → Game → GameOver  │
│      objects: Player / Enemy、level: ステージデータ    │
└─────────────────────────────────────────────────────────┘
```

### ディレクトリ構成

```
src/
├── main.tsx              # エントリポイント（SW 登録・React マウント）
├── App.tsx               # UI シェル
├── ui/                   # React コンポーネント（UI 層のみ）
├── core/                 # ゲーム共通基盤 ※ゲーム固有コードを置かない
└── games/
    └── platformer/       # 第1作（横スクロールアクション）
        ├── index.ts      # GameDefinition（シーン一覧・解像度・重力）
        ├── constants.ts  # 調整パラメータ・キー定義
        ├── level.ts      # ステージデータ
        ├── scenes/       # Boot / Preload / Title / Game / GameOver
        └── objects/      # Player / Enemy
```

第2作を追加するときは `src/games/<新作>/` を作り、`GameDefinition` を
`createGame()` に渡すだけでよい（`src/core/` は変更しない想定）。

## 操作方法

- **タッチ（スマホ）**: 画面左下の ◀ ▶ ボタンで移動、右下の ▲ ボタンでジャンプ
- **キーボード（PC）**: ← → で移動、スペース（または ↑）でジャンプ

ルール: コインで +100 点、敵は踏むと倒せて +50 点。横から触れるとミス。
穴に落ちてもミス。右端の旗に到達でクリア。

## 動作確認手順

### PC ブラウザ

1. `npm install`
2. `npm run dev` → 表示された URL（通常 <http://localhost:5173>）を開く
3. スペースキーでスタートし、←→・スペースで操作できることを確認

PWA（Service Worker・オフライン動作）は開発サーバーでは無効。
確認する場合は `npm run build && npm run preview` で <http://localhost:4173> を開き、
DevTools → Application → Service Workers で登録を確認後、
ネットワークを Offline にしてリロードしても動くことを確認する。

### スマホ実機（Chrome）

1. PC とスマホを同じ Wi-Fi につなぐ
2. `npm run dev -- --host` で LAN に公開し、表示された `Network:` の URL
   （例 `http://192.168.x.x:5173`）をスマホの Chrome で開く
3. 端末を横向きにして、バーチャルボタンで移動・ジャンプできることを確認
   （縦持ちだと回転を促すオーバーレイが出る）

> Service Worker は HTTPS（または localhost）でのみ動くため、LAN の IP アドレス
> 経由では PWA 機能は無効になる（ゲーム自体は動く）。実機で PWA として確認する
> 場合は Vercel 等にデプロイした HTTPS の URL で行うのが簡単。
> インストール確認は Chrome メニュー →「アプリをインストール」。

## リリースパイプライン（予定）

1. **PWA**: vite-plugin-pwa で manifest / Service Worker を生成（実装済み）
2. **Vercel**: リポジトリ連携で `dist/` を配信（ダッシュボードから手動設定）
3. **TWA 化**: [PWABuilder](https://www.pwabuilder.com/) に本番 URL を入力して
   Android パッケージ（TWA)を生成
4. **Google Play**: 生成した AAB を Play Console から公開

将来的なネイティブ機能（AdMob・課金）は Capacitor 移行で対応する想定のため、
ブラウザ固有 API への強い依存は避けること。

## アセット

現状はすべてコード生成のプレースホルダー（詳細は [ASSETS.md](./ASSETS.md)）。
外部アセットを追加する場合は必ず ASSETS.md にライセンスを記載する。

## スコープ外（未実装）

音・BGM、ステージエディタ、セーブ機能、広告・課金
