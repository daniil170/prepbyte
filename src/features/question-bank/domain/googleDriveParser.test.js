import { describe, expect, it } from 'vitest';
import {
  extractGoogleDriveFileId,
  GOOGLE_DRIVE_MIME_TYPES,
  isSupportedDriveMimeType,
  resolveDriveDownloadConfig,
} from './googleDriveParser';

describe('googleDriveParser domain module', () => {
  describe('extractGoogleDriveFileId', () => {
    it('extracts id from Google Docs document link', () => {
      const url =
        'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
      expect(extractGoogleDriveFileId(url)).toBe(
        '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      );
    });

    it('extracts id from Google Drive file link', () => {
      const url =
        'https://drive.google.com/file/d/1v8K3L9Z_abc123-XYZ_4567890/view';
      expect(extractGoogleDriveFileId(url)).toBe('1v8K3L9Z_abc123-XYZ_4567890');
    });

    it('extracts id from open?id= query parameter', () => {
      const url =
        'https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz_12345';
      expect(extractGoogleDriveFileId(url)).toBe(
        '1AbCdEfGhIjKlMnOpQrStUvWxYz_12345'
      );
    });

    it('extracts id from uc?id= export download link', () => {
      const url =
        'https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUvWxYz_12345&export=download';
      expect(extractGoogleDriveFileId(url)).toBe(
        '1AbCdEfGhIjKlMnOpQrStUvWxYz_12345'
      );
    });

    it('accepts raw bare ID of valid length', () => {
      const id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      expect(extractGoogleDriveFileId(id)).toBe(id);
    });

    it('returns null for invalid inputs, random urls or empty strings', () => {
      expect(extractGoogleDriveFileId('')).toBeNull();
      expect(extractGoogleDriveFileId(null)).toBeNull();
      expect(extractGoogleDriveFileId('https://example.com')).toBeNull();
      expect(extractGoogleDriveFileId('short')).toBeNull();
    });
  });

  describe('isSupportedDriveMimeType', () => {
    it('recognizes Google Docs, DOCX, PDF, and JSON', () => {
      expect(isSupportedDriveMimeType(GOOGLE_DRIVE_MIME_TYPES.GOOGLE_DOC)).toBe(
        true
      );
      expect(isSupportedDriveMimeType(GOOGLE_DRIVE_MIME_TYPES.DOCX)).toBe(true);
      expect(isSupportedDriveMimeType(GOOGLE_DRIVE_MIME_TYPES.PDF)).toBe(true);
      expect(isSupportedDriveMimeType(GOOGLE_DRIVE_MIME_TYPES.JSON)).toBe(true);
    });

    it('recognizes file names with supported extensions', () => {
      expect(isSupportedDriveMimeType('', 'variant.docx')).toBe(true);
      expect(isSupportedDriveMimeType('', 'test.pdf')).toBe(true);
      expect(isSupportedDriveMimeType('', 'questions.json')).toBe(true);
      expect(isSupportedDriveMimeType('', 'image.png')).toBe(false);
    });
  });

  describe('resolveDriveDownloadConfig', () => {
    it('configures export as docx for Google Docs', () => {
      const metadata = {
        id: 'doc-123',
        name: 'Пробный вариант ЕНТ №1',
        mimeType: GOOGLE_DRIVE_MIME_TYPES.GOOGLE_DOC,
      };

      const config = resolveDriveDownloadConfig(metadata);

      expect(config.isGoogleDoc).toBe(true);
      expect(config.fileName).toBe('Пробный вариант ЕНТ №1.docx');
      expect(config.mimeType).toBe(GOOGLE_DRIVE_MIME_TYPES.DOCX);
      expect(config.downloadUrl).toContain('/export?mimeType=');
      expect(config.downloadUrl).toContain('doc-123');
    });

    it('configures direct alt=media download for regular files', () => {
      const metadata = {
        id: 'file-456',
        name: 'variant_8.pdf',
        mimeType: GOOGLE_DRIVE_MIME_TYPES.PDF,
      };

      const config = resolveDriveDownloadConfig(metadata);

      expect(config.isGoogleDoc).toBe(false);
      expect(config.fileName).toBe('variant_8.pdf');
      expect(config.mimeType).toBe(GOOGLE_DRIVE_MIME_TYPES.PDF);
      expect(config.downloadUrl).toBe(
        'https://www.googleapis.com/drive/v3/files/file-456?alt=media'
      );
    });

    it('throws when metadata is invalid or missing id', () => {
      expect(() => resolveDriveDownloadConfig(null)).toThrow();
      expect(() => resolveDriveDownloadConfig({})).toThrow();
    });
  });
});
