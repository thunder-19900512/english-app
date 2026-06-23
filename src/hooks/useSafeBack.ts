import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 「もどる」ボタン用。ブラウザ履歴の1つ前のページへ戻す。
 * 直接URLを開いた・リロード直後など履歴が無いときだけ、ホーム（fallback）へ。
 * これまで navigate('/home') 固定だったため「1つ前に戻らずトップに飛ぶ」問題があったのを解消する。
 */
export const useSafeBack = (fallback: string = '/home') => {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key && location.key !== 'default') navigate(-1);
    else navigate(fallback);
  };
};
