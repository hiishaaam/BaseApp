-- Create the subjects table for timetable management
create table if not exists subjects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text not null,
  department text not null,
  year text not null,
  semester text not null,
  "dayOfWeek" integer not null check ("dayOfWeek" between 0 and 6),
  "startTime" text not null,
  "endTime" text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: Ensure quoting on camelCase columns if Supabase enforces it,
-- Or in Supabase Dashboard UI just create columns exactly as named above.

-- Enable Row Level Security (RLS) on subjects
alter table subjects enable row level security;

-- Create policies for subjects
create policy "Subjects are viewable by everyone." on subjects for
select using (true);

create policy "Subjects can be inserted by authenticated users." on subjects for
insert
with
    check (
        auth.role () = 'authenticated'
    );

create policy "Subjects can be updated by authenticated users." on subjects for
update using (
    auth.role () = 'authenticated'
);

create policy "Subjects can be deleted by authenticated users." on subjects for delete using (
    auth.role () = 'authenticated'
);

-- Create the class_configurations table to store working days and class strength
create table if not exists class_configurations (
  id uuid default gen_random_uuid() primary key,
  department text not null,
  year text not null,
  semester text not null,
  total_students integer default 0,
  working_days integer default 90,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (department, year, semester)
);

-- Enable Row Level Security (RLS) on class_configurations
alter table class_configurations enable row level security;

-- Create policies for class_configurations
create policy "Class configurations are viewable by everyone." on class_configurations for
select using (true);

create policy "Class configurations can be inserted by authenticated users." on class_configurations for
insert
with
    check (
        auth.role () = 'authenticated'
    );

create policy "Class configurations can be updated by authenticated users." on class_configurations for
update using (
    auth.role () = 'authenticated'
);