"use server";

import * as pdfParse from "pdf-parse";

/**
 * Server action to extract text from a PDF file.
 * This runs server-side where Node.js APIs like Buffer are available.
 *
 * @param formData FormData containing the PDF file
 * @returns Extracted text from the PDF
 */
export async function extractTextFromPDFAction(
  formData: FormData
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF using pdf-parse
    // @ts-ignore - pdfParse types are incomplete
    const data = await pdfParse(buffer);

    // Return extracted text
    if (!data.text || data.text.trim().length === 0) {
      return {
        success: false,
        error: "PDF appears to be empty or contains no text",
      };
    }

    return { success: true, text: data.text };
  } catch (error) {
    console.error("PDF extraction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to extract text from PDF: ${error.message}`
          : "Failed to extract text from PDF: Unknown error",
    };
  }
}
