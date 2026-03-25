import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Users, Loader2, MessageSquare, Mail, MapPin, Briefcase, Phone, Send, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface MentorshipApp {
  id: string;
  intern_id: string;
  student_id: string;
  lawyer_id: string;
  intern_name: string;
  intern_email: string;
  intern_phone: string;
  intern_bar_number: string | null;
  intern_city: string | null;
  intern_specialization: string | null;
  message: string | null;
  status: string;
  created_at: string;
  student?: { full_name: string; email: string; city: string | null };
  lawyer?: { full_name: string; specialization: string[] | null; city: string | null; phone: string | null };
}

interface LawyerProfile {
  id: string;
  full_name: string;
  specialization: string[] | null;
  city: string | null;
  bio: string | null;
  accepting_interns: boolean | null;
}

const PendingAppCard = ({ app, onAccept, onReject }: { app: MentorshipApp; onAccept: () => void; onReject: () => void }) => {
  const studentName = app.intern_name || app.student?.full_name || 'Student';
  const studentEmail = app.intern_email || app.student?.email || '—';
  const studentCity = app.intern_city || app.student?.city || null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold font-body">
              {studentName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-body font-bold text-foreground text-base">{studentName}</p>
              <p className="text-muted-foreground text-xs font-body flex items-center gap-1"><Mail className="w-3 h-3" /> {studentEmail}</p>
            </div>
          </div>
          {studentCity && <p className="text-muted-foreground text-xs font-body mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {studentCity}</p>}
          {app.intern_specialization && <p className="text-muted-foreground text-xs font-body mt-0.5 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {app.intern_specialization}</p>}
          {app.message && (
            <p className="text-sm font-body text-muted-foreground mt-3 italic bg-secondary/50 rounded-lg px-3 py-2">"{app.message}"</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-body shrink-0 ml-4">{new Date(app.created_at).toLocaleDateString('en-IN')}</span>
      </div>
      <div className="flex gap-3 mt-4">
        <motion.button onClick={onAccept} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-body font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
          <Check className="w-4 h-4" /> Accept
        </motion.button>
        <motion.button onClick={onReject} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-body bg-destructive/10 text-destructive border border-destructive/20">
          <X className="w-4 h-4" /> Reject
        </motion.button>
      </div>
    </div>
  );
};

const AcceptedInternCard = ({ app, onComplete }: { app: MentorshipApp; onComplete: () => void }) => {
  const studentName = app.intern_name || app.student?.full_name || 'Student';
  const studentEmail = app.intern_email || app.student?.email || '—';
  const studentCity = app.intern_city || app.student?.city || '—';
  const waLink = `https://wa.me/91${app.intern_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${studentName}, I am your mentor on Nyaya. Let's connect!`)}`;
  const navigate = useNavigate();

  return (
    <div className={`rounded-xl border-2 ${app.status === 'completed' ? 'border-primary/20 bg-card/50' : 'border-green-500/20 bg-card'} p-5 mb-3`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg font-body">
          {studentName?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-body font-bold text-foreground text-base">{studentName}</p>
          {app.status === 'completed' ? (
            <span className="text-xs font-body font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">✓ Completed</span>
          ) : (
            <span className="text-xs font-body font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">✓ Your Intern</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'EMAIL', value: studentEmail },
          { label: 'PHONE', value: app.intern_phone || '—' },
          { label: 'CITY', value: studentCity },
          { label: 'BAR NUMBER', value: app.intern_bar_number || '—' },
        ].map(f => (
          <div key={f.label} className="bg-secondary/50 rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-body font-semibold text-muted-foreground tracking-wider">{f.label}</p>
            <p className="text-xs font-body text-foreground mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>
      {app.intern_specialization && (
        <p className="text-xs font-body text-muted-foreground mb-4 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {app.intern_specialization}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/lawyer/mentorship/chat/${app.id}`)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <MessageSquare className="w-4 h-4" /> Chat with Intern
        </button>
        {app.status !== 'completed' && (
          <button onClick={onComplete} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-semibold bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
            <Check className="w-4 h-4" /> Mark as Completed
          </button>
        )}
        {app.intern_phone && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-semibold bg-green-500 text-white no-underline hover:bg-green-600 transition-colors">
            <Phone className="w-4 h-4" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

const MentorCard = ({ lawyer, onApply, alreadyApplied }: { lawyer: LawyerProfile; onApply: () => void; alreadyApplied: boolean }) => (
  <div className="rounded-xl border border-border bg-card p-5 mb-3">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold font-body">
        {lawyer.full_name?.charAt(0)?.toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="font-body font-bold text-foreground">{lawyer.full_name}</p>
        {lawyer.city && <p className="text-xs font-body text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {lawyer.city}</p>}
      </div>
    </div>
    {lawyer.specialization && lawyer.specialization.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {lawyer.specialization.map(s => (
          <span key={s} className="text-[11px] font-body bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>
    )}
    {lawyer.bio && <p className="text-xs font-body text-muted-foreground mb-3 line-clamp-2">{lawyer.bio}</p>}
    <motion.button
      onClick={onApply}
      disabled={alreadyApplied}
      whileHover={alreadyApplied ? {} : { scale: 1.02 }}
      whileTap={alreadyApplied ? {} : { scale: 0.98 }}
      className={`w-full py-2.5 rounded-lg text-sm font-body font-semibold transition-colors ${alreadyApplied ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
    >
      {alreadyApplied ? '✓ Applied' : 'Apply for Mentorship'}
    </motion.button>
  </div>
);

const ApplicationStatusCard = ({ app }: { app: MentorshipApp }) => {
  const statusConfig = {
    accepted: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: '✓ Accepted' },
    rejected: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: '✗ Rejected' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: '⏳ Pending' },
  };
  const s = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <div className={`rounded-xl border ${s.border} bg-card p-4 mb-3`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-body font-semibold text-foreground text-sm">Applied to {app.lawyer?.full_name || 'Senior Lawyer'}</p>
          <p className="text-xs font-body text-muted-foreground mt-0.5">{new Date(app.created_at).toLocaleDateString('en-IN')}</p>
        </div>
        <span className={`${s.bg} ${s.text} px-3 py-1 rounded-full text-xs font-body font-semibold`}>{s.label}</span>
      </div>
      {app.status === 'accepted' && app.lawyer?.phone && (
        <a href={`https://wa.me/91${app.lawyer.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I am your intern from Nyaya platform!')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-xs font-body font-semibold bg-green-500 text-white no-underline hover:bg-green-600 transition-colors">
          <MessageSquare className="w-3.5 h-3.5" /> Contact Mentor on WhatsApp
        </a>
      )}
    </div>
  );
};

const ApplyModal = ({ lawyer, user, onClose, onSubmit, submitting }: { lawyer: LawyerProfile; user: any; onClose: () => void; onSubmit: (form: any) => void; submitting: boolean }) => {
  const [form, setForm] = useState({
    intern_phone: user?.phone || '',
    intern_bar_number: user?.bar_council_number || '',
    intern_city: user?.city || '',
    intern_specialization: user?.specialization?.[0] || '',
    message: '',
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-md bg-card border border-border rounded-2xl p-6" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Apply to {lawyer.full_name}</h3>
        <p className="text-xs font-body text-muted-foreground mb-5">Share your details to apply for mentorship</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-body text-muted-foreground font-semibold">Phone Number *</label>
            <input value={form.intern_phone} onChange={e => setForm(p => ({ ...p, intern_phone: e.target.value }))} placeholder="9876543210" className="w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body text-muted-foreground font-semibold">Bar Number</label>
              <input value={form.intern_bar_number} onChange={e => setForm(p => ({ ...p, intern_bar_number: e.target.value }))} placeholder="Optional" className="w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground font-semibold">City</label>
              <input value={form.intern_city} onChange={e => setForm(p => ({ ...p, intern_city: e.target.value }))} placeholder="Your city" className="w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground font-semibold">Specialization</label>
            <input value={form.intern_specialization} onChange={e => setForm(p => ({ ...p, intern_specialization: e.target.value }))} placeholder="e.g. Criminal Law" className="w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground font-semibold">Message to Mentor</label>
            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Why do you want this mentorship?" rows={3} className="w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <motion.button onClick={() => onSubmit(form)} disabled={submitting} whileHover={{ scale: 1.01 }} className="flex-1 py-2.5 rounded-lg text-sm font-body font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Application
          </motion.button>
          <motion.button onClick={onClose} whileHover={{ scale: 1.01 }} className="px-5 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground">Cancel</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Mentorship = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('mentor');
  const [loading, setLoading] = useState(true);
  const [acceptingInterns, setAcceptingInterns] = useState(false);
  const [pendingApps, setPendingApps] = useState<MentorshipApp[]>([]);
  const [acceptedInterns, setAcceptedInterns] = useState<MentorshipApp[]>([]);
  const [availableMentors, setAvailableMentors] = useState<LawyerProfile[]>([]);
  const [myApplications, setMyApplications] = useState<MentorshipApp[]>([]);
  const [applyTarget, setApplyTarget] = useState<LawyerProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMentorData = useCallback(async () => {
    if (!user) return;
    const [{ data: pending }, { data: accepted }] = await Promise.all([
      // Join student details so name shows even if intern_name is empty
      (supabase as any).from('mentorship_applications')
        .select('*, student:users!mentorship_applications_student_id_fkey(full_name, email, city)')
        .eq('lawyer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
        (supabase as any).from('mentorship_applications')
        .select('*, student:users!mentorship_applications_student_id_fkey(full_name, email, city)')
        .eq('lawyer_id', user.id)
        .in('status', ['accepted', 'completed'])
        .order('created_at', { ascending: false }),
    ]);
    setPendingApps((pending as MentorshipApp[]) || []);
    setAcceptedInterns((accepted as MentorshipApp[]) || []);
  }, [user]);

  const fetchInternData = useCallback(async () => {
    if (!user) return;
    const [{ data: mentors }, { data: apps }] = await Promise.all([
      supabase.from('users').select('id, full_name, specialization, city, bio, accepting_interns').eq('role', 'lawyer').eq('accepting_interns', true).neq('id', user.id),
      (supabase as any).from('mentorship_applications')
        .select('*, lawyer:users!mentorship_applications_lawyer_id_fkey(full_name, specialization, city, phone)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    setAvailableMentors((mentors as LawyerProfile[]) || []);
    setMyApplications((apps as MentorshipApp[]) || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setAcceptingInterns(user.accepting_interns || false);
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchMentorData(), fetchInternData()]);
      setLoading(false);
    };
    load();
  }, [user, fetchMentorData, fetchInternData]);

  const toggleAccepting = async () => {
    const newVal = !acceptingInterns;
    setAcceptingInterns(newVal);
    await supabase.from('users').update({ accepting_interns: newVal }).eq('id', user!.id);
    toast({ title: newVal ? 'Now accepting interns.' : 'No longer accepting interns.' });
  };

  const handleApplication = async (appId: string, studentId: string, accept: boolean) => {
    await (supabase as any).from('mentorship_applications').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', appId);
    await supabase.from('notifications').insert({
      user_id: studentId,
      type: 'mentorship_update',
      title: accept ? 'Mentorship Accepted!' : 'Mentorship Declined',
      body: accept ? `${user!.full_name} has accepted your mentorship application.` : `${user!.full_name} has declined your mentorship application.`,
    });
    toast({ title: accept ? 'Intern accepted!' : 'Application declined.' });
    fetchMentorData();
  };

  const markCompleted = async (appId: string, studentId: string) => {
    await (supabase as any).from('mentorship_applications').update({ status: 'completed' }).eq('id', appId);
    await supabase.from('notifications').insert({
      user_id: studentId,
      type: 'mentorship_update',
      title: 'Internship Completed',
      body: `Your internship with ${user!.full_name} has been marked as completed.`,
    });
    toast({ title: 'Internship marked as completed.' });
    fetchMentorData();
  };

  const submitApplication = async (form: any) => {
    if (!user || !applyTarget) return;
    if (!form.intern_phone?.trim()) {
      toast({ title: 'Please enter your phone number.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from('mentorship_applications').insert({
      student_id: user.id,
      lawyer_id: applyTarget.id,
      intern_name: user.full_name,
      intern_email: user.email,
      intern_phone: form.intern_phone.trim(),
      intern_bar_number: form.intern_bar_number || null,
      intern_city: form.intern_city || null,
      intern_specialization: form.intern_specialization || null,
      message: form.message || null,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Failed to send application.', variant: 'destructive' });
    } else {
      toast({ title: `Application sent to ${applyTarget.full_name}!` });
      setApplyTarget(null);
      fetchInternData();
    }
  };

  const appliedLawyerIds = myApplications.map(a => a.lawyer_id);
  const filteredMentors = availableMentors.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.full_name.toLowerCase().includes(q) || m.city?.toLowerCase().includes(q) || m.specialization?.some(s => s.toLowerCase().includes(q));
  });

  if (loading) return (
    <div className="max-w-3xl space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse bg-muted/30" />)}
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Mentorship</h1>
        <p className="text-sm font-body text-muted-foreground mt-1">Connect with fellow lawyers for guidance and growth</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary/50 border border-border mb-6">
          <TabsTrigger value="mentor" className="flex-1 text-sm font-body data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="w-4 h-4 mr-2" /> As Mentor
          </TabsTrigger>
          <TabsTrigger value="intern" className="flex-1 text-sm font-body data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Briefcase className="w-4 h-4 mr-2" /> Find a Mentor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentor">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-body font-semibold text-sm text-muted-foreground">Manage Your Interns</h3>
            <motion.button onClick={toggleAccepting} whileHover={{ scale: 1.02 }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-body font-semibold border transition-colors ${acceptingInterns ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-secondary text-muted-foreground border-border'}`}>
              <Users className="w-4 h-4" /> {acceptingInterns ? '✓ Accepting Interns' : 'Not Accepting'}
            </motion.button>
          </div>

          {pendingApps.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-body font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pending Applications ({pendingApps.length})</h4>
              {pendingApps.map(app => (
                <PendingAppCard key={app.id} app={app}
                  onAccept={() => handleApplication(app.id, app.student_id || app.intern_id, true)}
                  onReject={() => handleApplication(app.id, app.student_id || app.intern_id, false)}
                />
              ))}
            </div>
          )}

          <h4 className="text-xs font-body font-semibold text-muted-foreground mb-3 uppercase tracking-wider">My Interns ({acceptedInterns.length})</h4>
          {acceptedInterns.length === 0 ? (
            <p className="text-sm font-body text-muted-foreground text-center py-10">No interns yet. Toggle "Accepting Interns" to receive applications.</p>
          ) : (
            acceptedInterns.map(app => <AcceptedInternCard key={app.id} app={app} onComplete={() => markCompleted(app.id, app.student_id || app.intern_id)} />)
          )}
        </TabsContent>

        <TabsContent value="intern">
          {myApplications.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-body font-semibold text-muted-foreground mb-3 uppercase tracking-wider">My Applications ({myApplications.length})</h4>
              {myApplications.map(app => <ApplicationStatusCard key={app.id} app={app} />)}
            </div>
          )}

          <h4 className="text-xs font-body font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Available Mentors</h4>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, city, or specialization..." className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {filteredMentors.length === 0 ? (
            <p className="text-sm font-body text-muted-foreground text-center py-10">No mentors available at the moment.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredMentors.map(lawyer => (
                <MentorCard key={lawyer.id} lawyer={lawyer} alreadyApplied={appliedLawyerIds.includes(lawyer.id)} onApply={() => setApplyTarget(lawyer)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {applyTarget && (
          <ApplyModal lawyer={applyTarget} user={user} onClose={() => setApplyTarget(null)} onSubmit={submitApplication} submitting={submitting} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mentorship;