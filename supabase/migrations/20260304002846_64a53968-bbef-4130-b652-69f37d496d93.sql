
-- USERS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'users' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.users', pol.policyname); end loop;
end $$;
create policy "users_read_all" on public.users for select to authenticated, anon using (true);
create policy "users_insert_own" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users_update_own" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- CASES
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'cases' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.cases', pol.policyname); end loop;
end $$;
create policy "cases_victim_all" on public.cases for all to authenticated using (victim_id = auth.uid());
create policy "cases_lawyer_read" on public.cases for select to authenticated using (status = 'open' or assigned_lawyer_id = auth.uid());
create policy "cases_lawyer_update" on public.cases for update to authenticated using (assigned_lawyer_id = auth.uid());

-- MESSAGES
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'messages' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.messages', pol.policyname); end loop;
end $$;
create policy "messages_participants" on public.messages for all to authenticated using (
  sender_id = auth.uid() or
  case_id in (select id from public.cases where victim_id = auth.uid() or assigned_lawyer_id = auth.uid())
);

-- DOCUMENTS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'documents' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.documents', pol.policyname); end loop;
end $$;
create policy "documents_uploader" on public.documents for all to authenticated using (uploader_id = auth.uid());
create policy "documents_lawyer_read" on public.documents for select to authenticated using (
  case_id in (select id from public.cases where assigned_lawyer_id = auth.uid())
);

-- LAWYER SCORES
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'lawyer_scores' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.lawyer_scores', pol.policyname); end loop;
end $$;
create policy "scores_read_all" on public.lawyer_scores for select to authenticated using (true);
create policy "scores_insert_own" on public.lawyer_scores for insert to authenticated with check (lawyer_id = auth.uid());
create policy "scores_update_own" on public.lawyer_scores for update to authenticated using (lawyer_id = auth.uid());

-- NOTIFICATIONS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'notifications' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.notifications', pol.policyname); end loop;
end $$;
create policy "notifications_own" on public.notifications for all to authenticated using (user_id = auth.uid());
create policy "notifications_insert_any" on public.notifications for insert to authenticated with check (user_id is not null);

-- APPOINTMENTS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'appointments' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.appointments', pol.policyname); end loop;
end $$;
create policy "appointments_participants" on public.appointments for all to authenticated using (victim_id = auth.uid() or lawyer_id = auth.uid());

-- INTERNSHIPS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'internships' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.internships', pol.policyname); end loop;
end $$;
create policy "internships_participants" on public.internships for all to authenticated using (student_id = auth.uid() or lawyer_id = auth.uid());

-- BADGES
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'badges' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.badges', pol.policyname); end loop;
end $$;
create policy "badges_read" on public.badges for select to authenticated using (true);
create policy "badges_insert" on public.badges for insert to authenticated with check (true);

-- MONTHLY HEROES
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'monthly_heroes' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.monthly_heroes', pol.policyname); end loop;
end $$;
create policy "heroes_read" on public.monthly_heroes for select to authenticated using (true);

-- CASE RATINGS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'case_ratings' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.case_ratings', pol.policyname); end loop;
end $$;
create policy "ratings_select" on public.case_ratings for select to authenticated using (victim_id = auth.uid() or lawyer_id = auth.uid());
create policy "ratings_insert" on public.case_ratings for insert to authenticated with check (victim_id = auth.uid());

-- SAHAAY CONVERSATIONS
do $$ declare pol record; begin
  for pol in select policyname from pg_policies where tablename = 'sahaay_conversations' and schemaname = 'public'
  loop execute format('drop policy if exists %I on public.sahaay_conversations', pol.policyname); end loop;
end $$;
create policy "sahaay_own" on public.sahaay_conversations for all to authenticated using (user_id = auth.uid());

-- STORAGE
insert into storage.buckets (id, name, public) values ('case-documents', 'case-documents', true), ('avatars', 'avatars', true) on conflict (id) do nothing;
drop policy if exists "case_docs_all" on storage.objects;
create policy "case_docs_all" on storage.objects for all using (bucket_id = 'case-documents' and auth.role() = 'authenticated');
drop policy if exists "avatars_all" on storage.objects;
create policy "avatars_all" on storage.objects for all using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- TRIGGER
create or replace function public.handle_new_lawyer()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.role = 'lawyer' then
    insert into public.lawyer_scores (lawyer_id, total_score, cases_accepted, cases_won, cases_resolved, avg_rating, total_ratings, rating_sum, pro_bono_count, generosity_points, current_streak, anonymous_cases_count, fast_resolutions)
    values (NEW.id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    on conflict (lawyer_id) do nothing;
  end if;
  return NEW;
end;
$$;
drop trigger if exists on_lawyer_created on public.users;
create trigger on_lawyer_created after insert on public.users for each row execute procedure public.handle_new_lawyer();
