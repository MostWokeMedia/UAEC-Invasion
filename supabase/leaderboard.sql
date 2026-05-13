create table if not exists public.leaderboard_scores (
  id bigint generated always as identity primary key,
  initials char(3) not null check (initials ~ '^[A-Z0-9]{3}$'),
  score integer not null check (score >= 0),
  wave integer not null check (wave >= 1),
  build_label text not null,
  created_at timestamptz not null default now()
);

alter table public.leaderboard_scores enable row level security;

drop policy if exists "leaderboard scores are readable" on public.leaderboard_scores;
create policy "leaderboard scores are readable"
on public.leaderboard_scores
for select
to anon
using (true);

drop policy if exists "players can submit leaderboard scores" on public.leaderboard_scores;
create policy "players can submit leaderboard scores"
on public.leaderboard_scores
for insert
to anon
with check (
  initials ~ '^[A-Z0-9]{3}$'
  and score >= 0
  and wave >= 1
  and char_length(build_label) <= 80
);

create index if not exists leaderboard_scores_rank_idx
on public.leaderboard_scores (score desc, created_at asc, id asc);

create or replace function public.prune_leaderboard_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.leaderboard_scores
  where id in (
    select id
    from public.leaderboard_scores
    order by score desc, created_at asc, id asc
    offset 100
  );

  return null;
end;
$$;

drop trigger if exists leaderboard_scores_prune_after_insert
on public.leaderboard_scores;

create trigger leaderboard_scores_prune_after_insert
after insert on public.leaderboard_scores
for each statement
execute function public.prune_leaderboard_scores();
