"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recycle, ScanLine, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// A more detailed component to represent a water bottle
const PlasticBottle = ({ className }: { className?: string }) => (
  <div className={cn("relative h-24 w-10", className)}>
    {/* Cap */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-5 bg-sky-500 rounded-t-sm z-10 border-x-2 border-t-2 border-sky-600" />
    
    {/* Bottle Body */}
    <div className="absolute top-2 left-0 w-full h-full bg-sky-300/60 rounded-t-lg rounded-b-md border-2 border-sky-400/80 overflow-hidden">
      {/* Water inside */}
      <div className="absolute bottom-0 left-0 w-full h-5/6 bg-sky-400/70" />
      
      {/* Label */}
      <div className="absolute top-6 left-0 w-full h-8 bg-white/80 flex items-center justify-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full" />
      </div>

      {/* Reflection Highlight */}
      <div className="absolute top-4 left-1.5 w-1 h-16 bg-white/50 rounded-full" />
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

type AnimationPhase = 'idle' | 'scanning' | 'verifying' | 'points_awarded' | 'moving_to_bin' | 'disintegrating' | 'reset';

const SeeItInAction = () => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [binShake, setBinShake] = useState(false);

  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];

    const runSequence = () => {
      setPhase('scanning');
      setBinShake(false);

      timers.push(setTimeout(() => setPhase('verifying'), 1500));
      timers.push(setTimeout(() => setPhase('points_awarded'), 2500));
      timers.push(setTimeout(() => setPhase('moving_to_bin'), 3500));
      timers.push(setTimeout(() => {
        setPhase('disintegrating');
        setBinShake(true);
      }, 4200));
      timers.push(setTimeout(() => setBinShake(false), 4500));
      timers.push(setTimeout(() => setPhase('reset'), 5000));
    };

    // Start the animation loop
    if (phase === 'idle' || phase === 'reset') {
      const startTimer = setTimeout(runSequence, phase === 'idle' ? 500 : 1500);
      timers.push(startTimer);
    }

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const statusText = {
    idle: "Ready to scan...",
    scanning: "Scanning barcode...",
    verifying: "Plastic bottle verified!",
    points_awarded: "Points awarded!",
    moving_to_bin: "Recycling bottle...",
    disintegrating: "Recycling complete!",
    reset: "Ready for next scan...",
  };

  const bottlePhaseClasses: Record<AnimationPhase, string> = {
    idle: 'opacity-0 scale-75',
    scanning: 'opacity-0 scale-75',
    verifying: 'opacity-100 scale-100',
    points_awarded: 'opacity-100 scale-100',
    moving_to_bin: 'opacity-100 scale-100 translate-x-[120%]',
    disintegrating: 'opacity-0 scale-0 translate-x-[120%]',
    reset: 'opacity-0 scale-75',
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-lg border shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-56 w-full flex items-center justify-between">
          {/* Phone on the left */}
          <PhoneMockup>
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-2 relative">
              <ScanLine className={cn(
                "h-10 w-10 text-primary transition-all duration-300",
                phase === 'scanning' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )} />
              <CheckCircle className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-green-500 transition-all duration-300",
                phase === 'verifying' || phase === 'points_awarded' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              )} />
              <p className="absolute bottom-4 text-xs font-semibold">SCANNER</p>
            </div>
          </PhoneMockup>

          {/* Animation Space */}
          <div className="absolute left-0 top-0 w-full h-full">
            {/* Scanning Beam */}
            <div className={cn(
              "absolute left-[28%] top-1/2 -translate-y-1/2 h-1 bg-primary/80 rounded-full origin-left",
              phase === 'scanning' ? "w-[44%] animate-scan-beam-active" : "w-0"
            )} />

            {/* Bottle */}
            <div
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ease-in-out",
                phase === 'reset' ? 'duration-0' : 'transition-all duration-700',
                bottlePhaseClasses[phase]
              )}
            >
              <PlasticBottle className="scale-125" />
              {(phase === 'points_awarded' || phase === 'moving_to_bin') && (
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
                binShake && "animate-bin-shake"
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