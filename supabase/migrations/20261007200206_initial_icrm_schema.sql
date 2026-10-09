-- ============================================================
-- INTERACT RUSPINA MONASTIR
-- DATABASE V1
-- ============================================================

begin;

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

create type public.app_role as enum (
  'member',
  'commission_head',
  'bureau',
  'super_admin'
);

create type public.member_status as enum (
  'active',
  'follow_up',
  'inactive'
);

create type public.commission_position as enum (
  'member',
  'responsable'
);

create type public.meeting_scope as enum (
  'club',
  'commission'
);

create type public.meeting_kind as enum (
  'meeting',
  'event',
  'training',
  'other'
);

create type public.attendance_status as enum (
  'present',
  'absent',
  'excused',
  'late'
);

create type public.task_status as enum (
  'pending',
  'in_progress',
  'completed'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.document_access_type as enum (
  'all_members',
  'commission',
  'bureau'
);

create type public.announcement_audience as enum (
  'all_members',
  'commission',
  'bureau'
);

-- ============================================================
-- 2. PROFILES
-- Connected 1:1 with Supabase Auth users
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null default '',
  avatar_url text,
  phone text,

  role public.app_role not null default 'member',
  status public.member_status not null default 'active',

  joined_at timestamptz not null default now(),
  mandate text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. COMMISSIONS
-- ============================================================

create table public.commissions (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint commissions_name_unique unique (name)
);

-- ============================================================
-- 4. COMMISSION MEMBERSHIP
-- ============================================================

create table public.commission_members (
  commission_id uuid not null
    references public.commissions(id) on delete cascade,

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  position public.commission_position not null default 'member',

  joined_at timestamptz not null default now(),

  primary key (commission_id, user_id)
);

-- Only one responsable per commission
create unique index commission_one_responsable_idx
on public.commission_members (commission_id)
where position = 'responsable';

create index commission_members_user_idx
on public.commission_members (user_id);

-- ============================================================
-- 5. MEETINGS / EVENTS
-- ============================================================

create table public.meetings (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  scope public.meeting_scope not null default 'club',
  kind public.meeting_kind not null default 'meeting',

  commission_id uuid
    references public.commissions(id) on delete cascade,

  location text,

  starts_at timestamptz not null,
  ends_at timestamptz,

  created_by uuid
    references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint meetings_scope_consistency check (
    (scope = 'club' and commission_id is null)
    or
    (scope = 'commission' and commission_id is not null)
  ),

  constraint meetings_time_valid check (
    ends_at is null or ends_at > starts_at
  )
);

create index meetings_starts_at_idx
on public.meetings (starts_at);

create index meetings_commission_idx
on public.meetings (commission_id, starts_at);

-- ============================================================
-- 6. ATTENDANCE
-- ============================================================

create table public.attendance (
  meeting_id uuid not null
    references public.meetings(id) on delete cascade,

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  status public.attendance_status not null default 'absent',

  marked_at timestamptz not null default now(),

  primary key (meeting_id, user_id)
);

create index attendance_user_idx
on public.attendance (user_id);

-- ============================================================
-- 7. TASKS
-- ============================================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  assigned_to uuid not null
    references public.profiles(id) on delete cascade,

  commission_id uuid
    references public.commissions(id) on delete cascade,

  status public.task_status not null default 'pending',
  priority public.task_priority not null default 'medium',

  due_at timestamptz,

  created_by uuid
    references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assigned_to_idx
on public.tasks (assigned_to, status);

create index tasks_commission_idx
on public.tasks (commission_id, status);

create index tasks_due_at_idx
on public.tasks (due_at);

-- ============================================================
-- 8. DOCUMENTS
-- ============================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  storage_path text not null,

  access_type public.document_access_type not null default 'all_members',

  commission_id uuid
    references public.commissions(id) on delete cascade,

  uploaded_by uuid
    references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint documents_access_consistency check (
    (access_type = 'commission' and commission_id is not null)
    or
    (access_type in ('all_members', 'bureau') and commission_id is null)
  )
);

create index documents_commission_idx
on public.documents (commission_id, created_at);

-- ============================================================
-- 9. ANNOUNCEMENTS
-- ============================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  content text not null,

  audience public.announcement_audience not null default 'all_members',

  commission_id uuid
    references public.commissions(id) on delete cascade,

  created_by uuid
    references public.profiles(id) on delete set null,

  published_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint announcements_audience_consistency check (
    (audience = 'commission' and commission_id is not null)
    or
    (audience in ('all_members', 'bureau') and commission_id is null)
  )
);

create index announcements_published_idx
on public.announcements (published_at desc);

-- ============================================================
-- 10. ACTIVITY LOG
-- ============================================================

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),

  actor_user_id uuid
    references public.profiles(id) on delete set null,

  action text not null,
  entity_type text,
  entity_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index activity_log_actor_idx
on public.activity_log (actor_user_id, created_at desc);

create index activity_log_created_idx
on public.activity_log (created_at desc);

-- ============================================================
-- 11. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger commissions_set_updated_at
before update on public.commissions
for each row execute function public.set_updated_at();

create trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

-- ============================================================
-- 12. PRIVATE SECURITY HELPERS
-- ============================================================

create schema if not exists private;

create or replace function private.is_bureau()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select p.role in ('bureau', 'super_admin')
      from public.profiles p
      where p.id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function private.is_commission_member(
  _commission_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.commission_members cm
      where cm.commission_id = _commission_id
        and cm.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_commission_manager(
  _commission_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.commission_members cm
      where cm.commission_id = _commission_id
        and cm.user_id = (select auth.uid())
        and cm.position = 'responsable'
    );
$$;

create or replace function private.can_view_profile(
  _target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    _target_user_id = (select auth.uid())
    or private.is_bureau()
    or exists (
      select 1
      from public.commission_members target_cm
      where target_cm.user_id = _target_user_id
        and private.is_commission_manager(target_cm.commission_id)
    );
$$;

create or replace function private.can_access_meeting(
  _meeting_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.meetings m
      where m.id = _meeting_id
        and (
          m.scope = 'club'
          or private.is_commission_member(m.commission_id)
        )
    );
$$;

create or replace function private.can_manage_meeting(
  _meeting_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.meetings m
      where m.id = _meeting_id
        and m.scope = 'commission'
        and private.is_commission_manager(m.commission_id)
    );
$$;

create or replace function private.can_access_task(
  _task_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.tasks t
      where t.id = _task_id
        and (
          t.assigned_to = (select auth.uid())
          or (
            t.commission_id is not null
            and private.is_commission_member(t.commission_id)
          )
        )
    );
$$;

create or replace function private.can_manage_task(
  _task_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.tasks t
      where t.id = _task_id
        and t.commission_id is not null
        and private.is_commission_manager(t.commission_id)
    );
$$;

create or replace function private.can_access_document(
  _document_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.documents d
      where d.id = _document_id
        and (
          d.access_type = 'all_members'
          or (
            d.access_type = 'commission'
            and private.is_commission_member(d.commission_id)
          )
        )
    );
$$;

create or replace function private.can_manage_document(
  _document_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.documents d
      where d.id = _document_id
        and d.access_type = 'commission'
        and private.is_commission_manager(d.commission_id)
    );
$$;

create or replace function private.can_access_announcement(
  _announcement_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.announcements a
      where a.id = _announcement_id
        and (
          a.audience = 'all_members'
          or (
            a.audience = 'commission'
            and private.is_commission_member(a.commission_id)
          )
        )
    );
$$;

create or replace function private.can_manage_announcement(
  _announcement_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    private.is_bureau()
    or exists (
      select 1
      from public.announcements a
      where a.id = _announcement_id
        and a.audience = 'commission'
        and private.is_commission_manager(a.commission_id)
    );
$$;

-- ============================================================
-- 13. NEW AUTH USER -> PROFILE
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- 14. TASK UPDATE PROTECTION
-- Members may change task status only.
-- Managers/Bureau may modify task details.
-- ============================================================

create or replace function private.protect_task_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_task(old.id) then

    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.assigned_to is distinct from old.assigned_to
      or new.commission_id is distinct from old.commission_id
      or new.priority is distinct from old.priority
      or new.due_at is distinct from old.due_at
    then
      raise exception 'Only commission managers or bureau members can modify task details';
    end if;

  end if;

  return new;
end;
$$;

create trigger tasks_protect_updates
before update on public.tasks
for each row
execute function private.protect_task_updates();

-- ============================================================
-- 15. ENABLE RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.commissions enable row level security;
alter table public.commission_members enable row level security;
alter table public.meetings enable row level security;
alter table public.attendance enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_log enable row level security;

-- ============================================================
-- 16. PRIVILEGES
-- ============================================================

revoke all on public.profiles from anon;
revoke all on public.commissions from anon;
revoke all on public.commission_members from anon;
revoke all on public.meetings from anon;
revoke all on public.attendance from anon;
revoke all on public.tasks from anon;
revoke all on public.documents from anon;
revoke all on public.announcements from anon;
revoke all on public.activity_log from anon;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, phone)
on public.profiles
to authenticated;

grant select, insert, update on public.commissions to authenticated;

grant select, insert, update, delete
on public.commission_members
to authenticated;

grant select, insert, update, delete
on public.meetings
to authenticated;

grant select, insert, update, delete
on public.attendance
to authenticated;

grant select, insert, update, delete
on public.tasks
to authenticated;

grant select, insert, update, delete
on public.documents
to authenticated;

grant select, insert, update, delete
on public.announcements
to authenticated;

grant select
on public.activity_log
to authenticated;

-- ============================================================
-- 17. RLS POLICIES — PROFILES
-- ============================================================

create policy "profiles_select"
on public.profiles
for select
to authenticated
using (
  private.can_view_profile(id)
);

create policy "profiles_update"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or private.is_bureau()
)
with check (
  id = (select auth.uid())
  or private.is_bureau()
);

-- ============================================================
-- 18. RLS POLICIES — COMMISSIONS
-- ============================================================

create policy "commissions_select"
on public.commissions
for select
to authenticated
using (
  private.is_bureau()
  or private.is_commission_member(id)
);

create policy "commissions_insert"
on public.commissions
for insert
to authenticated
with check (
  private.is_bureau()
);

create policy "commissions_update"
on public.commissions
for update
to authenticated
using (
  private.is_bureau()
)
with check (
  private.is_bureau()
);

-- ============================================================
-- 19. RLS POLICIES — COMMISSION MEMBERS
-- ============================================================

create policy "commission_members_select"
on public.commission_members
for select
to authenticated
using (
  private.is_bureau()
  or private.is_commission_member(commission_id)
);

create policy "commission_members_insert"
on public.commission_members
for insert
to authenticated
with check (
  private.is_commission_manager(commission_id)
);

create policy "commission_members_update"
on public.commission_members
for update
to authenticated
using (
  private.is_commission_manager(commission_id)
)
with check (
  private.is_commission_manager(commission_id)
);

create policy "commission_members_delete"
on public.commission_members
for delete
to authenticated
using (
  private.is_commission_manager(commission_id)
);

-- ============================================================
-- 20. RLS POLICIES — MEETINGS
-- ============================================================

create policy "meetings_select"
on public.meetings
for select
to authenticated
using (
  private.can_access_meeting(id)
);

create policy "meetings_insert"
on public.meetings
for insert
to authenticated
with check (
  private.is_bureau()
  or (
    scope = 'commission'
    and private.is_commission_manager(commission_id)
  )
);

create policy "meetings_update"
on public.meetings
for update
to authenticated
using (
  private.is_bureau()
  or (
    scope = 'commission'
    and private.is_commission_manager(commission_id)
  )
)
with check (
  private.is_bureau()
  or (
    scope = 'commission'
    and private.is_commission_manager(commission_id)
  )
);

create policy "meetings_delete"
on public.meetings
for delete
to authenticated
using (
  private.can_manage_meeting(id)
);

-- ============================================================
-- 21. RLS POLICIES — ATTENDANCE
-- ============================================================

create policy "attendance_select"
on public.attendance
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.can_access_meeting(meeting_id)
);

create policy "attendance_insert"
on public.attendance
for insert
to authenticated
with check (
  private.is_bureau()
  or private.can_manage_meeting(meeting_id)
);

create policy "attendance_update"
on public.attendance
for update
to authenticated
using (
  private.is_bureau()
  or private.can_manage_meeting(meeting_id)
)
with check (
  private.is_bureau()
  or private.can_manage_meeting(meeting_id)
);

create policy "attendance_delete"
on public.attendance
for delete
to authenticated
using (
  private.is_bureau()
  or private.can_manage_meeting(meeting_id)
);

-- ============================================================
-- 22. RLS POLICIES — TASKS
-- ============================================================

create policy "tasks_select"
on public.tasks
for select
to authenticated
using (
  private.can_access_task(id)
);

create policy "tasks_insert"
on public.tasks
for insert
to authenticated
with check (
  private.is_bureau()
  or (
    commission_id is not null
    and private.is_commission_manager(commission_id)
  )
);

create policy "tasks_update"
on public.tasks
for update
to authenticated
using (
  private.is_bureau()
  or assigned_to = (select auth.uid())
  or private.can_manage_task(id)
)
with check (
  private.is_bureau()
  or assigned_to = (select auth.uid())
  or private.can_manage_task(id)
);

create policy "tasks_delete"
on public.tasks
for delete
to authenticated
using (
  private.can_manage_task(id)
);

-- ============================================================
-- 23. RLS POLICIES — DOCUMENTS
-- ============================================================

create policy "documents_select"
on public.documents
for select
to authenticated
using (
  private.can_access_document(id)
);

create policy "documents_insert"
on public.documents
for insert
to authenticated
with check (
  private.is_bureau()
  or (
    access_type = 'commission'
    and private.is_commission_manager(commission_id)
  )
);

create policy "documents_update"
on public.documents
for update
to authenticated
using (
  private.is_bureau()
  or private.can_manage_document(id)
)
with check (
  private.is_bureau()
  or private.can_manage_document(id)
);

create policy "documents_delete"
on public.documents
for delete
to authenticated
using (
  private.is_bureau()
  or private.can_manage_document(id)
);

-- ============================================================
-- 24. RLS POLICIES — ANNOUNCEMENTS
-- ============================================================

create policy "announcements_select"
on public.announcements
for select
to authenticated
using (
  private.can_access_announcement(id)
);

create policy "announcements_insert"
on public.announcements
for insert
to authenticated
with check (
  private.is_bureau()
  or (
    audience = 'commission'
    and private.is_commission_manager(commission_id)
  )
);

create policy "announcements_update"
on public.announcements
for update
to authenticated
using (
  private.is_bureau()
  or private.can_manage_announcement(id)
)
with check (
  private.is_bureau()
  or private.can_manage_announcement(id)
);

create policy "announcements_delete"
on public.announcements
for delete
to authenticated
using (
  private.is_bureau()
  or private.can_manage_announcement(id)
);

-- ============================================================
-- 25. RLS POLICIES — ACTIVITY LOG
-- ============================================================

create policy "activity_log_select"
on public.activity_log
for select
to authenticated
using (
  actor_user_id = (select auth.uid())
  or private.is_bureau()
);

-- No direct INSERT / UPDATE / DELETE policy.
-- Activity entries will later be created by trusted backend logic.

-- ============================================================
-- 26. FUNCTION PERMISSIONS
-- ============================================================

revoke all on function private.is_bureau() from public;
revoke all on function private.is_commission_member(uuid) from public;
revoke all on function private.is_commission_manager(uuid) from public;
revoke all on function private.can_view_profile(uuid) from public;
revoke all on function private.can_access_meeting(uuid) from public;
revoke all on function private.can_manage_meeting(uuid) from public;
revoke all on function private.can_access_task(uuid) from public;
revoke all on function private.can_manage_task(uuid) from public;
revoke all on function private.can_access_document(uuid) from public;
revoke all on function private.can_manage_document(uuid) from public;
revoke all on function private.can_access_announcement(uuid) from public;
revoke all on function private.can_manage_announcement(uuid) from public;
revoke all on function private.protect_task_updates() from public;

grant usage on schema private to authenticated;

grant execute on function private.is_bureau() to authenticated;
grant execute on function private.is_commission_member(uuid) to authenticated;
grant execute on function private.is_commission_manager(uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.can_access_meeting(uuid) to authenticated;
grant execute on function private.can_manage_meeting(uuid) to authenticated;
grant execute on function private.can_access_task(uuid) to authenticated;
grant execute on function private.can_manage_task(uuid) to authenticated;
grant execute on function private.can_access_document(uuid) to authenticated;
grant execute on function private.can_manage_document(uuid) to authenticated;
grant execute on function private.can_access_announcement(uuid) to authenticated;
grant execute on function private.can_manage_announcement(uuid) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;

commit;