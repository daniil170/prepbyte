export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PDF_PAGES = 80;

let pdfjsPromise = null;
let mammothPromise = null;

export async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [pdfjs, workerMod] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url').then(
          (m) => m.default
        ),
      ]);
      if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerMod;
      }
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export async function getMammoth() {
  if (!mammothPromise) {
    mammothPromise = import('mammoth').then((m) => m.default || m);
  }
  return mammothPromise;
}

async function getArrayBuffer(file) {
  if (typeof file.arrayBuffer === 'function') {
    return await file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Reads text content from a DOCX file.
 * @param {File|Blob} file
 * @param {Object} [deps]
 * @returns {Promise<string>}
 */
export async function readDocxText(file, deps = {}) {
  if (!file) {
    throw new Error('Файл не передан.');
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(
      'Файл превышает допустимый размер (10 МБ). Пожалуйста, выберите файл меньшего размера.'
    );
  }

  const arrayBuffer = await getArrayBuffer(file);
  const mammoth = deps.mammoth || (await getMammoth());

  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result?.value || '';
    if (!text.trim()) {
      throw new Error('Файл пуст или не содержит читаемого текста.');
    }
    return text;
  } catch (error) {
    if (error.message && error.message.includes('Файл')) {
      throw error;
    }
    throw new Error(
      'Не удалось прочитать документ DOCX. Возможно, файл повреждён или защищён паролем.'
    );
  }
}

/**
 * Groups PDF text items on a page into lines based on Y-coordinate tolerance,
 * and sorts lines from top to bottom, left to right.
 * @param {Array<{ str: string, transform: number[], height?: number }>} rawItems
 * @returns {string}
 */
export function extractPageTextFromItems(rawItems) {
  const items = (rawItems || [])
    .filter((item) => typeof item.str === 'string' && item.str.length > 0)
    .map((item) => ({
      text: item.str,
      x: item.transform ? item.transform[4] : 0,
      y: item.transform ? item.transform[5] : 0,
      height:
        item.height ||
        (item.transform ? Math.abs(item.transform[3]) : 10) ||
        10,
    }));

  if (items.length === 0) {
    return '';
  }

  // Sort items primarily by Y descending (PDF origin is bottom-left, larger Y is higher up)
  items.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  let currentLine = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const prev = currentLine[currentLine.length - 1];
    const curr = items[i];
    const tolerance = Math.min(prev.height, curr.height) * 0.5 || 3;

    if (Math.abs(prev.y - curr.y) <= tolerance) {
      currentLine.push(curr);
    } else {
      // Sort items on the finished line by X ascending (left to right)
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine.map((it) => it.text).join(' '));
      currentLine = [curr];
    }
  }

  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine.map((it) => it.text).join(' '));
  }

  return lines.join('\n');
}

/**
 * Reads text content from a PDF file.
 * @param {File|Blob} file
 * @param {Object} [deps]
 * @returns {Promise<string>}
 */
export async function readPdfText(file, deps = {}) {
  if (!file) {
    throw new Error('Файл не передан.');
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(
      'Файл превышает допустимый размер (10 МБ). Пожалуйста, выберите файл меньшего размера.'
    );
  }

  const arrayBuffer = await getArrayBuffer(file);
  const pdfjs = deps.pdfjs || (await getPdfjs());

  let pdfDoc;
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    pdfDoc = await loadingTask.promise;
  } catch (error) {
    if (
      error?.name === 'PasswordException' ||
      /password/i.test(error?.message || '')
    ) {
      throw new Error(
        'Документ защищён паролем. Снимите защиту перед загрузкой.'
      );
    }
    throw new Error('Не удалось открыть PDF-файл. Возможно, файл повреждён.');
  }

  if (pdfDoc.numPages > MAX_PDF_PAGES) {
    throw new Error(
      `Документ содержит слишком много страниц (${pdfDoc.numPages}). Максимально допустимо: ${MAX_PDF_PAGES} страниц.`
    );
  }

  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = extractPageTextFromItems(content.items);
    if (pageText.trim()) {
      pageTexts.push(pageText);
    }
  }

  const fullText = pageTexts.join('\n\n');
  if (!fullText.trim()) {
    throw new Error(
      'Файл не содержит текстового слоя (похоже на скан). Распознавание изображений (OCR) не поддерживается.'
    );
  }

  return fullText;
}

/**
 * Universal document reader for DOCX and PDF.
 * @param {File} file
 * @param {Object} [deps]
 * @returns {Promise<string>}
 */
export async function readDocumentText(file, deps = {}) {
  if (!file) {
    throw new Error('Файл не передан.');
  }

  const fileName = file.name || '';
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
    throw new Error(
      'Формат .doc не поддерживается. Пожалуйста, пересохраните файл как .docx.'
    );
  }

  if (
    lowerName.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await readDocxText(file, deps);
  }

  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    return await readPdfText(file, deps);
  }

  throw new Error(
    `Неподдерживаемый формат файла "${fileName}". Поддерживаются только DOCX и PDF.`
  );
}
