"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, GlassWater, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";

const SeeItInAction = () => {
  const [state, setState] = useState<'idle' | 'scanning' | 'scanned' | 'recycling'>('idle');

  useEffect(() => {
    // This creates a continuous loop for the animation
    const sequence = [
      () => setState('scanning'),
      () => setState('scanned'),
      () => setState('recycling'),
      () => setState('idle'),
    ];

    const timers = sequence.map((action, index) =>
      setTimeout(action, (index + 1) * 2000)
    );

    return () => timers.forEach(clearTimeout);
  }, [state === 'idle']); // Rerun the effect only when the animation cycle restarts

  const statusText = {
    idle: "Ready to scan...",
    scanning: "Scanning for plastic bottles...",
    scanned: "Points awarded!",
    recycling: "Recycling complete!",
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-lg border shadow-xl rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-48 w-full flex items-center justify-between px-4 overflow-hidden">
          {/* Phone on the left */}
          <div className="z-10">
            <Smartphone className="h-32 w-32 text-muted-foreground" />
          </div>

          {/* Scan Beam */}
          {state === 'scanning' && (
            <div className="absolute left-1/4 w-1/2 h-1 bg-primary rounded-full animate-scan-beam" />
          )}

          {/* Bottle in the middle, moves to the right */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out z-20",
              state === 'recycling' && "left-[calc(100%-5rem)] opacity-0 scale-50",
              state === 'scanned' && "animate-pulse-once"
            )}
          >
            <GlassWater className="h-16 w-16 text-foreground" />
            {/* Points Badge */}
            {state === 'scanned' && (
              <Badge
                variant="secondary"
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg bg-primary/20 text-primary-foreground animate-point-burst"
              >
                +10 Points
              </Badge>
            )}
          </div>

          {/* Recycling Bin on the right */}
          <div className="z-10">
            <Recycle
              className={cn(
                "h-20 w-20 text-primary transition-transform",
                state === 'recycling' && "animate-pulse-once"
              )}
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="font-semibold text-lg h-6">
            {statusText[state]}
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