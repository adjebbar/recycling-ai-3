"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ScanLine, Trophy } from "lucide-react";
import { LucideProps } from "lucide-react";
import React from "react";

interface HowItWorksDialogProps {
  children: React.ReactNode;
}

interface Step {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
}

const steps: Step[] = [
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

export const HowItWorksDialog = ({ children }: HowItWorksDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-2">How It Works</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Get started with EcoScan AI in three simple steps.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="bg-background/50 backdrop-blur-lg border text-left shadow-lg rounded-xl">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <Icon className="h-8 w-8 text-orange" />
                  <CardTitle className="text-foreground">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};