import { describe, expect, it, vi } from 'vitest';
import { fetchGoogleDriveFile } from './googleDriveClient';

describe('googleDriveClient', () => {
  it('throws an error if fileId or accessToken is missing', async () => {
    await expect(
      fetchGoogleDriveFile({ fileId: '', accessToken: 'token' })
    ).rejects.toThrow('Укажите корректный идентификатор');

    await expect(
      fetchGoogleDriveFile({ fileId: '123', accessToken: '' })
    ).rejects.toThrow('требуется авторизация через Google');
  });

  it('handles 401 unauthorized gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(
      fetchGoogleDriveFile({
        fileId: 'file-1',
        accessToken: 'bad-token',
        fetchFn: mockFetch,
      })
    ).rejects.toThrow('Срок действия сессии Google истек');
  });

  it('handles 403 access denied gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    await expect(
      fetchGoogleDriveFile({
        fileId: 'file-2',
        accessToken: 'valid-token',
        fetchFn: mockFetch,
      })
    ).rejects.toThrow('Доступ к файлу ограничен');
  });

  it('handles 404 file not found gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(
      fetchGoogleDriveFile({
        fileId: 'missing-file',
        accessToken: 'token',
        fetchFn: mockFetch,
      })
    ).rejects.toThrow('Файл не найден на Google Диске');
  });

  it('rejects unsupported file mime types', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'img-1',
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
      }),
    });

    await expect(
      fetchGoogleDriveFile({
        fileId: 'img-1',
        accessToken: 'token',
        fetchFn: mockFetch,
      })
    ).rejects.toThrow('Неподдерживаемый тип файла');
  });

  it('exports Google Docs as DOCX file', async () => {
    const mockMetaResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'doc-999',
        name: 'ЕНТ Пробник Вариант 1',
        mimeType: 'application/vnd.google-apps.document',
      }),
    };

    const dummyBlob = new Blob(['docx binary content'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const mockDownloadResponse = {
      ok: true,
      status: 200,
      blob: async () => dummyBlob,
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockMetaResponse)
      .mockResolvedValueOnce(mockDownloadResponse);

    const result = await fetchGoogleDriveFile({
      fileId: 'doc-999',
      accessToken: 'valid-google-token',
      fetchFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Verifies metadata call
    expect(mockFetch.mock.calls[0][0]).toContain('/files/doc-999?');
    // Verifies export call
    expect(mockFetch.mock.calls[1][0]).toContain('/files/doc-999/export?');
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
      'Bearer valid-google-token'
    );

    expect(result.isGoogleDoc).toBe(true);
    expect(result.file).toBeInstanceOf(File);
    expect(result.file.name).toBe('ЕНТ Пробник Вариант 1.docx');
  });

  it('downloads binary PDF or DOCX file directly', async () => {
    const mockMetaResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'pdf-123',
        name: 'variant.pdf',
        mimeType: 'application/pdf',
      }),
    };

    const dummyBlob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });
    const mockDownloadResponse = {
      ok: true,
      status: 200,
      blob: async () => dummyBlob,
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockMetaResponse)
      .mockResolvedValueOnce(mockDownloadResponse);

    const result = await fetchGoogleDriveFile({
      fileId: 'pdf-123',
      accessToken: 'valid-google-token',
      fetchFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toBe(
      'https://www.googleapis.com/drive/v3/files/pdf-123?alt=media'
    );
    expect(result.isGoogleDoc).toBe(false);
    expect(result.file.name).toBe('variant.pdf');
    expect(result.file.type).toBe('application/pdf');
  });
});
