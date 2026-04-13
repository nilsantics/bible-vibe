-- Track non-chat AI feature usage (commentary, explain, context, etc.) separately from chat
ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS feature_count INT NOT NULL DEFAULT 0;
