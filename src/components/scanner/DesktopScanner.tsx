"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Keyboard, Loader2 } from 'lucide-react'; // Added Loader2
import BarcodeScanner from '@/components/BarcodeScanner';
import { useTranslation } from 'react-i18next';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import Html5QrcodeScanner type

interface DesktopScannerProps {
  state: any;
  actions: any;
  scannerRef: React.MutableRefObject<Html5QrcodeScanner | null>; // Pass scannerRef
}

export const DesktopScanner = ({ state, actions, scannerRef }: DesktopScannerProps) => {
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
            <div className="w-full max-w-xs mx-auto h-96 overflow-hidden rounded-md relative flex items-center justify-center">
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
            </div>
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