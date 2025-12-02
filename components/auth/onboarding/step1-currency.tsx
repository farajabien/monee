"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllCurrencies } from "@/lib/currency-utils";
import { MOBILE_CONFIG } from "./config";
import { Globe } from "lucide-react";

interface Step1CurrencyProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onNext: () => void;
}

export function Step1Currency({
  selectedCurrency,
  onCurrencyChange,
  onNext,
}: Step1CurrencyProps) {
  const currencies = getAllCurrencies();

  return (
    <div className={MOBILE_CONFIG.spacing.sectionGap}>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className={MOBILE_CONFIG.text.title}>
                Choose Your Currency
              </CardTitle>
              <p className={`${MOBILE_CONFIG.text.subtitle} text-muted-foreground mt-1`}>
                This will be used for all your transactions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className={MOBILE_CONFIG.spacing.betweenInputs}>
          <div className="space-y-3">
            <Label htmlFor="currency" className={MOBILE_CONFIG.text.label}>
              Currency
            </Label>
            <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
              <SelectTrigger
                id="currency"
                className={`${MOBILE_CONFIG.input.text} ${MOBILE_CONFIG.touchTarget}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {currencies.map((curr) => (
                  <SelectItem
                    key={curr.code}
                    value={curr.code}
                    className={MOBILE_CONFIG.touchTarget}
                  >
                    {curr.name} ({curr.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`${MOBILE_CONFIG.text.helper} text-muted-foreground`}>
              You can change this later in settings
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onNext}
        size="lg"
        className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full`}
      >
        Continue
      </Button>
    </div>
  );
}
