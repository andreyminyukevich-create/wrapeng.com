-- 001_workshop_pipeline.sql
-- Workshop pipeline tables: acceptance_acts, outsource_records, delivery_acts, status_history
-- Phase 1: Foundation

CREATE TABLE acceptance_acts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id        uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id      uuid        NOT NULL,
  mileage        integer,
  fuel_level     text,
  damages        text,
  equipment      jsonb,
  photo_checks   jsonb,
  client_agreed  boolean     NOT NULL DEFAULT false,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(calc_id)
);

CREATE TABLE outsource_records (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id          uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id        uuid        NOT NULL,
  contractor_name  text,
  work_type        text,
  deadline         date,
  outsource_type   text,
  notes            text,
  returned_at      timestamptz,
  return_notes     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_acts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id             uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id           uuid        NOT NULL,
  payment_method      text,
  payment_breakdown   jsonb,
  total_amount        numeric(12,2),
  vat_percent         numeric(5,2),
  notes               text,
  delivered_by        text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE status_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id      uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id    uuid        NOT NULL,
  from_status  text,
  to_status    text        NOT NULL,
  changed_by   uuid,
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_history_calc_date ON status_history (calc_id, created_at);
