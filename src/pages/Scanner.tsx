"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast, showInfo } from '@/utils/toast';
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
    setScanResult(null);
    const loadingToast = showLoading(t('scanner.verifying'));

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      
      dismissToast(loadingToast);

      if (invokeError) {
        throw new Error('Product verification failed due to a network error.');
      }
      if (data.error) {
        throw new Error(data.error);
      }

      const imageUrl = data.product?.image_front_url || data.product?.image_url;

      switch (data.decision) {
        case 'accepted':
          await handleSuccessfulRecycle(barcode);
          setScanResult({ type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl });
          break;
        case 'rejected':
          showError(data.reason || t('scanner.notPlastic'));
          setScanResult({ type: 'error', message: data.reason || t('scanner.notPlastic'), imageUrl });
          triggerPiConveyor('rejected');
          break;
        case 'not_found':
          showInfo(t('scanner.notFoundButAccepted', "Product not in database, but we'll accept it. Thanks for recycling!"));
          await handleSuccessfulRecycle(barcode);
          setScanResult({ type: 'success', message: t('scanner.accepted', 'Item Accepted!') });
          break;
        default:
          throw new Error('Received an unknown decision from the server.');
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
        setScanResult(null);
        setLastScanned(null);
      }, 3000);
    }
  };

  const handleRedeem = async () => {
    setShowTicket(true);
    setIsRedeeming(true);
    setQrCodeValue(null);
    setGeneratedVoucherCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-voucher', {
        body: { points },
      });

      if (error || data.error) {
        throw new Error(error?.message || data.error);
      }

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
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground">
      <div className="container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('scanner.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('scanner.subtitle')}</p>
        </div>
        
        <Tabs defaultValue="camera" className="w-full max-w-lg">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" />{t('scanner.cameraTab')}</TabsTrigger>
            <TabsTrigger value="manual"><Keyboard className="mr-2 h-4 w-4" />{t('scanner.manualTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="camera">
            <Card className="overflow-hidden">
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
            <Card className="relative overflow-hidden">
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
          <Card className="w-full max-w-lg mt-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('scanner.sessionScore')}</p>
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