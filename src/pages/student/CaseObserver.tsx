import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';

const CaseObserver = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from('cases').select('category, ai_summary, case_strength, evidence_gaps, created_at, status').eq('status', 'open');
      if (filter !== 'All') query = query.eq('category', filter);
      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      setCases(data || []);
      setLoading(false);
    };
    fetch();
  }, [filter]);

  const filters = ['All', 'Tenant Rights', 'Criminal', 'Domestic Violence', 'Labor Law', 'Property', 'Consumer Rights'];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-5 h-5 text-nyaya-teal" />
        <h2 className="font-display text-2xl font-bold text-foreground">Case Observer</h2>
      </div>
      <p className="text-sm font-body text-muted-foreground mb-6">Study real anonymized cases to build your legal knowledge.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-pill text-xs font-body nyaya-transition" style={f === filter ? { background: '#0d7377', color: '#fff', fontWeight: 600 } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
      ) : cases.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground text-center py-16">No cases to observe.</p>
      ) : (
        <div className="space-y-4">
          {cases.map((c, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <TiltCard className="glass-card p-5 rounded-xl" maxTilt={3}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-body font-medium" style={{ background: 'rgba(13,115,119,0.1)', color: '#0d7377' }}>{c.category}</span>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-body text-muted-foreground mb-3">{c.ai_summary || 'No summary available.'}</p>
                {c.case_strength > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: c.case_strength >= 70 ? '#0a9e6e' : '#f97316' }} initial={{ width: 0 }} animate={{ width: `${c.case_strength}%` }} transition={{ duration: 1 }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{c.case_strength}%</span>
                  </div>
                )}
                {c.evidence_gaps?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.evidence_gaps.map((g: string) => (
                      <span key={g} className="px-2 py-0.5 rounded text-[10px] font-body" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>⚠ {g}</span>
                    ))}
                  </div>
                )}
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseObserver;
