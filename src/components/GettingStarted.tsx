"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ScanLine, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Choose Your Recycling Path",
    description: "Scan bottles anonymously for instant points, or create an account to track your progress and unlock exclusive benefits.",
  },
  {
    icon: ScanLine,
    title: "2. Scan Plastic Bottles",
    description: "Use your phone's camera to scan the barcode on plastic bottles you want to recycle and earn points.",
  },
  {
    icon: Trophy,
    title: "3. Enjoy Your Rewards",
    description: "Redeem your accumulated points for shopping vouchers (anonymous) or exclusive rewards and achievements (account holders).",
  },
];

const GettingStarted = () => {
  return (
    <>
      <div className="bg-background/30 p-6 rounded-lg shadow-lg mb-6 text-center">
        <h2 className="text-3xl font-bold text-white">How It Works</h2>
        <p className="text-white mt-2 max-w-2xl mx-auto">Follow these simple steps to start your recycling journey.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} className="bg-background/50 backdrop-blur-md border text-left shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-white">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default GettingStarted;