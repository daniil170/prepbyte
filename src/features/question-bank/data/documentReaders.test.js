import { describe, expect, it, vi } from 'vitest';
import {
  extractPageTextFromItems,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_PDF_PAGES,
  readDocumentText,
  readDocxText,
  readPdfText,
} from './documentReaders';

describe('documentReaders', () => {
  describe('extractPageTextFromItems', () => {
    it('returns empty string for empty items', () => {
      expect(extractPageTextFromItems([])).toBe('');
      expect(extractPageTextFromItems(null)).toBe('');
    });

    it('sorts lines top-to-bottom and items left-to-right', () => {
      // PDF coordinates: Y increases upward (top of page has higher Y)
      const items = [
        { str: 'Мир', transform: [1, 0, 0, 1, 60, 500], height: 10 },
        { str: 'Привет', transform: [1, 0, 0, 1, 10, 500], height: 10 },
        { str: 'Вторая строка', transform: [1, 0, 0, 1, 10, 480], height: 10 },
        { str: 'Заголовок', transform: [1, 0, 0, 1, 10, 700], height: 14 },
      ];

      const text = extractPageTextFromItems(items);
      const lines = text.split('\n');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Заголовок');
      expect(lines[1]).toBe('Привет Мир');
      expect(lines[2]).toBe('Вторая строка');
    });

    it('groups items within vertical tolerance', () => {
      const items = [
        { str: 'Часть 1', transform: [1, 0, 0, 1, 10, 500], height: 12 },
        { str: 'Часть 2', transform: [1, 0, 0, 1, 80, 502], height: 12 }, // 2pt difference
      ];

      const text = extractPageTextFromItems(items);
      expect(text).toBe('Часть 1 Часть 2');
    });
  });

  describe('readDocxText', () => {
    it('rejects if no file provided', async () => {
      await expect(readDocxText(null)).rejects.toThrow('Файл не передан');
    });

    it('rejects if file exceeds 10MB', async () => {
      const bigFile = new File(['x'], 'test.docx', {
        type: 'application/vnd.openxmlformats',
      });
      Object.defineProperty(bigFile, 'size', {
        value: MAX_DOCUMENT_SIZE_BYTES + 1,
      });

      await expect(readDocxText(bigFile)).rejects.toThrow(
        'превышает допустимый размер'
      );
    });

    it('extracts raw text using mammoth', async () => {
      const file = new File(['dummy docx'], 'test.docx');
      const mockMammoth = {
        extractRawText: vi.fn().mockResolvedValue({
          value: '1. Вопрос по физике\nA) 1\nB) 2\nОтвет: A',
        }),
      };

      const text = await readDocxText(file, { mammoth: mockMammoth });
      expect(mockMammoth.extractRawText).toHaveBeenCalled();
      expect(text).toContain('1. Вопрос по физике');
    });

    it('throws if extracted text is empty or blank', async () => {
      const file = new File(['dummy docx'], 'empty.docx');
      const mockMammoth = {
        extractRawText: vi.fn().mockResolvedValue({ value: '   \n   ' }),
      };

      await expect(
        readDocxText(file, { mammoth: mockMammoth })
      ).rejects.toThrow('Файл пуст или не содержит читаемого текста');
    });

    it('throws user-friendly error on corrupted/invalid file', async () => {
      const file = new File(['bad docx'], 'bad.docx');
      const mockMammoth = {
        extractRawText: vi
          .fn()
          .mockRejectedValue(new Error('Zip format error')),
      };

      await expect(
        readDocxText(file, { mammoth: mockMammoth })
      ).rejects.toThrow('Не удалось прочитать документ DOCX');
    });
  });

  describe('readPdfText', () => {
    it('rejects if no file provided', async () => {
      await expect(readPdfText(null)).rejects.toThrow('Файл не передан');
    });

    it('rejects if file exceeds 10MB', async () => {
      const bigFile = new File(['x'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(bigFile, 'size', {
        value: MAX_DOCUMENT_SIZE_BYTES + 1,
      });

      await expect(readPdfText(bigFile)).rejects.toThrow(
        'превышает допустимый размер'
      );
    });

    it('rejects if page count exceeds 80', async () => {
      const file = new File(['pdf data'], 'too-long.pdf');
      const mockPdfDoc = {
        numPages: MAX_PDF_PAGES + 1,
      };
      const mockPdfjs = {
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.resolve(mockPdfDoc),
        }),
      };

      await expect(readPdfText(file, { pdfjs: mockPdfjs })).rejects.toThrow(
        'слишком много страниц (81)'
      );
    });

    it('throws friendly message if PDF is password protected', async () => {
      const file = new File(['pdf data'], 'protected.pdf');
      const error = new Error('Password required');
      error.name = 'PasswordException';
      const mockPdfjs = {
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.reject(error),
        }),
      };

      await expect(readPdfText(file, { pdfjs: mockPdfjs })).rejects.toThrow(
        'защищён паролем'
      );
    });

    it('throws friendly error if PDF cannot be opened', async () => {
      const file = new File(['pdf data'], 'corrupt.pdf');
      const mockPdfjs = {
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.reject(new Error('Format error')),
        }),
      };

      await expect(readPdfText(file, { pdfjs: mockPdfjs })).rejects.toThrow(
        'Не удалось открыть PDF-файл'
      );
    });

    it('throws OCR/scan warning if text is empty across all pages', async () => {
      const file = new File(['pdf data'], 'scanned.pdf');
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      };
      const mockPdfDoc = {
        numPages: 2,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };
      const mockPdfjs = {
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.resolve(mockPdfDoc),
        }),
      };

      await expect(readPdfText(file, { pdfjs: mockPdfjs })).rejects.toThrow(
        'похоже на скан'
      );
    });

    it('extracts multi-page text correctly', async () => {
      const file = new File(['pdf data'], 'valid.pdf');
      const page1 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            {
              str: '1. Вопрос первой страницы',
              transform: [1, 0, 0, 1, 10, 500],
              height: 10,
            },
          ],
        }),
      };
      const page2 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            {
              str: '2. Вопрос второй страницы',
              transform: [1, 0, 0, 1, 10, 500],
              height: 10,
            },
          ],
        }),
      };
      const mockPdfDoc = {
        numPages: 2,
        getPage: vi
          .fn()
          .mockImplementation((num) =>
            Promise.resolve(num === 1 ? page1 : page2)
          ),
      };
      const mockPdfjs = {
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.resolve(mockPdfDoc),
        }),
      };

      const result = await readPdfText(file, { pdfjs: mockPdfjs });
      expect(result).toContain('1. Вопрос первой страницы');
      expect(result).toContain('2. Вопрос второй страницы');
    });
  });

  describe('readDocumentText', () => {
    it('rejects legacy .doc files with guidance', async () => {
      const file = new File(['doc data'], 'test.doc');
      await expect(readDocumentText(file)).rejects.toThrow(
        'Формат .doc не поддерживается. Пожалуйста, пересохраните файл как .docx.'
      );
    });

    it('rejects unsupported file formats', async () => {
      const file = new File(['txt data'], 'notes.txt', { type: 'text/plain' });
      await expect(readDocumentText(file)).rejects.toThrow(
        'Неподдерживаемый формат файла "notes.txt"'
      );
    });

    it('routes .docx to readDocxText', async () => {
      const file = new File(['docx data'], 'test.docx');
      const mockMammoth = {
        extractRawText: vi.fn().mockResolvedValue({ value: '1. Тест' }),
      };

      const text = await readDocumentText(file, { mammoth: mockMammoth });
      expect(text).toBe('1. Тест');
    });

    it('routes .pdf to readPdfText', async () => {
      const file = new File(['pdf data'], 'test.pdf');
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: '1. Тест PDF', transform: [1, 0, 0, 1, 0, 100], height: 10 },
          ],
        }),
      };
      const mockPdfDoc = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };
      const mockPdfjs = {
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.resolve(mockPdfDoc),
        }),
      };

      const text = await readDocumentText(file, { pdfjs: mockPdfjs });
      expect(text).toBe('1. Тест PDF');
    });
  });
});
