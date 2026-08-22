import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 「もどる」ボタン用。
 *
 * 基本は「1つ上の階層（parent）」へ移動する。
 *   例）各モード → カテゴリのモード一覧、カテゴリ → カテゴリ一覧、ステージ → フォニックス一覧。
 *   これで「行ったり来たり（ピンポン）」せず、いつも1段ずつ上に戻れる。
 *
 * ただし、単元やカテゴリをまたいで飛んできた「クロスリンク」の場合
 * （例：ダイアログ練習 → 関連する単語練習へジャンプ）だけは、
 * 履歴を1つ戻して元の画面に返す。
 * ジャンプ元で navigate(path, { state: { fromCrossLink: true } }) を付けると有効になる。
 */
export const useSafeBack = (parent: string = '/home') => {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if ((location.state as any)?.fromCrossLink) navigate(-1);
    else navigate(parent);
  };
};
