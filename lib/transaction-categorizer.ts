// transaction-categorizer.ts
// Lightweight transaction categorization engine for M-Pesa / merchant strings.
// Drop into your analyzer service and extend RULES as needed.

type Category = {
  id: string;
  name: string;
  patterns: Array<string | RegExp>;
};

type CategorizationResult = {
  category: string | null;
  score: number;         // raw score
  confidence: number;    // 0..1
  matchedPattern?: string | RegExp;
  normalizedMerchant: string;
  tokensMatched: string[];
};

const CATEGORY_RULES: Category[] = [
  {
    id: "transport",
    name: "Transport",
    patterns: [
      /\buber\b/i,
      /\bbolt\b/i,
      /\bboda\b/i,
      /\bmatatu\b/i,
      /\btaxi\b/i,
      /\btrain\b/i,
      "fuel",
      "petrol",
      "shell",
      "total",
      "carwash",
    ],
  },
  {
    id: "food",
    name: "Food & Drinks",
    patterns: [
      /\brestaurant\b/i,
      /\bcafe\b/i,
      /\bcoffee\b/i,
      /\bkfc\b/i,
      /\bpizza\b/i,
      "ubereats",
      "bolt food",
      "naivas",
      "carrefour",
      "quickmart",
      "supermarket",
      "grocery",
      "eat",
      "meals",
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    patterns: [
      /\bshop\b/i,
      /\bstore\b/i,
      "jumia",
      "kilimall",
      "mall",
      "fashion",
      "clothing",
      "electronics",
      /\bamazon\b/i,
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    patterns: [
      "netflix",
      "showmax",
      "spotify",
      "dstv",
      "movie",
      "cinema",
      "betika",
      "sportpesa",
      "odibets",
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    patterns: [
      "kplc",
      "kenya power",
      "water",
      "nairobi water",
      "airtime",
      "data",
      "internet",
      "wifi",
      "safaricom",
      "airtel",
      "telkom",
    ],
  },
  {
    id: "health",
    name: "Health",
    patterns: ["hospital", "clinic", "pharmacy", "medical", "nhif", "insurance"],
  },
  {
    id: "finance",
    name: "Finance / Transfers",
    patterns: [
      /\bbank\b/i,
      /\bkcb\b/i,
      /\bequity\b/i,
      /\bpesalink\b/i,
      "withdraw",
      "deposit",
      "tala",
      "mshwari",
      "fuliza",
    ],
  },
  {
    id: "work",
    name: "Work & Subscriptions",
    patterns: [
      "vercel",
      "cursor",
      "git",
      "aws",
      "google",
      "microsoft",
      "subscription",
      "netlify",
      "stripe",
      "paystack",
      "domain",
      "hosting",
    ],
  },
  {
    id: "savings",
    name: "Savings / Goals",
    patterns: ["saving", "savings", "goal", "piggy", "investment", "bamboo"],
  },
  {
    id: "debt",
    name: "Debt / Loans",
    patterns: ["loan", "repay", "repayment", "credit", "installment", "fuliza"],
  },
  {
    id: "misc",
    name: "Miscellaneous",
    patterns: ["misc", "other", "uncategorized", "unknown"],
  },
];

///////////////////////////
// Utilities
///////////////////////////

/** Normalize merchant string for matching */
function normalize(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s@.-]/gu, " ") // remove weird punctuation but keep @ . - and numbers
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize string into meaningful words (skip tiny tokens) */
function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length >= 2 && !/^\d+$/.test(t));
}

/** Detect Paybill or Till patterns in a merchant string */
function detectPaybillOrTill(raw: string) {
  const cleaned = raw.replace(/\s+/g, "");
  const paybillMatch = cleaned.match(/(paybill[:#-]?|paybill|paybile|billto)?\s*([0-9]{5,6})/i);
  const tillMatch = cleaned.match(/(till[:#-]?|till|tillno)?\s*([0-9]{3,6})/i);
  return {
    isPaybill: !!paybillMatch,
    paybillNumber: paybillMatch ? paybillMatch[2] : null,
    isTill: !!tillMatch,
    tillNumber: tillMatch ? tillMatch[2] : null,
  };
}

///////////////////////////
// Scoring logic
///////////////////////////

/**
 * Scoring heuristics (simple, tunable):
 * - regex match: +12
 * - exact substring match: +8
 * - token match (word-level): +3 per matching token
 * - merchant canonical mapping match: +15 (useful for cleaned merchant table)
 *
 * Final confidence = min(1, score / 22)  (22 chosen as reasonable threshold)
 */

const SCORES = {
  REGEX: 12,
  SUBSTR: 8,
  TOKEN: 3,
  CANONICAL: 15,
};

function scoreAgainstPattern(merchant: string, tk: string[], pattern: string | RegExp) {
  const result = { score: 0, matchedTokens: [] as string[], matchedPattern: pattern };
  if (pattern instanceof RegExp) {
    if (pattern.test(merchant)) {
      result.score += SCORES.REGEX;
    }
    return result;
  }
  const pat = pattern.toLowerCase();
  if (merchant.includes(pat)) {
    result.score += SCORES.SUBSTR;
    result.matchedTokens.push(pat);
  }
  // token matches
  tk.forEach((t) => {
    if (t.includes(pat) || pat.includes(t)) {
      result.score += SCORES.TOKEN;
      result.matchedTokens.push(t);
    }
  });
  return result;
}

///////////////////////////
// Canonical merchant normalizer (small sample table)
// You can expand this mapping with real merchant cleaning rules.
// e.g. "NAIVAS NVS 123" -> "naivas"
///////////////////////////
const CANONICAL_MERCHANTS: Record<string, string> = {
  naivas: "naivas",
  carrefour: "carrefour",
  jumia: "jumia",
  "uber *": "uber",
  bolt: "bolt",
  kfc: "kfc",
  "safaricom": "safaricom",
};

function canonicalLookup(merchant: string) {
  // quick contains check
  for (const key of Object.keys(CANONICAL_MERCHANTS)) {
    const k = key.replace(/\*/g, "").toLowerCase();
    if (merchant.includes(k)) {
      return { canonical: CANONICAL_MERCHANTS[key], key };
    }
  }
  return null;
}

///////////////////////////
// Main categorize function
///////////////////////////

export function categorizeTransaction(rawMerchant: string, rawDescription?: string): CategorizationResult {
  const merged = [rawMerchant || "", rawDescription || ""].join(" ");
  const normalized = normalize(merged);
  const tk = tokens(normalized);

  // quick paybill/till detection (used as fallback or for policy)
  const paybillInfo = detectPaybillOrTill(merged);

  // canonical merchant boost
  const canonical = canonicalLookup(normalized);
  let best: { category?: string; score: number; matchedPattern?: string | RegExp; tokensMatched: string[] } = { score: 0, tokensMatched: [] };

  if (canonical) {
    // give a small boost on canonical presence (we don't map canonical->category here, but later you can)
    best.score += SCORES.CANONICAL / 2;
    best.tokensMatched.push(canonical.key);
  }

  for (const cat of CATEGORY_RULES) {
    let categoryScore = 0;
    const tokensMatched: string[] = [];
    let matchedPattern: string | RegExp | undefined;

    for (const pat of cat.patterns) {
      const res = scoreAgainstPattern(normalized, tk, pat);
      categoryScore += res.score;
      if (res.score > 0) {
        matchedPattern ??= pat;
        tokensMatched.push(...res.matchedTokens);
      }
    }

    // Slight boost if paybill number + known paybill merchant patterns
    if (paybillInfo.isPaybill && /paybill|paybillno|till/i.test(normalized)) {
      // heuristics: paybills often map to utilities, bills, subscriptions, merchant payments
      if (cat.id === "utilities" || cat.id === "finance" || cat.id === "work") {
        categoryScore += 6;
      }
    }

    // record best
    if (categoryScore > best.score) {
      best = {
        category: cat.name,
        score: categoryScore,
        matchedPattern: matchedPattern,
        tokensMatched,
      };
    }
  }

  // derive confidence
  const rawScore = best.score;
  const confidence = Math.min(1, rawScore / 22); // tweak denominator as you tune

  return {
    category: best.category || null,
    score: rawScore,
    confidence,
    matchedPattern: best.matchedPattern,
    normalizedMerchant: normalized,
    tokensMatched: best.tokensMatched,
  };
}

///////////////////////////
// Example usage / quick tests
///////////////////////////

// Example demo transactions (use in unit tests or during local runs)
const SAMPLE_TX = [
  { merchant: "NAIVAS NAIROBI TILL 2345", desc: "MPESA PAYMENT", amt: -2450 },
  { merchant: "Uber BV *Trip ID XW123", desc: "UBER TRIP", amt: -480 },
  { merchant: "PAYBILL 123456 KPLC TOKEN", desc: "", amt: -3500 },
  { merchant: "JUMIA ONLINE SHOPPING", desc: "ORDER 9876", amt: -5200 },
  { merchant: "M-PESA TRANSFER TO 07XXXXXXX (JOHN)", desc: "", amt: -1000 },
  { merchant: "NETFLIX.COM SUBS", desc: "", amt: -1200 },
];

function demoRun() {
  console.log("Demo categorization:");
  for (const t of SAMPLE_TX) {
    const out = categorizeTransaction(t.merchant, t.desc);
    console.log(t.merchant, "=>", out.category, `(${(out.confidence * 100).toFixed(0)}%)`, out.matchedPattern || "", out.tokensMatched.slice(0, 3));
  }
}

// uncomment to run locally
// demoRun();

export default {
  categorizeTransaction,
  CATEGORY_RULES,
};
