"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileScanner } from './MobileScanner.tsx';
import { DesktopScanner } from './DesktopScanner.tsx';
import { ScanResultOverlay } from './ScanResultOverlay.tsx';
import { Card, CardContent } from '@/components/ui/card';

interface ScannerViewProps {
  state: any;
  actions: any;
  // Removed fileInputRef as ImageAnalysis is removed
}

export const ScannerView = ({ state, actions }: ScannerViewProps) => {
  const isMobile = useIsMobile();

  // Determine the message to show, only if no scan result is active
  const messageToShow = (state.scanFailureMessage && !state.scanResult)
    ? state.scanFailureMessage
    : null;

  return (
    <Card className="w-full max-w-lg overflow-hidden">
      <CardContent className="p-4 relative flex items-center justify-center">
        {isMobile ? (
          <MobileScanner 
            state={state} 
            actions={actions} 
            scanFailureMessage={messageToShow} // Pass the message
          />
        ) : (
          <DesktopScanner 
            state={state} 
            actions={actions} 
            scanFailureMessage={messageToShow} // Pass the message
          />
        )}
        <ScanResultOverlay scanResult={state.scanResult} />
      </CardContent>
    </Card>
  );
};