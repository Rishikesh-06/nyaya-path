
-- ============================================================
-- FIX: All existing policies are RESTRICTIVE (not PERMISSIVE).
-- Drop all and recreate as PERMISSIVE.
-- ============================================================

-- ===================== USERS =====================
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row" ON public.users;
DROP POLICY IF EXISTS "users_read" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

CREATE POLICY "users_read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ===================== CASES =====================
DROP POLICY IF EXISTS "Victims can read own cases" ON public.cases;
DROP POLICY IF EXISTS "Lawyers can read open or assigned cases" ON public.cases;
DROP POLICY IF EXISTS "Victims can insert own cases" ON public.cases;
DROP POLICY IF EXISTS "Victims can update own cases" ON public.cases;
DROP POLICY IF EXISTS "Lawyers can update assigned cases" ON public.cases;
DROP POLICY IF EXISTS "cases_victim_all" ON public.cases;
DROP POLICY IF EXISTS "cases_lawyer_read" ON public.cases;
DROP POLICY IF EXISTS "cases_lawyer_update" ON public.cases;
DROP POLICY IF EXISTS "cases_student_read" ON public.cases;
DROP POLICY IF EXISTS "cases_victim_select" ON public.cases;
DROP POLICY IF EXISTS "cases_victim_insert" ON public.cases;
DROP POLICY IF EXISTS "cases_victim_update" ON public.cases;

CREATE POLICY "cases_victim_select" ON public.cases FOR SELECT TO authenticated USING (victim_id = auth.uid());
CREATE POLICY "cases_victim_insert" ON public.cases FOR INSERT TO authenticated WITH CHECK (victim_id = auth.uid());
CREATE POLICY "cases_victim_update" ON public.cases FOR UPDATE TO authenticated USING (victim_id = auth.uid());
CREATE POLICY "cases_lawyer_read" ON public.cases FOR SELECT TO authenticated USING (status = 'open' OR assigned_lawyer_id = auth.uid());
CREATE POLICY "cases_lawyer_update" ON public.cases FOR UPDATE TO authenticated USING (assigned_lawyer_id = auth.uid());

-- ===================== MESSAGES =====================
DROP POLICY IF EXISTS "Involved parties can read messages" ON public.messages;
DROP POLICY IF EXISTS "Involved parties can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Involved parties can update read status" ON public.messages;
DROP POLICY IF EXISTS "messages_participants" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR
  case_id IN (SELECT id FROM public.cases WHERE victim_id = auth.uid() OR assigned_lawyer_id = auth.uid())
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND
  case_id IN (SELECT id FROM public.cases WHERE victim_id = auth.uid() OR assigned_lawyer_id = auth.uid())
);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated USING (
  case_id IN (SELECT id FROM public.cases WHERE victim_id = auth.uid() OR assigned_lawyer_id = auth.uid())
);

-- ===================== DOCUMENTS =====================
DROP POLICY IF EXISTS "Uploaders can read own docs" ON public.documents;
DROP POLICY IF EXISTS "Lawyers can read docs for assigned cases" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own docs" ON public.documents;
DROP POLICY IF EXISTS "Users can update own docs" ON public.documents;
DROP POLICY IF EXISTS "documents_uploader" ON public.documents;
DROP POLICY IF EXISTS "documents_lawyer_read" ON public.documents;

CREATE POLICY "documents_uploader" ON public.documents FOR ALL TO authenticated USING (uploader_id = auth.uid());
CREATE POLICY "documents_lawyer_read" ON public.documents FOR SELECT TO authenticated USING (
  case_id IN (SELECT id FROM public.cases WHERE assigned_lawyer_id = auth.uid())
);

-- ===================== LAWYER_SCORES =====================
DROP POLICY IF EXISTS "Anyone can read lawyer scores" ON public.lawyer_scores;
DROP POLICY IF EXISTS "Lawyers can update own scores" ON public.lawyer_scores;
DROP POLICY IF EXISTS "System can insert scores" ON public.lawyer_scores;
DROP POLICY IF EXISTS "scores_read" ON public.lawyer_scores;
DROP POLICY IF EXISTS "scores_self_update" ON public.lawyer_scores;
DROP POLICY IF EXISTS "scores_insert" ON public.lawyer_scores;
DROP POLICY IF EXISTS "scores_update" ON public.lawyer_scores;

CREATE POLICY "scores_read" ON public.lawyer_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "scores_insert" ON public.lawyer_scores FOR INSERT TO authenticated WITH CHECK (lawyer_id = auth.uid());
CREATE POLICY "scores_update" ON public.lawyer_scores FOR UPDATE TO authenticated USING (lawyer_id = auth.uid());

-- ===================== NOTIFICATIONS =====================
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id IS NOT NULL);

-- ===================== APPOINTMENTS =====================
DROP POLICY IF EXISTS "Users can read own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Victims can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Lawyers can update appointment status" ON public.appointments;
DROP POLICY IF EXISTS "Victims can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;

CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated USING (victim_id = auth.uid() OR lawyer_id = auth.uid());
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (victim_id = auth.uid());
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated USING (victim_id = auth.uid() OR lawyer_id = auth.uid());

-- ===================== INTERNSHIPS =====================
DROP POLICY IF EXISTS "Students can read own internships" ON public.internships;
DROP POLICY IF EXISTS "Lawyers can read own internships" ON public.internships;
DROP POLICY IF EXISTS "Students can insert internships" ON public.internships;
DROP POLICY IF EXISTS "Lawyers can update internships" ON public.internships;
DROP POLICY IF EXISTS "Students can update own internships" ON public.internships;
DROP POLICY IF EXISTS "internships_own" ON public.internships;
DROP POLICY IF EXISTS "internships_select" ON public.internships;
DROP POLICY IF EXISTS "internships_insert" ON public.internships;
DROP POLICY IF EXISTS "internships_update" ON public.internships;

CREATE POLICY "internships_select" ON public.internships FOR SELECT TO authenticated USING (student_id = auth.uid() OR lawyer_id = auth.uid());
CREATE POLICY "internships_insert" ON public.internships FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "internships_update" ON public.internships FOR UPDATE TO authenticated USING (student_id = auth.uid() OR lawyer_id = auth.uid());

-- ===================== BADGES =====================
DROP POLICY IF EXISTS "Anyone can read badges" ON public.badges;
DROP POLICY IF EXISTS "Authenticated users can insert badges" ON public.badges;
DROP POLICY IF EXISTS "badges_read" ON public.badges;
DROP POLICY IF EXISTS "badges_insert" ON public.badges;

CREATE POLICY "badges_read" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_insert" ON public.badges FOR INSERT TO authenticated WITH CHECK (true);

-- ===================== MONTHLY_HEROES =====================
DROP POLICY IF EXISTS "Anyone can read monthly heroes" ON public.monthly_heroes;
DROP POLICY IF EXISTS "No direct inserts to monthly heroes" ON public.monthly_heroes;
DROP POLICY IF EXISTS "heroes_read" ON public.monthly_heroes;

CREATE POLICY "heroes_read" ON public.monthly_heroes FOR SELECT TO authenticated USING (true);

-- ===================== CASE_RATINGS =====================
DROP POLICY IF EXISTS "Involved parties can read ratings" ON public.case_ratings;
DROP POLICY IF EXISTS "Victims can insert ratings" ON public.case_ratings;
DROP POLICY IF EXISTS "ratings_own" ON public.case_ratings;
DROP POLICY IF EXISTS "ratings_select" ON public.case_ratings;
DROP POLICY IF EXISTS "ratings_insert" ON public.case_ratings;

CREATE POLICY "ratings_select" ON public.case_ratings FOR SELECT TO authenticated USING (victim_id = auth.uid() OR lawyer_id = auth.uid());
CREATE POLICY "ratings_insert" ON public.case_ratings FOR INSERT TO authenticated WITH CHECK (victim_id = auth.uid());

-- ===================== SAHAAY_CONVERSATIONS =====================
DROP POLICY IF EXISTS "Users can read own conversations" ON public.sahaay_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.sahaay_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.sahaay_conversations;
DROP POLICY IF EXISTS "sahaay_own" ON public.sahaay_conversations;
DROP POLICY IF EXISTS "sahaay_select" ON public.sahaay_conversations;
DROP POLICY IF EXISTS "sahaay_insert" ON public.sahaay_conversations;
DROP POLICY IF EXISTS "sahaay_update" ON public.sahaay_conversations;

CREATE POLICY "sahaay_select" ON public.sahaay_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sahaay_insert" ON public.sahaay_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sahaay_update" ON public.sahaay_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ===================== TRIGGER =====================
DROP TRIGGER IF EXISTS on_lawyer_created ON public.users;
DROP TRIGGER IF EXISTS on_new_lawyer_score ON public.users;

CREATE OR REPLACE FUNCTION public.handle_new_lawyer_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'lawyer' THEN
    INSERT INTO public.lawyer_scores (lawyer_id, total_score, cases_accepted, cases_won, cases_resolved, avg_resolution_days, avg_rating, total_ratings, rating_sum, pro_bono_count, generosity_points, current_streak, anonymous_cases_count, fast_resolutions)
    VALUES (NEW.id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (lawyer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lawyer_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_lawyer_score();

-- ===================== STORAGE POLICIES =====================
DROP POLICY IF EXISTS "Public read case-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload case-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth update case-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth update avatars" ON storage.objects;

CREATE POLICY "Public read case-documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'case-documents');
CREATE POLICY "Auth upload case-documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'case-documents');
CREATE POLICY "Auth update case-documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'case-documents');

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Auth update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
