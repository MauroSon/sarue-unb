#!/usr/bin/env node
/**
 * scripts/seed-dev-db.mjs
 *
 * Popula o banco de dados SQLite local de desenvolvimento (sarue_unb_dev.db)
 * com dados realistas da Universidade de Brasília (UnB):
 *  - Cursos / Turmas matriculadas (courses)
 *  - Feed de avisos e tarefas (feed_items)
 *  - Associações de turmas Aprender 3 <-> SIGAA (course_associations)
 *  - Histórico escolar e perfil acadêmico (academic_profile)
 *  - Cenário de simulação de IRA (ira_scenario)
 *  - Grade horária planejada (saved_grades)
 *  - Notificações de prazos (deadline_notifications)
 *
 * Uso:
 *   pnpm seeds          # Alimenta o banco dev (sarue_unb_dev.db em br.unb.sarue.dev)
 *   pnpm seeds --clean  # Limpa os dados de dev antes de semear
 *
 * NOTA: O banco de dados de produção (sarue_unb.db) é de uso pessoal e é
 * estritamente protegido. Nenhum comando de seed ou limpeza de prod é permitido.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

if (typeof DatabaseSync !== 'function') {
  console.error('\n❌ ERRO: Node.js >= 22.5 é obrigatório para suporte nativo à biblioteca node:sqlite.\n');
  process.exit(1);
}

const args = process.argv.slice(2);

// Trava de segurança: impede qualquer tentativa de direcionar para produção
if (args.includes('--prod') || args.includes('--all')) {
  console.error('\n❌ ERRO: O banco de dados de produção (sarue_unb.db) é de uso pessoal e é estritamente protegido.');
  console.error('   Nenhum script automatizado tem permissão para alterar ou limpar o banco de produção.\n');
  process.exit(1);
}

const shouldClean = args.includes('--clean') || args.includes('--reset');

function getBaseAppDataDir() {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support');
  }
  if (platform === 'win32') {
    return process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
  }
  // Linux / BSD
  return process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');
}

function resolveDevDbTarget() {
  const baseDir = getBaseAppDataDir();
  const target = {
    label: 'Dev (br.unb.sarue.dev / sarue_unb_dev.db)',
    dir: path.join(baseDir, 'br.unb.sarue.dev'),
    file: 'sarue_unb_dev.db',
  };

  // Asserção estrita de segurança: garante que o alvo nunca aponte para produção
  if (!target.dir.endsWith('br.unb.sarue.dev') || target.file !== 'sarue_unb_dev.db') {
    console.error('\n❌ ERRO DE SEGURANÇA: O alvo de semeadura deve ser estritamente br.unb.sarue.dev/sarue_unb_dev.db.\n');
    process.exit(1);
  }

  return target;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      semester TEXT NOT NULL,
      platform TEXT NOT NULL,
      professor TEXT,
      classroom TEXT,
      schedule TEXT,
      unread_count INTEGER NOT NULL DEFAULT 0,
      pending_assignments_count INTEGER NOT NULL DEFAULT 0,
      url TEXT
    );

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

    CREATE TABLE IF NOT EXISTS saved_grades (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      semester TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ira_scenario (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_profile (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deadline_notifications (
      item_id TEXT NOT NULL,
      marco TEXT NOT NULL,
      notified_at TEXT NOT NULL,
      PRIMARY KEY (item_id, marco)
    );
  `);
}

function cleanDatabase(db) {
  db.exec(`
    DELETE FROM feed_items;
    DELETE FROM courses;
    DELETE FROM course_associations;
    DELETE FROM saved_grades;
    DELETE FROM ira_scenario;
    DELETE FROM academic_profile;
    DELETE FROM deadline_notifications;
  `);
}

function seedDatabase(db) {
  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const hoursFromNow = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

  // 1. Cursos / Turmas Matriculadas (Semestre 2026.1)
  const courses = [
    {
      id: 'seed-course-calc1',
      code: 'MAT0025',
      name: 'Cálculo 1',
      semester: '2026.1',
      platform: 'aprender3',
      professor: 'Prof. Marcelo Silva',
      classroom: 'PAT AT 02/10',
      schedule: 'Seg/Qua/Sex 08:00 - 09:50',
      unread_count: 2,
      pending_assignments_count: 1,
      url: 'https://aprender3.unb.br/course/view.php?id=1042',
    },
    {
      id: 'seed-course-apc',
      code: 'CIC0004',
      name: 'Algoritmos e Programação de Computadores',
      semester: '2026.1',
      platform: 'aprender3',
      professor: 'Profa. Renata Garcia',
      classroom: 'Lab CIC 03',
      schedule: 'Ter/Qui 14:00 - 15:50',
      unread_count: 1,
      pending_assignments_count: 1,
      url: 'https://aprender3.unb.br/course/view.php?id=1294',
    },
    {
      id: 'seed-course-ed',
      code: 'CIC0090',
      name: 'Estruturas de Dados',
      semester: '2026.1',
      platform: 'sigaa',
      professor: 'Prof. Carlos Eduardo',
      classroom: 'PJC BT 110',
      schedule: 'Seg/Qua 14:00 - 15:50',
      unread_count: 3,
      pending_assignments_count: 0,
      url: 'https://sigaa.unb.br/sigaa/portais/discente/discente.jsf',
    },
    {
      id: 'seed-course-mds',
      code: 'FGA0138',
      name: 'Métodos de Desenvolvimento de Software',
      semester: '2026.1',
      platform: 'teams',
      professor: 'Prof. Fernando Mendes',
      classroom: 'UED Sala 12 / Teams',
      schedule: 'Ter/Qui 16:00 - 17:50',
      unread_count: 4,
      pending_assignments_count: 1,
      url: 'https://teams.microsoft.com',
    },
    {
      id: 'seed-course-bd',
      code: 'CIC0097',
      name: 'Bancos de Dados',
      semester: '2026.1',
      platform: 'sigaa',
      professor: 'Profa. Maristela Holanda',
      classroom: 'PJC BT 114',
      schedule: 'Seg/Qua 08:00 - 09:50',
      unread_count: 0,
      pending_assignments_count: 0,
      url: 'https://sigaa.unb.br/sigaa/portais/discente/discente.jsf',
    },
  ];

  const insertCourseStmt = db.prepare(`
    INSERT INTO courses (
      id, code, name, semester, platform, professor, classroom, schedule, unread_count, pending_assignments_count, url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      code = excluded.code,
      name = excluded.name,
      semester = excluded.semester,
      platform = excluded.platform,
      professor = excluded.professor,
      classroom = excluded.classroom,
      schedule = excluded.schedule,
      unread_count = excluded.unread_count,
      pending_assignments_count = excluded.pending_assignments_count,
      url = excluded.url;
  `);

  for (const c of courses) {
    insertCourseStmt.run(
      c.id,
      c.code,
      c.name,
      c.semester,
      c.platform,
      c.professor,
      c.classroom,
      c.schedule,
      c.unread_count,
      c.pending_assignments_count,
      c.url
    );
  }

  // 2. Feed Items (Avisos e Tarefas)
  const feedItems = [
    {
      id: 'seed-feed-1',
      platform: 'aprender3',
      title: 'Lista 3 de Exercícios: Derivadas e Regra da Cadeia',
      content: 'A Lista 3 já está disponível para envio. Certifiquem-se de submeter a resolução manuscrita escaneada em formato PDF até as 23h59.',
      course_name: 'Cálculo 1',
      course_code: 'MAT0025',
      author: 'Prof. Marcelo Silva',
      item_type: 'assignment',
      created_at: hoursAgo(2),
      due_date: hoursFromNow(48),
      is_completed: 0,
      is_hidden: 0,
      external_url: 'https://aprender3.unb.br/mod/assign/view.php?id=1042',
    },
    {
      id: 'seed-feed-2',
      platform: 'sigaa',
      title: 'Divulgação das Notas da Prova 1 e Revisão de Menções',
      content: 'As notas da primeira avaliação individual foram cadastradas no SIGAA. A sessão presencial de revisão ocorrerá na próxima quarta-feira na sala dos professores.',
      course_name: 'Estruturas de Dados',
      course_code: 'CIC0090',
      author: 'Prof. Carlos Eduardo',
      item_type: 'post',
      created_at: hoursAgo(5),
      due_date: null,
      is_completed: 0,
      is_hidden: 0,
      external_url: 'https://sigaa.unb.br/sigaa/portais/discente/discente.jsf',
    },
    {
      id: 'seed-feed-3',
      platform: 'aprender3',
      title: 'Projeto Prático 1: Implementação de Autômato Finito',
      content: 'Submissão do código-fonte em C e relatório técnico referente ao Trabalho Prático da Unidade 1. Entrega individual através do VPL.',
      course_name: 'Algoritmos e Programação de Computadores',
      course_code: 'CIC0004',
      author: 'Profa. Renata Garcia',
      item_type: 'assignment',
      created_at: hoursAgo(12),
      due_date: hoursFromNow(24),
      is_completed: 0,
      is_hidden: 0,
      external_url: 'https://aprender3.unb.br/mod/vpl/view.php?id=38192',
    },
    {
      id: 'seed-feed-4',
      platform: 'teams',
      title: 'Sprint 2: Reunião de Alinhamento e Arquitetura',
      content: 'Disponibilizado o link da gravação da aula síncrona sobre Clean Architecture e divisão de microsserviços. O material de apoio está na aba Arquivos do canal Geral.',
      course_name: 'Métodos de Desenvolvimento de Software',
      course_code: 'FGA0138',
      author: 'Prof. Fernando Mendes',
      item_type: 'post',
      created_at: hoursAgo(24),
      due_date: null,
      is_completed: 0,
      is_hidden: 0,
      external_url: 'https://teams.microsoft.com',
    },
    {
      id: 'seed-feed-5',
      platform: 'teams',
      title: 'Entrega do Documento de Arquitetura de Software (DAS)',
      content: 'Cada squad deve atualizar o repositório no GitHub com a versão v1.0 da documentação de arquitetura do projeto e submeter o link correspondente no canal da disciplina.',
      course_name: 'Métodos de Desenvolvimento de Software',
      course_code: 'FGA0138',
      author: 'Prof. Fernando Mendes',
      item_type: 'assignment',
      created_at: hoursAgo(48),
      due_date: hoursFromNow(120),
      is_completed: 0,
      is_hidden: 0,
      external_url: 'https://teams.microsoft.com',
    },
    {
      id: 'seed-feed-6',
      platform: 'sigaa',
      title: 'Slides de Modelagem Relacional e Normalização 3FN',
      content: 'Disponibilizados os slides da aula de Modelagem Entidade-Relacionamento e roteiro dos exercícios práticos para a próxima aula no laboratório.',
      course_name: 'Bancos de Dados',
      course_code: 'CIC0097',
      author: 'Profa. Maristela Holanda',
      item_type: 'post',
      created_at: hoursAgo(72),
      due_date: null,
      is_completed: 0,
      is_hidden: 0,
      external_url: 'https://sigaa.unb.br/sigaa/portais/discente/discente.jsf',
    },
    {
      id: 'seed-feed-7',
      platform: 'aprender3',
      title: 'Exercício de Fixação: Ponteiros e Alocação Dinâmica',
      content: 'Exercício preparatório concluído no laboratório de programação da aula anterior.',
      course_name: 'Algoritmos e Programação de Computadores',
      course_code: 'CIC0004',
      author: 'Profa. Renata Garcia',
      item_type: 'assignment',
      created_at: hoursAgo(96),
      due_date: hoursAgo(24),
      is_completed: 1,
      is_hidden: 0,
      external_url: 'https://aprender3.unb.br/mod/assign/view.php?id=38100',
    },
  ];

  const insertFeedStmt = db.prepare(`
    INSERT INTO feed_items (
      id, platform, title, content, course_name, course_code, author, item_type, created_at, due_date, is_completed, is_hidden, external_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      platform = excluded.platform,
      title = excluded.title,
      content = excluded.content,
      course_name = excluded.course_name,
      course_code = excluded.course_code,
      author = excluded.author,
      item_type = excluded.item_type,
      created_at = excluded.created_at,
      due_date = excluded.due_date,
      is_completed = excluded.is_completed,
      is_hidden = excluded.is_hidden,
      external_url = excluded.external_url;
  `);

  for (const f of feedItems) {
    insertFeedStmt.run(
      f.id,
      f.platform,
      f.title,
      f.content,
      f.course_name,
      f.course_code,
      f.author,
      f.item_type,
      f.created_at,
      f.due_date,
      f.is_completed,
      f.is_hidden,
      f.external_url
    );
  }

  // 3. Associações de Turmas Aprender 3 <-> SIGAA
  const associations = [
    {
      aprender_course_id: 'seed-course-calc1',
      sigaa_course_id: 'sigaa-MAT0025',
      is_ignored: 0,
      updated_at: now.toISOString(),
    },
    {
      aprender_course_id: 'seed-course-apc',
      sigaa_course_id: 'sigaa-CIC0004',
      is_ignored: 0,
      updated_at: now.toISOString(),
    },
  ];

  const insertAssocStmt = db.prepare(`
    INSERT INTO course_associations (
      aprender_course_id, sigaa_course_id, is_ignored, updated_at
    ) VALUES (?, ?, ?, ?)
    ON CONFLICT(aprender_course_id) DO UPDATE SET
      sigaa_course_id = excluded.sigaa_course_id,
      is_ignored = excluded.is_ignored,
      updated_at = excluded.updated_at;
  `);

  for (const a of associations) {
    insertAssocStmt.run(a.aprender_course_id, a.sigaa_course_id, a.is_ignored, a.updated_at);
  }

  // 4. Perfil Acadêmico e Histórico Escolar
  const academicProfile = {
    matricula: '202000000',
    studentName: 'Discente Demonstração',
    courseName: 'ENGENHARIA DE COMPUTAÇÃO',
    degree: 'BACHARELADO',
    shift: 'DIURNO',
    level: 'GRADUAÇÃO',
    admissionYear: '2022.1',
    curriculumCode: '1741/1',
    curriculumId: '354',
    completedDisciplines: [
      {
        code: 'CIC0004',
        name: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
        workloadHours: 90,
        period: '2022.1',
        grade: 'MS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'CIC0188',
        name: 'INTRODUÇÃO À ENGENHARIA DE COMPUTAÇÃO',
        workloadHours: 30,
        period: '2022.1',
        grade: 'SS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'MAT0137',
        name: 'CÁLCULO 1',
        workloadHours: 90,
        period: '2022.2',
        grade: 'MS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'IFD0173',
        name: 'FISICA 1 EXPERIMENTAL',
        workloadHours: 30,
        period: '2023.1',
        grade: 'MM',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'CIC0090',
        name: 'ESTRUTURAS DE DADOS',
        workloadHours: 60,
        period: '2023.1',
        grade: 'MM',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'MAT0031',
        name: 'ÁLGEBRA LINEAR',
        workloadHours: 60,
        period: '2023.2',
        grade: 'MS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'IFD0171',
        name: 'FISICA 1',
        workloadHours: 90,
        period: '2023.2',
        grade: 'MM',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'CIC0093',
        name: 'ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES',
        workloadHours: 60,
        period: '2024.1',
        grade: 'SS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'MAT0026',
        name: 'CÁLCULO 2',
        workloadHours: 90,
        period: '2024.1',
        grade: 'MM',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'ENE0334',
        name: 'CIRCUITOS LÓGICOS',
        workloadHours: 60,
        period: '2024.2',
        grade: 'MS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'ENE0056',
        name: 'SISTEMAS DIGITAIS',
        workloadHours: 60,
        period: '2025.1',
        grade: 'SS',
        situation: 'APR',
        isCompleted: true,
      },
      {
        code: 'CIC0099',
        name: 'PROJETO INTEGRADOR',
        workloadHours: 60,
        period: '2026.1',
        grade: '-',
        situation: 'MATR',
        isCompleted: false,
      },
      {
        code: 'CIC0097',
        name: 'BANCOS DE DADOS',
        workloadHours: 60,
        period: '2026.1',
        grade: '-',
        situation: 'MATR',
        isCompleted: false,
      },
      {
        code: 'FGA0138',
        name: 'MÉTODOS DE DESENVOLVIMENTO DE SOFTWARE',
        workloadHours: 60,
        period: '2026.1',
        grade: '-',
        situation: 'MATR',
        isCompleted: false,
      },
    ],
    manualCompletedCodes: [],
    manualUncompletedCodes: [],
    updatedAt: now.toISOString(),
    ira: 4.12,
    mp: 4.05,
    chObrigatoriaPendente: 1050,
    chOptativaPendente: 240,
    chTotalCurriculo: 3600,
    chComplementarPendente: 60,
    percentualIntegralizado: 42.5,
  };

  const insertProfileStmt = db.prepare(`
    INSERT INTO academic_profile (id, payload, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at;
  `);

  insertProfileStmt.run('current', JSON.stringify(academicProfile), now.toISOString());

  // 5. Cenário de Simulação de IRA
  const iraScenario = {
    baseIra: 4.12,
    baseMp: 4.05,
    targetIra: 4.3,
    plannedDisciplines: [
      {
        code: 'CIC0099',
        name: 'PROJETO INTEGRADOR',
        workloadHours: 60,
        expectedGrade: 'SS',
        credits: 4,
      },
      {
        code: 'CIC0097',
        name: 'BANCOS DE DADOS',
        workloadHours: 60,
        expectedGrade: 'MS',
        credits: 4,
      },
      {
        code: 'FGA0138',
        name: 'MÉTODOS DE DESENVOLVIMENTO DE SOFTWARE',
        workloadHours: 60,
        expectedGrade: 'SS',
        credits: 4,
      },
    ],
    calculatedIra: 4.28,
    calculatedMp: 4.22,
    updatedAt: now.toISOString(),
  };

  const insertIraStmt = db.prepare(`
    INSERT INTO ira_scenario (id, payload, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at;
  `);

  insertIraStmt.run('current', JSON.stringify(iraScenario), now.toISOString());

  // 6. Grade Horária Salva (Minha Grade 2026.1)
  const savedGradeData = [
    {
      id: 'CIC0004-02',
      disciplineCode: 'CIC0004',
      disciplineName: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
      classCode: '02',
      teachers: ['Profa. Renata Garcia'],
      classroom: 'Lab CIC 03',
      scheduleCode: '35T23',
      scheduleSlots: [
        {
          day: 3,
          dayName: 'Ter',
          shift: 'T',
          period: 2,
          timeRange: '14:00 - 14:55',
          globalSlotIndex: 6,
        },
        {
          day: 3,
          dayName: 'Ter',
          shift: 'T',
          period: 3,
          timeRange: '14:55 - 15:50',
          globalSlotIndex: 7,
        },
        {
          day: 5,
          dayName: 'Qui',
          shift: 'T',
          period: 2,
          timeRange: '14:00 - 14:55',
          globalSlotIndex: 6,
        },
        {
          day: 5,
          dayName: 'Qui',
          shift: 'T',
          period: 3,
          timeRange: '14:55 - 15:50',
          globalSlotIndex: 7,
        },
      ],
      vacancies: 45,
      occupied: 42,
    },
    {
      id: 'MAT0025-01',
      disciplineCode: 'MAT0025',
      disciplineName: 'CÁLCULO 1',
      classCode: '01',
      teachers: ['Prof. Marcelo Silva'],
      classroom: 'PAT AT 02/10',
      scheduleCode: '246M12',
      scheduleSlots: [
        {
          day: 2,
          dayName: 'Seg',
          shift: 'M',
          period: 1,
          timeRange: '08:00 - 08:55',
          globalSlotIndex: 0,
        },
        {
          day: 2,
          dayName: 'Seg',
          shift: 'M',
          period: 2,
          timeRange: '08:55 - 09:50',
          globalSlotIndex: 1,
        },
        {
          day: 4,
          dayName: 'Qua',
          shift: 'M',
          period: 1,
          timeRange: '08:00 - 08:55',
          globalSlotIndex: 0,
        },
        {
          day: 4,
          dayName: 'Qua',
          shift: 'M',
          period: 2,
          timeRange: '08:55 - 09:50',
          globalSlotIndex: 1,
        },
        {
          day: 6,
          dayName: 'Sex',
          shift: 'M',
          period: 1,
          timeRange: '08:00 - 08:55',
          globalSlotIndex: 0,
        },
        {
          day: 6,
          dayName: 'Sex',
          shift: 'M',
          period: 2,
          timeRange: '08:55 - 09:50',
          globalSlotIndex: 1,
        },
      ],
      vacancies: 60,
      occupied: 58,
    },
    {
      id: 'CIC0090-01',
      disciplineCode: 'CIC0090',
      disciplineName: 'ESTRUTURAS DE DADOS',
      classCode: '01',
      teachers: ['Prof. Carlos Eduardo'],
      classroom: 'PJC BT 110',
      scheduleCode: '24T23',
      scheduleSlots: [
        {
          day: 2,
          dayName: 'Seg',
          shift: 'T',
          period: 2,
          timeRange: '14:00 - 14:55',
          globalSlotIndex: 6,
        },
        {
          day: 2,
          dayName: 'Seg',
          shift: 'T',
          period: 3,
          timeRange: '14:55 - 15:50',
          globalSlotIndex: 7,
        },
        {
          day: 4,
          dayName: 'Qua',
          shift: 'T',
          period: 2,
          timeRange: '14:00 - 14:55',
          globalSlotIndex: 6,
        },
        {
          day: 4,
          dayName: 'Qua',
          shift: 'T',
          period: 3,
          timeRange: '14:55 - 15:50',
          globalSlotIndex: 7,
        },
      ],
      vacancies: 40,
      occupied: 39,
    },
    {
      id: 'CIC0097-01',
      disciplineCode: 'CIC0097',
      disciplineName: 'BANCOS DE DADOS',
      classCode: '01',
      teachers: ['Profa. Maristela Holanda'],
      classroom: 'PJC BT 114',
      scheduleCode: '24M34',
      scheduleSlots: [
        {
          day: 2,
          dayName: 'Seg',
          shift: 'M',
          period: 3,
          timeRange: '10:00 - 10:55',
          globalSlotIndex: 2,
        },
        {
          day: 2,
          dayName: 'Seg',
          shift: 'M',
          period: 4,
          timeRange: '10:55 - 11:50',
          globalSlotIndex: 3,
        },
        {
          day: 4,
          dayName: 'Qua',
          shift: 'M',
          period: 3,
          timeRange: '10:00 - 10:55',
          globalSlotIndex: 2,
        },
        {
          day: 4,
          dayName: 'Qua',
          shift: 'M',
          period: 4,
          timeRange: '10:55 - 11:50',
          globalSlotIndex: 3,
        },
      ],
      vacancies: 35,
      occupied: 35,
    },
  ];

  const insertGradeStmt = db.prepare(`
    INSERT INTO saved_grades (id, name, semester, data, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      semester = excluded.semester,
      data = excluded.data,
      updated_at = excluded.updated_at;
  `);

  insertGradeStmt.run(
    'grade-current',
    'Minha Grade 2026.1',
    '2026.1',
    JSON.stringify(savedGradeData),
    now.toISOString()
  );

  // 7. Notificações de Prazos (Deadline Notifications)
  const insertDeadlineStmt = db.prepare(`
    INSERT INTO deadline_notifications (item_id, marco, notified_at) VALUES (?, ?, ?)
    ON CONFLICT(item_id, marco) DO UPDATE SET
      notified_at = excluded.notified_at;
  `);

  insertDeadlineStmt.run('seed-feed-3', '24h', now.toISOString());

  return {
    coursesCount: courses.length,
    feedItemsCount: feedItems.length,
    associationsCount: associations.length,
  };
}

function main() {
  console.log('🌱 [Saruê UnB] Iniciando semeadura do banco de dados de desenvolvimento SQLite...');

  const target = resolveDevDbTarget();

  try {
    fs.mkdirSync(target.dir, { recursive: true });
    const dbPath = path.join(target.dir, target.file);

    console.log(`\n📂 Alvo exclusivo: ${target.label}`);
    console.log(`   Caminho: ${dbPath}`);

    const db = new DatabaseSync(dbPath);
    initSchema(db);

    if (shouldClean) {
      cleanDatabase(db);
      console.log('   🧹 Dados de desenvolvimento anteriores limpos com sucesso.');
    }

    const stats = seedDatabase(db);
    db.close();

    console.log(`   ✅ ${stats.coursesCount} Turmas matriculadas inseridas (courses)`);
    console.log(`   ✅ ${stats.feedItemsCount} Itens de feed inseridos (feed_items)`);
    console.log(`   ✅ ${stats.associationsCount} Associações Aprender 3 <-> SIGAA inseridas`);
    console.log('   ✅ Perfil Acadêmico e Histórico Escolar inseridos (academic_profile)');
    console.log('   ✅ Cenário de Simulação de IRA inserido (ira_scenario)');
    console.log('   ✅ Grade Horária Salva 2026.1 inserida (saved_grades)');
    console.log('   ✅ Notificação de Prazo deduplicada inserida (deadline_notifications)');

    console.log('\n🎉 Semeadura do ambiente DEV concluída com sucesso!');
    console.log('   (O banco de produção permaneceu 100% isolado e intacto.)');
  } catch (err) {
    console.error(`\n❌ Erro ao semear ${target.label}:`, err.message);
    process.exit(1);
  }
}

main();
