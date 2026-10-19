#!/usr/bin/env node
/**
 * scripts/tauri-cli.mjs
 *
 * Wrapper inteligente para a CLI do Tauri:
 * Se o comando for 'dev' e nenhuma flag --config tiver sido passada,
 * adiciona automaticamente '--config src-tauri/tauri.dev.conf.json'
 * para garantir que o ambiente dev use sempre 'br.unb.sarue.dev'
 * e nunca encoste na pasta de produção pessoal 'br.unb.sarue'.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const rawArgs = process.argv.slice(2);
const args = [...rawArgs];

const isDev = args[0] === 'dev';
const hasConfig = args.includes('-c') || args.includes('--config');

if (isDev && !hasConfig) {
  const devConfigPath = path.join(rootDir, 'src-tauri', 'tauri.dev.conf.json');
  args.splice(1, 0, '--config', devConfigPath);
}

const binName = process.platform === 'win32' ? 'tauri.cmd' : 'tauri';
const tauriBin = path.join(rootDir, 'node_modules', '.bin', binName);

const child = spawn(tauriBin, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('❌ Falha ao iniciar a CLI do Tauri:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

