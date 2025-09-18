"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ScanLine, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Create an Account",
    description: "Sign up to track your recycling progress, earn points, and unlock exclusive rewards.",
  },
  {
    icon: ScanLine,
    title: "2. Scan Plastic Bottles",
    description: "Use your phone's camera to scan the barcode on plastic bottles you want to recycle and earn points.",
  },
  {
    icon: Trophy,
    title: "3. Redeem Rewards",
    description: "Exchange your accumulated points for exciting vouchers, discounts, or other exclusive rewards from our partners.",
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
            <Card key={index} className="bg-card/70 backdrop-blur-lg border text-center shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Icon className="h-8 w-8 text-primary" />
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default GettingStarted;