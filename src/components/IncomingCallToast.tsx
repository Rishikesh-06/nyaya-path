import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const IncomingCallToast = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [call, setCall] = useState<{ caseId: string; lawyerName: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopRing = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.suspend();
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    } catch (e) { console.warn('AudioContext close error:', e); }
  };

  // ── Nice WhatsApp-style ring using Web Audio API ──────────────────────────
  const startRing = () => {
    stopRing();
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const playRing = () => {
        // Notes: D5, G5, A5, G5 — pleasant ascending pattern
        const notes = [587, 784, 880, 784];
        const noteDuration = 0.15;
        const noteGap = 0.05;

        notes.forEach((freq, i) => {
          const startTime = ctx.currentTime + i * (noteDuration + noteGap);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
          gain.connect(ctx.destination);

          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(gain);
          osc.start(startTime);
          osc.stop(startTime + noteDuration);

          // Add a subtle harmonic for richness
          const gain2 = ctx.createGain();
          gain2.gain.setValueAtTime(0, startTime);
          gain2.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
          gain2.connect(ctx.destination);

          const osc2 = ctx.createOscillator();
          osc2.type = 'triangle';
          osc2.frequency.value = freq * 2;
          osc2.connect(gain2);
          osc2.start(startTime);
          osc2.stop(startTime + noteDuration);
        });
      };

      playRing();
      // Repeat every 2.5 seconds
      ringIntervalRef.current = setInterval(playRing, 2500);
    } catch (e) {
      console.warn('Ring audio failed:', e);
    }
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`incoming-call-user-${user.id}`)
      .on('broadcast', { event: 'incoming-call' }, ({ payload }: any) => {
        console.log('📞 Incoming call received:', payload);
        setCall({ caseId: payload.caseId, lawyerName: payload.lawyerName });
        setTimeLeft(30);
        startRing();
      })
      .subscribe((status) => {
        console.log('📡 IncomingCallToast channel status:', status);
      });

    return () => { supabase.removeChannel(channel); stopRing(); };
  }, [user]);

  useEffect(() => {
    if (!call) return;
    if (timeLeft <= 0) { stopRing(); setCall(null); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [call, timeLeft]);

  // Listen for call acceptance/rejection from other tabs via database signals
  useEffect(() => {
    if (!call) return;
    const signalChannel = supabase
      .channel(`toast-signal-${call.caseId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signals',
        filter: `case_id=eq.${call.caseId}`,
      }, (payload: any) => {
        const type = payload.new.type;
        if (['answer', 'reject', 'end', 'timeout'].includes(type) || payload.new.from_role === 'victim') {
          console.log('🛑 Stopping ring due to database signal:', type);
          stopRing();
          setCall(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(signalChannel);
    };
  }, [call]);

  const acceptCall = () => {
    if (!call) return;
    stopRing();
    navigate(`/video-call/${call.caseId}?role=victim&name=${encodeURIComponent(call.lawyerName)}`);
    setCall(null);
  };

  const declineCall = () => { stopRing(); setCall(null); };

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          className="fixed top-6 left-1/2 z-[9999]"
          style={{ transform: 'translateX(-50%)' }}
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0d1f35, #1a3c5e)',
              border: '1px solid rgba(201,162,39,0.3)',
              minWidth: 320,
              backdropFilter: 'blur(20px)',
            }}>
            <div className="relative flex-shrink-0">
              <motion.div className="absolute inset-0 rounded-full"
                style={{ background: 'rgba(201,162,39,0.3)' }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white relative z-10"
                style={{ background: 'linear-gradient(135deg, #1a3c5e, #c9a227)' }}>
                {call.lawyerName[0]?.toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{call.lawyerName}</p>
              <p className="text-white opacity-60 text-xs">Incoming video call • {timeLeft}s</p>
              <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full"
                  style={{ background: '#c9a227', width: `${(timeLeft / 30) * 100}%`, transition: 'width 1s linear' }} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button onClick={declineCall}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <PhoneOff className="w-4 h-4 text-red-400" />
              </motion.button>
              <motion.button onClick={acceptCall}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#0a9e6e' }}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}>
                <Phone className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallToast;