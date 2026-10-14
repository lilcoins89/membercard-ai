create extension if not exists pgcrypto;

create table if not exists public.membership_cards (
  id uuid primary key default gen_random_uuid(),
  public_membership_id text not null unique,
  organization_name text not null,
  member_name text not null,
  membership_type text not null,
  expiration_date date,
  photo_data_url text,
  design jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_config (
  id integer primary key default 1,
  base_fee_cents integer not null default 499,
  card_fee_cents integer not null default 0,
  international_surcharge_cents integer not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.shipping_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.shipment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  card_id text not null,
  card_snapshot jsonb not null,
  recipient_name text not null,
  email text not null,
  phone text,
  street text not null,
  unit text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'US',
  shipping_cost_cents integer not null,
  total_cents integer not null,
  idempotency_key text not null unique,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  solana_reference text unique,
  solana_amount_lamports bigint,
  solana_usd_rate numeric(12,4),
  payment_provider text,
  solana_signature text unique,
  usdc_amount bigint,
  stripe_session_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipment_orders_user_idx on public.shipment_orders (user_id, created_at desc);
create index if not exists shipment_orders_status_idx on public.shipment_orders (payment_status, created_at desc);

create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  order_id uuid references public.shipment_orders(id) on delete set null,
  asset text not null check (asset in ('SOL', 'USDC')),
  amount_atomic numeric(30,0) not null,
  amount_usd_cents integer not null default 0,
  signature text not null unique,
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists wallet_deposits_user_idx on public.wallet_deposits (user_id, status, created_at desc);

create table if not exists public.card_designs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.membership_cards(id) on delete cascade,
  owner_id text not null,
  name text not null default 'Untitled design',
  canvas_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists card_designs_owner_idx on public.card_designs (owner_id, updated_at desc);

-- Fulfillment, payment and tracking columns used by src/app and src/lib.
alter table public.shipment_orders add column if not exists usdc_amount bigint;
alter table public.shipment_orders alter column usdc_amount type bigint;
alter table public.shipment_orders add column if not exists stripe_payment_intent_id text;
alter table public.shipment_orders add column if not exists fulfillment_status text not null default 'pending';
alter table public.shipment_orders add column if not exists provider_order_id text;
alter table public.shipment_orders add column if not exists tracking_number text;
alter table public.shipment_orders add column if not exists tracking_url text;
alter table public.shipment_orders add column if not exists estimated_delivery timestamptz;
alter table public.shipment_orders add column if not exists error_message text;
alter table public.shipment_orders add column if not exists fulfillment_claimed_at timestamptz;

-- The Stripe webhook sets payment_status = 'refunded' on charge.refunded.
alter table public.shipment_orders drop constraint if exists shipment_orders_payment_status_check;
alter table public.shipment_orders add constraint shipment_orders_payment_status_check check (payment_status in ('pending','paid','failed','refunded'));

create index if not exists shipment_orders_stripe_payment_intent_idx on public.shipment_orders (stripe_payment_intent_id);

create table if not exists public.fulfillment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipment_orders(id) on delete cascade,
  event_type text not null,
  status text,
  payload jsonb,
  error_message text,
  created_at timestamptz default now()
);
create index if not exists fulfillment_events_shipment_idx on public.fulfillment_events (shipment_id, created_at desc);

create table if not exists public.stripe_events (
  id text primary key,
  type text,
  received_at timestamptz not null default now()
);

create unique index if not exists shipment_orders_payment_signature_idx on public.shipment_orders (solana_signature) where solana_signature is not null;
