-- =====================================================================
-- AgroStyle: schema completo en Supabase
-- Pega TODO este archivo en: Supabase -> SQL Editor -> New query -> Run
-- Si necesitas resetear, descomenta el bloque DROP al final.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ───────────────────────────── PROFILES ─────────────────────────────
-- Extiende auth.users con datos de aplicacion (rol, status, etc.)
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null default '',
  email             text not null,
  role              text not null check (role in ('producer','buyer','transporter','admin')),
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason  text,
  approved_at       timestamptz,
  approved_by       uuid,
  rejected_at       timestamptz,
  rejected_by       uuid,
  created_at        timestamptz not null default now()
);

create index if not exists profiles_role_idx   on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);

-- ─────────────────────────────── FARMS ──────────────────────────────
create table if not exists public.farms (
  id           uuid primary key default gen_random_uuid(),
  producer_id  uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  phone        text,
  zone         text,
  lat          double precision,
  lng          double precision,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists farms_producer_idx on public.farms(producer_id);

-- ───────────────────────────── DOCUMENTS ────────────────────────────
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  producer_id       uuid not null references public.profiles(id) on delete cascade,
  producer_name     text,
  title             text not null,
  description       text,
  file_name         text,
  file_url          text not null,
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason  text,
  reviewed_at       timestamptz,
  reviewed_by       uuid,
  uploaded_at       timestamptz not null default now()
);

create index if not exists documents_producer_idx on public.documents(producer_id);
create index if not exists documents_status_idx   on public.documents(status);

-- ───────────────────────────── PRODUCTS ─────────────────────────────
create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  producer_id        uuid not null references public.profiles(id) on delete cascade,
  producer_name      text,
  farm_id            uuid references public.farms(id) on delete set null,
  farm_name          text,
  farm_zone          text,
  lat                double precision,
  lng                double precision,
  name               text not null,
  category           text not null,
  description        text,
  price              numeric(10,2) not null check (price > 0),
  suggested_price    numeric(10,2),
  quantity           integer not null check (quantity > 0),
  unit               text not null,
  image_url          text,
  availability_type  text not null check (availability_type in ('immediate','preorder')),
  available_date     date not null,
  status             text not null default 'active' check (status in ('active','sold_out','archived')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists products_producer_idx on public.products(producer_id);
create index if not exists products_status_idx   on public.products(status);
create index if not exists products_category_idx on public.products(category);

-- ───────────────────── TRIGGER: crear profile al signup ─────────────
-- Lee full_name + role de raw_user_meta_data; buyers se aprueban auto.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_name   text;
  v_status text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');
  v_name := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_status := case when v_role = 'buyer' then 'approved' else 'pending' end;

  insert into public.profiles (id, full_name, email, role, status)
  values (new.id, v_name, new.email, v_role, v_status)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────── TRIGGER: updated_at ──────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists farms_updated_at on public.farms;
create trigger farms_updated_at before update on public.farms
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ═════════════════════════════ RLS ═════════════════════════════════

alter table public.profiles  enable row level security;
alter table public.farms     enable row level security;
alter table public.documents enable row level security;
alter table public.products  enable row level security;

-- helper: is_admin()
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ── PROFILES policies ──
drop policy if exists profiles_self_read  on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;

create policy profiles_self_read  on public.profiles
  for select using (auth.uid() = id);

create policy profiles_admin_read on public.profiles
  for select using (public.is_admin());

create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_admin_update on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- ── FARMS policies ──
drop policy if exists farms_owner_all      on public.farms;
drop policy if exists farms_public_read    on public.farms;

create policy farms_public_read on public.farms
  for select using (true);  -- todos pueden leer (para que buyers vean origen)

create policy farms_owner_all on public.farms
  for all using (producer_id = auth.uid())
  with check (producer_id = auth.uid());

-- ── DOCUMENTS policies ──
drop policy if exists documents_owner_all   on public.documents;
drop policy if exists documents_admin_read  on public.documents;
drop policy if exists documents_admin_update on public.documents;

create policy documents_owner_all on public.documents
  for all using (producer_id = auth.uid())
  with check (producer_id = auth.uid());

create policy documents_admin_read on public.documents
  for select using (public.is_admin());

create policy documents_admin_update on public.documents
  for update using (public.is_admin())
  with check (public.is_admin());

-- ── PRODUCTS policies ──
drop policy if exists products_owner_all       on public.products;
drop policy if exists products_public_read_act on public.products;

create policy products_owner_all on public.products
  for all using (producer_id = auth.uid())
  with check (producer_id = auth.uid());

-- Cualquier autenticado puede ver productos activos
create policy products_public_read_act on public.products
  for select using (status = 'active');

-- ═════════════════════════ STORAGE POLICIES ════════════════════════
-- IMPORTANTE: crea el bucket 'agrostyle' en Storage UI primero (Public)
-- Luego ejecuta esto:

drop policy if exists "agrostyle_public_read"   on storage.objects;
drop policy if exists "agrostyle_auth_insert"   on storage.objects;
drop policy if exists "agrostyle_owner_update"  on storage.objects;
drop policy if exists "agrostyle_owner_delete"  on storage.objects;

create policy "agrostyle_public_read" on storage.objects
  for select using (bucket_id = 'agrostyle');

create policy "agrostyle_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'agrostyle');

create policy "agrostyle_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'agrostyle' and owner = auth.uid());

create policy "agrostyle_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'agrostyle' and owner = auth.uid());

-- ═══════════════════════════ ORDERS ═══════════════════════════════
-- US10/US11/US12: carrito → pedido → pago QR simulado

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  buyer_name    text,
  producer_id   uuid not null references public.profiles(id),
  producer_name text,
  status        text not null default 'pending_confirmation'
                  check (status in ('pending_confirmation','confirmed','rejected','paid','delivered')),
  total         numeric(10,2) not null,
  notes         text,
  rejection_reason text,
  qr_code       text,  -- payload simulado del QR
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  product_name   text not null,
  unit           text not null,
  price          numeric(10,2) not null,
  quantity       numeric(10,2) not null,
  subtotal       numeric(10,2) not null,
  is_preorder    boolean not null default false,
  available_date date
);

create index if not exists orders_buyer_idx    on public.orders(buyer_id);
create index if not exists orders_producer_idx on public.orders(producer_id);
create index if not exists orders_status_idx   on public.orders(status);
create index if not exists order_items_order_idx on public.order_items(order_id);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ── ORDERS RLS ──
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists orders_buyer_all     on public.orders;
drop policy if exists orders_producer_read on public.orders;
drop policy if exists orders_producer_update on public.orders;
drop policy if exists orders_admin_all     on public.orders;
drop policy if exists order_items_buyer_read    on public.order_items;
drop policy if exists order_items_producer_read on public.order_items;
drop policy if exists order_items_insert_buyer  on public.order_items;

-- Comprador: puede crear y leer sus propios pedidos
create policy orders_buyer_all on public.orders
  for all using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- Productor: puede leer pedidos dirigidos a él y actualizarlos (confirmar/rechazar)
create policy orders_producer_read on public.orders
  for select using (producer_id = auth.uid());

create policy orders_producer_update on public.orders
  for update using (producer_id = auth.uid())
  with check (producer_id = auth.uid());

-- Admin: acceso total
create policy orders_admin_all on public.orders
  for all using (public.is_admin());

-- Order items: comprador puede insertar y leer
create policy order_items_insert_buyer on public.order_items
  for insert with check (
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );

create policy order_items_buyer_read on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );

create policy order_items_producer_read on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and producer_id = auth.uid())
  );

-- =====================================================================
-- RESET (descomentar si quieres borrar todo y empezar de cero)
-- =====================================================================
-- drop table if exists public.products  cascade;
-- drop table if exists public.documents cascade;
-- drop table if exists public.farms     cascade;
-- drop table if exists public.profiles  cascade;
-- drop function if exists public.handle_new_user() cascade;
-- drop function if exists public.set_updated_at() cascade;
-- drop function if exists public.is_admin() cascade;
