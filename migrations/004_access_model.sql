-- Модель доступа: триал / партнёр / подписка
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Планы подписки
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO subscription_plans (name, label, price, duration_days)
SELECT 'monthly', 'Месяц', 5000, 30
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name='monthly');

INSERT INTO subscription_plans (name, label, price, duration_days)
SELECT 'annual', 'Год', 50000, 365
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name='annual');
