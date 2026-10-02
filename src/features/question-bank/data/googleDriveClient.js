import {
  isSupportedDriveMimeType,
  resolveDriveDownloadConfig,
} from '../domain/googleDriveParser';

/**
 * Downloads a file or exports a Google Doc from Google Drive API v3 using an OAuth2 access token.
 *
 * @param {object} params
 * @param {string} params.fileId - Google Drive file ID.
 * @param {string} params.accessToken - Valid OAuth2 Bearer token with drive.readonly or drive scope.
 * @param {typeof fetch} [params.fetchFn=fetch] - Injected fetch implementation for testing.
 * @returns {Promise<{ file: File, metadata: object, isGoogleDoc: boolean }>}
 */
export async function fetchGoogleDriveFile({
  fileId,
  accessToken,
  fetchFn = fetch,
}) {
  if (!fileId || typeof fileId !== 'string') {
    throw new Error('Укажите корректный идентификатор файла Google Диска.');
  }

  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error(
      'Для доступа к Google Диску требуется авторизация через Google.'
    );
  }

  const cleanId = fileId.trim();
  const cleanToken = accessToken.trim();

  // Step 1: Fetch file metadata
  const metaUrl = `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType,size`;
  const metaResponse = await fetchFn(metaUrl, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (!metaResponse.ok) {
    if (metaResponse.status === 401) {
      throw new Error(
        'Срок действия сессии Google истек. Пожалуйста, подключите Google Диск снова.'
      );
    }
    if (metaResponse.status === 403) {
      throw new Error(
        'Доступ к файлу ограничен. Убедитесь, что у вашего Google-аккаунта есть права на чтение этого файла.'
      );
    }
    if (metaResponse.status === 404) {
      throw new Error(
        'Файл не найден на Google Диске. Проверьте правильность ссылки или идентификатора.'
      );
    }
    let errorDetail = '';
    try {
      const errJson = await metaResponse.json();
      errorDetail = errJson?.error?.message || '';
    } catch {
      // Ignore json parse error
    }
    throw new Error(
      `Ошибка получения метаданных файла с Google Диска (${metaResponse.status}): ${errorDetail || 'Неизвестная ошибка'}`
    );
  }

  const metadata = await metaResponse.json();

  if (!isSupportedDriveMimeType(metadata.mimeType, metadata.name)) {
    throw new Error(
      `Неподдерживаемый тип файла (${metadata.mimeType || 'неизвестно'}). Поддерживаются Google Документы, DOCX, PDF и JSON.`
    );
  }

  // Step 2: Resolve download or export URL
  const config = resolveDriveDownloadConfig(metadata);

  const downloadResponse = await fetchFn(config.downloadUrl, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (!downloadResponse.ok) {
    throw new Error(
      `Не удалось загрузить содержимое файла с Google Диска (${downloadResponse.status}).`
    );
  }

  const blob = await downloadResponse.blob();
  const file = new File([blob], config.fileName, {
    type: config.mimeType,
    lastModified: Date.now(),
  });

  return {
    file,
    metadata,
    isGoogleDoc: config.isGoogleDoc,
  };
}
