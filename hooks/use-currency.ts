import { useMemo } from "react";
import {
  formatCurrency as formatCurrencyUtil,
  formatCurrencyCompact as formatCurrencyCompactUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  getLocaleForCurrency,
  type CurrencyConfig,
  getCurrencyConfig,
} from "@/lib/currency-utils";

/**
 * Hook to access user's currency preferences and formatting utilities
 * @param userCurrency - The user's preferred currency from their profile
 * @param userLocale - The user's preferred locale from their profile
 * @returns Currency utilities and configuration
 */
export function useCurrency(
  userCurrency?: string,
  userLocale?: string
) {
  const currency = userCurrency || DEFAULT_CURRENCY;
  const locale = userLocale || userLocale || getLocaleForCurrency(currency);

  const config: CurrencyConfig = useMemo(
    () => getCurrencyConfig(currency),
    [currency]
  );

  const formatCurrency = useMemo(
    () => (amount: number, options?: Intl.NumberFormatOptions) =>
      formatCurrencyUtil(amount, currency, locale, options),
    [currency, locale]
  );

  const formatCurrencyCompact = useMemo(
    () => (amount: number) =>
      formatCurrencyCompactUtil(amount, currency, locale),
    [currency, locale]
  );

  const getCurrencySymbol = useMemo(
    () => () => getCurrencySymbolUtil(currency),
    [currency]
  );

  return {
    currency,
    locale,
    config,
    formatCurrency,
    formatCurrencyCompact,
    getCurrencySymbol,
  };
}
