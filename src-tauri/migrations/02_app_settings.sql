-- Migration 2: App Settings Table
-- Suporte nativo a configurações no SQLite (prepara migração segura de preferências do localStorage)

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
