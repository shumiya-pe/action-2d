# action-2d

Vite + TypeScript + React + Phaser 3 による 2D アクションゲーム基盤。
Claude Code は作業前に `README.md`、`CHANGELOG.md`、必要に応じて `docs/DESIGN.md` を読む。

## ws運用
- `/Users/mbp/ws` から操作する場合も、このリポジトリを独立したGit管理単位として扱う
- コミット・push・status確認は `action-2d` 内で行う
- 副業/ゲームアプリ全体の方針や進捗が変わる場合は `bun-hq` の該当STATE/README更新を検討する

## 開発コマンド
- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run build`
- `npm run preview`

## 実装方針
- React は起動シェルとDOM UI、ゲームループ・描画・物理は Phaser 側に置く
- React と Phaser は EventBus 経由で連携し、直接結合しない
- `src/core/` はゲーム共通基盤として保ち、固有ロジックは `src/games/<game>/` に置く
- 外部アセットを追加したら `ASSETS.md` にライセンスを記録する
- 変更したら `CHANGELOG.md` へ作業内容を追記する

