"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, GlassWater, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";

const SeeItInAction = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      () => setStep(1), // Start scan
      () => setStep(2), // Show points
      () => setStep(3), // Move bottle
      () => setStep(0), // Reset
    ];

    const timers = sequence.map((action, index) => 
      setTimeout(action, index * 2000 + 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [step === 3]); // Rerun the effect after the sequence completes

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-lg border shadow-xl rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-48 w-full flex items-center justify-center">
          {/* Phone */}
          <Smartphone className="h-32 w-32 text-muted-foreground z-10" />

          {/* Scan Line */}
          {step === 1 && (
            <div className="absolute h-20 w-20 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 overflow-hidden">
              <div className="absolute h-1 w-full bg-primary/70 rounded-full shadow-[0_0_10px_theme(colors.primary)] animate-scan-line" />
            </div>
          )}

          {/* Bottle */}
          <GlassWater
            className={cn(
              "h-16 w-16 text-foreground absolute transition-all duration-1000 ease-in-out",
              step < 3 ? "left-1/2 -translate-x-1/2" : "left-[calc(100%-8rem)]",
              step === 3 && "opacity-0"
            )}
          />

          {/* Points Badge */}
          {step >= 2 && (
            <Badge
              variant="secondary"
              className="absolute left-1/2 -translate-x-1/2 top-8 text-lg bg-primary/20 text-primary-foreground animate-point-burst"
            >
              +10 Points
            </Badge>
          )}

          {/* Recycling Bin */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Recycle
              className={cn(
                "h-20 w-20 text-primary transition-transform",
                step === 3 && "animate-pulse-once"
              )}
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="font-semibold text-lg">
            {step === 0 && "Ready to scan..."}
            {step === 1 && "Scanning for plastic bottles..."}
            {step === 2 && "Points awarded!"}
            {step === 3 && "Recycling complete!"}
          </p>
          <p className="text-sm text-muted-foreground">
            Our system automatically verifies and rewards you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeeItInAction;