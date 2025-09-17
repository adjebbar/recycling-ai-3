"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Keyboard, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodeScanner from '@/components/BarcodeScanner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { supabase } from '@/lib/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const POINTS_PER_BOTTLE = 10;

const isPlasticBottle = (product: any): boolean => {
  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon'];
  const plasticKeywords = ['plastic', 'plastique', 'plastico', 'pet', 'hdpe', 'polyethylene'];
  
  // More robust exclusion keywords
  const glassKeywords = ['glass', 'verre', 'vidrio'];
  const metalKeywords = ['metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier'];
  const cartonKeywords = ['carton', 'brick', 'brique', 'tetrapak'];

  const allExclusionMaterials = [...glassKeywords, ...metalKeywords, ...cartonKeywords];

  const packagingInfo: string[] = [
    ...(product.packaging_tags || []),
    ...(product.packagings || []).flatMap((p: any) => [p.material, p.shape]),
    ...(product.packaging || '').split(',').map((s: string) => s.trim())
  ].filter(Boolean).map((tag: string) => (tag.split(':').pop() || '').toLowerCase());

  // --- Step 1: Hard Exclusions ---
  // If any packaging info indicates it's definitely not plastic, reject it.
  if (packagingInfo.some(tag => allExclusionMaterials.includes(tag))) {
    return false;
  }

  // --- Step 2: Hard Inclusions ---
  // If packaging info confirms it's a plastic bottle, accept it.
  const isPlastic = packagingInfo.some(tag => plasticKeywords.includes(tag));
  const isBottle = packagingInfo.some(tag => bottleKeywords.includes(tag));
  if (isPlastic && isBottle) {
    return true;
  }

  // --- Step 3: Fallback to text analysis (more conservative) ---
  // This runs only if packaging info was inconclusive.
  const name = (product.product_name || '').toLowerCase();
  const genericName = (product.generic_name || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  const combinedText = `${name} ${genericName} ${categories}`;

  // Check for exclusion keywords in text as a safety net
  if (allExclusionMaterials.some(keyword => combinedText.includes(keyword))) {
      return false;
  }

  // Check for strong indicators of a plastic bottle in text
  const isDrink = [
    'boisson', 'beverage', 'drink', 'soda', 'eau', 'water', 'jus', 'juice', 'limonade', 'cola', 'lait', 'milk'
  ].some(kw => combinedText.includes(kw));

  const textHasBottle = bottleKeywords.some(kw => combinedText.includes(kw));

  // Only return true if it's a drink AND the word "bottle" is present.
  if (isDrink && textHasBottle) {
    return true;
  }

  return false;
};


const ScannerPage = () => {
  const { t } = useTranslation();
  const { addPoints, user, points, resetAnonymousPoints } = useAuth();
  const animatedPoints = useAnimatedCounter(points);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string; imageUrl?: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null); // New state for camera errors

  useEffect(() => {
    const hasShownPrompt = sessionStorage.getItem('resetPromptShown');
    if (!user && points > 0 && !hasShownPrompt) {
      toast.info(t('scanner.welcomeBackTitle'), {
        description: t('scanner.welcomeBackDescription'),
        action: {
          label: t('scanner.resetScore'),
          onClick: () => resetAnonymousPoints(),
        },
        duration: 10000,
      });
      sessionStorage.setItem('resetPromptShown', 'true');
    }
  }, [user, points, resetAnonymousPoints, t]);

  const processBarcode = async (barcode: string) => {
    if (!barcode || barcode === lastScanned) {
      return;
    }
    
    setLastScanned(barcode);
    const loadingToast = showLoading(t('scanner.verifying'));

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('fetch-product-info', {
        body: { barcode },
      });

      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      dismissToast(loadingToast);

      if (data.status === 1 && data.product) {
        const imageUrl = data.product.image_front_url || data.product.image_url;
        if (isPlasticBottle(data.product)) {
          await addPoints(POINTS_PER_BOTTLE, barcode);
          const successMessage = t('scanner.success', { points: POINTS_PER_BOTTLE });
          showSuccess(successMessage);
          setScanResult({ type: 'success', message: successMessage, imageUrl: imageUrl });
          
          if (!user) {
            const hasShownToast = sessionStorage.getItem('signupToastShown');
            if (!hasShownToast) {
              setTimeout(() => {
                toast.info(t('scanner.signupPromptTitle'), {
                  description: t('scanner.signupPromptDescription'),
                  action: {
                    label: t('nav.signup'),
                    onClick: () => navigate('/signup'),
                  },
                  duration: 10000,
                });
                sessionStorage.setItem('signupToastShown', 'true');
              }, 1500);
            }
          }
        } else {
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          setScanResult({ type: 'error', message: errorMessage });
        }
      } else {
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        setScanResult({ type: 'error', message: errorMessage });
      }
    } catch (err) {
      dismissToast(loadingToast);
      const errorMessage = t('scanner.connectionError');
      showError(errorMessage);
      setScanResult({ type: 'error', message: errorMessage });
      console.error(err);
    } finally {
      setTimeout(() => {
        setLastScanned(null);
        setScanResult(null);
      }, 3000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcode(manualBarcode.trim());
    setManualBarcode('');
  };

  const handleCameraError = (error: string) => {
    console.error("Camera error:", error);
    setCameraError(error);
    showError(t('scanner.cameraInitError'));
  };

  const renderScanResult = () => {
    if (!scanResult) return null;
    return (
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 animate-fade-in-up"
        style={{ animationDuration: '0.3s' }}
      >
        <div className="w-32 h-32 mb-4 flex items-center justify-center">
          {scanResult.imageUrl ? (
            <img src={scanResult.imageUrl} alt="Scanned product" className="max-w-full max-h-full object-contain rounded-md" />
          ) : (
            scanResult.type === 'success' ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-destructive" />
            )
          )}
        </div>
        <p
          className={cn(
            'text-xl font-semibold',
            scanResult.type === 'success' ? 'text-green-500' : 'text-destructive'
          )}
        >
          {scanResult.message}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground relative">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-fixed"
        style={{
          backgroundImage: `url('/hero-background.jpg')`,
          backgroundPosition: 'center 75%',
        }}
      />
      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/90 via-black/70 to-black/40 z-0" />
      
      <div className="relative z-10 container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-white">{t('scanner.title')}</h1>
          <p className="text-gray-200 mb-6">{t('scanner.subtitle')}</p>
        </div>
        
        <Tabs defaultValue="camera" className="w-full max-w-lg">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera">
              <Camera className="mr-2 h-4 w-4" />
              {t('scanner.cameraTab')}
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="mr-2 h-4 w-4" />
              {t('scanner.manualTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="camera">
            <Card className="overflow-hidden bg-card/70 backdrop-blur-lg border">
              <CardContent className="p-4 relative">
                {cameraError ? (
                  <Alert variant="destructive" className="flex flex-col items-center text-center p-6">
                    <AlertTriangle className="h-8 w-8 mb-4" />
                    <AlertTitle className="text-xl font-bold">{t('scanner.cameraErrorTitle')}</AlertTitle>
                    <AlertDescription className="mt-2 text-base">
                      {t('scanner.cameraErrorMessage')}
                      <p className="mt-2 text-sm text-muted-foreground">({cameraError})</p>
                      <Button onClick={() => setCameraError(null)} className="mt-6">
                        {t('scanner.retryCamera')}
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <BarcodeScanner onScanSuccess={processBarcode} onScanFailure={handleCameraError} />
                )}
                {renderScanResult()}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="manual">
            <Card className="bg-card/70 backdrop-blur-lg border relative overflow-hidden">
              <CardHeader>
                <CardTitle>{t('scanner.manualTitle')}</CardTitle>
                <CardDescription>{t('scanner.manualDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder={t('scanner.manualPlaceholder')}
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                  />
                  <Button type="submit">{t('scanner.manualButton')}</Button>
                </form>
              </CardContent>
              {renderScanResult()}
            </Card>
          </TabsContent>
        </Tabs>

        {!user && (
          <Card className="w-full max-w-lg mt-4 bg-card/70 backdrop-blur-lg border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('scanner.sessionScore')}</p>
                <p className="text-2xl font-bold text-primary">{animatedPoints}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetAnonymousPoints} disabled={points === 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('scanner.resetScore')}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6 max-w-lg w-full">
          <p className="text-sm text-gray-300 flex items-center justify-center">
            <CameraOff className="w-4 h-4 mr-2" />
            {t('scanner.cameraPermission')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;