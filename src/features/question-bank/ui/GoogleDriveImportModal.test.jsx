import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@features/auth';
import { GoogleDriveImportModal } from './GoogleDriveImportModal';

describe('GoogleDriveImportModal', () => {
  let mockRequestAccess;
  let mockFetchDriveFile;
  let mockOnFileLoaded;
  let mockOnClose;
  let defaultAuthValue;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRequestAccess = vi.fn().mockResolvedValue('mock-token');
    mockFetchDriveFile = vi.fn().mockResolvedValue({
      file: new File(['dummy content'], 'variant.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      isGoogleDoc: true,
    });
    mockOnFileLoaded = vi.fn();
    mockOnClose = vi.fn();

    defaultAuthValue = {
      user: { id: 'admin1', email: 'admin@prepbyte.kz' },
      googleDriveToken: 'existing-drive-token',
      requestGoogleDriveAccess: mockRequestAccess,
    };
  });

  function renderModal(props = {}, authValue = defaultAuthValue) {
    return render(
      <AuthContext.Provider value={authValue}>
        <GoogleDriveImportModal
          isOpen={true}
          onClose={mockOnClose}
          onFileLoaded={mockOnFileLoaded}
          fetchDriveFile={mockFetchDriveFile}
          {...props}
        />
      </AuthContext.Provider>
    );
  }

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AuthContext.Provider value={defaultAuthValue}>
        <GoogleDriveImportModal
          isOpen={false}
          onClose={mockOnClose}
          onFileLoaded={mockOnFileLoaded}
        />
      </AuthContext.Provider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog when isOpen is true', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Импорт из Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Google Диск подключен')).toBeInTheDocument();
  });

  it('shows connect button when googleDriveToken is missing', () => {
    renderModal(
      {},
      {
        ...defaultAuthValue,
        googleDriveToken: null,
      }
    );

    expect(screen.getByText('Подключить Google Диск')).toBeInTheDocument();
  });

  it('validates invalid URL and shows error message', async () => {
    renderModal();

    const input = screen.getByLabelText(/Ссылка на файл или документ:/);
    fireEvent.change(input, {
      target: { value: 'https://invalid-site.com/doc' },
    });

    fireEvent.click(screen.getByText('Импортировать'));

    expect(
      await screen.findByText(/Не удалось распознать ссылку Google Диска/)
    ).toBeInTheDocument();
    expect(mockFetchDriveFile).not.toHaveBeenCalled();
  });

  it('successfully fetches file and calls onFileLoaded and onClose', async () => {
    renderModal();

    const input = screen.getByLabelText(/Ссылка на файл или документ:/);
    fireEvent.change(input, {
      target: {
        value:
          'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      },
    });

    fireEvent.click(screen.getByText('Импортировать'));

    await waitFor(() => {
      expect(mockFetchDriveFile).toHaveBeenCalledWith({
        fileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        accessToken: 'existing-drive-token',
      });
      expect(mockOnFileLoaded).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles escape key press to close modal', () => {
    renderModal();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
