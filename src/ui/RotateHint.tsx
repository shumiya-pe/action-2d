/**
 * スマホ縦持ち時に横画面を促すオーバーレイ（表示制御は CSS メディアクエリ）。
 */
export function RotateHint() {
  return (
    <div className="rotate-hint">
      <div className="rotate-hint__inner">
        <span className="rotate-hint__icon">📱↻</span>
        <p>端末を横向きにしてください</p>
      </div>
    </div>
  );
}
