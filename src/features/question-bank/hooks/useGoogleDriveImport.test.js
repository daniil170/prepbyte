import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGoogleDriveImport } from './useGoogleDriveImport';

describe('useGoogleDriveImport hook', () => {
  let mockFetchDriveFile;
  let mockRequestAccess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestAccess = vi.fn().mockResolvedValue('test-access-token');
    mockFetchDriveFile = vi.fn().mockResolvedValue({
      file: new File(['dummy content'], 'variant.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      isGoogleDoc: true,
    });
  });

  it('initializes with default empty state', () => {
    const { result } = renderHook(() =>
      useGoogleDriveImport({
        fetchDriveFile: mockFetchDriveFile,
        auth: {
          googleDriveToken: null,
          requestGoogleDriveAccess: mockRequestAccess,
        },
      })
    );

    expect(result.current.driveUrl).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('connects to Google Drive successfully', async () => {
    const { result } = renderHook(() =>
      useGoogleDriveImport({
        fetchDriveFile: mockFetchDriveFile,
        auth: {
          googleDriveToken: null,
          requestGoogleDriveAccess: mockRequestAccess,
        },
      })
    );

    let token;
    await act(async () => {
      token = await result.current.connectDrive();
    });

    expect(token).toBe('test-access-token');
    expect(mockRequestAccess).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('validates invalid URLs when importing', async () => {
    const { result } = renderHook(() =>
      useGoogleDriveImport({
        fetchDriveFile: mockFetchDriveFile,
        auth: {
          googleDriveToken: 'token',
          requestGoogleDriveAccess: mockRequestAccess,
        },
      })
    );

    let file;
    await act(async () => {
      file = await result.current.importFile('https://invalid-site.com');
    });

    expect(file).toBeNull();
    expect(result.current.error).toContain('Не удалось распознать ссылку');
    expect(mockFetchDriveFile).not.toHaveBeenCalled();
  });

  it('imports file successfully when valid URL and token are provided', async () => {
    const { result } = renderHook(() =>
      useGoogleDriveImport({
        fetchDriveFile: mockFetchDriveFile,
        auth: {
          googleDriveToken: 'valid-token',
          requestGoogleDriveAccess: mockRequestAccess,
        },
      })
    );

    let file;
    await act(async () => {
      file = await result.current.importFile(
        'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
      );
    });

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('variant.docx');
    expect(result.current.error).toBeNull();
    expect(mockFetchDriveFile).toHaveBeenCalledWith({
      fileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      accessToken: 'valid-token',
    });
  });

  it('resets state when reset is called', () => {
    const { result } = renderHook(() =>
      useGoogleDriveImport({
        fetchDriveFile: mockFetchDriveFile,
        auth: {
          googleDriveToken: 'valid-token',
          requestGoogleDriveAccess: mockRequestAccess,
        },
      })
    );

    act(() => {
      result.current.setDriveUrl('https://docs.google.com/...');
      result.current.setError('Some error');
    });

    expect(result.current.driveUrl).toBe('https://docs.google.com/...');
    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.driveUrl).toBe('');
    expect(result.current.error).toBeNull();
  });
});
