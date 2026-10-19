/// <reference types="vite/client" />

/**
 * Configuração dos nomes de banco de dados e cofre com isolamento estrito
 * entre os ambientes de Desenvolvimento (DEV) e Produção (PROD).
 * 
 * - Em Dev: 'sqlite:sarue_unb_dev.db' e 'unb_vault_dev.hold'
 * - Em Prod: 'sqlite:sarue_unb.db' e 'unb_vault.hold'
 */
export const isDev = import.meta.env.DEV;

export const SQLITE_DB_NAME = isDev
  ? 'sqlite:sarue_unb_dev.db'
  : 'sqlite:sarue_unb.db';

export const VAULT_FILE_NAME = isDev
  ? 'unb_vault_dev.hold'
  : 'unb_vault.hold';
