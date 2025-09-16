"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recycle, ScanLine } from "lucide-react";
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
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'scanned' | 'recycling'>('idle');

  useEffect(() => {
    const sequence = [
      () => setPhase('scanning'),
      () => setPhase('scanned'),
      () => setPhase('recycling'),
      () => setPhase('idle'),
    ];

    const timers = [
      setTimeout(sequence[0], 500),   // Start scanning
      setTimeout(sequence[1], 2000),  // Scan complete
      setTimeout(sequence[2], 3000),  // Start recycling
      setTimeout(sequence[3], 4500),  // Reset
    ];

    return () => timers.forEach(clearTimeout);
  }, [phase === 'idle']);

  const statusText = {
    idle: "Ready to scan...",
    scanning: "Scanning for plastic bottles...",
    scanned: "Points awarded!",
    recycling: "Recycling complete!",
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-lg border shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-56 w-full flex items-center justify-between">
          {/* Phone on the left */}
          <PhoneMockup>
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-2">
              <ScanLine className={cn("h-10 w-10 text-primary transition-opacity", phase === 'scanning' ? 'opacity-100' : 'opacity-50')} />
              <p className="text-xs font-semibold mt-2">SCANNER</p>
            </div>
          </PhoneMockup>

          {/* Animation Space */}
          <div className="absolute left-0 top-0 w-full h-full">
            {/* Scanning Beam */}
            <div className={cn(
              "absolute left-[28%] top-1/2 -translate-y-1/2 h-1 bg-primary/80 rounded-full origin-left transition-transform duration-1000 ease-in-out",
              phase === 'scanning' ? "scale-x-100" : "scale-x-0"
            )} style={{ width: '44%' }} />

            {/* Bottle */}
            <div
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1500 ease-in-out",
                phase === 'idle' || phase === 'scanning' ? "opacity-0 scale-75" : "opacity-100 scale-100",
                phase === 'recycling' && "translate-x-[120%] scale-50 opacity-0",
              )}
            >
              <PlasticBottle className={cn("scale-125", phase === 'scanned' && "animate-pulse-once")} />
              {phase === 'scanned' && (
                <Badge
                  variant="secondary"
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg bg-primary/20 text-primary-foreground animate-point-burst"
                >
                  +10 Points
                </Badge>
              )}
            </div>
          </div>

          {/* Recycling Bin on the right */}
          <div className="z-10">
            <Recycle
              className={cn(
                "h-24 w-24 text-primary transition-transform",
                phase === 'recycling' && "animate-pulse-once"
              )}
            />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="font-semibold text-lg h-6">
            {statusText[phase]}
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