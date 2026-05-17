# Supabase Database Setup

Follow these steps to set up your database in the Supabase SQL Editor:

## 1. Profiles Table & Roles
This script creates the `profiles` table to store user information and roles.

```sql
-- 1. Create Profiles Table (if not exists)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'pending' check (role in ('admin', 'member', 'pending')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies to avoid "already exists" error
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Admins can update any profile." on public.profiles;

-- Create policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile." on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'pending');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call function on signup (Drop first if exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 2. Initial Admin
If you need to make yourself an admin, run this after signing up:
```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

## 3. Notifications Table
This script creates the `notifications` table and its RLS policies.

```sql
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications." on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications." on public.notifications
  for update using (auth.uid() = user_id);
```
