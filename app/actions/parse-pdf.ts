"use server";

import { PDFParse } from "pdf-parse";

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize parser with buffer data
    const parser = new PDFParse({ data: buffer });

    // Extract text from all pages
    const result = await parser.getText();

    // Clean up resources
    await parser.destroy();

    return result.text;
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
