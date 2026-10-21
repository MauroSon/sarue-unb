import { useState, useCallback, useEffect, useRef } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'ready-to-restart'
  | 'error';

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export function useAppUpdater() {
  const [status, setStatus] = useState<UpdaterStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Versão instalada (tauri.conf.json); "0.1.1" é só o fallback enquanto o
  // Tauri não responde ou em dev no navegador.
  const [currentVersion, setCurrentVersion] = useState('0.1.1');
  const pendingUpdateRef = useRef<Update | null>(null);
  const lastPercentRef = useRef(-1);

  useEffect(() => {
    getVersion()
      .then(setCurrentVersion)
      .catch((err) =>
        console.warn('Não foi possível ler a versão do app:', err),
      );
  }, []);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!silent) {
      setStatus('checking');
      setErrorMessage(null);
    }
    try {
      const update = await check();
      if (update?.available) {
        pendingUpdateRef.current = update;
        setUpdateInfo({
          version: update.version,
          currentVersion: update.currentVersion,
          date: update.date,
          body: update.body,
        });
        setStatus('available');
        return update;
      } else {
        pendingUpdateRef.current = null;
        setUpdateInfo(null);
        if (!silent) {
          setStatus('up-to-date');
        }
        return null;
      }
    } catch (err) {
      console.error('Falha ao verificar atualizações:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      if (!silent) {
        setStatus('error');
      }
      return null;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    const update = pendingUpdateRef.current;
    if (!update) {
      setErrorMessage('Nenhuma atualização pronta para download.');
      setStatus('error');
      return;
    }

    try {
      setStatus('downloading');
      setErrorMessage(null);
      setProgress({ downloaded: 0, total: 0, percent: 0 });

      let downloadedBytes = 0;
      let totalBytes = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            totalBytes = event.data.contentLength ?? 0;
            lastPercentRef.current = -1;
            setProgress({ downloaded: 0, total: totalBytes, percent: 0 });
            break;
          case 'Progress': {
            downloadedBytes += event.data.chunkLength;
            // A UI só lê o percentual inteiro: re-renderiza só quando ele muda,
            // não a cada chunk baixado.
            const pct =
              totalBytes > 0
                ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
                : 0;
            if (pct !== lastPercentRef.current) {
              lastPercentRef.current = pct;
              setProgress({
                downloaded: downloadedBytes,
                total: totalBytes,
                percent: pct,
              });
            }
            break;
          }
          case 'Finished':
            setProgress({ downloaded: totalBytes, total: totalBytes, percent: 100 });
            break;
        }
      });

      setStatus('ready-to-restart');
    } catch (err) {
      console.error('Falha no download da atualização:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  const relaunchApp = useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error('Falha ao reiniciar o aplicativo:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  return {
    status,
    currentVersion,
    updateInfo,
    progress,
    errorMessage,
    checkForUpdates,
    downloadAndInstall,
    relaunchApp,
  };
}
