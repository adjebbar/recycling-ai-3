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
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null); // This will be the JWT
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState<string | null>(null); // New state for human-readable code
  const [isRedeeming, setIsRedeeming] = useState(false);

  // New states for image analysis
  const [imageAnalysisMode, setImageAnalysisMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Base64 image data
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
    setScanResult({ type: 'success', message: successMessage }); // No image URL from image analysis
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
    setScanFailureMessage(null);
    setScanResult(null); // Clear previous scan result
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
          await handleSuccessfulRecycle(barcode);
          setScanResult({ type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl: imageUrl });
        } else {
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          setScanResult({ type: 'error', message: errorMessage, imageUrl: imageUrl });
          triggerPiConveyor('rejected');
          // Offer image analysis as fallback
          setImageAnalysisMode(true);
        }
      } else {
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        setScanResult({ type: 'error', message: errorMessage });
        triggerPiConveyor('rejected');
        // Offer image analysis as fallback
        setImageAnalysisMode(true);
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      setScanResult({ type: 'error', message: errorMessage });
      triggerPiConveyor('rejected');
      // Offer image analysis as fallback
      setImageAnalysisMode(true);
      console.error(err);
    } finally {
      // Keep scanResult visible for a short period, then clear
      setTimeout(() => {
        setScanResult(null);
        setLastScanned(null);
      }, 3000);
    }
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!capturedImage) {
      showError("Please capture an image first.");
      return;
    }

    setIsAnalyzingImage(true);
    setScanResult(null); // Clear previous scan result
    const loadingToast = showLoading("Analyzing image...");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', {
        body: { imageData: capturedImage },
      });

      if (invokeError) {
        let errorMessage = 'Image analysis failed.';
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
      const errorMessage = err.message || "An unknown error occurred during image analysis.";
      showError(errorMessage);
      setScanResult({ type: 'error', message: errorMessage });
      triggerPiConveyor('rejected');
      console.error(err);
    } finally {
      setIsAnalyzingImage(false);
      setCapturedImage(null); // Clear captured image after analysis
      setImageAnalysisMode(false); // Exit image analysis mode
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    }
  };

  const handleRedeem = async () => {
    setShowTicket(true);
    setIsRedeeming(true);
    setQrCodeValue(null);
    setGeneratedVoucherCode(null); // Clear previous code

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

      setQrCodeValue(data.voucherToken); // Set the JWT for the QR code
      setGeneratedVoucherCode(data.voucherCode); // Set the human-readable code
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
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url('/images/eco-futuristic-background.png')` }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-primary-dark opacity-80 z-0" />
      
      <div className="relative z-10 container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-white">{t('scanner.title')}</h1>
          <p className="text-white mb-6">{t('scanner.subtitle')}</p>
        </div>

        {/* New image added here */}
        <div className="w-full max-w-md mb-8">
          <img 
            src="/images/recycling-machine-scan.png" 
            alt="Recycling Machine Scan" 
            className="w-full h-auto rounded-lg shadow-lg object-cover"
          />
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
                ) : imageAnalysisMode ? (
                  <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-bold">Analyze with Image</h3>
                    <p className="text-foreground text-center">
                      Barcode scan was inconclusive. Take a photo of the item to determine if it's a plastic bottle.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment" // Suggests front or rear camera
                      onChange={handleImageCapture}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    {capturedImage && (
                      <div className="relative w-48 h-48 rounded-md overflow-hidden border-2 border-primary">
                        <img src={capturedImage} alt="Captured for analysis" className="w-full h-full object-cover" />
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="absolute top-1 right-1"
                          onClick={() => setCapturedImage(null)}
                        >
                          X
                        </Button>
                      </div>
                    )}
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isAnalyzingImage}
                    >
                      {capturedImage ? "Retake Photo" : "Take Photo"}
                    </Button>
                    <Button 
                      onClick={handleImageAnalysis} 
                      disabled={!capturedImage || isAnalyzingImage}
                      className="w-full"
                    >
                      {isAnalyzingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Image"
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setImageAnalysisMode(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <BarcodeScanner 
                    onScanSuccess={processBarcode} 
                    onScanFailure={handleScanFailure}
                    onCameraInitError={handleCameraInitializationError}
                  />
                )}
                {renderScanResult()}
                {scanFailureMessage && !scanResult && !imageAnalysisMode && (
                  <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-foreground">
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
                <p className="text-sm font-medium text-foreground">{t('scanner.sessionScore')}</p> {/* Changed to text-foreground */}
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
          voucherCode={generatedVoucherCode} // Pass the new prop
          isLoading={isRedeeming}
          points={points}
          onRedeemAndClose={handleRedeemAndClose}
        />

        <div className="text-center mt-6 max-w-lg w-full">
          <p className="text-sm text-foreground flex items-center justify-center">
            <CameraOff className="w-4 h-4 mr-2" />
            {t('scanner.cameraPermission')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;