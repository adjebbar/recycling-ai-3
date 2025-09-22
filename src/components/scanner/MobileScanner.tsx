"use client";

import { AspectRatio } from '@/components/ui/aspect-ratio';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2
import { useTranslation } from 'react-i18next';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import Html5QrcodeScanner type

interface MobileScannerProps {
  state: any;
  actions: any;
  scannerRef: React.MutableRefObject<Html5QrcodeScanner | null>; // Pass scannerRef
}

export const MobileScanner = ({ state, actions, scannerRef }: MobileScannerProps) => {
  const { t } = useTranslation();

  if (state.cameraInitializationError) {
    return (
      <Alert variant="destructive" className="flex flex-col items-center text-center p-6">
        <AlertTriangle className="h-8 w-8 mb-4" />
        <AlertTitle className="text-xl font-bold">{t('scanner.cameraErrorTitle')}</AlertTitle>
        <AlertDescription className="mt-2 text-base">
          {t('scanner.cameraErrorMessage')}
          <Button onClick={() => actions.updateState({ cameraInitializationError: null })} className="mt-6">{t('scanner.retryCamera')}</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <AspectRatio ratio={3 / 4} className="bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
        <BarcodeScanner
          onScanSuccess={actions.processBarcode}
          onScanFailure={() => {}}
          onCameraInitError={(error: string) => actions.updateState({ cameraInitializationError: error })}
          scannerRef={scannerRef} // Pass the scannerRef
        />
        {state.isImageAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-xl font-semibold text-foreground">{t('scanner.analyzingImage')}</p>
          </div>
        )}
      </AspectRatio>
    </div>
  );
};