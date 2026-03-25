import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';

const FindMentors = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('users')
      .select('*, lawyer_scores(avg_rating, total_score)')
      .eq('role', 'lawyer')
      .eq('accepting_interns', true)
      .then(({ data }) => {
        setMentors(data || []);
        setLoading(false);
      });

    // Load already applied
    if (user?.id) {
      (supabase as any)
        .from('mentorship_applications')
        .select('lawyer_id')
        .eq('student_id', user.id)
        .then(({ data }: any) => {
          if (data) setApplied(data.map((d: any) => d.lawyer_id));
        });
    }
  }, [user]);

  const applyForMentorship = async (lawyerId: string) => {
    if (!user) return;
    if (applying) return;
    setApplying(lawyerId);

    const { error } = await (supabase as any)
      .from('mentorship_applications')
      .insert({
        student_id: user.id,
        lawyer_id: lawyerId,
        status: 'pending',
        message: 'I am interested in learning under your mentorship.',
      });

    if (error) {
      toast({
        title: 'Failed to apply',
        description: error.code === '23505' ? 'You have already applied to this mentor.' : error.message,
        variant: 'destructive',
      });
    } else {
      setApplied(prev => [...prev, lawyerId]);
      toast({ title: '✅ Application submitted!', description: 'The lawyer will review your application.' });

      // Notify lawyer
      await supabase.from('notifications').insert({
        user_id: lawyerId,
        type: 'new_application',
        title: 'New Mentorship Application',
        body: `${user.full_name || 'A student'} has applied for mentorship.`,
      });
    }
    setApplying(null);
  };

  return (
    <div className="max-w-5xl">
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Find Mentors</h2>
      <p className="text-sm font-body text-muted-foreground mb-6">
        {mentors.length} lawyers are currently accepting interns.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground text-center py-16">No mentors available right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mentors.map((m, i) => {
            const isApplied = applied.includes(m.id);
            const isApplying = applying === m.id;
            const scores = Array.isArray(m.lawyer_scores) ? m.lawyer_scores[0] : m.lawyer_scores;
            return (
              <ScrollReveal key={m.id} delay={i * 0.1}>
                <TiltCard className="glass-card p-5 rounded-2xl" maxTilt={5}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(13,115,119,0.1)', border: '2px solid rgba(13,115,119,0.2)' }}>
                      <span className="font-body font-bold text-sm text-nyaya-teal">{m.full_name?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm text-foreground">{m.full_name}</p>
                      <p className="text-xs font-body text-muted-foreground">
                        {Array.isArray(m.specialization) ? m.specialization.join(', ') : m.specialization || 'General'} • {m.city || 'India'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-nyaya-gold" fill="#c9a227" />
                      {scores?.avg_rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span>{scores?.total_score || 0} pts</span>
                  </div>
                  <motion.button
                    onClick={() => applyForMentorship(m.id)}
                    disabled={isApplied || isApplying}
                    className="w-full py-2 rounded-lg text-xs font-body font-semibold btn-shine flex items-center justify-center gap-1"
                    style={{
                      background: isApplied ? 'rgba(10,158,110,0.3)' : '#0d7377',
                      color: '#fff',
                      cursor: isApplied ? 'not-allowed' : 'pointer',
                      opacity: isApplying ? 0.7 : 1,
                    }}
                    whileHover={{ scale: isApplied ? 1 : 1.02 }}
                    whileTap={{ scale: isApplied ? 1 : 0.98 }}
                  >
                    {isApplied ? '✓ Applied' : isApplying ? 'Applying...' : <><span>Apply</span><ChevronRight className="w-3 h-3" /></>}
                  </motion.button>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindMentors;