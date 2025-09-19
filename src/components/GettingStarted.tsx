"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ScanLine, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Sign Up or Scan Anonymously",
    description: "Create an account to track progress and unlock rewards, or start scanning right away as a guest.",
  },
  {
    icon: ScanLine,
    title: "2. Scan & Earn Points",
    description: "Use your phone's camera to scan barcodes on plastic bottles. You'll earn points for every successful scan.",
  },
  {
    icon: Trophy,
    title: "3. Redeem Rewards",
    description: "Exchange your points for shopping vouchers and other exclusive rewards in our store.",
  },
];

const GettingStarted = () => {
  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center text-white">How It Works</h2>
      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} className="bg-background/50 backdrop-blur-lg border text-left shadow-lg rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Icon className="h-8 w-8 text-primary" /> {/* Changed to text-primary */}
                <CardTitle className="text-foreground">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default GettingStarted;