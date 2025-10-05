"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Keyboard } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { ImageAnalysis } from './ImageAnalysis.tsx';
import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormDescription, FormField, FormItem } from '@/components/ui/form'; // Import FormItem
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface DesktopScannerProps {
  state: any;
  actions: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  scanFailureMessage: string | null; // New prop
}

// Define a schema for the manual barcode input
const manualBarcodeSchema = z.object({
  barcode: z.string().min(8, "Barcode must be at least 8 digits.").max(13, "Barcode must be at most 13 digits.").regex(/^[0-9]+$/, "Barcode must contain only digits."),
});

type ManualBarcodeFormValues = z.infer<typeof manualBarcodeSchema>;

export const DesktopScanner = ({ state, actions, fileInputRef, scanFailureMessage }: DesktopScannerProps) => {
  const { t } = useTranslation();

  const form = useForm<ManualBarcodeFormValues>({
    resolver: zodResolver(manualBarcodeSchema),
    defaultValues: {
      barcode: state.manualBarcode,
    },
  });

  // Update form value when state.manualBarcode changes
  // This ensures the input is controlled by the global state from useScannerLogic
  if (form.getValues('barcode') !== state.manualBarcode) {
    form.setValue('barcode', state.manualBarcode);
  }

  const onSubmit = (values: ManualBarcodeFormValues) => {
    actions.handleManualSubmit(values.barcode);
    form.reset({ barcode: '' }); // Clear the form after submission
  };

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="tel" // Use tel for numeric keyboard on mobile
                          pattern="[0-9]{8,13}" // Enforce 8 to 13 digits for common barcodes
                          maxLength={13} // Max length for common barcodes
                          placeholder={t('scanner.manualPlaceholder')}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            actions.updateState({ manualBarcode: e.target.value }); // Keep global state updated
                          }}
                          className="shadow-sm"
                        />
                      </FormControl>
                      <FormDescription className="text-left text-muted-foreground text-xs">
                        {t('scanner.manualFormatHint')}
                      </FormDescription>
                      {/* FormMessage can be added here if you want to display validation errors */}
                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                  {t('scanner.manualButton')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};