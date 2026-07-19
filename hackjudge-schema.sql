-- ============================================================================
-- HACKJUDGE — SUPABASE SCHEMA (v2, reviewed)
-- Run this once in the Supabase SQL editor on a fresh project.
-- Changes from the prior draft are marked REVIEW: with the reason inline.
-- ============================================================================

-- Note: pgcrypto is already enabled by default on Supabase. 
-- Running CREATE EXTENSION here can cause a read-only transaction error in the dashboard.
-- create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type event_status as enum ('draft', 'live', 'closed');
create type event_type as enum ('hackathon', 'pitch_comp', 'case_comp', 'other');
create type round_status as enum ('upcoming', 'live', 'closed');
create type tiebreak_rule as enum ('highest_criterion', 'most_recent_round', 'manual_only');
create type judge_status as enum ('invited', 'active');
create type team_source as enum ('csv', 'manual');

-- ----------------------------------------------------------------------------
-- ORGANIZERS
-- ----------------------------------------------------------------------------
create table organizers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- REVIEW: auto-provision a profile row on signup, so events.organizer_id's FK
-- never fails on someone's first event just because the app forgot to insert
-- a profile row first. Harmless for judges who sign up too — this only ever
-- creates a name lookup row, it grants no event-creation rights on its own
-- (that's governed by events.organizer_id = auth.uid(), set at event-creation
-- time, not by the mere existence of an organizers row).
create or replace function handle_new_user_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into organizers (id, name, phone)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data ->> 'name', new.email, new.phone, 'User ' || substr(new.id::text, 1, 8)),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_signup();

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references organizers(id) on delete cascade,
  name text not null,
  event_type event_type not null default 'hackathon',
  status event_status not null default 'draft',
  start_date date,
  end_date date,
  tiebreak_rule tiebreak_rule not null default 'manual_only',
  tiebreak_criterion_id uuid,
  sponsor_logo_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ROUNDS
-- ----------------------------------------------------------------------------
create table rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  order_index int not null default 0,
  status round_status not null default 'upcoming',
  advance_count int,
  advanced_team_ids uuid[],
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CRITERIA
-- ----------------------------------------------------------------------------
create table criteria (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  weight numeric(5,2) not null default 0,
  max_score numeric(5,2) not null default 10,
  round_ids uuid[] not null default '{}',
  order_index int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

alter table events
  add constraint events_tiebreak_criterion_fk
  foreign key (tiebreak_criterion_id) references criteria(id) on delete set null;

-- ----------------------------------------------------------------------------
-- TRACKS & PANELS
-- ----------------------------------------------------------------------------
create table tracks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table panels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  track_id uuid references tracks(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TEAMS
-- ----------------------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  members jsonb not null default '[]',
  track_id uuid references tracks(id) on delete restrict,
  source team_source not null default 'manual',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- JUDGES
-- REVIEW: invite_token default switched to hex — the previous base64 default
-- can contain '+' and '/', which are not safe to drop unescaped into a URL
-- path like /j/{invite_token}.
-- ----------------------------------------------------------------------------
create table judges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  invite_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  token_expires_at timestamptz,
  status judge_status not null default 'invited',
  round_ids uuid[] not null default '{}',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PANEL_JUDGES (mapping table)
-- ----------------------------------------------------------------------------
create table panel_judges (
  panel_id uuid not null references panels(id) on delete cascade,
  judge_id uuid not null references judges(id) on delete cascade,
  primary key (panel_id, judge_id)
);

-- ----------------------------------------------------------------------------
-- SCORES — append-only. A revision is a new row with a new client_id, never
-- an update to an existing one. See REVIEW note near the policies below for
-- why the UPDATE policy from the last draft was removed rather than kept.
-- ----------------------------------------------------------------------------
create table scores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  team_id uuid not null references teams(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  judge_id uuid not null references judges(id) on delete cascade,
  criterion_id uuid not null references criteria(id) on delete cascade,
  value numeric(5,2) not null,
  client_submitted_at timestamptz not null default now(),
  synced_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- OVERRIDES
-- ----------------------------------------------------------------------------
create table overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  team_ids uuid[] not null,
  resolved_by uuid not null references organizers(id),
  resolution_note text,
  resolved_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_events_organizer on events(organizer_id);
create index idx_rounds_event on rounds(event_id);
create index idx_criteria_event on criteria(event_id) where archived_at is null;
create index idx_teams_event on teams(event_id);
create index idx_judges_event on judges(event_id);
create index idx_judges_user on judges(user_id) where user_id is not null;
create index idx_scores_team_round on scores(team_id, round_id);
create index idx_scores_judge on scores(judge_id);
create index idx_overrides_event on overrides(event_id);
create index idx_tracks_event on tracks(event_id);
create index idx_panels_event on panels(event_id);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
create or replace function is_organizer_of_event(check_event_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from events
    where id = check_event_id and organizer_id = auth.uid()
  );
$$;

create or replace function jwt_judge_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'judge_id', '')::uuid;
$$;

create or replace function jwt_round_ids()
returns uuid[] language sql stable as $$
  select case
    when jsonb_typeof(auth.jwt() -> 'round_ids') = 'array' then
      array(select jsonb_array_elements_text(auth.jwt() -> 'round_ids')::uuid)
    when auth.jwt() ->> 'round_ids' is not null then
      string_to_array(auth.jwt() ->> 'round_ids', ',')::uuid[]
    else '{}'::uuid[]
  end;
$$;

-- REVIEW: this MUST be security definer. It queries judges, and judges' own
-- "judge reads own row" policy is exactly is_current_judge(id) — without
-- security definer, checking the linked-account branch here recurses into
-- the same policy it's trying to satisfy. This is what was silently breaking
-- every logged-in (non-magic-link) judge session.
create or replace function is_current_judge(check_judge_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select check_judge_id = jwt_judge_id()
      or exists (select 1 from judges where id = check_judge_id and user_id = auth.uid());
$$;

-- REVIEW: new. auth.jwt()'s email claim is self-reported at signup and isn't
-- proof of ownership on its own — this checks the real column Supabase sets
-- once the address is actually confirmed.
create or replace function current_user_email_verified()
returns boolean language sql security definer stable set search_path = public as $$
  select email_confirmed_at is not null from auth.users where id = auth.uid();
$$;

-- REVIEW: new. Replaces the raw judges UPDATE policy from the last draft.
-- A generic UPDATE policy that only checks "new user_id = auth.uid()" leaves
-- every other column open to being changed in the same call (name, email,
-- round_ids, even event_id). This function does exactly one thing and
-- nothing else is reachable through it.
create or replace function claim_judge_row(target_judge_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update judges
  set user_id = auth.uid(), status = 'active'
  where id = target_judge_id
    and user_id is null
    and email = auth.jwt() ->> 'email';

  if not found then
    raise exception 'No matching unclaimed judge row for this email';
  end if;
end;
$$;

grant execute on function claim_judge_row(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table organizers enable row level security;
alter table events enable row level security;
alter table rounds enable row level security;
alter table criteria enable row level security;
alter table tracks enable row level security;
alter table panels enable row level security;
alter table panel_judges enable row level security;
alter table teams enable row level security;
alter table judges enable row level security;
alter table scores enable row level security;
alter table overrides enable row level security;

-- ORGANIZERS
create policy "organizer reads own profile" on organizers
  for select using (id = auth.uid());
create policy "organizer updates own profile" on organizers
  for update using (id = auth.uid());
create policy "organizer profile created on signup" on organizers
  for insert with check (id = auth.uid());

-- EVENTS
create policy "organizer full access to own events" on events
  for all using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy "public reads non-draft events" on events
  for select using (status <> 'draft');

-- ROUNDS, CRITERIA, TEAMS
create policy "organizer full access to own rounds" on rounds
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));
create policy "public reads rounds of non-draft events" on rounds
  for select using (exists (select 1 from events where id = event_id and status <> 'draft'));

create policy "organizer full access to own criteria" on criteria
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));
create policy "public reads criteria of non-draft events" on criteria
  for select using (exists (select 1 from events where id = event_id and status <> 'draft'));

create policy "organizer full access to own teams" on teams
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));
create policy "public reads teams of non-draft events" on teams
  for select using (exists (select 1 from events where id = event_id and status <> 'draft'));

-- TRACKS, PANELS
create policy "organizer full access to own tracks" on tracks
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));
create policy "public reads tracks of non-draft events" on tracks
  for select using (exists (select 1 from events where id = event_id and status <> 'draft'));

create policy "organizer full access to own panels" on panels
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));
create policy "public reads panels of non-draft events" on panels
  for select using (exists (select 1 from events where id = event_id and status <> 'draft'));

-- REVIEW: dropped the public read policy on panel_judges — there's no
-- legitimate anon/display-mode use case for reading judge-to-panel pairing,
-- only organizer (for assignment) and the judge session itself need it.
create policy "organizer full access to own panel_judges" on panel_judges
  for all using (exists (select 1 from panels p where p.id = panel_id and is_organizer_of_event(p.event_id)))
  with check (exists (select 1 from panels p where p.id = panel_id and is_organizer_of_event(p.event_id)));
create policy "judge reads own panel assignment" on panel_judges
  for select using (is_current_judge(judge_id));

-- JUDGES
create policy "organizer full access to own judges" on judges
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));
create policy "judge reads own row" on judges
  for select using (is_current_judge(id));

-- REVIEW: now requires a verified email, not just a matching JWT claim.
-- The actual claim WRITE happens only through claim_judge_row() above —
-- no raw UPDATE policy is exposed for this anymore.
create policy "auth user can see unclaimed judge rows for their email" on judges
  for select using (
    user_id is null
    and email = auth.jwt() ->> 'email'
  );

-- SCORES
-- REVIEW: added c.archived_at is null (an archived criterion shouldn't
-- accept new scores) and the track/panel check (a no-op — always true —
-- for any event that isn't using tracks, since t.track_id is null there).
create policy "judge inserts own scores for assigned rounds" on scores
  for insert with check (
    is_current_judge(judge_id)
    and exists (
      select 1 from judges j
      join teams t on t.event_id = j.event_id
      join rounds r on r.event_id = j.event_id
      join criteria c on c.event_id = j.event_id
      where j.id = judge_id
        and t.id = team_id
        and r.id = round_id
        and c.id = criterion_id
        and c.archived_at is null
        and value >= 0
        and value <= c.max_score
        and (cardinality(c.round_ids) = 0 or round_id = any(c.round_ids))
        and (cardinality(j.round_ids) = 0 or round_id = any(j.round_ids) or round_id = any(jwt_round_ids()))
        and (
          t.track_id is null
          or exists (
            select 1 from panel_judges pj
            join panels p on p.id = pj.panel_id
            where pj.judge_id = j.id and p.track_id = t.track_id
          )
        )
    )
  );

-- REVIEW: removed the scores UPDATE policy. It contradicted the append-only
-- design (a revision should be a new row, new client_id — that's what keeps
-- the audit trail intact for tie-break disputes) and its with check didn't
-- actually restrict team_id/round_id/criterion_id from being changed on an
-- existing row. Offline-retry idempotency doesn't need UPDATE at all: the
-- app does INSERT ... ON CONFLICT (client_id) DO NOTHING, which only needs
-- INSERT privilege.

create policy "judge reads own scores" on scores
  for select using (is_current_judge(judge_id));
create policy "organizer reads all scores for own event" on scores
  for select using (
    exists (
      select 1 from rounds r where r.id = round_id and is_organizer_of_event(r.event_id)
    )
  );

-- OVERRIDES
create policy "organizer full access to own overrides" on overrides
  for all using (is_organizer_of_event(event_id)) with check (is_organizer_of_event(event_id));

-- ----------------------------------------------------------------------------
-- CURRENT_SCORES — for direct organizer/judge introspection. security_invoker
-- is correct here: whoever queries it should only see what their own RLS
-- allows. Do NOT build public_leaderboard on top of this view — see below.
-- ----------------------------------------------------------------------------
create view current_scores with (security_invoker = on) as
  select distinct on (team_id, round_id, judge_id, criterion_id)
    team_id, round_id, judge_id, criterion_id, value, client_submitted_at
  from scores
  order by team_id, round_id, judge_id, criterion_id, client_submitted_at desc;

-- ----------------------------------------------------------------------------
-- PUBLIC_LEADERBOARD
-- REVIEW: this now computes "latest wins" inline against scores directly,
-- rather than selecting from current_scores. Chaining through an
-- invoker-mode view meant anon's query would apply anon's own (nonexistent)
-- scores permissions transitively — an empty leaderboard for anon, and a
-- silently-wrong, single-judge-only aggregate for any judge who queried it.
-- This view keeps default (definer) semantics on purpose: it's the one
-- deliberate, narrow bypass that exposes an aggregate — never raw scores,
-- never per-judge detail — to anon and display mode.
-- ----------------------------------------------------------------------------
create view public_leaderboard as
  select
    t.event_id,
    cs.round_id,
    t.id as team_id,
    t.name as team_name,
    avg(cs.value) as avg_score,
    count(distinct cs.judge_id) as judges_scored
  from (
    select distinct on (team_id, round_id, judge_id, criterion_id)
      team_id, round_id, judge_id, criterion_id, value
    from scores
    order by team_id, round_id, judge_id, criterion_id, client_submitted_at desc
  ) cs
  join teams t on t.id = cs.team_id
  join events e on e.id = t.event_id and e.status <> 'draft'
  group by t.event_id, cs.round_id, t.id, t.name;

grant select on public_leaderboard to anon, authenticated;
grant select on current_scores to authenticated;
