import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Briefcase, GraduationCap, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ParticleField from '@/components/ParticleField';
import TiltCard from '@/components/TiltCard';

const roles = [
  {
    id: 'victim' as UserRole,
    title: 'I Need Legal Help',
    description: 'Understand your rights. Connect with a verified lawyer. Free.',
    icon: Scale,
    accentColor: 'hsl(210, 56%, 40%)',
    accentHsl: '210, 56%, 40%',
    bgTransition: '#0a1929',
  },
  {
    id: 'lawyer' as UserRole,
    title: 'I Am a Lawyer',
    description: 'Help people who need you. Build your reputation. Use AI tools.',
    icon: Briefcase,
    accentColor: 'hsl(43, 72%, 47%)',
    accentHsl: '43, 72%, 47%',
    bgTransition: '#0d1f35',
  },
  {
    id: 'student' as UserRole,
    title: 'I Am a Law Student',
    description: 'Get real case experience. Build your portfolio. Find mentors.',
    icon: GraduationCap,
    accentColor: 'hsl(179, 80%, 25%)',
    accentHsl: '179, 80%, 25%',
    bgTransition: '#0a2626',
  },
];

const RoleSelection = () => {
  const { signUp, signIn, setSelectedRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [step, setStep] = useState<'select' | 'signup' | 'login'>('select');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSelect = (role: UserRole) => {
    setSelected(role);
    setSelectedRole(role);
    setTimeout(() => setStep('signup'), 500);
  };

  const handleBack = () => {
    setStep('select');
    setSelected(null);
    setSelectedRole(null);
    setErrors({});
  };

  const selectedRoleData = roles.find(r => r.id === selected);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim() && step === 'signup') e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email';
    if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (step === 'signup' && formData.password !== formData.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !validate()) return;
    setLoading(true);
    const success = await signUp(formData.email, formData.password, {
      full_name: formData.name,
      role: selected,
      city: '',
      preferred_language: 'English',
    });
    setLoading(false);
    if (success) {
      navigate(selected === 'victim' ? '/dashboard' : selected === 'lawyer' ? '/lawyer' : '/student');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const success = await signIn(formData.email, formData.password);
    setLoading(false);
    // Navigation is handled by App.tsx detecting isAuthenticated + user.role
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden grain-overlay"
      style={{ background: 'radial-gradient(ellipse at 40% 50%, #0d1f35, #040810)' }}
      animate={{ backgroundColor: selected ? selectedRoleData?.bgTransition : undefined }}
      transition={{ duration: 0.6 }}
    >
      <ParticleField count={50} />

      {[600, 900, 1200].map((size, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{ width: size, height: size, border: '1px solid rgba(201,162,39,0.05)', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', animation: `spin ${40 + i * 30}s linear infinite` }} />
      ))}

      <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'rgba(201,162,39,0.04)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[15%] left-[10%] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: 'rgba(68,136,255,0.04)', filter: 'blur(80px)' }} />

      <motion.div className="flex flex-col items-center mb-8 md:mb-12 relative z-10 px-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
        <motion.div className="relative mb-6" animate={{ boxShadow: ['0 0 30px rgba(201,162,39,0.15)', '0 0 60px rgba(201,162,39,0.3)', '0 0 30px rgba(201,162,39,0.15)'] }} transition={{ duration: 3, repeat: Infinity }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}>
            <Scale className="w-10 h-10 text-nyaya-gold" strokeWidth={1.5} />
          </div>
        </motion.div>
        <motion.h1 className="text-3xl sm:text-5xl md:text-[56px] font-display font-bold mb-3 text-white text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Welcome to <span className="gold-shimmer">Nyaya</span>
        </motion.h1>
        <motion.p className="text-lg font-body" style={{ color: 'rgba(255,255,255,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {step === 'login' ? 'Sign in to your account' : 'Who are you here as?'}
        </motion.p>
      </motion.div>

      <div className="relative z-10 w-full max-w-5xl px-4 md:px-6">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div key="cards" className="grid grid-cols-1 md:grid-cols-3 gap-6" exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
              {roles.map((role, i) => (
                <motion.div key={role.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={selected === role.id ? { scale: 1.1, y: -40, opacity: 1 } : { x: i === 0 ? -200 : i === 2 ? 200 : 0, opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.15 }}>
                  <TiltCard className="p-6 md:p-8 text-left cursor-pointer group min-h-[180px] md:min-h-[200px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '16px' }} onClick={() => handleSelect(role.id)}>
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10" style={{ background: `hsla(${role.accentHsl}, 0.1)`, border: `1px solid hsla(${role.accentHsl}, 0.2)` }}>
                        <role.icon className="w-8 h-8" style={{ color: role.accentColor }} strokeWidth={1.5} />
                      </div>
                      <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: `hsla(${role.accentHsl}, 0.15)`, transform: 'scale(2)' }} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-display font-semibold mb-2 text-white group-hover:gold-shimmer nyaya-transition">{role.title}</h3>
                    <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{role.description}</p>
                    <ArrowRight className="w-4 h-4 mt-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 nyaya-transition" style={{ color: role.accentColor }} />
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          )}

          {(step === 'signup' || step === 'login') && (
            <motion.div key="form" className="max-w-md mx-auto" initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.2, duration: 0.5 }}>
              {step === 'signup' && selectedRoleData && (
                <div className="flex items-center gap-3 mb-8 justify-center">
                  <span className="px-4 py-1.5 rounded-pill text-sm font-body font-medium" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: selectedRoleData.accentColor }}>
                    Signing up as: {selected === 'victim' ? 'Someone who needs help' : selected === 'lawyer' ? 'Lawyer' : 'Student'}
                  </span>
                  <button onClick={handleBack} className="text-sm font-body flex items-center gap-1 nyaya-transition text-white/60 hover:text-white">
                    <ArrowLeft className="w-3 h-3" /> Change
                  </button>
                </div>
              )}

              <form onSubmit={step === 'signup' ? handleSignup : handleLogin} className="space-y-4">
                {step === 'signup' && (
                  <div>
                    <input type="text" placeholder="Full Name" className="w-full px-4 py-3.5 rounded-[10px] font-body text-sm nyaya-transition input-glow text-white placeholder:text-white/50" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.name ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }} value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                  </div>
                )}
                <div>
                  <input type="email" placeholder="Email" className="w-full px-4 py-3.5 rounded-[10px] font-body text-sm nyaya-transition input-glow text-white placeholder:text-white/50" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }} value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input type="password" placeholder="Password" className="w-full px-4 py-3.5 rounded-[10px] font-body text-sm nyaya-transition input-glow text-white placeholder:text-white/50" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.password ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }} value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} />
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                </div>
                {step === 'signup' && (
                  <div>
                    <input type="password" placeholder="Confirm Password" className="w-full px-4 py-3.5 rounded-[10px] font-body text-sm nyaya-transition input-glow text-white placeholder:text-white/50" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.confirm ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }} value={formData.confirm} onChange={e => setFormData(prev => ({ ...prev, confirm: e.target.value }))} />
                    {errors.confirm && <p className="text-xs text-red-400 mt-1">{errors.confirm}</p>}
                  </div>
                )}
                <motion.button type="submit" disabled={loading} className="w-full py-3.5 rounded-[10px] font-body font-semibold text-sm btn-shine nyaya-transition flex items-center justify-center gap-2" style={{ background: selectedRoleData?.accentColor || '#c9a227', color: '#ffffff', letterSpacing: '0.3px', opacity: loading ? 0.7 : 1 }} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.97 }}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {step === 'signup' ? 'Create My Account' : 'Sign In'}
                </motion.button>
              </form>

              <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                {step === 'signup' ? (
                  <p className="text-xs font-body text-white/60">
                    Already have an account?{' '}
                    <button onClick={() => setStep('login')} className="underline text-nyaya-gold">Sign In</button>
                  </p>
                ) : (
                  <p className="text-xs font-body text-white/60">
                    Don't have an account?{' '}
                    <button onClick={() => { setStep('select'); setSelected(null); }} className="underline text-nyaya-gold">Sign Up</button>
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default RoleSelection;
