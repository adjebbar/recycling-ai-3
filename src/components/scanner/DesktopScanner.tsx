"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Keyboard } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { ImageAnalysis } from './ImageAnalysis.tsx';
import { useTranslation } from 'react-i18next';

interface DesktopScannerProps {
  state: any;
  actions: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  scanFailureMessage: string | null; // New prop
}

export const DesktopScanner = ({ state, actions, fileInputRef, scanFailureMessage }: DesktopScannerProps) => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="camera" className="w-full max-w-lg">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />{t('scanner.cameraTab')}</TabsTrigger>
        <TabsTrigger value="manual"><Keyboard className="mr-2 h-4 w-4" />{t('scanner.manualTab')}</TabsTrigger>
      </TabsList>
      <TabsContent value="camera">
        <Card className="overflow-hidden">
          <CardContent className="p-4 relative flex items-center justify-center">
            {state.imageAnalysisMode ? (
              <ImageAnalysis
                capturedImage={state.capturedImage}
                isAnalyzing={state.isAnalyzingImage}
                onCapture={actions.handleImageCapture}
                onAnalyze={actions.handleImageAnalysis}
                onCancel={() => actions.updateState({ imageAnalysisMode: false })}
                fileInputRef={fileInputRef}
              />
            ) : (
              <div className="w-full max-w-xs mx-auto h-96 overflow-hidden rounded-md relative">
                <BarcodeScanner
                  onScanSuccess={actions.processBarcode}
                  onScanFailure={(error: string) => actions.updateState({ scanFailureMessage: t('scanner.noBarcodeDetected') })}
                  onCameraInitError={(error: string) => actions.updateState({ cameraInitializationError: error })}
                  message={scanFailureMessage} // Pass the message
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="manual">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>{t('scanner.manualTitle')}</CardTitle>
            <CardDescription>{t('scanner.manualDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={actions.handleManualSubmit} className="flex space-x-2">
              <Input
                type="text"
                placeholder={t('scanner.manualPlaceholder')}
                value={state.manualBarcode}
                onChange={(e) => actions.updateState({ manualBarcode: e.target.value })}
              />
              <Button type="submit">{t('scanner.manualButton')}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};