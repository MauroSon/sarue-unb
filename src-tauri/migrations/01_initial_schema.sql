-- Migration 1: Initial Schema (Tauri 2 SQLite)
-- Consolidação de todas as tabelas do Saruê UnB com índices de performance

-- 1. Matrizes e Perfil Acadêmico
CREATE TABLE IF NOT EXISTS academic_profile (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curricula_cache (
  course_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Turmas e Grade Horária
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  semester TEXT NOT NULL,
  platform TEXT NOT NULL,
  professor TEXT,
  classroom TEXT,
  schedule TEXT,
  turma TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  pending_assignments_count INTEGER NOT NULL DEFAULT 0,
  url TEXT
);

CREATE TABLE IF NOT EXISTS saved_grades (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  semester TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Feed, Tarefas e Notificações
CREATE TABLE IF NOT EXISTS feed_items (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_code TEXT,
  author TEXT,
  item_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  due_date TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  external_url TEXT
);

CREATE TABLE IF NOT EXISTS course_associations (
  aprender_course_id TEXT PRIMARY KEY,
  sigaa_course_id TEXT,
  is_ignored INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deadline_notifications (
  item_id TEXT NOT NULL,
  marco TEXT NOT NULL,
  notified_at TEXT NOT NULL,
  PRIMARY KEY (item_id, marco)
);

-- 4. Avaliações e Cenários do IRA
CREATE TABLE IF NOT EXISTS professor_evaluations (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ira_scenario (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. Índices de Otimização de Consultas
CREATE INDEX IF NOT EXISTS idx_feed_items_due_date ON feed_items(due_date);
CREATE INDEX IF NOT EXISTS idx_feed_items_platform ON feed_items(platform);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
