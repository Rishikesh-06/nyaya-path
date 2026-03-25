
CREATE TABLE IF NOT EXISTS public.mentorship_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intern_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lawyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  intern_name TEXT NOT NULL,
  intern_email TEXT NOT NULL,
  intern_phone TEXT NOT NULL,
  intern_bar_number TEXT,
  intern_city TEXT,
  intern_specialization TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mentorship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and interns see their applications" ON public.mentorship_applications FOR SELECT USING (auth.uid() = lawyer_id OR auth.uid() = intern_id);

CREATE POLICY "Interns can apply" ON public.mentorship_applications FOR INSERT WITH CHECK (auth.uid() = intern_id);

CREATE POLICY "Lawyers can update status" ON public.mentorship_applications FOR UPDATE USING (auth.uid() = lawyer_id);
