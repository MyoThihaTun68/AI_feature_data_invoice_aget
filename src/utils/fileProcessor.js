import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * Processes an uploaded file and prepares it for the AI.
 * For text-based files, it extracts the text.
 * For image/pdf files, it returns the file object directly.
 * @param {File} file The file uploaded by the user.
 * @returns {Promise<{type: 'text' | 'file', content: string | File}>} An object indicating the content type and the content itself.
 */
export const processFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Handle images and PDFs directly
  if (fileType.startsWith('image/') || fileType === 'application/pdf') {
    return { type: 'file', content: file };
  }

  // Handle DOCX files
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return { type: 'text', content: value };
  }

  // Handle XLSX and XLS files
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_csv(worksheet);
      fullText += `Sheet: ${sheetName}\n${sheetData}\n\n`;
    });
    return { type: 'text', content: fullText.trim() };
  }
  
  // Handle CSV files as plain text
  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    return { type: 'text', content: text };
  }

  throw new Error('Unsupported file format. Please upload an image, PDF, DOCX, XLSX, or CSV.');
};