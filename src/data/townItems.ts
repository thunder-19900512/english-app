// みんなの町（クラスの木の続き）。
// 木 → 森 → 町ひらき → 建物を建てる、と積み上がる。
// 建物は10種×3段階。Lv1が完成するとLv2が候補に出る（積み上げ式）。
// 価格の目安：1チームが授業1回で木に入れるのは約700〜900P（2026-09時点の実績）。

export interface TownBuilding {
  id: string;
  kind: string;      // 種類（住まい・交通など）。同じ種類はLv順に解放される
  level: 1 | 2 | 3;
  emoji: string;
  name: string;
  desc: string;
  cost: number;
}

// 森→町へ移るしきい値。ここを超えると「町ひらき」で建物を建てられるようになる。
export const TOWN_OPEN = 20000;

// 森の段階（0〜TOWN_OPEN）。木が増えて森になっていく。
export const FOREST_STAGES = [
  '🌱', '🌿', '🪴', '🌳', '🌳🌲', '🌲🌳🌲', '🌳🌲🌳🌲', '🌲🌳🌲🌳🌲', '🌲🌳🌲🌳🌲🌳', '🌲🌳🌲🌳🌲🌳🌲',
];

export const TOWN_BUILDINGS: TownBuilding[] = [
  // 住まい
  { id: 'house1', kind: '住まい', level: 1, emoji: '🏠', name: '家', desc: 'さいしょの一けん。ここから町がはじまる', cost: 1200 },
  { id: 'house2', kind: '住まい', level: 2, emoji: '🏡', name: '庭つきの家', desc: '庭で花をそだてられる家', cost: 2000 },
  { id: 'house3', kind: '住まい', level: 3, emoji: '🏘️', name: '住宅街', desc: 'みんなが住む、にぎやかな通り', cost: 3500 },
  // 学校
  { id: 'school1', kind: '学校', level: 1, emoji: '🏫', name: '学校', desc: '町のみんなが学ぶ場所', cost: 1500 },
  { id: 'school2', kind: '学校', level: 2, emoji: '📚', name: '図書館', desc: '本がたくさん。しずかに読める', cost: 2500 },
  { id: 'school3', kind: '学校', level: 3, emoji: '🎓', name: '大きな学園', desc: '世界から人が学びに来る', cost: 4000 },
  // お店
  { id: 'shop1', kind: 'お店', level: 1, emoji: '🏪', name: 'コンビニ', desc: 'いつでも開いている、たよれるお店', cost: 1000 },
  { id: 'shop2', kind: 'お店', level: 2, emoji: '🏬', name: '商店街', desc: 'お店がならぶ、たのしい通り', cost: 2000 },
  { id: 'shop3', kind: 'お店', level: 3, emoji: '🛍️', name: 'ショッピングプラザ', desc: '軽井沢みたいな大きなお店', cost: 3500 },
  // 食べる
  { id: 'food1', kind: '食べる', level: 1, emoji: '🍞', name: 'パン屋', desc: '朝からいいにおい', cost: 1200 },
  { id: 'food2', kind: '食べる', level: 2, emoji: '🍽️', name: 'レストラン', desc: '川のそばでごはんが食べられる', cost: 2200 },
  { id: 'food3', kind: '食べる', level: 3, emoji: '🍱', name: '世界の料理店', desc: '世界のお弁当が集まるお店', cost: 3500 },
  // 交通
  { id: 'train1', kind: '交通', level: 1, emoji: '🚏', name: 'バス停', desc: 'ここから町へ出かけられる', cost: 800 },
  { id: 'train2', kind: '交通', level: 2, emoji: '🚉', name: '駅', desc: '電車に乗れる。町の中心', cost: 2500 },
  { id: 'train3', kind: '交通', level: 3, emoji: '🚄', name: '新幹線の駅', desc: '遠くの町とつながる', cost: 4500 },
  // 自然
  { id: 'park1', kind: '自然', level: 1, emoji: '⛲', name: '公園', desc: 'あそべる広場', cost: 1500 },
  { id: 'park2', kind: '自然', level: 2, emoji: '🦢', name: '池のある公園', desc: '雲場池みたいな、きれいな水', cost: 2500 },
  { id: 'park3', kind: '自然', level: 3, emoji: '🏞️', name: '大きな自然公園', desc: '森と川がひろがる', cost: 4000 },
  // 文化
  { id: 'culture1', kind: '文化', level: 1, emoji: '⛪', name: '教会', desc: '聖パウロ教会のような、しずかな場所', cost: 2000 },
  { id: 'culture2', kind: '文化', level: 2, emoji: '🏛️', name: '美術館', desc: '絵や作品を見られる', cost: 3000 },
  { id: 'culture3', kind: '文化', level: 3, emoji: '🎪', name: 'ホール', desc: '音楽や発表ができる大きな場所', cost: 4500 },
  // 軽井沢：高原
  { id: 'karui1', kind: '高原', level: 1, emoji: '🌾', name: '高原の道', desc: '木もれ日のさんぽ道', cost: 1000 },
  { id: 'karui2', kind: '高原', level: 2, emoji: '🚲', name: 'サイクリングロード', desc: '自転車で町を回れる', cost: 2200 },
  { id: 'karui3', kind: '高原', level: 3, emoji: '💧', name: '大きな滝', desc: '白糸の滝のような名所', cost: 3800 },
  // 軽井沢：あそび
  { id: 'play1', kind: 'あそび', level: 1, emoji: '♨️', name: '温泉', desc: 'あたたまってほっとする', cost: 1500 },
  { id: 'play2', kind: 'あそび', level: 2, emoji: '⛸️', name: 'スケートリンク', desc: '風越公園みたいな氷の広場', cost: 2500 },
  { id: 'play3', kind: 'あそび', level: 3, emoji: '🎿', name: 'スキー場', desc: '冬の軽井沢の楽しみ', cost: 4000 },
  // ランドマーク
  { id: 'land1', kind: 'ランドマーク', level: 1, emoji: '🗼', name: 'タワー', desc: '町がぜんぶ見わたせる', cost: 3000 },
  { id: 'land2', kind: 'ランドマーク', level: 2, emoji: '🏰', name: 'お城', desc: '町のシンボル', cost: 5000 },
  { id: 'land3', kind: 'ランドマーク', level: 3, emoji: '🚀', name: 'ロケット発射台', desc: '町から宇宙へ！さいごの目標', cost: 8000 },
];

/** 今つくれる候補（各種類でいちばん低いLvの未完成のもの）から3つ選ぶ。安い順＋種類の重複を避ける。 */
export const pickCandidates = (built: string[], limit = 3): TownBuilding[] => {
  const doneKindLv = new Map<string, number>();
  for (const b of TOWN_BUILDINGS) {
    if (built.includes(b.id)) doneKindLv.set(b.kind, Math.max(doneKindLv.get(b.kind) || 0, b.level));
  }
  const open = TOWN_BUILDINGS.filter(b => !built.includes(b.id) && b.level === (doneKindLv.get(b.kind) || 0) + 1);
  return open.sort((a, b) => a.cost - b.cost).slice(0, limit);
};
