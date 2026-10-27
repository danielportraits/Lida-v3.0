-- Ejecuta este archivo en Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  has_seen_tour boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Map the verified auth user to the chosen username at signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_lida on auth.users;
create trigger on_auth_user_created_lida after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'direct' check (kind in ('direct','group','welcome')),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "Conversation owners can read their conversations" on public.conversations for select to authenticated using (owner_id = auth.uid());
create policy "Users can create own conversations" on public.conversations for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can update their conversations" on public.conversations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners can delete their conversations" on public.conversations for delete to authenticated using (owner_id = auth.uid());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  is_system boolean not null default false
);
alter table public.messages enable row level security;
create policy "Message owner can read messages" on public.messages for select to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_id and c.owner_id = auth.uid()));
create policy "Message owner can send to own conversation" on public.messages for insert to authenticated with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.owner_id = auth.uid()) and (sender_id = auth.uid() or is_system));

-- Creates the user's single Lida welcome conversation only once, after first registration.
create or replace function public.ensure_lida_welcome()
returns uuid language plpgsql security invoker set search_path = public as $$
declare cid uuid;
begin
  select id into cid from public.conversations where owner_id = auth.uid() and kind = 'welcome' limit 1;
  if cid is null then
    insert into public.conversations(owner_id, kind, title) values (auth.uid(), 'welcome', 'Lida') returning id into cid;
    insert into public.messages(conversation_id, sender_id, body, is_system)
    values (cid, null, '¡Bienvenido a LIDA! 💚 Este es tu espacio para conectar, compartir y descubrir. Explora la aplicación a tu ritmo; te acompañaremos en tus primeros pasos.', true);
  end if;
  return cid;
end;
$$;
grant execute on function public.ensure_lida_welcome() to authenticated;
