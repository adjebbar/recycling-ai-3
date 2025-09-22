"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileScanner } from './MobileScanner.tsx';
import { DesktopScanner } from './DesktopScanner.tsx';
import { ScanResultOverlay } from './ScanResultOverlay.tsx';
import { Card, CardContent } from '@/components/ui/card';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import Html5QrcodeScanner type

interface ScannerViewProps {
  state: any;
  actions: any;
  scannerRef: React.MutableRefObject<Html5QrcodeScanner | null>; // Pass scannerRef
}

export const ScannerView = ({ state, actions, scannerRef }: ScannerViewProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className="w-full max-w-lg overflow-hidden">
      <CardContent className="p-4 relative flex items-center justify-center">
        {isMobile ? (
          <MobileScanner state={state} actions={actions} scannerRef={scannerRef} />
        ) : (
          <DesktopScanner state={state} actions={actions} scannerRef={scannerRef} />
        )}
        <ScanResultOverlay scanResult={state.scanResult} />
      </CardContent>
    </Card>
  );
};