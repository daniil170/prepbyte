import { useCallback, useContext, useState } from 'react';
import { AuthContext } from '@features/auth';
import { fetchGoogleDriveFile as defaultFetchDriveFile } from '../data/googleDriveClient';
import { extractGoogleDriveFileId } from '../domain/googleDriveParser';

/**
 * Hook managing Google Drive variant ingestion, OAuth access, and file download.
 *
 * @param {object} [options]
 * @param {Function} [options.fetchDriveFile=defaultFetchDriveFile]
 * @param {object} [options.auth]
 * @returns {object} Google Drive import state and actions.
 */
export function useGoogleDriveImport({
  fetchDriveFile = defaultFetchDriveFile,
  auth = null,
} = {}) {
  const authContext = useContext(AuthContext) || {};
  const googleDriveToken =
    auth?.googleDriveToken ?? authContext.googleDriveToken ?? null;
  const requestGoogleDriveAccess =
    auth?.requestGoogleDriveAccess ?? authContext.requestGoogleDriveAccess;

  const [driveUrl, setDriveUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setDriveUrl('');
    setError(null);
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const connectDrive = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Авторизация в Google...');
    try {
      if (typeof requestGoogleDriveAccess === 'function') {
        const token = await requestGoogleDriveAccess();
        if (!token) {
          throw new Error('Не удалось получить токен доступа к Google Диску.');
        }
        return token;
      }
      throw new Error('Авторизация Google Drive недоступна в текущем окружении.');
    } catch (err) {
      setError(err?.message || 'Не удалось подключить Google Диск.');
      return null;
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [requestGoogleDriveAccess]);

  const importFile = useCallback(
    async (urlToImport = driveUrl) => {
      setError(null);

      const fileId = extractGoogleDriveFileId(urlToImport);
      if (!fileId) {
        setError(
          'Не удалось распознать ссылку Google Диска. Вставьте ссылку на Google Документ или файл (или ID файла).'
        );
        return null;
      }

      let token = googleDriveToken;
      if (!token) {
        setIsLoading(true);
        setLoadingMessage('Запрос доступа к Google Диску...');
        try {
          if (typeof requestGoogleDriveAccess === 'function') {
            token = await requestGoogleDriveAccess();
          }
        } catch (err) {
          setIsLoading(false);
          setError(
            err?.message || 'Требуется разрешение на доступ к Google Диску.'
          );
          return null;
        }
      }

      if (!token) {
        setIsLoading(false);
        setError('Для загрузки файла требуется авторизоваться через Google.');
        return null;
      }

      setIsLoading(true);
      setLoadingMessage('Загрузка и конвертация файла с Google Диска...');

      try {
        const result = await fetchDriveFile({
          fileId,
          accessToken: token,
        });

        if (result && result.file) {
          return result.file;
        }
        throw new Error('Файл не был получен.');
      } catch (err) {
        setError(
          err?.message || 'Не удалось импортировать файл из Google Диска.'
        );
        return null;
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    },
    [driveUrl, googleDriveToken, requestGoogleDriveAccess, fetchDriveFile]
  );

  return {
    driveUrl,
    setDriveUrl,
    isLoading,
    loadingMessage,
    error,
    setError,
    isConnected: Boolean(googleDriveToken),
    connectDrive,
    importFile,
    reset,
  };
}
