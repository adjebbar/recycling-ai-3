"use client";

import { AspectRatio } from '@/components/ui/aspect-ratio';
import BarcodeScanner from '@/components/BarcodeScanner';
import { ImageAnalysis } from './ImageAnalysis.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileScannerProps {
  state: any;
  actions: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const MobileScanner = ({ state, actions, fileInputRef }: MobileScannerProps) => {
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

  if (state.imageAnalysisMode) {
    return (
      <ImageAnalysis
        capturedImage={state.capturedImage}
        isAnalyzing={state.isAnalyzingImage}
        onCapture={actions.handleImageCapture}
        onAnalyze={actions.handleImageAnalysis}
        onCancel={() => actions.updateState({ imageAnalysisMode: false })}
        fileInputRef={fileInputRef}
      />
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <AspectRatio ratio={3 / 4} className="bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
        <BarcodeScanner
          onScanSuccess={actions.processBarcode}
          onScanFailure={() => {}} // Removed setting scanFailureMessage
          onCameraInitError={(error: string) => actions.updateState({ cameraInitializationError: error })}
        />
      </AspectRatio>
    </div>
  );
};