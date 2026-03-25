
-- Fix: Make critical policies PERMISSIVE so they OR together
-- Cases: lawyer needs to be able to UPDATE an open case to assign themselves

-- Drop all existing cases policies
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'cases' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.cases', pol.policyname); end loop;
end $$;

-- Recreate as PERMISSIVE (default)
create policy "cases_victim_all" on public.cases for all to authenticated using (victim_id = auth.uid()) with check (victim_id = auth.uid());
create policy "cases_lawyer_read" on public.cases for select to authenticated using (status = 'open' or assigned_lawyer_id = auth.uid());
create policy "cases_lawyer_update" on public.cases for update to authenticated using (assigned_lawyer_id = auth.uid() or status = 'open');

-- Fix notifications - make insert permissive so anyone can notify others
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'notifications' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.notifications', pol.policyname); end loop;
end $$;

create policy "notifications_read_own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "notifications_insert_any" on public.notifications for insert to authenticated with check (true);

-- Fix appointments
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'appointments' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.appointments', pol.policyname); end loop;
end $$;

create policy "appointments_select" on public.appointments for select to authenticated using (victim_id = auth.uid() or lawyer_id = auth.uid());
create policy "appointments_insert" on public.appointments for insert to authenticated with check (victim_id = auth.uid() or lawyer_id = auth.uid());
create policy "appointments_update" on public.appointments for update to authenticated using (victim_id = auth.uid() or lawyer_id = auth.uid());

-- Fix messages
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'messages' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.messages', pol.policyname); end loop;
end $$;

create policy "messages_select" on public.messages for select to authenticated using (
  sender_id = auth.uid() or case_id in (select id from public.cases where victim_id = auth.uid() or assigned_lawyer_id = auth.uid())
);
create policy "messages_insert" on public.messages for insert to authenticated with check (sender_id = auth.uid());
create policy "messages_update" on public.messages for update to authenticated using (
  case_id in (select id from public.cases where victim_id = auth.uid() or assigned_lawyer_id = auth.uid())
);

-- Fix users policies
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'users' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.users', pol.policyname); end loop;
end $$;

create policy "users_read_all" on public.users for select using (true);
create policy "users_insert_own" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users_update_own" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Fix internships
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'internships' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.internships', pol.policyname); end loop;
end $$;

create policy "internships_select" on public.internships for select to authenticated using (student_id = auth.uid() or lawyer_id = auth.uid());
create policy "internships_insert" on public.internships for insert to authenticated with check (student_id = auth.uid() or lawyer_id = auth.uid());
create policy "internships_update" on public.internships for update to authenticated using (student_id = auth.uid() or lawyer_id = auth.uid());

-- Fix lawyer_scores
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'lawyer_scores' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.lawyer_scores', pol.policyname); end loop;
end $$;

create policy "scores_read_all" on public.lawyer_scores for select using (true);
create policy "scores_insert_own" on public.lawyer_scores for insert to authenticated with check (lawyer_id = auth.uid());
create policy "scores_update_own" on public.lawyer_scores for update to authenticated using (lawyer_id = auth.uid());

-- Fix badges
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'badges' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.badges', pol.policyname); end loop;
end $$;

create policy "badges_read" on public.badges for select using (true);
create policy "badges_insert" on public.badges for insert to authenticated with check (true);

-- Fix case_ratings
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'case_ratings' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.case_ratings', pol.policyname); end loop;
end $$;

create policy "ratings_select" on public.case_ratings for select to authenticated using (victim_id = auth.uid() or lawyer_id = auth.uid());
create policy "ratings_insert" on public.case_ratings for insert to authenticated with check (victim_id = auth.uid());

-- Fix sahaay_conversations
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'sahaay_conversations' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.sahaay_conversations', pol.policyname); end loop;
end $$;

create policy "sahaay_own" on public.sahaay_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fix documents
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'documents' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.documents', pol.policyname); end loop;
end $$;

create policy "documents_uploader" on public.documents for all to authenticated using (uploader_id = auth.uid()) with check (uploader_id = auth.uid());
create policy "documents_lawyer_read" on public.documents for select to authenticated using (
  case_id in (select id from public.cases where assigned_lawyer_id = auth.uid())
);

-- Recreate the trigger (it's missing from the database)
drop trigger if exists on_lawyer_created on public.users;
create trigger on_lawyer_created
  after insert on public.users
  for each row execute procedure public.handle_new_lawyer();

-- Ensure realtime
do $$
begin
  alter publication supabase_realtime add table public.cases;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null;
end $$;
