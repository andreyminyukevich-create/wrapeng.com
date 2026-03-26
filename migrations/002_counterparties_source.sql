-- Добавляем поля источника для автосинхронизации контрагентов
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Уникальный индекс: один источник = один контрагент в студии
CREATE UNIQUE INDEX IF NOT EXISTS idx_counterparties_source
ON counterparties (studio_id, source_type, source_id)
WHERE source_type IS NOT NULL;
