-- Migration to create persistent chat for the mentorship module

CREATE TABLE IF NOT EXISTS public.mentorship_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_id UUID REFERENCES public.mentorship_applications(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mentorship_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties can read messages" ON public.mentorship_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.mentorship_applications 
    WHERE mentorship_applications.id = mentorship_messages.mentorship_id 
    AND (mentorship_applications.intern_id = auth.uid() OR mentorship_applications.lawyer_id = auth.uid())
  )
);

CREATE POLICY "Involved parties can insert messages" ON public.mentorship_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.mentorship_applications 
    WHERE mentorship_applications.id = mentorship_messages.mentorship_id 
    AND (mentorship_applications.intern_id = auth.uid() OR mentorship_applications.lawyer_id = auth.uid())
  )
);

CREATE POLICY "Involved parties can update messages" ON public.mentorship_messages FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.mentorship_applications 
    WHERE mentorship_applications.id = mentorship_messages.mentorship_id 
    AND (mentorship_applications.intern_id = auth.uid() OR mentorship_applications.lawyer_id = auth.uid())
  )
);

-- Enable real-time for live chat functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_messages;
