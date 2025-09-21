"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ScanLine, Trophy } from "lucide-react";
import { LucideProps } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Step {
  icon: React.ElementType<LucideProps>;
  titleKey: string;
  descriptionKey: string;
}

const steps: Step[] = [
  {
    icon: UserPlus,
    titleKey: "howItWorks.step1Title",
    descriptionKey: "howItWorks.step1Description",
  },
  {
    icon: ScanLine,
    titleKey: "howItWorks.step2Title",
    descriptionKey: "howItWorks.step2Description",
  },
  {
    icon: Trophy,
    titleKey: "howItWorks.step3Title",
    descriptionKey: "howItWorks.step3Description",
  },
];

export const HowItWorksSection = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
        {t('howItWorks.title')}
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card 
              key={index} 
              className={cn(
                "bg-card/70 backdrop-blur-lg border text-left shadow-lg rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in-up",
                `animation-delay-${index * 100}ms` // Add delay for staggered animation
              )}
            >
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Icon className="h-8 w-8 text-orange" />
                <CardTitle className="text-foreground">{t(step.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t(step.descriptionKey)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};