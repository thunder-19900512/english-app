// ミッションだけロックで、それぞれのミッションがいま開くか（トップの表示とロック画面で共通）。
//   はじめから … いつでも開く
//   ✍️ afterSign … サインの合言葉を入れた端末だけ（30分。lib/signUnlock）
//   🏁 final     … ほかのミッションを全部クリアしたら開く。🏁 までクリアした端末は、その日ロックが外れる
// 「クリア」は、その日その端末でミッションの画面で合格したこと（lib/missionBonus の markMissionDone）
import type { TodayMission } from '../hooks/useAppSettings';
import { isMissionDone } from './missionBonus';
import { isSignUnlocked } from './signUnlock';

export const isMissionOpen = (m: TodayMission, missions: TodayMission[]): boolean => {
  if (isSignUnlocked()) return true;
  if (m.afterSign) return false;
  if (m.final) return missions.filter(x => !x.final).every(x => isMissionDone(x.route));
  return true;
};

/** 🏁 のミッションまでクリアした端末は、その日はロックなし */
export const finishedToday = (missions: TodayMission[]): boolean => {
  const finals = missions.filter(m => m.final);
  return finals.length > 0 && finals.every(m => isMissionDone(m.route));
};
