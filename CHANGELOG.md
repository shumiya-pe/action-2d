# Changelog

作業履歴のメモ。上が新しい。

## 2026-07-03

### Vercel 連携・Android 実機確認

- Vercel と GitHub 連携（Framework Preset: Vite / Output: `dist`）。main への push で自動デプロイ
- Android 実機（Chrome）で動作確認済み: タッチ操作・横画面・PWA（HTTPS 配信）

### ゲームデザイン方針の決定（docs/GAME_DESIGN.md）

- 世界観: **SF・メカ**（斬撃=ブレード、射撃=ビーム読み替え）
- 構造: **両モード併存**（ステージクリア型＋エンドレスラン）
- 被弾: **HP制（ハート3つ）** に変更予定（現状は一撃ミス）
- 強化: バフは時間制のまま、**武装は弾数制へ変更予定**
- 未決定項目（スコア設計・ボス戦・HP回復・難易度カーブ等）も同ファイルに記録

### 横スクロールアクション試作 `src/games/proto/`（コミット 3a28053）

- コマンド: ジャンプ・斬撃(Z)・射撃(X) 各1ボタン（バーチャルボタン併設）
- スクロール: タイトルで手動 / 自動（オートラン）を選択式
- 一時バフ: 飛行・速度1.5倍・攻撃力2倍（時限、HUD に残り秒数表示）
- 一時武装: 爆弾投擲（範囲爆発）・弓（高速貫通矢）
- 敵2種: walker（HP1・+200点）/ brute（HP3・+500点）。踏む・斬る・撃つで撃破
- 見た目は `skin.ts` に集約した仮デザイン（差し替え前提の構造）
- 基盤拡張: `Controls` を汎用アクションボタン対応化、`status-changed` イベント追加
- バグ修正: 敵グループを物理グループ化（非物理グループだと空間木に載らず衝突判定が
  機能しない）、衝突コールバックを引数順に依存しない実装へ
- Playwright によるスモークテストで検証（射撃キル・接触ミス・両モード・HUD 連動）

### 設計仕様書（docs/DESIGN.md、コミット 11480f5）

- レイヤー構造・依存ルール（ui / core / games の一方向依存）
- EventBus 契約、シーン骨格、入力・アセット・60fps 方針、リリースパイプライン
- インフラ構築マイルストーンとしてタグ `v0.1.0-infra` を作成
  （※リモートの push ポリシーがブランチのみ許可のためタグは未プッシュ。
  GitHub Releases から手動作成するか、ローカルから `git push origin v0.1.0-infra`）

### 開発基盤の構築（コミット 123a933〜defd094）

- Vite 8 / TypeScript 6 / React 19 / Phaser 3.90（いずれも当時の最新安定版）
- React は UI シェルのみ、ゲームは Phaser シーン、連携は EventBus 経由という分離構造
- PWA 対応: vite-plugin-pwa（manifest / Service Worker / オフライン / autoUpdate）
- PWA アイコンを外部依存なしで生成するスクリプト（`npm run icons`）
- 品質: ESLint 10 + Prettier + `tsc --noEmit`、GitHub Actions で
  lint / format / typecheck / build を push ごとに実行
- 縦切りサンプル `src/games/platformer/`（マリオ風・コイン・敵踏み・落下死・ゴール）
- README（開発コマンド・構成図・PC / スマホ実機の動作確認手順）、ASSETS.md（ライセンス管理方針）
