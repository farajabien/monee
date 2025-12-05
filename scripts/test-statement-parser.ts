/**
 * Test script for M-Pesa statement parser
 *
 * Usage: npx tsx scripts/test-statement-parser.ts
 */

import * as fs from 'fs';
import * as path from 'path';

async function testStatementParser() {
  console.log('=== M-Pesa Statement Parser Test ===\n');

  // Path to the test PDF
  const pdfPath = '/Users/farajabien/Downloads/Statement_All_Transactions_20250701_20251124.pdf';

  console.log('1. Checking if PDF file exists...');
  if (!fs.existsSync(pdfPath)) {
    console.error(`ERROR: PDF file not found at ${pdfPath}`);
    process.exit(1);
  }
  console.log('✓ PDF file found\n');

  console.log('2. Reading PDF file...');
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`✓ PDF file read successfully (${pdfBuffer.length} bytes)\n`);

  console.log('3. Extracting text from PDF...');
  try {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Set worker source for Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';

    // Convert Buffer to Uint8Array (pdfjs-dist requires Uint8Array)
    const pdfData = new Uint8Array(pdfBuffer);

    // Load the PDF
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    console.log(`✓ PDF loaded successfully (${pdf.numPages} pages)\n`);

    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
      console.log(`  - Extracted text from page ${i} (${pageText.length} chars)`);
    }

    console.log(`\n✓ Text extraction complete (${fullText.length} total chars)\n`);

    // Save extracted text to file for inspection
    const textOutputPath = path.join(__dirname, 'statement-extracted-text.txt');
    fs.writeFileSync(textOutputPath, fullText);
    console.log(`✓ Extracted text saved to: ${textOutputPath}\n`);

    // Now test the parser
    console.log('4. Parsing statement with statement-parser...');

    // Import the parser
    const { parseStatementText } = await import('../lib/statement-parser');

    const expenses = parseStatementText(fullText);

    console.log(`\n✓ Parsing complete!\n`);
    console.log('=== RESULTS ===');
    console.log(`Total expenses found: ${expenses.length}\n`);

    if (expenses.length > 0) {
      console.log('First 5 expenses:');
      expenses.slice(0, 5).forEach((exp, idx) => {
        console.log(`\n${idx + 1}. Amount: KSh ${exp.amount.toFixed(2)}`);
        console.log(`   Recipient: ${exp.recipient}`);
        console.log(`   Date: ${new Date(exp.timestamp).toLocaleString()}`);
        console.log(`   Description: ${exp.description.substring(0, 80)}${exp.description.length > 80 ? '...' : ''}`);
      });

      console.log(`\n\n... and ${expenses.length - 5} more expenses`);

      // Save parsed results to JSON
      const jsonOutputPath = path.join(__dirname, 'statement-parsed-expenses.json');
      fs.writeFileSync(jsonOutputPath, JSON.stringify(expenses, null, 2));
      console.log(`\n✓ Parsed expenses saved to: ${jsonOutputPath}`);

      // Summary statistics
      const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const dateRange = {
        earliest: new Date(Math.min(...expenses.map(e => e.timestamp))),
        latest: new Date(Math.max(...expenses.map(e => e.timestamp)))
      };

      console.log('\n=== SUMMARY ===');
      console.log(`Total Expenses: ${expenses.length}`);
      console.log(`Total Amount: KSh ${totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`);
      console.log(`Date Range: ${dateRange.earliest.toLocaleDateString()} - ${dateRange.latest.toLocaleDateString()}`);
      console.log(`Average per transaction: KSh ${(totalAmount / expenses.length).toFixed(2)}`);
    } else {
      console.log('\n⚠️  WARNING: No expenses were parsed!');
      console.log('\nShowing first 1000 characters of extracted text for debugging:');
      console.log('---');
      console.log(fullText.substring(0, 1000));
      console.log('---');
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('\n❌ ERROR during test:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testStatementParser().catch(console.error);
