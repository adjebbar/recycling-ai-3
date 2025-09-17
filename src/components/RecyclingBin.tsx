"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface RecyclingBinProps {
  className?: string;
  isShaking?: boolean;
}

const RecyclingBin = ({ className, isShaking = false }: RecyclingBinProps) => {
  return (
    <div className={cn("relative w-24 h-32 md:w-28 md:h-36", className)}>
      {/* Bin Body */}
      <div className={cn(
        "absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full bg-gray-700 rounded-b-lg rounded-t-md border-2 border-gray-800 shadow-lg",
        isShaking && "animate-bin-shake"
      )}>
        {/* Recycling Symbol on the front */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-primary/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 md:w-10 md:h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
      {/* Bin Lid */}
      <div className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 w-[110%] h-6 bg-gray-800 rounded-t-lg border-2 border-gray-900",
        isShaking && "animate-bin-shake"
      )} />
    </div>
  );
};

export default RecyclingBin;