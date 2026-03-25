import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import BookAppointment from '@/components/BookAppointment';

const FindLawyer = () => {
  const { ts } = useLanguage();
  const fl = ts('find_lawyer');
  const common = ts('common');
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [bookingLawyer, setBookingLawyer] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('users').select('*, lawyer_scores(*)').eq('role', 'lawyer').order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching lawyers:", error);
      }
      setLawyers(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filters = [
    { key: 'all', label: common.all },
    { key: 'free', label: fl.free_low_cost },
    { key: '4plus', label: fl.four_plus_rating },
  ];
  const filtered = lawyers.filter(l => {
    const scores = Array.isArray(l.lawyer_scores) ? l.lawyer_scores[0] : l.lawyer_scores;
    if (filter === 'free') return (l.fee_range_min || 0) === 0;
    if (filter === '4plus') return (scores?.avg_rating || 0) >= 4;
    return true;
  });

  return (
    <div className="max-w-5xl">
      <h2 className="font-display text-2xl font-bold mb-6" style={{ color: '#1a3c5e' }}>{fl.find_lawyer_title}</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-pill text-xs font-body nyaya-transition ${f.key === filter ? 'font-semibold' : ''}`} style={f.key === filter ? { background: '#1a3c5e', color: '#fff' } : { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,60,94,0.08)', color: '#4b5563' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(26,60,94,0.06)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm font-body text-center py-16" style={{ color: '#6b7280' }}>{fl.no_lawyers_criteria}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l, i) => {
            const scores = Array.isArray(l.lawyer_scores) ? l.lawyer_scores[0] : l.lawyer_scores;
            return (
              <ScrollReveal key={l.id} delay={i * 0.1}>
                <TiltCard className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,60,94,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }} maxTilt={6}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,60,94,0.06)', border: '2px solid rgba(201,162,39,0.2)' }}>
                      <span className="font-body font-bold text-sm" style={{ color: '#1a3c5e' }}>{l.full_name?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm" style={{ color: '#1a3c5e' }}>{l.full_name}</p>
                      <p className="text-xs font-body" style={{ color: '#6b7280' }}>{l.specialization?.join(', ') || common.general} • {l.city || 'India'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-body mb-3" style={{ color: '#6b7280' }}>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-nyaya-gold" fill="#c9a227" /> {scores?.avg_rating?.toFixed(1) || 'N/A'}</span>
                    <span>{scores?.cases_won || 0} {fl.cases_won_label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-body mb-4" style={{ color: '#6b7280' }}>
                    <span className="font-mono text-nyaya-gold font-semibold">{scores?.total_score || 0} {fl.pts}</span>
                    <span>{fl.fee}: ₹{l.fee_range_min || 0} - ₹{l.fee_range_max || 0}</span>
                  </div>
                  <motion.button onClick={() => setBookingLawyer(l)} className="w-full py-2 rounded-lg text-xs font-body font-semibold btn-shine flex items-center justify-center gap-1" style={{ background: '#1a3c5e', color: '#fff' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Calendar className="w-3 h-3" /> {fl.book_appointment}
                  </motion.button>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {bookingLawyer && <BookAppointment lawyer={bookingLawyer} onClose={() => setBookingLawyer(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default FindLawyer;
