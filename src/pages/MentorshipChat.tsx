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

const MentorshipChat = ({ role }: { role: 'lawyer' | 'student' }) => {
  const { mentorshipId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [otherParty, setOtherParty] = useState<string>('Loading...');
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mentorshipId || !user) return;

    // Fetch mentorship info for other party name
    const fetchInfo = async () => {
      console.log(`Fetching info for mentorship: ${mentorshipId}`);
      const res = await (supabase as any).from('mentorship_applications')
        .select('*, lawyer:users!mentorship_applications_lawyer_id_fkey(full_name), student:users!mentorship_applications_intern_id_fkey(full_name)')
        .eq('id', mentorshipId)
        .single();
      
      const { data, error } = res;
      if (error) console.error("Error fetching mentorship details:", error);
      
      if (data) {
        setOtherParty(role === 'student' ? data.lawyer?.full_name || 'Lawyer' : data.intern_name || data.student?.full_name || 'Intern');
        setReceiverId(role === 'student' ? data.lawyer_id : (data.intern_id || data.student_id));
      } else {
        setOtherParty('Unknown User');
      }
    };
    fetchInfo();

    // Fetch messages
    const fetchMessages = async () => {
      console.log(`Fetching messages for thread: ${mentorshipId}`);
      const { data, error } = await (supabase as any).from('mentorship_messages').select('*').eq('mentorship_id', mentorshipId).order('created_at', { ascending: true });
      if (error) console.error("Error fetching messages:", error);
      
      console.log("Fetched messages:", data);
      setMessages(data || []);
      // Mark unread as read
      await (supabase as any).from('mentorship_messages').update({ is_read: true }).eq('mentorship_id', mentorshipId).neq('sender_id', user.id).eq('is_read', false);
    };
    fetchMessages();

    // Realtime
    const channel = supabase.channel(`mentorship-chat-${mentorshipId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mentorship_messages', filter: `mentorship_id=eq.${mentorshipId}` }, (payload) => {
      console.log("Realtime event received:", payload);
      setMessages(prev => {
        // Prevent duplicates from optimistic UI
        if (!prev.find(m => m.id === payload.new.id)) {
          return [...prev, payload.new as ChatMessage];
        }
        return prev;
      });
      if ((payload.new as ChatMessage).sender_id !== user.id) {
        (supabase as any).from('mentorship_messages').update({ is_read: true }).eq('id', (payload.new as ChatMessage).id);
      }
    }).subscribe((status) => {
      console.log("Realtime subscription status:", status);
    });

    return () => { supabase.removeChannel(channel); };
  }, [mentorshipId, user, role]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !mentorshipId) return;
    const content = input.trim();
    setInput('');

    console.log("Initiating message send:", { content, sender_id: user.id, receiver_id: receiverId, mentorship_id: mentorshipId });

    // Optimistic UI updates
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = { id: tempId, sender_id: user.id, content, created_at: new Date().toISOString(), is_read: false };
    setMessages(prev => [...prev, optimistic]);

    let res = await (supabase as any).from('mentorship_messages').insert({ mentorship_id: mentorshipId, sender_id: user.id, receiver_id: receiverId, content }).select('*').single();
    
    // Fallback if receiver_id column doesn't actually exist
    if (res.error && res.error.message?.includes('receiver_id')) {
      console.warn("Receiver ID column doesn't exist, falling back to standard schema...");
      res = await (supabase as any).from('mentorship_messages').insert({ mentorship_id: mentorshipId, sender_id: user.id, content }).select('*').single();
    }

    if (res.error) {
      console.error("Critical Message insert error:", res.error);
      alert("Failed to send message properly: " + res.error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      console.log("Message insertion successful:", res.data);
      // Map the optimistic message to the newly confirmed ID so realtime doesn't duplicate it
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-100px)] flex flex-col pt-2" style={{ background: 'transparent' }}>
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary nyaya-transition">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <p className="font-body font-bold text-base text-foreground">{otherParty}</p>
          <p className="text-xs font-body text-muted-foreground mr-1">Mentorship Chat</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3 px-2">
        {messages.length === 0 && <p className="text-center text-sm font-body text-muted-foreground mt-10">No messages yet. Say hi!</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 text-sm font-body shadow-sm ${msg.sender_id === user?.id ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`} 
              style={{
                background: msg.sender_id === user?.id ? '#1a3c5e' : 'var(--secondary)',
                color: msg.sender_id === user?.id ? '#fff' : 'var(--foreground)',
                border: msg.sender_id !== user?.id ? `1px solid var(--border)` : 'none'
              }}>
              {msg.content}
              <p className={`text-[10px] mt-1.5 text-right font-medium opacity-60`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="pt-4 border-t border-border mt-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card shadow-sm">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 px-2 py-2 text-sm font-body bg-transparent outline-none text-foreground placeholder-muted-foreground" />
          <motion.button onClick={sendMessage} disabled={!input.trim()} className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50" style={{ background: input.trim() ? '#1a3c5e' : 'var(--secondary)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Send className="w-4 h-4" style={{ color: input.trim() ? '#fff' : 'var(--muted-foreground)' }} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default MentorshipChat;
