-- ================================================================
-- Steelhead Storage — Supabase schema
-- Run this once in the Supabase SQL editor (supabase.com → SQL editor)
-- ================================================================

-- ── Units (availability) ────────────────────────────────────────
create table if not exists units (
  key         text primary key,
  label       text        not null,
  price       integer     not null,
  total       integer     not null default 0,
  available   integer     not null default 0,
  type        text        not null check (type in ('unit','park','container')),
  description text,
  updated_at  timestamptz not null default now()
);

-- ── Tenants ─────────────────────────────────────────────────────
create table if not exists tenants (
  id          uuid        primary key default gen_random_uuid(),
  unit        text        not null unique,
  name        text        not null,
  email       text,
  phone       text,
  size        text,
  unit_key    text        references units(key) on delete set null,
  rent        integer     not null default 0,
  balance     integer     not null default 0,
  due_date    text,
  status      text        not null default 'Paid',
  gate_code   text,
  address     text,
  contact2    jsonb,
  vehicle     jsonb,
  pw_hash     text,
  notes       text,
  autopay     boolean     not null default false,
  lease_start text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Reservations ────────────────────────────────────────────────
create table if not exists reservations (
  id             uuid        primary key default gen_random_uuid(),
  unit_key       text        references units(key),
  assigned_unit  text,
  name           text        not null,
  email          text        not null,
  phone          text,
  gate_code      text,
  status         text        not null default 'confirmed',
  created_at     timestamptz not null default now()
);

-- ── Payments ────────────────────────────────────────────────────
create table if not exists payments (
  id                       uuid        primary key default gen_random_uuid(),
  tenant_id                uuid        references tenants(id) on delete set null,
  unit                     text,
  amount_cents             integer     not null,
  stripe_payment_intent_id text        unique,
  status                   text        not null default 'pending',
  created_at               timestamptz not null default now()
);

-- ── Waitlist ────────────────────────────────────────────────────
create table if not exists waitlist (
  id         uuid        primary key default gen_random_uuid(),
  unit_key   text,
  name       text        not null,
  email      text        not null,
  created_at timestamptz not null default now()
);

-- ── Settings (key-value) ─────────────────────────────────────────
create table if not exists settings (
  key        text        primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ── Auto-update updated_at ───────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_units_updated    before update on units    for each row execute function set_updated_at();
create trigger trg_tenants_updated  before update on tenants  for each row execute function set_updated_at();

-- ── Indexes ─────────────────────────────────────────────────────
create index if not exists idx_tenants_email    on tenants(lower(email));
create index if not exists idx_tenants_unit     on tenants(lower(unit));
create index if not exists idx_payments_tenant  on payments(tenant_id);
create index if not exists idx_stripe_pi        on payments(stripe_payment_intent_id);

-- ── RLS (Row Level Security) ────────────────────────────────────
-- The service key (used server-side only) bypasses RLS.
-- We enable RLS to block direct client access from the browser.
alter table units        enable row level security;
alter table tenants      enable row level security;
alter table reservations enable row level security;
alter table payments     enable row level security;
alter table waitlist     enable row level security;
alter table settings     enable row level security;

-- ── Seed: unit types ────────────────────────────────────────────
insert into units (key, label, price, total, available, type, description) values
  ('10x15',    '10×15',                     120, 12, 4,  'unit',      'Great for apartment storage or small household items.'),
  ('10x20',    '10×20',                     135, 10, 2,  'unit',      'Fits the contents of a one-bedroom home.'),
  ('10x30',    '10×30',                     205,  6, 1,  'unit',      'Ideal for vehicles, business inventory, and larger items.'),
  ('12x33',    '12×33',                     260,  5, 3,  'unit',      'Extra depth for vehicles, boats, and equipment.'),
  ('14x35',    '14×35',                     305,  4, 0,  'unit',      'Perfect for boats, RVs, or large equipment.'),
  ('14x40',    '14×40',                     345,  3, 1,  'unit',      'Maximum space for RVs, trailers, or large storage needs.'),
  ('rv',       'RV / Trailer Parking',       85, 20, 7,  'park',      'Spacious outdoor parking for RVs, trailers, boats, and equipment.'),
  ('container','Container 8×16×7.5',        120,  8, 5,  'container', 'Wind and water tight containers for all your storage needs.')
on conflict (key) do nothing;
