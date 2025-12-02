/**
 * Client-side PDF text extraction utilities using pdfjs-dist
 * This works in the browser without needing server-side processing
 */

import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts text content from a PDF file in the browser
 * @param file The PDF file to extract text from
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const textContents: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items from the page
      const pageText = textContent.items
        .map((item) => {
          // Handle both TextItem and TextMarkedContent types
          return "str" in item ? item.str : "";
        })
        .join(" ");

      textContents.push(pageText);
    }

    // Join all pages with newlines
    return textContents.join("\n\n");
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extracts and merges text from multiple M-Pesa statement PDFs
 * @param files Array of PDF files to process
 * @returns Merged text content from all PDFs
 */
export async function extractTextFromMultiplePDFs(
  files: File[]
): Promise<string> {
  try {
    const textContents: string[] = [];

    for (const file of files) {
      const text = await extractTextFromPDF(file);
      textContents.push(text);
    }

    // Merge all text contents with a separator
    return textContents.join("\n\n--- STATEMENT SEPARATOR ---\n\n");
  } catch (error) {
    console.error("Error extracting text from multiple PDFs:", error);
    throw new Error(
      `Failed to extract text from PDFs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validates if a file is a valid PDF
 * @param file The file to validate
 * @returns true if valid PDF
 */
export function isValidPDF(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Gets human-readable file size
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
