import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const LawyerChat = () => {
  const { lawyerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [otherLawyer, setOtherLawyer] = useState<string>('Lawyer');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lawyerId || !user) return;

    // Get other lawyer's name
    supabase.from('users').select('full_name').eq('id', lawyerId).single().then(({ data }: any) => {
      if (data) setOtherLawyer(data.full_name || 'Lawyer');
    });

    // Fetch messages between these two lawyers
    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from('lawyer_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${lawyerId}),and(sender_id.eq.${lawyerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);

      // Mark as read
      await (supabase as any)
        .from('lawyer_messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', lawyerId)
        .eq('is_read', false);
    };
    fetchMessages();

    // Realtime
    const channel = supabase
      .channel(`lawyer-chat-${[user.id, lawyerId].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lawyer_messages',
      }, (payload: any) => {
        const msg = payload.new as ChatMessage;
        const isRelevant =
          (msg.sender_id === user.id && msg.receiver_id === lawyerId) ||
          (msg.sender_id === lawyerId && msg.receiver_id === user.id);
        if (isRelevant) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== user.id) {
            (supabase as any).from('lawyer_messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [lawyerId, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !lawyerId) return;
    const content = input.trim();
    setInput('');

    // Optimistic update
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: lawyerId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, optimistic]);

    const { error } = await (supabase as any).from('lawyer_messages').insert({
      sender_id: user.id,
      receiver_id: lawyerId,
      content,
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid rgba(26,60,94,0.06)' }}>
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" style={{ color: '#1a3c5e' }} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #1a3c5e, #c9a227)' }}>
            {otherLawyer[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-body font-semibold text-sm" style={{ color: '#1a3c5e' }}>{otherLawyer}</p>
            <p className="text-xs font-body" style={{ color: '#6b7280' }}>Lawyer • Connected</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <p className="text-4xl">💬</p>
            <p className="text-sm font-body" style={{ color: '#6b7280' }}>Start a conversation with {otherLawyer}</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[75%] px-4 py-3 rounded-2xl text-sm font-body"
              style={msg.sender_id === user?.id
                ? { background: '#1a3c5e', color: '#fff', borderBottomRightRadius: '4px' }
                : { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,60,94,0.06)', color: '#1a3c5e', borderBottomLeftRadius: '4px' }
              }
            >
              {msg.content}
              <p className="text-xs mt-1 opacity-50">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="pt-3" style={{ borderTop: '1px solid rgba(26,60,94,0.06)' }}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(26,60,94,0.08)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${otherLawyer}...`}
            className="flex-1 text-sm font-body bg-transparent outline-none"
            style={{ color: '#1a3c5e' }}
          />
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: input.trim() ? '#c9a227' : 'rgba(201,162,39,0.3)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4 text-white" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default LawyerChat;