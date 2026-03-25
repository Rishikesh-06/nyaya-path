
-- Users/profiles table
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('victim','lawyer','student')),
  city text,
  preferred_language text DEFAULT 'English',
  bar_council_number text,
  specialization text[],
  university text,
  year_of_study integer,
  languages_spoken text[],
  avatar_url text,
  accepting_interns boolean DEFAULT false,
  fee_range_min integer DEFAULT 0,
  fee_range_max integer DEFAULT 0,
  bio text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own row" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own row" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Cases table
CREATE TABLE public.cases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  victim_id uuid REFERENCES public.users NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  fir_number text,
  fir_verified boolean DEFAULT false,
  is_anonymous boolean DEFAULT true,
  case_strength integer DEFAULT 0,
  status text DEFAULT 'open' CHECK (status IN ('open','assigned','resolved','closed')),
  assigned_lawyer_id uuid REFERENCES public.users,
  ai_summary text,
  evidence_gaps text[],
  deadlines jsonb DEFAULT '[]'::jsonb,
  outcome text,
  fee_charged integer DEFAULT 0,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Victims can read own cases" ON public.cases FOR SELECT TO authenticated USING (victim_id = auth.uid());
CREATE POLICY "Lawyers can read open or assigned cases" ON public.cases FOR SELECT TO authenticated USING (
  status = 'open' OR assigned_lawyer_id = auth.uid()
);
CREATE POLICY "Victims can insert own cases" ON public.cases FOR INSERT TO authenticated WITH CHECK (victim_id = auth.uid());
CREATE POLICY "Victims can update own cases" ON public.cases FOR UPDATE TO authenticated USING (victim_id = auth.uid());
CREATE POLICY "Lawyers can update assigned cases" ON public.cases FOR UPDATE TO authenticated USING (assigned_lawyer_id = auth.uid());

-- Documents table
CREATE TABLE public.documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES public.cases,
  uploader_id uuid REFERENCES public.users NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  ai_analysis jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uploaders can read own docs" ON public.documents FOR SELECT TO authenticated USING (uploader_id = auth.uid());
CREATE POLICY "Lawyers can read docs for assigned cases" ON public.documents FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = documents.case_id AND cases.assigned_lawyer_id = auth.uid())
);
CREATE POLICY "Users can insert own docs" ON public.documents FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());
CREATE POLICY "Users can update own docs" ON public.documents FOR UPDATE TO authenticated USING (uploader_id = auth.uid());

-- Messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES public.cases NOT NULL,
  sender_id uuid REFERENCES public.users NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties can read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = messages.case_id AND (cases.victim_id = auth.uid() OR cases.assigned_lawyer_id = auth.uid()))
);
CREATE POLICY "Involved parties can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND (cases.victim_id = auth.uid() OR cases.assigned_lawyer_id = auth.uid()))
);
CREATE POLICY "Involved parties can update read status" ON public.messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = messages.case_id AND (cases.victim_id = auth.uid() OR cases.assigned_lawyer_id = auth.uid()))
);

-- Lawyer scores table
CREATE TABLE public.lawyer_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id uuid REFERENCES public.users UNIQUE NOT NULL,
  total_score integer DEFAULT 0,
  cases_accepted integer DEFAULT 0,
  cases_won integer DEFAULT 0,
  cases_resolved integer DEFAULT 0,
  avg_resolution_days numeric DEFAULT 0,
  avg_rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  rating_sum numeric DEFAULT 0,
  pro_bono_count integer DEFAULT 0,
  generosity_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  anonymous_cases_count integer DEFAULT 0,
  fast_resolutions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.lawyer_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lawyer scores" ON public.lawyer_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lawyers can update own scores" ON public.lawyer_scores FOR UPDATE TO authenticated USING (lawyer_id = auth.uid());
CREATE POLICY "System can insert scores" ON public.lawyer_scores FOR INSERT TO authenticated WITH CHECK (lawyer_id = auth.uid());

-- Badges table
CREATE TABLE public.badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id uuid REFERENCES public.users NOT NULL,
  badge_name text NOT NULL,
  badge_category text,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(lawyer_id, badge_name)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System inserts badges" ON public.badges FOR INSERT TO authenticated WITH CHECK (true);

-- Appointments table
CREATE TABLE public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  victim_id uuid REFERENCES public.users NOT NULL,
  lawyer_id uuid REFERENCES public.users NOT NULL,
  date date NOT NULL,
  time_slot text NOT NULL,
  fee integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own appointments" ON public.appointments FOR SELECT TO authenticated USING (victim_id = auth.uid() OR lawyer_id = auth.uid());
CREATE POLICY "Victims can create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (victim_id = auth.uid());
CREATE POLICY "Lawyers can update appointment status" ON public.appointments FOR UPDATE TO authenticated USING (lawyer_id = auth.uid());
CREATE POLICY "Victims can update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (victim_id = auth.uid());

-- Internships table
CREATE TABLE public.internships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.users NOT NULL,
  lawyer_id uuid REFERENCES public.users NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled')),
  motivation_letter text,
  skills text[],
  availability text,
  start_date date,
  end_date date,
  supervisor_rating integer,
  supervisor_review text,
  skills_demonstrated text[],
  tasks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own internships" ON public.internships FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Lawyers can read own internships" ON public.internships FOR SELECT TO authenticated USING (lawyer_id = auth.uid());
CREATE POLICY "Students can insert internships" ON public.internships FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Lawyers can update internships" ON public.internships FOR UPDATE TO authenticated USING (lawyer_id = auth.uid());
CREATE POLICY "Students can update own internships" ON public.internships FOR UPDATE TO authenticated USING (student_id = auth.uid());

-- Notifications table
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Monthly heroes table
CREATE TABLE public.monthly_heroes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id uuid REFERENCES public.users NOT NULL,
  category text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  key_stat text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.monthly_heroes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read monthly heroes" ON public.monthly_heroes FOR SELECT TO authenticated USING (true);
CREATE POLICY "System inserts heroes" ON public.monthly_heroes FOR INSERT TO authenticated WITH CHECK (true);

-- Sahaay conversations table
CREATE TABLE public.sahaay_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  language text DEFAULT 'English',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sahaay_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations" ON public.sahaay_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON public.sahaay_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON public.sahaay_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Case ratings table
CREATE TABLE public.case_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES public.cases NOT NULL UNIQUE,
  victim_id uuid REFERENCES public.users NOT NULL,
  lawyer_id uuid REFERENCES public.users NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.case_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties can read ratings" ON public.case_ratings FOR SELECT TO authenticated USING (victim_id = auth.uid() OR lawyer_id = auth.uid());
CREATE POLICY "Victims can insert ratings" ON public.case_ratings FOR INSERT TO authenticated WITH CHECK (victim_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lawyer_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internships;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Public read case docs" ON storage.objects FOR SELECT USING (bucket_id = 'case-documents');
CREATE POLICY "Auth users upload case docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own case docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger function for auto-creating lawyer_scores on lawyer signup
CREATE OR REPLACE FUNCTION public.handle_new_lawyer_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'lawyer' THEN
    INSERT INTO public.lawyer_scores (lawyer_id) VALUES (NEW.id) ON CONFLICT (lawyer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_user_created_lawyer_score
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_lawyer_score();
