"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileScanner } from './MobileScanner.tsx';
import { DesktopScanner } from './DesktopScanner.tsx';
import { ScanResultOverlay } from './ScanResultOverlay.tsx';
import { Card, CardContent } from '@/components/ui/card';

interface ScannerViewProps {
  state: any;
  actions: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ScannerView = ({ state, actions, fileInputRef }: ScannerViewProps) => {
  const isMobile = useIsMobile();

  // Determine the message to show, only if no scan result is active and not in image analysis mode
  const messageToShow = (state.scanFailureMessage && !state.scanResult && !state.imageAnalysisMode)
    ? state.scanFailureMessage
    : null;

  return (
    <Card className="w-full max-w-lg overflow-hidden">
      <CardContent className="p-4 relative flex items-center justify-center">
        {isMobile ? (
          <MobileScanner 
            state={state} 
            actions={actions} 
            fileInputRef={fileInputRef} 
            scanFailureMessage={messageToShow} // Pass the message
          />
        ) : (
          <DesktopScanner 
            state={state} 
            actions={actions} 
            fileInputRef={fileInputRef} 
            scanFailureMessage={messageToShow} // Pass the message
          />
        )}
        <ScanResultOverlay scanResult={state.scanResult} />
        {/* The scanFailureMessage is now handled by BarcodeScanner directly */}
      </CardContent>
    </Card>
  );
};