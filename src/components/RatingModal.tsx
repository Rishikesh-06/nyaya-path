import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  caseData: any;
  onClose: () => void;
}

// ─── Direct Supabase score update ────────────────────────────────────────────
const updateLawyerScore = async (lawyerId: string, ratingValue: number) => {
  try {
    const { data: existing } = await supabase
      .from('lawyer_scores')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .single();

    const current = existing || {
      lawyer_id: lawyerId,
      total_score: 0,
      cases_won: 0,
      cases_resolved: 0,
      anonymous_cases_count: 0,
      avg_rating: 0,
      mentor_sessions: 0,
    };

    const totalRatings = Math.max(current.cases_resolved || 1, 1);
    const newAvgRating = ((current.avg_rating || 0) * (totalRatings - 1) + ratingValue) / totalRatings;
    const scoreBonus = Math.round(ratingValue * 5); // 5★ = +25 points

    const updates = {
      avg_rating: Math.round(newAvgRating * 100) / 100,
      total_score: (current.total_score || 0) + scoreBonus,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from('lawyer_scores').update(updates).eq('lawyer_id', lawyerId);
    } else {
      await supabase.from('lawyer_scores').insert({ ...current, ...updates });
    }
  } catch (err) {
    console.warn('Score update failed (non-critical):', err);
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const RatingModal = ({ caseData, onClose }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async () => {
    if (!rating || !user || !caseData.assigned_lawyer_id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('case_ratings').insert({
        case_id: caseData.id,
        victim_id: user.id,
        lawyer_id: caseData.assigned_lawyer_id,
        rating,
        review: review || null,
      });
      if (error) throw error;

      // ✅ Direct score update instead of Edge Function
      await updateLawyerScore(caseData.assigned_lawyer_id, rating);

      toast({ title: 'Thank you for your rating!' });
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to submit rating.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="w-full max-w-sm rounded-2xl p-6 relative" style={{ background: 'rgba(255,255,255,0.95)', color: '#1a3c5e' }} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5" style={{ color: '#6b7280' }} /></button>
        <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#1a3c5e' }}>Rate Your Lawyer</h3>
        <p className="text-xs font-body mb-4" style={{ color: '#6b7280' }}>How was your experience?</p>

        <div className="flex items-center gap-2 justify-center mb-4">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onMouseEnter={() => setHoveredStar(s)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setRating(s)}>
              <Star className="w-8 h-8 nyaya-transition" fill={(hoveredStar || rating) >= s ? '#c9a227' : 'transparent'} stroke={(hoveredStar || rating) >= s ? '#c9a227' : '#d1d5db'} />
            </button>
          ))}
        </div>

        <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Optional review..." rows={3} className="w-full px-3 py-2 rounded-xl text-sm font-body resize-none mb-4" style={{ background: 'rgba(26,60,94,0.04)', border: '1px solid rgba(26,60,94,0.1)', color: '#1a3c5e' }} />

        <motion.button onClick={handleSubmit} disabled={!rating || loading} className="w-full py-2.5 rounded-xl text-sm font-body font-semibold flex items-center justify-center gap-2" style={{ background: '#c9a227', color: '#0d1f35' }} whileHover={{ scale: 1.01 }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Rating
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default RatingModal;