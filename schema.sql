CREATE TABLE IF NOT EXISTS ingestion_runs (
  id BIGSERIAL PRIMARY KEY,
  run_key TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT TRUE,
  mode TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS raw_series_points (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  series_id TEXT NOT NULL,
  point_date DATE NOT NULL,
  point_value DOUBLE PRECISION NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  UNIQUE (source, series_id, point_date, captured_at)
);

CREATE INDEX IF NOT EXISTS idx_raw_series_lookup
  ON raw_series_points (source, series_id, point_date DESC);

CREATE TABLE IF NOT EXISTS transformed_series_points (
  id BIGSERIAL PRIMARY KEY,
  metric_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  category TEXT NOT NULL,
  point_date DATE NOT NULL,
  point_value DOUBLE PRECISION NOT NULL,
  z_score DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL,
  UNIQUE (metric_id, point_date, captured_at)
);

CREATE INDEX IF NOT EXISTS idx_transformed_metric_lookup
  ON transformed_series_points (metric_id, point_date DESC);

CREATE TABLE IF NOT EXISTS score_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_key TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL,
  what_changed JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS score_snapshot_values (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id BIGINT NOT NULL REFERENCES score_snapshots(id) ON DELETE CASCADE,
  score_id TEXT NOT NULL,
  score_name TEXT NOT NULL,
  score_value DOUBLE PRECISION NOT NULL,
  change_1w DOUBLE PRECISION NOT NULL,
  change_1m DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION,
  status TEXT,
  UNIQUE (snapshot_id, score_id)
);

CREATE INDEX IF NOT EXISTS idx_score_values_scoreid
  ON score_snapshot_values (score_id, snapshot_id DESC);
