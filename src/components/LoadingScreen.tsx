"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Recycle } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <Recycle className="h-24 w-24 text-primary animate-pulse-once mb-6" />
      <h1 className="text-4xl font-bold mb-4">Loading EcoScan AI...</h1>
      <div className="space-y-2 w-64">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
};

export default LoadingScreen;