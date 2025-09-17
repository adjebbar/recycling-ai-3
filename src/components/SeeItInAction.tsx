"use client";

import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recycle, ScanLine, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// A more detailed component to represent a water bottle
const PlasticBottle = ({ className }: { className?: string }) => (
  <div className={cn("relative h-32 w-12", className)}>
    {/* Cap */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-6 bg-sky-500 rounded-t-sm z-10 border-x-2 border-t-2 border-sky-600" />
    {/* Neck */}
    <div className="absolute top-3 left-1/2 -translate-x-1/2 h-2 w-4 bg-sky-400/80" />
    {/* Body */}
    <div className="absolute top-5 left-0 w-full h-[108px] bg-sky-300/60 rounded-t-lg rounded-b-md border-2 border-sky-400/80 overflow-hidden">
      {/* Water inside */}
      <div className="absolute bottom-0 left-0 w-full h-5/6 bg-sky-400/70" />
      {/* Label */}
      <div className="absolute top-8 left-0 w-full h-10 bg-white/80 flex items-center justify-center">
        <div className="w-full h-0.5 bg-gray-300" />
        <div className="w-5 h-5 bg-blue-500 rounded-full absolute" />
        <div className="w-full h-0.5 bg-gray-300 absolute top-8" />
      </div>
      {/* Reflection Highlight */}
      <div className="absolute top-4 left-1.5 w-1.5 h-20 bg-white/50 rounded-full" />
    </div>
  </div>
);

// A component to represent the phone with a dynamic screen
const PhoneMockup = ({ screenContent }: { screenContent: ReactNode }) => (
  <div className="relative h-56 w-28 bg-slate-800 rounded-2xl border-4 border-slate-900 shadow-lg">
    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 bg-slate-900 rounded-full" />
    <div className="absolute inset-x-1 top-4 bottom-1 bg-black rounded-lg overflow-hidden p-2 flex items-center justify-center">
      {screenContent}
    </div>
  </div>
);

type AnimationPhase = 'idle' | 'bottleIn' | 'scanning' | 'verifying' | 'reward' | 'recycling' | 'recycled';

const SeeItInAction = () => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [binEffect, setBinEffect] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let isMounted = true;

    const runSequence = () => {
      if (!isMounted) return;

      setPhase('bottleIn');
      timers.push(setTimeout(() => { if (isMounted) setPhase('scanning'); }, 500));
      timers.push(setTimeout(() => { if (isMounted) setPhase('verifying'); }, 2500));
      timers.push(setTimeout(() => { if (isMounted) setPhase('reward'); }, 3500));
      timers.push(setTimeout(() => { if (isMounted) setPhase('recycling'); }, 4500));
      timers.push(setTimeout(() => {
        if (isMounted) {
          setPhase('recycled');
          setBinEffect(true);
        }
      }, 5200));
      timers.push(setTimeout(() => { if (isMounted) setBinEffect(false); }, 5700));
      
      // Schedule the next full sequence
      timers.push(setTimeout(runSequence, 8000)); // Full sequence + 2s pause
    };

    // Initial start with a delay
    const initialTimeout = setTimeout(runSequence, 500);
    timers.push(initialTimeout);

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  const getScreenContent = () => {
    switch (phase) {
      case 'scanning':
        return <p className="text-sm text-white">Scanning...</p>;
      case 'verifying':
        return <Loader2 className="h-8 w-8 text-white animate-spin" />;
      case 'reward':
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      default:
        return <ScanLine className="h-10 w-10 text-primary" />;
    }
  };

  const statusText = {
    idle: "Ready to scan...",
    bottleIn: "Bottle detected...",
    scanning: "Scanning barcode...",
    verifying: "Verifying material...",
    reward: "Plastic bottle verified!",
    recycling: "Recycling...",
    recycled: "Success!",
  }[phase];

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/80 backdrop-blur-lg border shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-64 w-full flex items-center justify-between">
          {/* Phone on the left */}
          <PhoneMockup screenContent={getScreenContent()} />

          {/* Animation Space */}
          <div className="absolute left-0 top-0 w-full h-full">
            {/* Scanning Laser */}
            <div className={cn(
              "absolute left-[30%] h-24 w-0.5 bg-red-500/70 shadow-[0_0_10px_red] rounded-full transition-opacity duration-300",
              phase === 'scanning' ? 'opacity-100 animate-scan-line-sweep' : 'opacity-0'
            )} />

            {/* Bottle */}
            <div className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out",
              (phase === 'idle' || phase === 'recycled') && 'opacity-0 scale-75',
              (phase === 'bottleIn' || phase === 'scanning' || phase === 'verifying' || phase === 'reward') && 'opacity-100 scale-100',
              phase === 'recycling' && 'opacity-100 scale-100 translate-x-[110%]',
            )}>
              <PlasticBottle />
              {phase === 'reward' && (
                <Badge variant="secondary" className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg bg-primary/20 text-primary-foreground animate-point-burst">
                  +10 Points
                </Badge>
              )}
            </div>
          </div>

          {/* Recycling Bin on the right */}
          <div className="z-10">
            <Recycle className={cn(
              "h-28 w-28 text-primary transition-all duration-300",
              binEffect && "animate-bin-shake scale-110 animate-glow-pulse"
            )} />
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="font-semibold text-lg h-6">
            {statusText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeeItInAction;