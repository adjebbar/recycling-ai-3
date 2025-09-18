"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Keyboard, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Trophy } from 'lucide-react';
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
import { achievementsList } from '@/lib/achievements'; // Import achievementsList

const POINTS_PER_BOTTLE = 10;

const isPlasticBottle = (product: any): boolean => {
  // Combine all relevant text fields into a single, lowercased string for easier searching.
  const searchText = [
    product.product_name,
    product.generic_name,
    product.categories,
    product.packaging,
    ...(product.packaging_tags || []),
  ].filter(Boolean).join(' ').toLowerCase(); // Filter out null/undefined/empty strings

  console.log("isPlasticBottle: searchText:", searchText);

  // Define keywords
  const plasticKeywords = ['plastic', 'plastique', 'pet', 'hdpe', 'polyethylene'];
  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon'];
  const drinkKeywords = ['boisson', 'beverage', 'drink', 'soda', 'eau', 'water', 'jus', 'juice', 'limonade', 'cola', 'lait', 'milk'];
  const exclusionKeywords = ['glass', 'verre', 'vidrio', 'metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier', 'carton', 'brick', 'brique', 'tetrapak'];

  // 1. Strict Exclusion: If any exclusion keyword is found, it's definitely not a plastic bottle.
  const isExcluded = exclusionKeywords.some(keyword => searchText.includes(keyword));
  console.log("isPlasticBottle: isExcluded:", isExcluded);
  if (isExcluded) {
    return false;
  }

  // 2. Primary Inclusion: Check for a combination of plastic and bottle keywords.
  const hasPlasticKeyword = plasticKeywords.some(keyword => searchText.includes(keyword));
  const hasBottleKeyword = bottleKeywords.some(keyword => searchText.includes(keyword));
  console.log("isPlasticBottle: hasPlasticKeyword:", hasPlasticKeyword, "hasBottleKeyword:", hasBottleKeyword);

  if (hasPlasticKeyword && hasBottleKeyword) {
    return true;
  }

  // 3. Enhanced Fallback Heuristic: If it's a drink and contains "bottle" in its name/categories,
  // it's very likely a plastic bottle, since glass, metal, and cartons have already been excluded.
  const hasDrinkKeyword = drinkKeywords.some(keyword => searchText.includes(keyword));
  
  // For water bottles, "eau" is a strong indicator, and they are almost always plastic if not excluded.
  const isWaterProduct = searchText.includes('eau') || searchText.includes('water');

  console.log("isPlasticBottle: hasDrinkKeyword:", hasDrinkKeyword, "isWaterProduct:", isWaterProduct);

  if (hasDrinkKeyword && hasBottleKeyword) {
    return true;
  }

  // Specific heuristic for water bottles if previous checks didn't catch it
  if (isWaterProduct && !isExcluded) {
    // If it's a water product and not explicitly excluded, assume it's a plastic bottle.
    // This helps catch cases where "plastic" or "bouteille" might be missing from packaging info.
    return true;
  }

  // If none of the above conditions are met, assume it's not a recyclable plastic bottle.
  console.log("isPlasticBottle: No plastic bottle criteria met, returning false.");
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
  const [scanFailureMessage, setScanFailureMessage] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const triggerPiConveyor = async (result: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase.functions.invoke('trigger-pi-conveyor', {
        body: { result },
      });
      if (error) {
        console.error("Failed to trigger Pi conveyor:", error.message);
        showError("Failed to communicate with recycling machine.");
      } else {
        console.log(`Successfully sent '${result}' to Pi conveyor.`);
      }
    } catch (err) {
      console.error("Error invoking trigger-pi-conveyor edge function:", err);
      showError("Error communicating with recycling machine.");
    }
  };

  const processBarcode = async (barcode: string) => {
    if (!barcode || barcode === lastScanned) return;
    
    setLastScanned(barcode);
    setScanFailureMessage(null);
    const loadingToast = showLoading(t('scanner.verifying'));

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      
      if (invokeError) {
        let errorMessage = 'Product verification failed.';
        try {
          const errorBody = await invokeError.context.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) {
          console.error("Could not parse error response from edge function:", e);
        }
        throw new Error(errorMessage);
      }

      if (data.error) throw new Error(data.error);
      dismissToast(loadingToast);

      if (data.status === 1 && data.product) {
        const imageUrl = data.product.image_front_url || data.product.image_url;
        if (isPlasticBottle(data.product)) {
          const addPointsResult = await addPoints(POINTS_PER_BOTTLE, barcode); // Get the consolidated result

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

          showSuccess(successMessage); // Show one consolidated success toast
          setScanResult({ type: 'success', message: successMessage, imageUrl: imageUrl });
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
        } else {
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          setScanResult({ type: 'error', message: errorMessage });
          triggerPiConveyor('rejected');
        }
      } else {
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        setScanResult({ type: 'error', message: errorMessage });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      setScanResult({ type: 'error', message: errorMessage });
      triggerPiConveyor('rejected');
      console.error(err);
    } finally {
      setTimeout(() => {
        setLastScanned(null);
        setScanResult(null);
      }, 3000);
    }
  };

  const handleRedeem = async () => {
    setShowTicket(true);
    setIsRedeeming(true);
    setQrCodeValue(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-voucher', {
        body: { points },
      });

      if (error) {
        let errorMessage = 'Voucher generation failed. Please try again.';
        try {
          const errorBody = await error.context.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) {
          console.error("Could not parse error response from edge function:", e);
        }
        throw new Error(errorMessage);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      setQrCodeValue(data.voucherToken);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      console.error("Failed to generate voucher:", err);
      showError(`Voucher Error: ${errorMessage}`);
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
    console.error("Camera initialization error:", error);
    setCameraInitializationError(error);
    showError(t('scanner.cameraInitError'));
  };

  const handleScanFailure = (error: string) => {
    console.warn("Barcode scan failure:", error);
    setScanFailureMessage(t('scanner.noBarcodeDetected'));
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    return (
      <div className={cn(
        "absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20 transition-opacity duration-300",
        scanResult ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {scanResult.type === 'success' ? (
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4 animate-pulse-once" />
        ) : (
          <XCircle className="h-16 w-16 text-destructive mb-4 animate-pulse-once" />
        )}
        <p className="text-xl font-semibold text-foreground text-center mb-2">{scanResult.message}</p>
        {scanResult.imageUrl && (
          <img src={scanResult.imageUrl} alt="Scanned Product" className="h-24 w-24 object-contain rounded-md shadow-md" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground relative bg-gradient-to-br from-gray-900 to-gray-700">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background/20 z-0" />
      
      <div className="relative z-10 container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('scanner.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('scanner.subtitle')}</p>
        </div>
        
        <Tabs defaultValue="camera" className="w-full max-w-lg">
          <TabsList className="grid w-full grid-cols-2 bg-card/70 backdrop-blur-lg border">
            <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />{t('scanner.cameraTab')}</TabsTrigger>
            <TabsTrigger value="manual"><Keyboard className="mr-2 h-4 w-4" />{t('scanner.manualTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="camera">
            <Card className="overflow-hidden bg-card/70 backdrop-blur-lg border">
              <CardContent className="p-4 relative">
                {cameraInitializationError ? (
                  <Alert variant="destructive" className="flex flex-col items-center text-center p-6">
                    <AlertTriangle className="h-8 w-8 mb-4" />
                    <AlertTitle className="text-xl font-bold">{t('scanner.cameraErrorTitle')}</AlertTitle>
                    <AlertDescription className="mt-2 text-base">
                      {t('scanner.cameraErrorMessage')}
                      <Button onClick={() => setCameraInitializationError(null)} className="mt-6">{t('scanner.retryCamera')}</Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <BarcodeScanner 
                    onScanSuccess={processBarcode} 
                    onScanFailure={handleScanFailure}
                    onCameraInitError={handleCameraInitializationError}
                  />
                )}
                {renderScanResult()}
                {scanFailureMessage && !scanResult && (
                  <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
                    {scanFailureMessage}
                  </p>
                )}
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
                  <Input type="text" placeholder={t('scanner.manualPlaceholder')} value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} />
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
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={handleRedeem} disabled={points === 0 || isRedeeming}>
                  <Trophy className="mr-2 h-4 w-4" />
                  {isRedeeming ? "Generating..." : "Redeem"}
                </Button>
                <Button variant="ghost" size="sm" onClick={resetAnonymousPoints} disabled={points === 0}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('scanner.resetScore')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <RewardTicketDialog 
          open={showTicket} 
          onOpenChange={setShowTicket} 
          qrCodeValue={qrCodeValue}
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