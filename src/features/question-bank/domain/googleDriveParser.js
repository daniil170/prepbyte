/**
 * Supported Google Drive MIME types for question variant ingestion.
 */
export const GOOGLE_DRIVE_MIME_TYPES = {
  GOOGLE_DOC: 'application/vnd.google-apps.document',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PDF: 'application/pdf',
  JSON: 'application/json',
};

/**
 * Extracts a Google Drive file ID from a URL or raw ID string.
 *
 * Supported formats:
 * - https://docs.google.com/document/d/<ID>/edit...
 * - https://drive.google.com/file/d/<ID>/view...
 * - https://drive.google.com/open?id=<ID>
 * - https://drive.google.com/uc?id=<ID>...
 * - Raw alphanumeric ID string (e.g., 25+ chars)
 *
 * @param {string} input
 * @returns {string|null} Extracted file ID or null if invalid.
 */
export function extractGoogleDriveFileId(input = '') {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Matches docs.google.com/document/d/<ID> or drive.google.com/file/d/<ID>
  const pathIdMatch = trimmed.match(
    /(?:docs\.google\.com\/(?:document|file)\/d\/|drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/
  );
  if (pathIdMatch && pathIdMatch[1]) {
    return pathIdMatch[1];
  }

  // Matches ?id=<ID> query param
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryIdMatch && queryIdMatch[1]) {
    return queryIdMatch[1];
  }

  // Matches raw alphanumeric file IDs (typically 25 to 60 characters)
  const isBareId = /^[a-zA-Z0-9_-]{20,80}$/.test(trimmed);
  if (isBareId) {
    return trimmed;
  }

  return null;
}

/**
 * Determines whether a given MIME type or file extension is supported.
 *
 * @param {string} mimeType
 * @param {string} [fileName='']
 * @returns {boolean}
 */
export function isSupportedDriveMimeType(mimeType = '', fileName = '') {
  const cleanMime = (mimeType || '').trim().toLowerCase();
  const cleanName = (fileName || '').trim().toLowerCase();

  if (cleanMime === GOOGLE_DRIVE_MIME_TYPES.GOOGLE_DOC) return true;
  if (cleanMime === GOOGLE_DRIVE_MIME_TYPES.DOCX) return true;
  if (cleanMime === GOOGLE_DRIVE_MIME_TYPES.PDF) return true;
  if (cleanMime === GOOGLE_DRIVE_MIME_TYPES.JSON) return true;

  if (cleanName.endsWith('.docx')) return true;
  if (cleanName.endsWith('.pdf')) return true;
  if (cleanName.endsWith('.json')) return true;

  return false;
}

/**
 * Resolves the download and filename configuration for a Google Drive file.
 * If the file is a Google Doc, it must be exported as DOCX.
 *
 * @param {object} metadata
 * @param {string} metadata.id
 * @param {string} metadata.name
 * @param {string} metadata.mimeType
 * @returns {{
 *   downloadUrl: string,
 *   fileName: string,
 *   mimeType: string,
 *   isGoogleDoc: boolean
 * }}
 */
export function resolveDriveDownloadConfig(metadata) {
  if (!metadata || !metadata.id) {
    throw new Error('Метаданные файла Google Drive должны содержать id.');
  }

  const fileId = metadata.id;
  const originalName = metadata.name || 'document';
  const mimeType = metadata.mimeType || '';

  if (mimeType === GOOGLE_DRIVE_MIME_TYPES.GOOGLE_DOC) {
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    return {
      downloadUrl: `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(
        GOOGLE_DRIVE_MIME_TYPES.DOCX
      )}`,
      fileName: `${baseName}.docx`,
      mimeType: GOOGLE_DRIVE_MIME_TYPES.DOCX,
      isGoogleDoc: true,
    };
  }

  return {
    downloadUrl: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    fileName: originalName,
    mimeType: mimeType || 'application/octet-stream',
    isGoogleDoc: false,
  };
}
