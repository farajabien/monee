import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export function HowToGetStatement() {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-primary">
          📱 How to Get Your M-Pesa Statement
        </h3>
        <p className="text-sm text-muted-foreground">
          No password required! Get your statement directly from the M-Pesa app in seconds.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Steps */}
          <div className="space-y-3">
            <ol className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  1
                </span>
                <span>Open M-Pesa app on your phone</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  2
                </span>
                <span>
                  Next to <strong>&quot;M-PESA STATEMENTS&quot;</strong>, click{" "}
                  <strong>&quot;SEE ALL&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  3
                </span>
                <span>
                  Click <strong>&quot;Export Statements&quot;</strong> button (bottom right)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  4
                </span>
                <span>
                  Leave it on <strong>&quot;All Transactions&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  5
                </span>
                <span>Select your date range (max 6 months per statement)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  6
                </span>
                <span>
                  Click <strong>&quot;Generate Statement&quot;</strong>
                </span>
              </li>
            </ol>
          </div>

          {/* Screenshots */}
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border">
              <Image
                src="/docs/images/mpesa-see-all-button.png"
                alt="M-Pesa See All Button"
                width={400}
                height={300}
                className="w-full h-auto"
              />
              <p className="text-xs text-center p-2 bg-muted">
                Step 2: Click &quot;SEE ALL&quot; next to M-PESA STATEMENTS
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border">
              <Image
                src="/docs/images/mpesa-generate-statements.png"
                alt="M-Pesa Generate Statements"
                width={400}
                height={300}
                className="w-full h-auto"
              />
              <p className="text-xs text-center p-2 bg-muted">
                Step 3-6: Export and generate your statement
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-background p-4 rounded-lg border mt-4">
          <p className="text-sm font-bold mb-3">💡 Pro Tips:</p>
          <ul className="text-xs space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong className="text-foreground">Full year?</strong> Generate 2
                statements (Jan-Jun, Jul-Dec)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong className="text-foreground">Daily routine?</strong> Just
                generate last 7 days
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong className="text-foreground">Catch up?</strong> Generate
                statement for missing period
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong className="text-foreground">No password!</strong> New app
                export doesn&apos;t require password ✅
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
