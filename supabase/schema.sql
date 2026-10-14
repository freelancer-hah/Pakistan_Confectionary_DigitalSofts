-- ==============================================================================
-- 0. FIX PERMISSION DENIED FOR SCHEMA PUBLIC (RUN THIS IN SUPABASE SQL EDITOR)
-- ==============================================================================
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;


-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  product_type text not null check (product_type in ('wholesale', 'retail')), -- 'wholesale' (Carton) ya 'retail' (Piece)
  unit text not null default 'Carton', -- 'Carton' ya 'Piece' / 'Box'
  price numeric(10,2) not null, -- Price in PKR / Rupees
  stock int not null default 10, -- Kitna maal bacha ha
  image_url text, -- Supabase bucket (product_images) URL
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. ORDERS TABLE
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  customer_name text not null,
  phone text not null,
  whatsapp text,
  address text not null,
  city text not null default 'Karachi',
  order_type text not null check (order_type in ('wholesale', 'retail')), -- 'wholesale' (Min 15000), 'retail' (Min 2500)
  total_amount numeric(10,2) not null,
  payment_method text default 'Cash on Delivery (COD)',
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Delivered', 'Cancelled')),
  created_at timestamptz default now()
);

-- 3. ORDER ITEMS TABLE
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit text not null,
  quantity int not null,
  price numeric(10,2) not null,
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

-- RLS POLICIES (Safe drop & create taake error na aaye)
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Products all access" on public.products;
drop policy if exists "Products public select" on public.products;
create policy "Products all access" on public.products for all using (true) with check (true);

drop policy if exists "Orders all access" on public.orders;
drop policy if exists "Orders public insert" on public.orders;
create policy "Orders all access" on public.orders for all using (true) with check (true);

drop policy if exists "Order items all access" on public.order_items;
drop policy if exists "Order items public insert" on public.order_items;
create policy "Order items all access" on public.order_items for all using (true) with check (true);

-- ==============================================================================
-- 4. SUPABASE STORAGE BUCKET (product_images) POLICIES
-- ==============================================================================
insert into storage.buckets (id, name, public) 
values ('product_images', 'product_images', true)
on conflict (id) do update set public = true;

drop policy if exists "product_images public read" on storage.objects;
create policy "product_images public read"
on storage.objects for select
using (bucket_id = 'product_images');

drop policy if exists "product_images public insert" on storage.objects;
create policy "product_images public insert"
on storage.objects for insert
with check (bucket_id = 'product_images');

drop policy if exists "product_images public update" on storage.objects;
create policy "product_images public update"
on storage.objects for update
using (bucket_id = 'product_images');

-- ==============================================================================
-- 5. CUSTOMERS TABLE (Registered Wholesale Clients)
-- ==============================================================================
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text unique not null,
  pin text not null default '1234',
  email text,
  address text not null,
  city text not null default 'Karachi',
  is_verified boolean default true,
  verification_method text default 'pin_auth',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- In case table already exists:
alter table public.customers add column if not exists pin text default '1234';

alter table public.customers enable row level security;
drop policy if exists "Customers all access" on public.customers;
create policy "Customers all access" on public.customers for all using (true) with check (true);
