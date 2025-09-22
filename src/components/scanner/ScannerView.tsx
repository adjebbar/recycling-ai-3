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

  return (
    <Card className="w-full max-w-lg overflow-hidden">
      <CardContent className="p-4 relative flex items-center justify-center">
        {isMobile ? (
          <MobileScanner state={state} actions={actions} fileInputRef={fileInputRef} />
        ) : (
          <DesktopScanner state={state} actions={actions} fileInputRef={fileInputRef} />
        )}
        <ScanResultOverlay scanResult={state.scanResult} />
        {/* Removed the conditional rendering of state.scanFailureMessage */}
      </CardContent>
    </Card>
  );
};