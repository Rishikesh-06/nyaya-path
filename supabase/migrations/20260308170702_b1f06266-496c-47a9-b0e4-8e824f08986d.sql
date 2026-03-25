
-- Add headline column to users if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS headline TEXT;

-- Connection requests
CREATE TABLE IF NOT EXISTS public.lawyer_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.lawyer_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers manage own connections" ON public.lawyer_connections
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'update',
  case_title TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read posts" ON public.community_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authors manage own posts" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors update own posts" ON public.community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Authors delete own posts" ON public.community_posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Allow any authenticated user to update likes/comments count
CREATE POLICY "Any user can update post counts" ON public.community_posts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read all likes" ON public.post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own likes" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own likes" ON public.post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read comments" ON public.post_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authors insert own comments" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors delete own comments" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Community notifications
CREATE TABLE IF NOT EXISTS public.community_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  from_user_id UUID,
  from_user_name TEXT,
  post_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own community notifications" ON public.community_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Any user insert community notifications" ON public.community_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users update own community notifications" ON public.community_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_notifications;
