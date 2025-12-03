"use server";

/**
 * Server-side PDF text extraction using pdfjs-dist
 * Note: This is a server action for add-expense-form.tsx compatibility
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    
    // Set worker source for server-side using string path
    if (typeof window === 'undefined') {
      // Use require.resolve to get the worker path in Node.js environment
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
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
 * Extracts and merges text from multiple M-Pesa statement PDFs.
 * Supports the new M-Pesa export format (no password required).
 *
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
