-- Create Student Community Posts Table
CREATE TABLE IF NOT EXISTS public.student_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'update',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Likes Table
CREATE TABLE IF NOT EXISTS public.student_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.student_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Create Comments Table
CREATE TABLE IF NOT EXISTS public.student_post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.student_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_college TEXT,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Connections Table
CREATE TABLE IF NOT EXISTS public.student_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, receiver_id)
);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.student_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    from_user_name TEXT,
    from_user_college TEXT,
    post_id UUID REFERENCES public.student_posts(id) ON DELETE CASCADE,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.student_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Enable read access for all users" ON public.student_posts FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.student_post_likes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.student_post_comments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.student_connections FOR SELECT USING (true);
CREATE POLICY "Enable view to own notifications" ON public.student_notifications FOR SELECT USING (auth.uid() = user_id);

-- Allow insert/update for own records
CREATE POLICY "Enable insert for authenticated users" ON public.student_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Enable update for own posts" ON public.student_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for own posts" ON public.student_posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Enable insert for authenticated users" ON public.student_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete for own likes" ON public.student_post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.student_post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Enable delete for own comments" ON public.student_post_comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Enable insert for connections" ON public.student_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Enable update for receiver" ON public.student_connections FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Enable insert for notifications" ON public.student_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own notifications" ON public.student_notifications FOR UPDATE USING (auth.uid() = user_id);
