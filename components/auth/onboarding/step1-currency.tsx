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
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6 space-y-6">
      <Card className="border-2 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-3">

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl font-semibold leading-tight">
                Choose Your Currency
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                This will be used for all your transactions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5">
            <Label htmlFor="currency" className="text-sm font-medium">
              Currency
            </Label>
            <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
              <SelectTrigger id="currency" className="h-12 text-base w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[280px] sm:max-h-[320px]">
                {currencies.map((curr) => (
                  <SelectItem
                    key={curr.code}
                    value={curr.code}
                    className="h-12 text-base cursor-pointer"
                  >
                    {curr.name} ({curr.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You can change this later in settings
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-auto pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full h-12 text-base font-medium shadow-sm"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
