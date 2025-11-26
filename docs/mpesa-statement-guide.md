# M-Pesa Statement Generation Guide

## How to Get Your M-Pesa Statement (New Method - No Password!)

### Step-by-Step Instructions

1. **Open M-Pesa App**

   - Launch your M-Pesa app (Safaricom app)
   - Go to home dashboard

2. **Access Statements**

   - Next to "M-PESA STATEMENTS", click on **"SEE ALL"**
   - This opens your recent M-Pesa statements

3. **Export Statements**

   - Click the **"Export Statements"** button (bottom right)
   - Leave it on **"All Expenses"** for expense type

4. **Select Date Range**

   - Choose your desired date range
   - **Note**: Maximum range is 6 months per statement
   - For a full year, you'll need to generate 2 statements:
     - Statement 1: Jan 1 - Jun 30
     - Statement 2: Jul 1 - Dec 31

5. **Generate Statement**
   - Click **"Generate Statement"**
   - The PDF will be downloaded to your device
   - **No password required!** ✅

### Screenshots Locations

- `docs/images/mpesa-see-all-button.jpg` - Shows the "SEE ALL" button location
- `docs/images/mpesa-generate-statements.jpg` - Shows the generate statements interface

---

## Use Cases We Support

### 1. **Year-End Review**

- User generates 2 statements (Jan-Jun, Jul-Dec)
- Uploads both PDFs to analyzer
- Gets complete year analysis

### 2. **Daily Expense Routine**

- User generates statement for last 1-7 days
- Uploads small PDF instead of copying SMS messages
- Faster than manual SMS copy-paste

### 3. **Catch-Up Mode**

- User went days/weeks without recording
- Generates statement for missing period
- Uploads to catch up quickly

### 4. **Multiple Statement Upload**

- User has multiple PDFs (different date ranges)
- Can string them together or upload sequentially
- Analyzer merges and deduplicates expenses

---

## Technical Implementation Plan

### Phase 1: Multi-PDF Upload Support

- [ ] Add support for multiple file selection
- [ ] Merge text from multiple PDFs before parsing
- [ ] Handle duplicate detection across files
- [ ] Show progress: "Processing 2 of 3 statements..."

### Phase 2: Date Range Detection

- [ ] Auto-detect date ranges from each PDF
- [ ] Show user what periods are covered
- [ ] Warn about gaps: "Missing expenses between Jun 30 - Jul 1"
- [ ] Suggest ranges to fill gaps

### Phase 3: Smart Recommendations

- [ ] "For full year analysis, upload Jan-Jun and Jul-Dec statements"
- [ ] "This covers [X days]. Need more? Generate another statement"
- [ ] "Last statement: May 15. Generate one from May 16 - today"

### Phase 4: Incremental Updates

- [ ] Allow users to add new statements to existing analysis
- [ ] Merge with previously uploaded data
- [ ] Only process new expenses (skip duplicates)

---

## UI/UX Improvements Needed

### Color Scheme Update

- **Primary Green**: Safaricom green (#00A65E or similar)
- **Accent Red**: Touch of red for important CTAs
- Update `globals.css` with new brand colors
- Maintain dark mode support

### Upload Experience

```
┌─────────────────────────────────────────────┐
│  📄 Upload M-Pesa Statement(s)              │
│                                             │
│  [Drag & Drop PDFs Here or Click to Browse]│
│                                             │
│  ✓ Supports multiple PDFs                  │
│  ✓ Maximum 6 months per statement          │
│  ✓ No password required                    │
│                                             │
│  📊 Uploaded Statements:                    │
│  • Statement_Jan-Jun_2025.pdf (185 KB)     │
│    Jan 1 - Jun 30, 2025 (362 expenses) │
│                                             │
│  • Statement_Jul-Dec_2025.pdf (203 KB)     │
│    Jul 1 - Dec 31, 2025 (418 expenses) │
│                                             │
│  [+ Add Another Statement]                  │
│                                             │
│  [Analyze All Statements 📊]               │
└─────────────────────────────────────────────┘
```

### Progress Feedback

```
Analyzing your statements...
✓ Statement 1: Extracted 362 expenses
✓ Statement 2: Extracted 418 expenses
⚙️ Merging and removing duplicates...
✓ Found 780 unique expenses
✓ Date range: Jan 1 - Dec 31, 2025
```

---

## How-to Guide Section

Add to the analyzer page:

```markdown
### 📱 How to Get Your M-Pesa Statement

**Quick & Easy - No Password Needed!**

1. Open M-Pesa app → Home dashboard
2. Click "SEE ALL" next to "M-PESA STATEMENTS"
3. Click "Export Statements" (bottom right)
4. Select date range (max 6 months)
5. Click "Generate Statement"
6. Upload the PDF here!

**💡 Pro Tip**: For full year analysis, generate 2 statements:

- Jan 1 - Jun 30
- Jul 1 - Dec 31

**⚡ Fast Track**: Just need last few days? Generate a mini statement instead of copying SMS messages!
```

---

## Parser Enhancements Needed

### Handle Multiple Statements

```typescript
async function analyzeMultipleStatements(files: File[]): Promise<Expense[]> {
  const allExpenses: Expense[] = [];

  for (const file of files) {
    const text = await extractTextFromPDF(file);
    const expenses = parseStatementText(text);
    allExpenses.push(...expenses);
  }

  // Remove duplicates by receipt number
  const uniqueExpenses = deduplicateByReceipt(allExpenses);

  // Sort by date
  return uniqueExpenses.sort(
    (a, b) =>
      new Date(a.completionTime).getTime() -
      new Date(b.completionTime).getTime()
  );
}
```

### Date Range Analysis

```typescript
function analyzeStatementCoverage(expenses: Expense[]): {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  gaps: Array<{ start: Date; end: Date; days: number }>;
} {
  // Detect gaps in expense dates
  // Warn user about missing periods
}
```

---

## Marketing Copy Updates

### Hero Section

```
"Upload Your M-Pesa Statement in Seconds 🚀"

No more copying SMS messages. Just:
1. Open M-Pesa app
2. Export your statement (no password!)
3. Upload here
4. Get instant insights

Works with multiple statements for full year analysis.
```

### Benefits

- ⚡ **Faster**: Upload PDF vs copying 100+ messages
- 🔒 **No Password**: New M-Pesa export has no password
- 📊 **Complete**: Get up to 6 months per statement
- 🎯 **Accurate**: All fields included (Receipt, Time, Status, Amounts)
- 🔄 **Flexible**: Daily updates or catch-up mode

---

## Next Steps

1. **Create `/docs/images/` folder** for screenshots
2. **Update color scheme** in `globals.css` to Safaricom green + red accent
3. **Implement multi-PDF upload** component
4. **Add how-to guide** section to analyzer page
5. **Test with real multi-statement scenarios**
6. **Add date range detection** and gap warnings
7. **Update marketing copy** to emphasize this workflow

---

## Design Tokens for Safaricom Colors

```css
:root {
  /* Safaricom Green */
  --safaricom-green: oklch(0.65 0.15 155); /* Bright green */
  --safaricom-green-dark: oklch(0.45 0.12 155); /* Darker shade */

  /* Accent Red */
  --accent-red: oklch(0.577 0.245 27.325); /* Keep existing destructive */

  /* Update primary to use Safaricom green */
  --primary: var(--safaricom-green);
  --primary-foreground: oklch(1 0 0); /* White text on green */
}
```
