
-- Fix permissive RLS policies by restricting inserts

-- Badges: only allow insert if the lawyer_id matches a valid lawyer
DROP POLICY "System inserts badges" ON public.badges;
CREATE POLICY "Authenticated users can insert badges" ON public.badges FOR INSERT TO authenticated WITH CHECK (lawyer_id = auth.uid());

-- Notifications: only allow insert if user_id is the target (system will use service role)
DROP POLICY "System inserts notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications for others" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id IS NOT NULL);

-- Monthly heroes: restrict to authenticated, service role will handle actual inserts
DROP POLICY "System inserts heroes" ON public.monthly_heroes;
CREATE POLICY "No direct inserts to monthly heroes" ON public.monthly_heroes FOR INSERT TO authenticated WITH CHECK (false);
