import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

const CaseChat = () => {
  const { caseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [otherParty, setOtherParty] = useState<string>('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!caseId || !user) return;

    // Fetch case info for other party name
    supabase.from('cases').select('*, victim:users!cases_victim_id_fkey(full_name), lawyer:users!cases_assigned_lawyer_id_fkey(full_name)').eq('id', caseId).single().then(({ data }: any) => {
      if (data) {
        setOtherParty(user.role === 'victim' ? data.lawyer?.full_name || 'Lawyer' : data.victim?.full_name || 'Client');
      }
    });

    // Fetch messages
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('case_id', caseId).order('created_at', { ascending: true });
      setMessages(data || []);
      // Mark unread as read
      await supabase.from('messages').update({ is_read: true }).eq('case_id', caseId).neq('sender_id', user.id).eq('is_read', false);
    };
    fetchMessages();

    // Realtime
    const channel = supabase.channel(`chat-${caseId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `case_id=eq.${caseId}` }, (payload) => {
      setMessages(prev => [...prev, payload.new as ChatMessage]);
      if ((payload.new as ChatMessage).sender_id !== user.id) {
        supabase.from('messages').update({ is_read: true }).eq('id', (payload.new as ChatMessage).id);
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [caseId, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !caseId) return;
    const content = input.trim();
    setInput('');

    // Optimistic
    const optimistic: ChatMessage = { id: `temp-${Date.now()}`, sender_id: user.id, content, created_at: new Date().toISOString(), is_read: false };
    setMessages(prev => [...prev, optimistic]);

    const { error } = await supabase.from('messages').insert({ case_id: caseId, sender_id: user.id, content });
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } else {
      // Remove optimistic, realtime will add the real one
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  };

  const basePath = user?.role === 'victim' ? '/dashboard' : user?.role === 'lawyer' ? '/lawyer' : '/student';

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid rgba(26,60,94,0.06)' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" style={{ color: '#1a3c5e' }} /></button>
        <div>
          <p className="font-body font-semibold text-sm" style={{ color: '#1a3c5e' }}>{otherParty}</p>
          <p className="text-xs font-body" style={{ color: '#6b7280' }}>Case Chat</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[75%] px-4 py-3 rounded-2xl text-sm font-body" style={msg.sender_id === user?.id ? { background: '#1a3c5e', color: '#fff', borderBottomRightRadius: '4px' } : { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(26,60,94,0.06)', color: '#1a3c5e', borderBottomLeftRadius: '4px' }}>
              {msg.content}
              <p className="text-xs mt-1 opacity-50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid rgba(26,60,94,0.06)' }}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(26,60,94,0.08)' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 text-sm font-body bg-transparent outline-none" style={{ color: '#1a3c5e' }} />
          <motion.button onClick={sendMessage} disabled={!input.trim()} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: input.trim() ? '#c9a227' : 'rgba(201,162,39,0.3)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Send className="w-4 h-4 text-white" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CaseChat;
