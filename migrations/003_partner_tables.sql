-- Роль партнёра в profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- Клиенты-партнёры (покупатели плёнки)
CREATE TABLE IF NOT EXISTS partner_clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID REFERENCES profiles(id),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone        TEXT,
  email        TEXT,
  city         TEXT,
  status       TEXT NOT NULL DEFAULT 'active',
  referral_code TEXT UNIQUE,
  referred_by  UUID REFERENCES partner_clients(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Закупки партнёров
CREATE TABLE IF NOT EXISTS partner_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES partner_clients(id),
  order_number TEXT,
  order_date   DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_orders_client ON partner_orders(client_id);

-- Позиции закупки
CREATE TABLE IF NOT EXISTS partner_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES partner_orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity     NUMERIC(10,3),
  unit         TEXT,
  unit_price   NUMERIC(12,2),
  total_price  NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Подписки на CRM
CREATE TABLE IF NOT EXISTS partner_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES partner_clients(id),
  subscription_type TEXT NOT NULL DEFAULT 'annual',
  status            TEXT NOT NULL DEFAULT 'none',
  start_date        DATE,
  end_date          DATE,
  price             NUMERIC(12,2),
  payment_status    TEXT DEFAULT 'pending',
  payment_method    TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Бонусный баланс (кешбэк)
CREATE TABLE IF NOT EXISTS partner_cashback_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL UNIQUE REFERENCES partner_clients(id),
  balance      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- История кешбэка
CREATE TABLE IF NOT EXISTS partner_cashback_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES partner_clients(id),
  type          TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  source_type   TEXT,
  source_id     UUID,
  comment       TEXT,
  balance_after NUMERIC(12,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Рефералы
CREATE TABLE IF NOT EXISTS partner_referrals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id UUID NOT NULL REFERENCES partner_clients(id),
  invited_client_id  UUID REFERENCES partner_clients(id),
  referral_code      TEXT NOT NULL,
  status             TEXT DEFAULT 'invited',
  reward_given       BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
