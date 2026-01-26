"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Cloud, Monitor, ArrowRight, Wallet, Check } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<"cloud" | "self-hosted">("cloud");

  const handleGetStarted = () => {
    // In a real app, you might save the plan preference here
    // For now, simple navigation
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 antialiased transition-colors duration-200">
      {/* Header */}
      <div className="w-full flex flex-col items-center mt-12 mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
          <Wallet className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">MONEE</h1>
        <p className="text-muted-foreground text-center text-sm font-medium max-w-[280px]">
          Master your personal finances. <br />
          Simple. Private. Powerful.
        </p>
      </div>

      {/* Plans Selection */}
      <div className="w-full max-w-md space-y-4 flex-grow flex flex-col justify-center">
        
        {/* Cloud Plan */}
        <div 
          className="relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          onClick={() => setPlan("cloud")}
        >
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-10 uppercase tracking-wide">
            Recommended
          </div>
          <div className={`relative flex flex-col p-5 bg-card border-2 ${plan === "cloud" ? "border-primary" : "border-border"} rounded-2xl shadow-xl shadow-primary/5`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Cloud className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cloud</h3>
                  <p className="text-xs text-muted-foreground">Sync across all devices</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-primary">KSh 999</span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-accent px-2 py-0.5 rounded">LIFETIME</span>
              </div>
            </div>
            
            <ul className="space-y-2 mt-2">
              <li className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                Auto-sync & Cloud Backups
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                Encrypted Data
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                Priority Support
              </li>
            </ul>

            {/* Checkmark for selection */}
            {plan === "cloud" && (
                <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-0.5 shadow-sm">
                    <Check className="h-4 w-4" />
                </div>
            )}
          </div>
        </div>

        {/* Self-Hosted Plan */}
        <div 
          className="relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          onClick={() => setPlan("self-hosted")}
        >
          <div className={`relative flex flex-col p-5 bg-card border ${plan === "self-hosted" ? "border-primary ring-1 ring-primary" : "border-border"} rounded-2xl shadow-sm hover:border-gray-300 dark:hover:border-gray-600`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Monitor className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Self-Hosted</h3>
                  <p className="text-xs text-muted-foreground">Manage your own data</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold">Free</span>
                <span className="text-[10px] font-semibold text-muted-foreground">OPEN SOURCE</span>
              </div>
            </div>
            
            <ul className="space-y-2 mt-2">
              <li className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-muted-foreground mr-2" />
                Bring your own server
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-muted-foreground mr-2" />
                For Developers & Hobbyists
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-muted-foreground mr-2" />
                Manual Backups
              </li>
            </ul>

            {/* Checkmark for selection */}
            {plan === "self-hosted" && (
                <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-0.5 shadow-sm">
                    <Check className="h-4 w-4" />
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="w-full max-w-md mt-8 mb-6">
        <Button 
            className="w-full bg-primary hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-primary/25 transition duration-300 text-lg"
            onClick={handleGetStarted}
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a className="underline decoration-primary font-medium text-foreground" href="#">Terms</a>{" "}
          and{" "}
          <a className="underline decoration-primary font-medium text-foreground" href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
