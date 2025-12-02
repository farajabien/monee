import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { MPesaAnalyzerClient } from "@/components/marketing/mpesa-analyzer-client";

export const dynamic = 'force-dynamic';

export default function FreeMPesaAnalyzer() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="mx-auto">
            <BarChart3 className="h-3 w-3 mr-1" />
            Free Tool • No Login Required
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Free M-Pesa{" "}
            <span className="text-primary">Transaction Analyzer</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            It&apos;s Monday. Can you tell where all your money went? Upload
            your last 3 days, 7 days, or monthly M-Pesa statement and see
            everything clearly.
          </p>
          <p className="text-sm text-muted-foreground">
            ✨ Completely free • No signup required • Instant insights
          </p>
        </div>
      </section>

      {/* Analyzer Section */}
      <section className="container mx-auto px-4 py-8">
        <MPesaAnalyzerClient />
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                1
              </div>
              <h3 className="font-semibold">Upload or Paste</h3>
              <p className="text-sm text-muted-foreground">
                Drop your M-Pesa PDF statement or paste SMS messages
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                2
              </div>
              <h3 className="font-semibold">Instant Analysis</h3>
              <p className="text-sm text-muted-foreground">
                We analyze your transactions and categorize them automatically
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                3
              </div>
              <h3 className="font-semibold">Get Insights</h3>
              <p className="text-sm text-muted-foreground">
                See where your money went with clear charts and breakdowns
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
