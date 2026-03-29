import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateCaseWithAudit } from '@/services/caseAuditService';

interface Props {
  caseData: any;
  onClose: () => void;
  onResolved: () => void;
}

// ─── Direct Supabase score update ────────────────────────────────────────────
const updateLawyerScore = async (lawyerId: string, eventType: string, extra?: any) => {
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

    let updates: any = { updated_at: new Date().toISOString() };

    switch (eventType) {
      case 'case_won':
        updates.total_score = (current.total_score || 0) + 50;
        updates.cases_won = (current.cases_won || 0) + 1;
        updates.cases_resolved = (current.cases_resolved || 0) + 1;
        break;
      case 'resolved_fast':
        updates.total_score = (current.total_score || 0) + 20;
        updates.cases_resolved = (current.cases_resolved || 0) + 1;
        break;
      case 'pro_bono':
        updates.total_score = (current.total_score || 0) + 30;
        updates.anonymous_cases_count = (current.anonymous_cases_count || 0) + 1;
        break;
      default:
        break;
    }

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

const ResolveCaseModal = ({ caseData, onClose, onResolved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [outcome, setOutcome] = useState('');
  const [feeCharged, setFeeCharged] = useState(0);
  const [loading, setLoading] = useState(false);

  const outcomes = ['Won', 'Settled', 'Dismissed', 'Withdrawn'];

  const handleResolve = async () => {
    if (!outcome || !user) return;
    setLoading(true);
    try {
      const resolvedAt = new Date().toISOString();
      const { error } = await updateCaseWithAudit(caseData.id, {
        status: 'resolved',
        outcome,
        fee_charged: feeCharged,
        resolved_at: resolvedAt,
      });
      if (error) throw error;

      const createdAt = new Date(caseData.created_at).getTime();
      const resolutionDays = Math.ceil((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

      // ✅ Direct score updates instead of Edge Function
      if (outcome === 'Won') {
        await updateLawyerScore(user.id, 'case_won');
      } else {
        // For settled/dismissed/withdrawn — still count as resolved
        if (resolutionDays < 30) {
          await updateLawyerScore(user.id, 'resolved_fast', { resolutionDays });
        } else {
          await supabase.from('lawyer_scores')
            .update({ cases_resolved: (await supabase.from('lawyer_scores').select('cases_resolved').eq('lawyer_id', user.id).single()).data?.cases_resolved + 1 || 1 })
            .eq('lawyer_id', user.id);
        }
      }

      if (feeCharged === 0) {
        await updateLawyerScore(user.id, 'pro_bono');
      }

      // Notify victim
      await supabase.from('notifications').insert({
        user_id: caseData.victim_id,
        type: 'case_resolved',
        title: 'Case Resolved',
        body: `Your case "${caseData.title}" has been resolved. Outcome: ${outcome}.`,
      });

      toast({ title: 'Case resolved successfully!' });
      onResolved();
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to resolve case.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-sm glass-card rounded-2xl p-6 relative" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-muted-foreground" /></button>
        <h3 className="font-display text-xl font-bold text-foreground mb-4">Resolve Case</h3>

        <p className="text-xs font-body font-semibold text-muted-foreground mb-2">Outcome</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {outcomes.map(o => (
            <button key={o} onClick={() => setOutcome(o)} className="px-3 py-2 rounded-lg text-sm font-body nyaya-transition" style={outcome === o ? { background: 'hsl(var(--nyaya-gold))', color: '#0d1f35', fontWeight: 600 } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {o}
            </button>
          ))}
        </div>

        <p className="text-xs font-body font-semibold text-muted-foreground mb-2">Fee Charged (₹)</p>
        <input type="number" value={feeCharged} onChange={e => setFeeCharged(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl font-body text-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />

        <motion.button onClick={handleResolve} disabled={!outcome || loading} className="w-full py-3 rounded-xl font-body text-sm font-semibold flex items-center justify-center gap-2 btn-shine" style={{ background: '#0a9e6e', color: '#fff' }} whileHover={{ scale: 1.01 }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Resolve Case
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ResolveCaseModal;