"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recycle, ScanLine, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// A component to represent a water bottle
const PlasticBottle = ({ className }: { className?: string }) => (
  <div className={cn("relative h-24 w-10", className)}>
    {/* Cap */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-5 bg-sky-500 rounded-t-sm z-10" />
    
    {/* Bottle Body */}
    <div className="absolute top-2 left-0 w-full h-full bg-sky-300/60 rounded-t-lg rounded-b-md border-2 border-sky-400/80 overflow-hidden">
      {/* Water inside */}
      <div className="absolute bottom-0 left-0 w-full h-5/6 bg-sky-400/70" />
      
      {/* Reflection Highlight 1 */}
      <div className="absolute top-4 left-2 w-1 h-12 bg-white/50 rounded-full" />
      
      {/* Reflection Highlight 2 */}
      <div className="absolute top-6 right-2 w-0.5 h-8 bg-white/40 rounded-full" />
    </div>
  </div>
);

// A component to represent the phone
const PhoneMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-48 w-24 bg-slate-800 rounded-2xl border-4 border-slate-900 shadow-lg">
    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-8 bg-slate-900 rounded-full" />
    <div className="absolute inset-x-1 top-4 bottom-1 bg-black rounded-lg overflow-hidden">
      {children}
    </div>
  </div>
);

const SeeItInAction = () => {
  const [state, setState] = useState<'idle' | 'scanning' | 'scanned' | 'recycling'>('idle');

  useEffect(() => {
    const sequence = [
      () => setState('scanning'),
      () => setState('scanned'),
      () => setState('recycling'),
      () => setState('idle'),
    ];

    const timers = sequence.map((action, index) =>
      setTimeout(action, (index + 1) * 2500) // Increased duration for clarity
    );

    return () => timers.forEach(clearTimeout);
  }, [state === 'idle']);

  const statusText = {
    idle: "Ready to scan...",
    scanning: "Scanning for plastic bottles...",
    scanned: "Points awarded!",
    recycling: "Recycling complete!",
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-lg border shadow-xl rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-56 w-full flex items-center justify-around px-4 overflow-hidden">
          {/* Phone on the left */}
          <PhoneMockup>
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-2">
              {state === 'idle' && (
                <div className="animate-fade-in-up space-y-2">
                  <ScanLine className="h-8 w-8 text-primary" />
                  <p className="text-xs font-semibold">Tap to Scan</p>
                </div>
              )}
              {state === 'scanning' && (
                <div className="w-full h-full relative flex items-center justify-center animate-fade-in-up overflow-hidden">
                   <PlasticBottle className="scale-150" />
                   <div className="absolute w-full h-1 bg-red-500/80 rounded-full animate-scan-beam-vertical" />
                </div>
              )}
              {state === 'scanned' && (
                 <div className="animate-point-burst space-y-2">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                    <p className="text-lg font-bold text-green-400">+10 Points</p>
                 </div>
              )}
               {state === 'recycling' && (
                 <div className="animate-fade-in-up space-y-2">
                    <Recycle className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '2s' }} />
                    <p className="text-xs font-semibold">Success!</p>
                 </div>
              )}
            </div>
          </PhoneMockup>

          {/* Bottle in the middle, moves to the right */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out z-20",
              "opacity-0", // Initially hidden
              (state === 'scanning' || state === 'scanned') && "opacity-100",
              state === 'scanned' && "animate-pulse-once",
              state === 'recycling' && "left-[calc(100%-6rem)] opacity-0 scale-50",
            )}
          >
            <PlasticBottle className="scale-125" />
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
                "h-24 w-24 text-primary transition-transform",
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