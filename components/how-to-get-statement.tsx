import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Building2 } from "lucide-react";

export function HowToGetStatement() {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-primary">
          📱 How to Import Your Transactions
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred method to import transactions into MONEE
        </p>

        <Tabs defaultValue="mpesa-pdf" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mpesa-pdf">
              <FileText className="h-4 w-4 mr-2" />
              M-Pesa PDF
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              Copy SMS
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Building2 className="h-4 w-4 mr-2" />
              Bank
            </TabsTrigger>
          </TabsList>

          {/* M-Pesa PDF Tab */}
          <TabsContent value="mpesa-pdf" className="space-y-4">
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
                      Next to <strong>&quot;M-PESA STATEMENTS&quot;</strong>,
                      click <strong>&quot;SEE ALL&quot;</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      3
                    </span>
                    <span>
                      Click <strong>&quot;Export Statements&quot;</strong> button
                      (bottom right)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      4
                    </span>
                    <span>
                      Leave it on <strong>&quot;All Expenses&quot;</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      5
                    </span>
                    <span>
                      Select your date range (max 6 months per statement)
                    </span>
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
                    src="/images/mpesa-see-all-button.jpg"
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
                    src="/images/mpesa-generate-statements.jpg"
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
                    <strong className="text-foreground">Full year?</strong>{" "}
                    Generate 2 statements (Jan-Jun, Jul-Dec)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">Catch up?</strong>{" "}
                    Generate statement for missing period
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">No password!</strong> New
                    app export doesn&apos;t require password ✅
                  </span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* Copy SMS Tab */}
          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-background p-4 rounded-lg border">
                <p className="text-sm font-bold mb-3">📱 How to Copy M-Pesa SMS:</p>
                <ol className="text-sm space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      1
                    </span>
                    <span>
                      Open your phone&apos;s Messages app and search for
                      &quot;M-PESA&quot;
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      2
                    </span>
                    <span>
                      Long-press on any M-Pesa message you want to import
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      3
                    </span>
                    <span>
                      Select multiple messages (you can select as many as you want)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      4
                    </span>
                    <span>Tap &quot;Copy&quot; or the copy icon</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      5
                    </span>
                    <span>
                      Come back to MONEE and paste in the import text area
                    </span>
                  </li>
                </ol>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm font-bold mb-2">✨ Why This Method?</p>
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <strong className="text-foreground">Super fast</strong> for
                      daily check-ins
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <strong className="text-foreground">No files needed</strong>{" "}
                      - just copy and paste
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <strong className="text-foreground">Works great</strong> for
                      catching up on the last few days
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Bank Statements Tab */}
          <TabsContent value="bank" className="space-y-4">
            <div className="bg-muted/50 p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center space-y-4">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <p className="font-bold text-lg mb-2">Coming Soon!</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re working on adding support for bank statement imports.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will include support for:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• KCB Bank statements</li>
                  <li>• Equity Bank statements</li>
                  <li>• Co-operative Bank statements</li>
                  <li>• And more...</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                For now, please use M-Pesa PDF or SMS import, or add transactions
                manually.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
