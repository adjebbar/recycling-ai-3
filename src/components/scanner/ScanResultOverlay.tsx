"use client";

import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ScanResultOverlayProps {
  scanResult: { type: 'success' | 'error'; message: string; imageUrl?: string } | null;
}

export const ScanResultOverlay = ({ scanResult }: ScanResultOverlayProps) => {
  if (!scanResult) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20 transition-opacity duration-300",
      scanResult ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      {scanResult.type === 'success' ? (
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4 animate-pulse-once" />
      ) : (
        <XCircle className="h-16 w-16 text-destructive mb-4 animate-pulse-once" />
      )}
      <p className="text-xl font-semibold text-foreground text-center mb-2">{scanResult.message}</p>
      {scanResult.imageUrl && (
        <img src={scanResult.imageUrl} alt="Scanned Product" className="h-24 w-24 object-contain rounded-md shadow-md" />
      )}
    </div>
  );
};