import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import PodiumCSS from '@/components/2d/PodiumCSS';

const categories = [
  { label: '🏆 Volume Champion', key: 'cases_won', order: 'desc' },
  { label: '⚡ Speed Champion', key: 'avg_resolution_days', order: 'asc' },
  { label: '❤️ Pro Bono Champion', key: 'pro_bono_count', order: 'desc' },
  { label: '⭐ Most Trusted', key: 'avg_rating', order: 'desc' },
  { label: '🛡️ Courage Award', key: 'anonymous_cases_count', order: 'desc' },
  { label: '🌟 Rising Star', key: 'total_score', order: 'desc' },
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const cat = categories[activeCategory];
    const { data } = await supabase
      .from('lawyer_scores')
      .select('*, user:users!lawyer_scores_lawyer_id_fkey(full_name, city)')
      .order(cat.key as any, { ascending: cat.order === 'asc' })
      .limit(10);
    setLeaderboard(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeaderboard(); }, [activeCategory]);

  // Refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  const top3 = leaderboard.slice(0, 3).map(l => ({
    name: l.user?.full_name || 'Unknown',
    initials: (l.user?.full_name || 'U')[0],
    score: l.total_score || 0,
  }));

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">Leaderboard</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {categories.map((c, i) => (
          <button key={i} onClick={() => setActiveCategory(i)} className="px-3 py-1.5 rounded-pill text-xs font-body whitespace-nowrap nyaya-transition relative" style={{ color: activeCategory === i ? '#0d1f35' : 'rgba(255,255,255,0.6)', fontWeight: activeCategory === i ? 600 : 400 }}>
            {activeCategory === i && <motion.div layoutId="cat-pill" className="absolute inset-0 rounded-pill" style={{ background: '#c9a227' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            <span className="relative z-10">{c.label}</span>
          </button>
        ))}
      </div>

      {!loading && top3.length >= 3 && (
        <div className="mb-6 py-8 glass-card rounded-2xl flex items-end justify-center">
          <PodiumCSS className="h-[200px]" top3={top3} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((l, i) => {
            const isUser = l.lawyer_id === user?.id;
            return (
              <ScrollReveal key={l.id} delay={i * 0.05}>
                <TiltCard className={`glass-card flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl`} style={isUser ? { background: 'rgba(201,162,39,0.05)', border: '1px dashed rgba(201,162,39,0.3)' } : i < 3 ? { borderLeft: `4px solid ${i === 0 ? 'rgba(201,162,39,0.5)' : i === 1 ? 'rgba(180,180,180,0.3)' : 'rgba(205,127,50,0.3)'}` } : {}} maxTilt={3}>
                  <span className="text-3xl font-display font-bold w-10 text-center" style={{ color: i < 3 ? 'rgba(201,162,39,0.3)' : 'rgba(255,255,255,0.08)' }}>{i + 1}</span>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: i === 0 ? '2px solid rgba(201,162,39,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-xs font-body font-semibold text-foreground">{(l.user?.full_name || 'U')[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-body font-semibold text-foreground">{l.user?.full_name || 'Unknown'} {isUser && <span className="text-nyaya-gold text-xs">(You)</span>}</p>
                    <p className="text-xs font-body text-muted-foreground">{l.user?.city || ''} • {l[categories[activeCategory].key] || 0} {categories[activeCategory].key.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="font-mono font-bold text-sm text-nyaya-gold">{l.total_score || 0}</span>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
