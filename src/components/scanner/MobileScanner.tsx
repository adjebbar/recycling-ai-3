"use client";

import { AspectRatio } from '@/components/ui/aspect-ratio';
import BarcodeScanner from '@/components/BarcodeScanner';
// Removed ImageAnalysis import
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileScannerProps {
  state: any;
  actions: any;
  // Removed fileInputRef as ImageAnalysis is removed
  scanFailureMessage: string | null; // New prop
}

export const MobileScanner = ({ state, actions, scanFailureMessage }: MobileScannerProps) => {
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

  // Removed conditional rendering for ImageAnalysis mode

  return (
    <div className="w-full max-w-xs mx-auto">
      <AspectRatio ratio={3 / 4} className="bg-muted rounded-md overflow-hidden relative">
        <BarcodeScanner
          onScanSuccess={actions.processBarcode}
          onScanFailure={(error: string) => actions.updateState({ scanFailureMessage: t('scanner.noBarcodeDetected') })}
          onCameraInitError={(error: string) => actions.updateState({ cameraInitializationError: error })}
          message={scanFailureMessage} // Pass the message
        />
      </AspectRatio>
    </div>
  );
};