"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Keyboard, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Trophy, Image as ImageIcon, Loader2 } from 'lucide-react';
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
import { RewardTicketDialog } from '@/components/RewardTicketDialog';
import { achievementsList } from '@/lib/achievements';
import { useIsMobile } from "@/hooks/use-mobile";

const POINTS_PER_BOTTLE = 10;

const isPlasticBottle = (product: any): boolean => {
  const searchText = [
    product.product_name,
    product.generic_name,
    product.categories,
    product.packaging,
    ...(product.packaging_tags || []),
  ].filter(Boolean).join(' ').toLowerCase();

  const plasticKeywords = ['plastic', 'plastique', 'pet', 'hdpe', 'polyethylene'];
  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon'];
  const drinkKeywords = ['boisson', 'beverage', 'drink', 'soda', 'eau', 'water', 'jus', 'juice', 'limonade', 'cola', 'lait', 'milk'];
  const exclusionKeywords = ['glass', 'verre', 'vidrio', 'metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier', 'carton', 'brick', 'brique', 'tetrapak'];

  const isExcluded = exclusionKeywords.some(keyword => searchText.includes(keyword));
  if (isExcluded) return false;

  const hasPlasticKeyword = plasticKeywords.some(keyword => searchText.includes(keyword));
  const hasBottleKeyword = bottleKeywords.some(keyword => searchText.includes(keyword));
  if (hasPlasticKeyword && hasBottleKeyword) return true;

  const hasDrinkKeyword = drinkKeywords.some(keyword => searchText.includes(keyword));
  const isWaterProduct = searchText.includes('eau') || searchText.includes('water');
  if (hasDrinkKeyword && hasBottleKeyword) return true;
  if (isWaterProduct && !isExcluded) return true;

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
  const [cameraInitializationError, setCameraInitializationError] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [imageAnalysisMode, setImageAnalysisMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const triggerPiConveyor = async (result: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase.functions.invoke('trigger-pi-conveyor', { body: { result } });
      if (error) {
        console.error("Failed to trigger Pi conveyor:", error.message);
        showError("Failed to communicate with recycling machine.");
      }
    } catch (err) {
      console.error("Error invoking trigger-pi-conveyor edge function:", err);
      showError("Error communicating with recycling machine.");
    }
  };

  const handleSuccessfulRecycle = async (barcode?: string) => {
    const addPointsResult = await addPoints(POINTS_PER_BOTTLE, barcode);
    let successMessage = t('scanner.success', { points: addPointsResult.pointsEarned });
    if (addPointsResult.leveledUpTo) {
      successMessage += ` 🎉 ${t('scanner.leveledUp', { levelName: addPointsResult.leveledUpTo.name })}`;
    }
    if (addPointsResult.unlockedAchievements.length > 0) {
      const achievementNames = addPointsResult.unlockedAchievements.map(id => {
        const achievement = achievementsList.find(a => a.id === id);
        return achievement ? t(`achievements.${id}Name`) : '';
      }).filter(Boolean).join(', ');
      successMessage += ` 🏆 ${t('scanner.achievementsUnlocked', { achievements: achievementNames })}`;
    }
    showSuccess(successMessage);
    setScanResult({ type: 'success', message: successMessage });
    triggerPiConveyor('accepted');
    if (!user) {
      const hasShownToast = sessionStorage.getItem('signupToastShown');
      if (!hasShownToast) {
        setTimeout(() => {
          toast.info(t('scanner.signupPromptTitle'), {
            description: t('scanner.signupPromptDescription'),
            action: { label: t('nav.signup'), onClick: () => navigate('/signup') },
            duration: 10000,
          });
          sessionStorage.setItem('signupToastShown', 'true');
        }, 1500);
      }
    }
  };

  const processBarcode = async (barcode: string) => {
    if (!barcode || barcode === lastScanned) return;
    setLastScanned(barcode);
    setScanResult(null);
    const loadingToast = showLoading(t('scanner.verifying'));
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      if (invokeError) throw new Error((await invokeError.context.json()).error || 'Product verification failed.');
      if (data.error) throw new Error(data.error);
      dismissToast(loadingToast);
      if (data.status === 1 && data.product) {
        const imageUrl = data.product.image_front_url || data.product.image_url;
        if (isPlasticBottle(data.product)) {
          await handleSuccessfulRecycle(barcode);
          setScanResult({ type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl });
        } else {
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          setScanResult({ type: 'error', message: errorMessage, imageUrl });
          triggerPiConveyor('rejected');
          setImageAnalysisMode(true);
        }
      } else {
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        setScanResult({ type: 'error', message: errorMessage });
        triggerPiConveyor('rejected');
        setImageAnalysisMode(true);
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      setScanResult({ type: 'error', message: errorMessage });
      triggerPiConveyor('rejected');
      setImageAnalysisMode(true);
    }
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCapturedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!capturedImage) return;
    setIsAnalyzingImage(true);
    setScanResult(null);
    const loadingToast = showLoading("Analyzing image...");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', { body: { imageData: capturedImage } });
      if (invokeError) throw new Error((await invokeError.context.json()).error || 'Image analysis failed.');
      if (data.error) throw new Error(data.error);
      dismissToast(loadingToast);
      if (data.is_plastic_bottle) {
        await handleSuccessfulRecycle();
        setScanResult({ type: 'success', message: t('scanner.imageSuccess', { points: POINTS_PER_BOTTLE }) });
      } else {
        const errorMessage = t('scanner.imageNotPlastic');
        showError(errorMessage);
        setScanResult({ type: 'error', message: errorMessage });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.message || "An unknown error occurred.");
      setScanResult({ type: 'error', message: err.message });
      triggerPiConveyor('rejected');
    } finally {
      setIsAnalyzingImage(false);
      setCapturedImage(null);
      setImageAnalysisMode(false);
    }
  };

  const handleRedeem = async () => {
    setShowTicket(true);
    setIsRedeeming(true);
    setQrCodeValue(null);
    setGeneratedVoucherCode(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-voucher', { body: { points } });
      if (error) throw new Error((await error.context.json()).error || 'Voucher generation failed.');
      if (data.error) throw new Error(data.error);
      setQrCodeValue(data.voucherToken);
      setGeneratedVoucherCode(data.voucherCode);
    } catch (err: any) {
      showError(`Voucher Error: ${err.message}`);
      setShowTicket(false);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRedeemAndClose = () => {
    resetAnonymousPoints();
    setShowTicket(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcode(manualBarcode.trim());
    setManualBarcode('');
  };

  const handleCameraInitializationError = (error: string) => {
    setCameraInitializationError(error);
    showError(t('scanner.cameraInitError'));
  };

  const resetScanner = () => {
    setScanResult(null);
    setLastScanned(null);
    setImageAnalysisMode(false);
    setCapturedImage(null);
  };

  const renderScanResult = () => {
    if (!scanResult) return null;
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20 p-4">
        {scanResult.type === 'success' ? <CheckCircle2 className="h-16 w-16 text-green-500 mb-4 animate-pulse-once" /> : <XCircle className="h-16 w-16 text-destructive mb-4 animate-pulse-once" />}
        <p className="text-xl font-semibold text-foreground text-center mb-4">{scanResult.message}</p>
        {scanResult.imageUrl && <img src={scanResult.imageUrl} alt="Scanned Product" className="h-24 w-24 object-contain rounded-md shadow-md mb-4" />}
        <Button onClick={resetScanner}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('scanner.scanNext')}
        </Button>
      </div>
    );
  };

  const ScannerView = () => (
    <div className="relative aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
      {cameraInitializationError ? (
        <Alert variant="destructive" className="flex flex-col items-center text-center p-6">
          <AlertTriangle className="h-8 w-8 mb-4" />
          <AlertTitle className="text-xl font-bold">{t('scanner.cameraErrorTitle')}</AlertTitle>
          <AlertDescription className="mt-2 text-base">
            {t('scanner.cameraErrorMessage')}
            <Button onClick={() => setCameraInitializationError(null)} className="mt-6">{t('scanner.retryCamera')}</Button>
          </AlertDescription>
        </Alert>
      ) : imageAnalysisMode ? (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <ImageIcon className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-bold">Analyze with Image</h3>
          <p className="text-muted-foreground text-center">Take a photo to determine if it's a plastic bottle.</p>
          <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} ref={fileInputRef} className="hidden" />
          {capturedImage && <img src={capturedImage} alt="Captured" className="w-48 h-48 object-cover rounded-md border-2 border-primary" />}
          <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzingImage}>{capturedImage ? "Retake Photo" : "Take Photo"}</Button>
          <Button onClick={handleImageAnalysis} disabled={!capturedImage || isAnalyzingImage} className="w-full">
            {isAnalyzingImage ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : "Analyze Image"}
          </Button>
          <Button variant="outline" onClick={() => setImageAnalysisMode(false)}>Cancel</Button>
        </div>
      ) : (
        <>
          <BarcodeScanner onScanSuccess={processBarcode} onScanFailure={() => {}} onCameraInitError={handleCameraInitializationError} />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-3/4 h-1/2 border-4 border-primary/50 rounded-2xl shadow-lg" />
            <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-scan-line-sweep" />
          </div>
        </>
      )}
      {renderScanResult()}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground">
      <div className="container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('scanner.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('scanner.subtitle')}</p>
        </div>
        
        <div className="w-full max-w-lg">
          {isMobile ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ScannerView />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />{t('scanner.cameraTab')}</TabsTrigger>
                <TabsTrigger value="manual"><Keyboard className="mr-2 h-4 w-4" />{t('scanner.manualTab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="camera">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <ScannerView />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="manual">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('scanner.manualTitle')}</CardTitle>
                    <CardDescription>{t('scanner.manualDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleManualSubmit} className="flex space-x-2">
                      <Input type="text" placeholder={t('scanner.manualPlaceholder')} value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} />
                      <Button type="submit">{t('scanner.manualButton')}</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {!user && (
            <div className="w-full max-w-lg mt-4 bg-card p-4 rounded-lg shadow-md flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('scanner.sessionScore')}</p>
                <p className="text-2xl font-bold text-primary">{animatedPoints}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={handleRedeem} disabled={points === 0 || isRedeeming}>
                  <Trophy className="mr-2 h-4 w-4" />
                  {isRedeeming ? "Generating..." : "Redeem"}
                </Button>
                <Button variant="ghost" size="icon" onClick={resetAnonymousPoints} disabled={points === 0}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <RewardTicketDialog 
          open={showTicket} 
          onOpenChange={setShowTicket} 
          qrCodeValue={qrCodeValue}
          voucherCode={generatedVoucherCode}
          isLoading={isRedeeming}
          points={points}
          onRedeemAndClose={handleRedeemAndClose}
        />

        <div className="text-center mt-6 max-w-lg w-full">
          <p className="text-sm text-muted-foreground flex items-center justify-center">
            <CameraOff className="w-4 h-4 mr-2" />
            {t('scanner.cameraPermission')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;