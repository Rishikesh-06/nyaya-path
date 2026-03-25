import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended' | 'timeout' | 'rejected';

const VideoCallPage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = searchParams.get('role') as 'lawyer' | 'victim' || 'victim';
  const remoteName = searchParams.get('name') || (role === 'lawyer' ? 'Victim' : 'Lawyer');

  const [status, setStatus] = useState<CallStatus>(role === 'lawyer' ? 'calling' : 'incoming');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const startTimeRef = useRef<string>('');
  const iceBufferRef = useRef<any[]>([]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const sendSignal = async (type: string, data: any) => {
    const { error } = await (supabase as any).from('webrtc_signals').insert({
      case_id: caseId,
      type,
      data,
      from_role: role,
    });
    if (error) console.error('Signal send error:', error);
    else console.log('📤 Signal sent:', type);
  };

  const cleanup = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    iceBufferRef.current = [];
  };

  const getLocalStream = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } catch {
        stream = new MediaStream();
      }
    }
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPC = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      console.log('🎥 Got remote track!');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) await sendSignal('ice', { candidate: event.candidate });
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('connected');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        durationRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      }
      if (['disconnected', 'failed'].includes(pc.connectionState)) {
        setStatus('ended');
        cleanup();
      }
    };
    return pc;
  };

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!user || !caseId) return;
    if (hasStartedRef.current) return; // prevent re-running on auth refresh
    hasStartedRef.current = true;
    startTimeRef.current = new Date().toISOString();

    // Lawyer: clear old signals first, then start
    if (role === 'lawyer') {
      (supabase as any).from('webrtc_signals')
        .delete().eq('case_id', caseId)
        .then(() => {
          console.log('🧹 Cleared old signals');
          setupChannelAndCall();
        });
    } else {
      // Victim: just setup channel (no clearing!)
      setupChannelAndCall();
    }

    return () => cleanup();
  }, [user, caseId]);

  const setupChannelAndCall = () => {
    const ch = supabase
      .channel(`signals-${caseId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signals',
        filter: `case_id=eq.${caseId}`,
      }, async (payload: any) => {
        const signal = payload.new;

        // Skip own signals
        if (signal.from_role === role) {
          console.log('⏭ Skipping own signal:', signal.type);
          return;
        }

        console.log('📨 Got signal:', signal.type, 'from', signal.from_role);

        if (signal.type === 'answer' && pcRef.current) {
          try {
            if (pcRef.current.signalingState === 'have-local-offer') {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.data.answer));
              console.log('✅ Answer applied!');

              if (iceBufferRef.current.length > 0) {
                console.log(`🧊 Applying ${iceBufferRef.current.length} buffered ICE candidates`);
                for (const candidate of iceBufferRef.current) {
                  try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                  } catch (e) {
                    console.warn('🧊 Buffered ICE error:', e);
                  }
                }
                iceBufferRef.current = [];
              }
            }
          } catch (e) { console.error('Answer error:', e); }
        }

        if (signal.type === 'ice') {
          if (pcRef.current?.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.data.candidate));
            } catch (e) { console.warn('ICE error:', e); }
          } else {
            console.log('🧊 Buffering ICE candidate because remote description is not set yet');
            iceBufferRef.current.push(signal.data.candidate);
          }
        }

        if (signal.type === 'end') { setStatus('ended'); cleanup(); }
        if (signal.type === 'reject') { setStatus('rejected'); cleanup(); }
        if (signal.type === 'timeout') {
          if (pcRef.current?.connectionState !== 'connected') {
            setStatus('timeout'); cleanup();
          }
        }
      })
      .subscribe(async (state) => {
        console.log('📡 Channel:', state);
        if (state === 'SUBSCRIBED' && role === 'lawyer') {
          setTimeout(() => initLawyerCall(), 300);
        }
      });

    channelRef.current = ch;
  };

  const initLawyerCall = async () => {
    console.log('📞 Starting lawyer call...');
    const stream = await getLocalStream();
    const pc = createPC(stream);

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    await sendSignal('offer', { offer });

    timeoutRef.current = setTimeout(async () => {
      if (pcRef.current?.connectionState !== 'connected') {
        await sendSignal('timeout', {});
        setStatus('timeout');
        cleanup();
      }
    }, 60000);
  };

  const acceptCall = async () => {
    console.log('✅ Accepting call...');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('connected');

    try {
      const { data: signals } = await (supabase as any)
        .from('webrtc_signals')
        .select('*')
        .eq('case_id', caseId)
        .eq('type', 'offer')
        .eq('from_role', 'lawyer')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!signals || signals.length === 0) {
        console.error('❌ No offer found!');
        setStatus('ended');
        return;
      }

      const offer = signals[0].data.offer;
      console.log('📨 Got offer:', offer.type);

      const stream = await getLocalStream();
      const pc = createPC(stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal('answer', { answer });
      console.log('📤 Answer sent!');

      // Fetch missed ICE candidates from the lawyer
      try {
        const { data: iceSignals } = await (supabase as any)
          .from('webrtc_signals')
          .select('*')
          .eq('case_id', caseId)
          .eq('type', 'ice')
          .eq('from_role', 'lawyer')
          .order('created_at', { ascending: true });

        if (iceSignals && iceSignals.length > 0) {
          console.log(`🧊 Applying ${iceSignals.length} missed ICE candidates from DB`);
          for (const sig of iceSignals) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(sig.data.candidate));
            } catch (e) {
              console.warn('🧊 Missed ICE error:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching missed ICE candidates:', e);
      }
    } catch (err) {
      console.error('Accept error:', err);
      setStatus('ended');
    }
  };

  const rejectCall = async () => {
    await sendSignal('reject', {});
    setStatus('rejected');
    cleanup();
    setTimeout(() => navigate(-1), 1500);
  };

  const endCall = async () => {
    await sendSignal('end', {});
    setStatus('ended');
    cleanup();
    setTimeout(() => navigate(-1), 2000);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(p => !p);
  };

  useEffect(() => {
    if (['ended', 'timeout', 'rejected'].includes(status)) {
      const t = setTimeout(() => navigate(-1), 2500);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", zIndex: 9999 }}>

      <video ref={remoteVideoRef} autoPlay playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: status === 'connected' ? 1 : 0, transition: 'opacity 0.8s' }}
      />

      {status !== 'connected' && (
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0d1f35 0%, #1a3c5e 50%, #0d1f35 100%)' }}
        />
      )}

      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{
            background: status === 'connected' ? '#0a9e6e' : ['calling','incoming'].includes(status) ? '#c9a227' : '#ef4444'
          }} />
          <span className="text-white text-sm font-medium opacity-80">
            {status === 'connected' ? formatDuration(callDuration)
              : status === 'calling' ? 'Calling...'
              : status === 'incoming' ? 'Incoming call...'
              : status === 'ended' ? 'Call ended'
              : status === 'timeout' ? 'No answer'
              : status === 'rejected' ? 'Call declined' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          <span className="text-white text-xs font-medium">🔒 Encrypted</span>
        </div>
      </div>

      <AnimatePresence>
        {['calling','incoming'].includes(status) && (
          <motion.div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="relative flex items-center justify-center">
              {[1,2,3].map(i => (
                <motion.div key={i} className="absolute rounded-full border"
                  style={{ borderColor: 'rgba(201,162,39,0.3)', width: 80+i*40, height: 80+i*40 }}
                  animate={{ scale:[1,1.1,1], opacity:[0.3,0.1,0.3] }}
                  transition={{ duration: 2, delay: i*0.4, repeat: Infinity }} />
              ))}
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white relative z-10"
                style={{ background: 'linear-gradient(135deg, #1a3c5e, #c9a227)' }}>
                {remoteName[0]?.toUpperCase()}
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold mb-1">{remoteName}</h2>
              <p className="text-white opacity-60 text-sm">
                {status === 'calling' ? 'Waiting for answer...' : 'is calling you'}
              </p>
            </div>
            {status === 'incoming' && (
              <motion.div className="flex items-center gap-8 mt-4"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex flex-col items-center gap-2">
                  <motion.button onClick={rejectCall}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: '#ef4444' }}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <PhoneOff className="w-7 h-7 text-white" />
                  </motion.button>
                  <span className="text-white text-xs opacity-70">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <motion.button onClick={acceptCall}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: '#0a9e6e' }}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    animate={{ scale: [1,1.05,1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Phone className="w-7 h-7 text-white" />
                  </motion.button>
                  <span className="text-white text-xs opacity-70">Accept</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {['ended','timeout','rejected'].includes(status) && (
          <motion.div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-6xl mb-2">
              {status === 'ended' ? '📵' : status === 'timeout' ? '⏱️' : '❌'}
            </div>
            <h2 className="text-white text-2xl font-bold">
              {status === 'ended' ? 'Call Ended' : status === 'timeout' ? 'No Answer' : 'Call Declined'}
            </h2>
            <p className="text-white opacity-50 text-sm">
              {status === 'ended' ? `Duration: ${formatDuration(callDuration)}`
                : status === 'timeout' ? `${remoteName} didn't answer`
                : `${remoteName} declined the call`}
            </p>
            <p className="text-white opacity-30 text-xs">Returning...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="absolute z-20 rounded-2xl overflow-hidden shadow-2xl"
        style={{ bottom: 140, right: 20, width: 120, height: 160, border: '2px solid rgba(255,255,255,0.2)' }}
        drag dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }} whileDrag={{ scale: 1.05 }}>
        <video ref={localVideoRef} autoPlay playsInline muted
          className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        {isCameraOff && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="w-6 h-6 text-white opacity-50" />
          </div>
        )}
      </motion.div>

      {['connected','calling'].includes(status) && (
        <motion.div className="relative z-10 flex items-center justify-center gap-5 pb-12 pt-4"
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.button onClick={toggleMute}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
            </motion.button>
            <span className="text-white text-xs opacity-60">{isMuted ? 'Unmute' : 'Mute'}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <motion.button onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: '#ef4444' }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <PhoneOff className="w-6 h-6 text-white" />
            </motion.button>
            <span className="text-white text-xs opacity-60">End</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <motion.button onClick={toggleCamera}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: isCameraOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {isCameraOff ? <VideoOff className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5 text-white" />}
            </motion.button>
            <span className="text-white text-xs opacity-60">{isCameraOff ? 'Start Cam' : 'Stop Cam'}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoCallPage;