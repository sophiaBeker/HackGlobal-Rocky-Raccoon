-- Run in Supabase SQL Editor. Safe to run more than once.
-- Stores only learning progress and Rocky conversations;
-- authentication users are managed by Supabase Auth.

-- ---------------------------------------------------------------
-- Learner progress
-- ---------------------------------------------------------------
create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed text[] not null default '{}',
  points integer not null default 0 check (points >= 0),
  quizzes integer not null default 0 check (quizzes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.learner_progress enable row level security;

drop policy if exists "Learners can read their own progress" on public.learner_progress;
create policy "Learners can read their own progress"
  on public.learner_progress for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "Learners can create their own progress" on public.learner_progress;
create policy "Learners can create their own progress"
  on public.learner_progress for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "Learners can update their own progress" on public.learner_progress;
create policy "Learners can update their own progress"
  on public.learner_progress for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Additions for module theme rewards and flashcard study progress.
alter table public.learner_progress
  add column if not exists unlocked_themes text[] not null default '{}',
  add column if not exists active_theme text not null default 'default',
  add column if not exists flashcards_known text[] not null default '{}',
  add column if not exists flashcards_review text[] not null default '{}';

-- Avatar shop ownership and equipped cosmetic items.
alter table public.learner_progress
  add column if not exists owned_avatars text[] not null default array['classic'],
  add column if not exists active_avatar text not null default 'classic',
  add column if not exists owned_accessories text[] not null default array['none'],
  add column if not exists active_accessory text not null default 'none';

-- ---------------------------------------------------------------
-- Rocky conversations
-- ---------------------------------------------------------------

-- Stores each conversation with Rocky.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Conversation',
  created_at timestamptz not null default now()
);

-- Stores individual messages in each conversation.
create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);

-- Improve conversation loading performance.
create index if not exists conversations_user_id_idx
  on public.conversations(user_id);

create index if not exists conversation_messages_conversation_id_idx
  on public.conversation_messages(conversation_id);

-- Enable Row Level Security.
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

-- Users can only read their own conversations.
drop policy if exists "Users can read own conversations" on public.conversations;
create policy "Users can read own conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can only create their own conversations.
drop policy if exists "Users can create own conversations" on public.conversations;
create policy "Users can create own conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can rename/update only their own conversations.
drop policy if exists "Users can update own conversations" on public.conversations;
create policy "Users can update own conversations"
  on public.conversations for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own conversations.
drop policy if exists "Users can delete own conversations" on public.conversations;
create policy "Users can delete own conversations"
  on public.conversations for delete
  to authenticated
  using (auth.uid() = user_id);

-- Users can read messages belonging to their conversations.
drop policy if exists "Users can read own messages" on public.conversation_messages;
create policy "Users can read own messages"
  on public.conversation_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- Users can insert messages into their own conversations.
drop policy if exists "Users can insert own messages" on public.conversation_messages;
create policy "Users can insert own messages"
  on public.conversation_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
        and conversations.user_id = auth.uid()
    )
  );