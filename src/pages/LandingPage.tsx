import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ArrowRight, MessageCircle, Shield, Calendar, Trophy, GraduationCap, Heart, ChevronRight, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ParticleField from '@/components/ParticleField';
import TiltCard from '@/components/TiltCard';
import ScrollReveal from '@/components/ScrollReveal';
import CountUp from '@/components/CountUp';
import HeroScales2D from '@/components/2d/HeroScales2D';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const wordAnimation = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03 }
  }
};

const wordChild = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } }
};

const AnimatedText = ({ text, className }: { text: string; className?: string }) => (
  <motion.span className={`inline-flex flex-wrap leading-[1.15] ${className}`} variants={wordAnimation} initial="hidden" animate="visible" style={{ margin: 0, padding: 0 }}>
    {text.split(' ').map((word, i) => (
      <motion.span key={i} variants={wordChild} className="mr-[0.3em]">{word}</motion.span>
    ))}
  </motion.span>
);

const marqueeItems = [
  '3.5 Crore Cases Pending',
  '1.7 Million Advocates in India',
  'Justice Delayed is Justice Denied',
  'Available in 6 Languages',
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark } = useTheme();

  const features = [
    { icon: Scale, title: 'AI Document Reader', desc: 'Understand any legal notice in your language in seconds.', color: 'hsl(210, 56%, 24%)' },
    { icon: MessageCircle, title: 'Sahaay Companion', desc: 'Know your rights in everyday situations. Police, landlord, employer.', color: 'hsl(160, 87%, 33%)' },
    { icon: Shield, title: 'Anonymous Case Posting', desc: 'FIR-verified. Identity fully protected. Post safely at 2am.', color: 'hsl(210, 56%, 24%)' },
    { icon: Calendar, title: 'Direct Lawyer Booking', desc: 'Browse verified lawyers. Book like a doctor appointment.', color: 'hsl(43, 72%, 47%)' },
    { icon: Trophy, title: 'Lawyer Gamification', desc: 'Leaderboards, badges, Monthly Hero awards.', color: 'hsl(270, 80%, 60%)' },
    { icon: GraduationCap, title: 'Student Mentorship', desc: 'Real cases. Real experience. Before graduation.', color: 'hsl(179, 80%, 25%)' },
  ];

  const stats = [
    { number: 3.5, suffix: ' Crore', label: 'Cases pending in Indian courts right now.' },
    { number: 80, suffix: '%', label: 'Indians who cannot afford a single lawyer consultation.' },
    { number: 11, suffix: ' Years', label: 'Average time a case takes without proper representation.' },
  ];

  const testimonials = [
    { quote: 'I received an eviction notice and had no idea what to do. Nyaya explained my rights in Telugu and connected me with a lawyer in 2 hours. I kept my home.', name: 'Ramesh', city: 'Hyderabad', initials: 'R' },
    { quote: 'As a domestic violence survivor I was terrified to post publicly. The anonymous feature gave me the courage to finally get legal help.', name: 'Anonymous', city: 'Delhi', initials: 'A' },
    { quote: 'My employer refused to pay 3 months salary. Nyaya helped me draft a legal notice in 20 minutes. He paid within a week.', name: 'Kavitha', city: 'Bengaluru', initials: 'K' },
  ];

  return (
    <div className="min-h-screen bg-background grain-overlay">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.08)'}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[64px] md:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <Scale className="w-5 h-5 text-nyaya-gold" strokeWidth={1.5} />
            <span className="font-display font-bold text-[20px] md:text-[22px] tracking-wide text-nyaya-gold">NYAYA</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <ThemeToggle />
            <a href="#lawyers" className="text-sm font-body text-muted-foreground nyaya-transition hover:text-foreground relative group">
              For Lawyers
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-nyaya-gold group-hover:w-full nyaya-transition" />
            </a>
            <a href="#features" className="text-sm font-body text-muted-foreground nyaya-transition hover:text-foreground relative group">
              For Students
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-nyaya-gold group-hover:w-full nyaya-transition" />
            </a>
            <button onClick={() => navigate('/welcome')} className="text-sm font-body text-foreground font-medium nyaya-transition hover:text-nyaya-gold">Login</button>
            <motion.button
              onClick={() => navigate('/welcome')}
              className="px-7 py-3 rounded-xl text-sm font-body font-semibold btn-shine nyaya-transition"
              style={{ background: 'linear-gradient(135deg, #c9a227, #e2c97e)', color: '#0d1520', letterSpacing: '0.3px', boxShadow: '0 4px 20px rgba(201,162,39,0.35)' }}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(201,162,39,0.5)' }}
              whileTap={{ scale: 0.97 }}
            >
              Get Help Now
            </motion.button>
          </div>
          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.2)' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5 text-nyaya-gold" /> : <Menu className="w-5 h-5 text-nyaya-gold" />}
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ background: isDark ? 'rgba(8,12,20,0.95)' : 'rgba(255,255,255,0.97)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.08)'}`, overflow: 'hidden' }}
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#lawyers" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-body text-muted-foreground py-2">For Lawyers</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-body text-muted-foreground py-2">For Students</a>
                <button onClick={() => { navigate('/welcome'); setMobileMenuOpen(false); }} className="block text-sm font-body text-foreground font-medium py-2 w-full text-left">Login</button>
                <button
                  onClick={() => { navigate('/welcome'); setMobileMenuOpen(false); }}
                  className="w-full px-6 py-3 rounded-xl text-sm font-body font-semibold"
                  style={{ background: 'linear-gradient(135deg, #c9a227, #e2c97e)', color: '#0d1520' }}
                >
                  Get Help Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="min-h-screen pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 mesh-bg relative overflow-hidden">
        <ParticleField count={50} />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 lg:max-w-[55%]">
            <motion.div
              className="flex items-center gap-2 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-0.5 h-5 bg-nyaya-gold rounded-full" />
              <span className="text-xs font-body font-medium tracking-[0.2em] uppercase text-nyaya-gold">India's Legal Justice Platform</span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-display font-bold mb-6 flex flex-col" style={{ lineHeight: 1.05, margin: '0 0 24px', gap: '4px' }}>
              <AnimatedText text="Justice for" className="block text-foreground leading-[1.05] m-0 p-0" />
              <AnimatedText text="Not Just the" className="block text-foreground leading-[1.05] m-0 p-0" />
              <AnimatedText text="Wealthy." className="block text-foreground leading-[1.05] m-0 p-0" />
            </h1>

            <motion.p
              className="text-lg font-body text-muted-foreground max-w-lg leading-[1.7]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Upload your legal notice. Know your rights. Connect with a verified lawyer. Free.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                onClick={() => navigate('/welcome')}
                className="px-7 py-3.5 rounded-[10px] font-body font-semibold text-sm btn-shine nyaya-transition flex items-center gap-2"
                style={{ background: '#1a3c5e', color: '#fff', letterSpacing: '0.3px' }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                I Need Legal Help <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => navigate('/welcome')}
                className="px-7 py-3.5 rounded-[10px] font-body font-semibold text-sm btn-shine nyaya-transition border-2"
                style={{ borderColor: '#c9a227', color: '#c9a227', letterSpacing: '0.3px' }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(201,162,39,0.1)' }}
                whileTap={{ scale: 0.97 }}
              >
                I Am a Lawyer
              </motion.button>
            </motion.div>

            <motion.div
              className="mt-6 md:mt-10 flex flex-wrap items-center gap-4 md:gap-6 text-sm font-body py-4"
              style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.08)'}`, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.08)'}` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[
                { val: '3.5 Crore+', label: 'Pending Cases' },
                { val: '80%', label: "Can't Afford a Lawyer" },
                { val: '0', label: 'Platforms Like This' },
              ].map((stat, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="hidden sm:block w-px h-8" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,60,94,0.1)' }} />}
                  <div>
                    <p className="font-display text-xl md:text-2xl font-bold gold-shimmer">{stat.val}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </React.Fragment>
              ))}
            </motion.div>
          </div>

          {/* Hero 2D Visual — Animated Scales */}
          <motion.div
            className="flex-1 hidden lg:flex items-center justify-center relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <HeroScales2D className="w-full h-[500px]" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-24 px-4 md:px-6 mesh-bg relative">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-8 md:mb-14">
              A Broken System. A Platform to Fix It.
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <TiltCard className="glass-card p-8 text-left" maxTilt={6}>
                  <div style={{ borderLeft: '3px solid #c9a227', paddingLeft: '16px' }}>
                    <p className="text-4xl font-display font-bold gold-shimmer mb-2">
                      <CountUp end={stat.number} suffix={stat.suffix} decimals={stat.suffix === ' Crore' ? 1 : 0} />
                    </p>
                    <p className="text-sm font-body text-muted-foreground">{stat.label}</p>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 md:py-24 px-4 md:px-6 relative" style={{ background: 'hsl(var(--nyaya-dark))' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-4">
              Everything You Need.
            </h2>
            <p className="text-center font-body text-muted-foreground mb-14 max-w-xl mx-auto">
              One platform for victims, lawyers, and law students — powered by AI, built with empathy.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <TiltCard className="glass-card p-8 group cursor-pointer h-full hover:border-t-[3px]" style={{ borderTopColor: f.color }}>
                  <motion.div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.color + '20' }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.4 }}
                  >
                    <f.icon className="w-6 h-6" style={{ color: f.color }} strokeWidth={1.5} />
                  </motion.div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm font-body text-muted-foreground">{f.desc}</p>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="py-4 overflow-hidden" style={{ background: isDark ? '#0d1f35' : 'hsl(220, 25%, 92%)' }}>
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="text-sm font-body font-medium text-muted-foreground flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-nyaya-gold" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* How It Works */}
      <section className="py-12 md:py-24 px-4 md:px-6 mesh-bg relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-8 md:mb-16">
              How It Works
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[17%] right-[17%] border-t-2 border-dashed" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,60,94,0.08)' }} />
            {[
              { step: '01', title: 'Upload your document', desc: 'Legal notice, FIR, or any legal document.' },
              { step: '02', title: 'AI explains your rights', desc: 'In plain language, in your language.' },
              { step: '03', title: 'Get matched with a lawyer', desc: 'Verified, rated, and ready to help.' },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 0.2}>
                <div className="text-center relative">
                  <span className="text-8xl font-display font-bold absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" style={{ color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,60,94,0.04)' }}>
                    {s.step}
                  </span>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 glass-card" style={{ color: '#c9a227' }}>
                    <span className="font-body font-bold text-sm">{s.step}</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm font-body text-muted-foreground">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-24 px-4 md:px-6 relative" style={{ background: 'hsl(var(--nyaya-dark))' }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-center text-foreground mb-8 md:mb-14">
              Real Stories. Real Impact.
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <TiltCard className="glass-card p-7 h-full">
                  <span className="font-display text-5xl gold-shimmer leading-none">"</span>
                  <p className="text-sm font-body text-muted-foreground mb-6 italic leading-relaxed">{t.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.15)' }}>
                      <span className="text-xs font-body font-semibold text-nyaya-gold">{t.initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs font-body text-muted-foreground">{t.city}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className="text-xs text-nyaya-gold">★</span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lawyer CTA */}
      <section id="lawyers" className="py-12 md:py-24 px-4 md:px-6 mesh-bg relative overflow-hidden">
        <ParticleField count={30} />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 md:gap-12 relative z-10">
          <ScrollReveal className="flex-1">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">
              Built for Lawyers Who Care.{' '}
              <span className="gold-shimmer">And Lawyers Who Are Ambitious.</span>
            </h2>
            <p className="font-body text-sm text-muted-foreground mb-8 leading-relaxed">
              AI toolkit, reputation scoring, Monthly Hero awards, career growth — all in one platform. Join the elite justice league.
            </p>
            <motion.button
              onClick={() => navigate('/welcome')}
              className="px-7 py-3.5 rounded-[10px] font-body font-semibold text-sm btn-shine nyaya-transition flex items-center gap-2"
              style={{ background: '#c9a227', color: '#0d1f35' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Join as a Lawyer <ChevronRight className="w-4 h-4" />
            </motion.button>
          </ScrollReveal>
          <ScrollReveal className="flex-1 hidden lg:block" delay={0.3}>
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="glass-card p-6 rounded-2xl max-w-xs mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.15)' }}>
                    <span className="font-body font-bold text-sm text-nyaya-gold">PS</span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-sm text-foreground">Advocate Priya Sharma</p>
                    <p className="text-xs font-body text-muted-foreground">Tenant Rights • Hyderabad</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-2xl font-mono font-bold text-nyaya-gold">847</p>
                    <p className="text-xs font-body text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold text-foreground">89%</p>
                    <p className="text-xs font-body text-muted-foreground">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold text-foreground">34</p>
                    <p className="text-xs font-body text-muted-foreground">Cases</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-pill text-xs font-body" style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227' }}>🏆 Monthly Hero</span>
                  <span className="px-2 py-1 rounded-pill text-xs font-body glass-card text-muted-foreground">🛡️ People's Defender</span>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 md:py-16 px-4 md:px-6" style={{ background: isDark ? 'hsl(220, 30%, 4%)' : 'hsl(225, 25%, 93%)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,60,94,0.08)'}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Scale className="w-5 h-5 text-nyaya-gold" strokeWidth={1.5} />
                <span className="font-display font-bold text-lg text-nyaya-gold">NYAYA</span>
              </div>
              <p className="text-xs font-body text-muted-foreground">Justice for Every Indian.</p>
            </div>
            <div className="grid grid-cols-3 gap-6 md:gap-12">
              {[
                { title: 'Platform', links: ['For Victims', 'For Lawyers', 'For Students'] },
                { title: 'Company', links: ['About', 'Blog', 'Contact'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
              ].map(col => (
                <div key={col.title}>
                  <p className="text-[10px] md:text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground mb-3">{col.title}</p>
                  {col.links.map(l => (
                    <p key={l} className="text-xs md:text-sm font-body mb-2 cursor-pointer nyaya-transition hover:text-nyaya-gold text-muted-foreground">{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-6" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,94,0.08)' }}>
            <p className="text-xs font-body flex items-center gap-1 text-muted-foreground">
              Nyaya is a social impact platform. Victims are never charged. <Heart className="w-3 h-3 text-nyaya-gold" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
