
-- Student community posts
CREATE TABLE IF NOT EXISTS student_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'update',
  title TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated read student posts" ON student_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors insert own student posts" ON student_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own student posts" ON student_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors delete own student posts" ON student_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Any authenticated update student post counts" ON student_posts FOR UPDATE TO authenticated USING (true);

-- Student post likes
CREATE TABLE IF NOT EXISTS student_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES student_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE student_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read all student likes" ON student_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own student likes" ON student_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own student likes" ON student_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Student post comments
CREATE TABLE IF NOT EXISTS student_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES student_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT,
  author_college TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read student comments" ON student_post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors insert own student comments" ON student_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own student comments" ON student_post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Student connections
CREATE TABLE IF NOT EXISTS student_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);
ALTER TABLE student_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own connections" ON student_connections FOR ALL TO authenticated USING (auth.uid() = requester_id OR auth.uid() = receiver_id) WITH CHECK (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Student notifications
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  from_user_id UUID,
  from_user_name TEXT,
  from_user_college TEXT,
  post_id UUID,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own student notifications" ON student_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Any authenticated insert student notifications" ON student_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own student notifications" ON student_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for student posts and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE student_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE student_notifications;
