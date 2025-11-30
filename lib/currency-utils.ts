/**
 * Centralized currency formatting utilities for MONEE
 * Provides dynamic currency formatting based on user preferences
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

/**
 * Supported currencies in MONEE
 */
export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    locale: "en-KE",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "en-GB",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
  },
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    locale: "en-NG",
  },
  ZAR: {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
    locale: "en-ZA",
  },
  TZS: {
    code: "TZS",
    symbol: "TSh",
    name: "Tanzanian Shilling",
    locale: "en-TZ",
  },
  UGX: {
    code: "UGX",
    symbol: "USh",
    name: "Ugandan Shilling",
    locale: "en-UG",
  },
};

/**
 * Default currency for new users
 */
export const DEFAULT_CURRENCY = "KES";
export const DEFAULT_LOCALE = "en-KE";

/**
 * Format a number as currency using the specified currency code and locale
 * @param amount - The amount to format
 * @param currency - Currency code (e.g., "USD", "KES")
 * @param locale - Locale string (e.g., "en-US", "en-KE")
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

/**
 * Format a number in compact notation (e.g., 1.5M, 2.3K)
 * @param amount - The amount to format
 * @param currency - Currency code
 * @param locale - Locale string
 * @returns Formatted compact currency string
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  // For numbers >= 1M, show in millions
  if (Math.abs(amount) >= 1000000) {
    const compact = (amount / 1000000).toFixed(1);
    const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || currency;
    return `${symbol}${compact}M`;
  }

  // For numbers >= 1K, show in thousands
  if (Math.abs(amount) >= 1000) {
    const compact = (amount / 1000).toFixed(1);
    const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || currency;
    return `${symbol}${compact}K`;
  }

  // For smaller numbers, use regular formatting
  return formatCurrency(amount, currency, locale);
}

/**
 * Get currency symbol for a given currency code
 * @param currency - Currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || currency;
}

/**
 * Get locale for a given currency code
 * @param currency - Currency code
 * @returns Locale string
 */
export function getLocaleForCurrency(currency: string = DEFAULT_CURRENCY): string {
  return SUPPORTED_CURRENCIES[currency]?.locale || DEFAULT_LOCALE;
}

/**
 * Get currency configuration
 * @param currency - Currency code
 * @returns Currency configuration object
 */
export function getCurrencyConfig(currency: string = DEFAULT_CURRENCY): CurrencyConfig {
  return SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Validate if a currency code is supported
 * @param currency - Currency code to validate
 * @returns True if supported, false otherwise
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency in SUPPORTED_CURRENCIES;
}

/**
 * Get list of all supported currency codes
 * @returns Array of currency codes
 */
export function getSupportedCurrencyCodes(): string[] {
  return Object.keys(SUPPORTED_CURRENCIES);
}

/**
 * Get list of all supported currencies with their configs
 * @returns Array of currency configurations
 */
export function getAllCurrencies(): CurrencyConfig[] {
  return Object.values(SUPPORTED_CURRENCIES);
}
