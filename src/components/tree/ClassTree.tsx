import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { STUDENTS } from '../../data/students';
import { useShop } from '../../hooks/useShop';
import { useAppSettings } from '../../hooks/useAppSettings';
import { Button } from '../ui/Button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { TREE_STAGES, TREE_STEP } from '../../data/shopItems';

// クラスの木（P1-1）：みんなの寄付でチームの木が育つ「見るだけ」ごほうび。
// 寄付は個人(shop.donated)に記録され、表示時に56A/56B か 5年/6年 で集計する。
interface Group { key: string; label: string; emoji: string; total: number; }

const stageFor = (total: number) => Math.min(TREE_STAGES.length - 1, Math.floor(total / TREE_STEP));

export const ClassTree: React.FC = () => {
  const navigate = useNavigate();
  const { balance, donate } = useShop();
  const { treeMode } = useAppSettings();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('students').select('id, shop');
    const donatedById = new Map<string, number>();
    (data || []).forEach((r: any) => { donatedById.set(r.id, r.shop?.donated || 0); });

    // ロスターの実生徒だけをグループ分けして集計（Test/設定行は除外）
    const roster = STUDENTS.filter(s => s.id !== '00');
    let g: Group[];
    if (treeMode === 'grade') {
      const sum = (grade: number) => roster.filter(s => s.grade === grade).reduce((a, s) => a + (donatedById.get(s.id) || 0), 0);
      g = [
        { key: 'g5', label: '5年生', emoji: '🟢', total: sum(5) },
        { key: 'g6', label: '6年生', emoji: '🟣', total: sum(6) },
      ];
    } else {
      const sum = (cls: 'A' | 'B') => roster.filter(s => s.cls === cls).reduce((a, s) => a + (donatedById.get(s.id) || 0), 0);
      g = [
        { key: 'A', label: '56A', emoji: '🔵', total: sum('A') },
        { key: 'B', label: '56B', emoji: '🟠', total: sum('B') },
      ];
    }
    setGroups(g);
    setLoading(false);
  };

  useEffect(() => { load(); }, [treeMode]); // eslint-disable-line

  const handleDonate = async (amount: number) => {
    if (donate(amount)) {
      // 反映まで少し待って再取得
      setTimeout(load, 900);
    }
  };

  const diff = groups ? Math.abs(groups[0].total - groups[1].total) : 0;
  const leader = groups && groups[0].total !== groups[1].total
    ? (groups[0].total > groups[1].total ? groups[0] : groups[1]) : null;

  return (
    <div className="flex-col gap-lg" style={{ flex: 1, maxWidth: '720px', margin: '0 auto', width: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate('/home')} icon={ArrowLeft}>もどる</Button>
        <h2 className="text-primary" style={{ margin: 0, flex: 1, textAlign: 'center', marginRight: '80px' }}>🌳 みんなの木</h2>
      </div>
      <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>
        ポイントをあげると、チームの木が そだつよ！みんなで大きくしよう🌱
      </p>

      {loading || !groups ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>よみこみ中…</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {groups.map(g => {
              const st = stageFor(g.total);
              const nextAt = (st + 1) * TREE_STEP;
              const inStage = g.total - st * TREE_STEP;
              const pct = st >= TREE_STAGES.length - 1 ? 100 : Math.round((inStage / TREE_STEP) * 100);
              return (
                <div key={g.key} className="glass-card flex-col flex-center gap-sm" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{g.emoji} {g.label}</div>
                  <div style={{ fontSize: '4.5rem', lineHeight: 1.1 }}>{TREE_STAGES[st]}</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{g.total}P</div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-success)', transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {st >= TREE_STAGES.length - 1 ? 'さいだいまで育った！🏆' : `つぎの木まで あと${nextAt - g.total}P`}
                  </div>
                </div>
              );
            })}
          </div>

          {leader && (
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              いま {leader.emoji}{leader.label} が {diff}P リード！
            </div>
          )}

          {/* 寄付 */}
          <div className="glass-card flex-col flex-center gap-md" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>じぶんのチームの木に あげる（つかえる：{balance}P）</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[10, 50, 100].map(a => (
                <Button key={a} onClick={() => handleDonate(a)} disabled={balance < a}>{a}P あげる</Button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>※ ためたポイント（累計）は へらないよ</p>
          </div>

          <div className="flex-center">
            <Button variant="outline" onClick={load} icon={RefreshCw}>さいしんにする</Button>
          </div>
        </>
      )}
    </div>
  );
};
