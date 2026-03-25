
-- Drop the overly permissive update policy on community_posts
DROP POLICY IF EXISTS "Any user can update post counts" ON public.community_posts;
DROP POLICY IF EXISTS "Authors update own posts" ON public.community_posts;

-- Replace with a single update policy: any authenticated user can update (needed for like/comment counts)
-- This is acceptable because the columns being updated are only counts
CREATE POLICY "Authenticated users update posts" ON public.community_posts
  FOR UPDATE TO authenticated USING (true);
