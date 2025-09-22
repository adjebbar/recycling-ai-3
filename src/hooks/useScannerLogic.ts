"use client";

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabaseClient';
import { achievementsList } from '@/lib/achievements';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import Html5QrcodeScanner type

const POINTS_PER_BOTTLE = 10;
const IMAGE_ANALYSIS_DELAY_MS = 2000; // 2 seconds delay

const isPlasticBottle = (product: any): boolean => {
  const searchText = [
    product.product_name,
    product.generic_name,
    product.categories,
    product.packaging,
    ...(product.packaging_tags || []),
  ].filter(Boolean).join(' ').toLowerCase();

  const plasticKeywords = ['plastic', 'plastique', 'pet', 'hdpe', 'polyethylene', 'bouteille plastique'];
  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon'];
  const drinkKeywords = ['boisson', 'beverage', 'drink', 'soda', 'jus', 'juice', 'limonade', 'cola', 'lait', 'milk'];
  const waterKeywords = ['eau', 'water'];
  const exclusionKeywords = ['glass', 'verre', 'vidrio', 'metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier', 'carton', 'brick', 'brique', 'tetrapak'];

  // 1. Exclude if any explicit exclusion keyword is found
  if (exclusionKeywords.some(k => searchText.includes(k))) {
    console.log("Excluded by keyword:", searchText);
    return false;
  }

  // 2. Check if it's a bottle
  const isBottle = bottleKeywords.some(k => searchText.includes(k));
  
  // 3. Check for plastic indicators or common beverage types
  const isPlastic = plasticKeywords.some(k => searchText.includes(k));
  const isDrink = drinkKeywords.some(k => searchText.includes(k));
  const isWater = waterKeywords.some(k => searchText.includes(k));

  // A product is considered a plastic bottle if it's a bottle AND (it's explicitly plastic OR it's a drink OR it's water)
  if (isBottle && (isPlastic || isDrink || isWater)) {
    console.log("Identified as plastic bottle:", searchText);
    return true;
  }

  // Fallback: if it's a drink or water, and not explicitly excluded, assume it's a plastic bottle (common case)
  // This is a bit more permissive but covers many common scenarios where "bottle" or "plastic" might be missing
  if ((isDrink || isWater) && !isBottle) { // If it's a drink/water but "bottle" keyword is missing
    console.log("Identified as plastic bottle (drink/water fallback):", searchText);
    return true;
  }

  console.log("Not identified as plastic bottle:", searchText);
  return false;
};

export const useScannerLogic = (scannerRef: React.MutableRefObject<Html5QrcodeScanner | null>) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addPoints, user, points, resetAnonymousPoints } = useAuth();

  const [state, setState] = useState({
    lastScanned: null as string | null,
    manualBarcode: '',
    scanResult: null as { type: 'success' | 'error'; message: string; imageUrl?: string } | null,
    cameraInitializationError: null as string | null,
    isImageAnalyzing: false, // New state for live image analysis
    showTicket: false,
    qrCodeValue: null as string | null,
    generatedVoucherCode: null as string | null,
    isRedeeming: false,
  });

  const updateState = (newState: Partial<typeof state>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  const triggerPiConveyor = async (result: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase.functions.invoke('trigger-pi-conveyor', { body: { result } });
      if (error) console.error("Failed to trigger Pi conveyor:", error.message);
      else console.log(`Successfully sent '${result}' to Pi conveyor.`);
    } catch (err) {
      console.error("Error invoking trigger-pi-conveyor edge function:", err);
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
    updateState({ scanResult: { type: 'success', message: successMessage } });
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

  const handleAutomaticImageAnalysis = async () => {
    if (!scannerRef.current) {
      console.error("handleAutomaticImageAnalysis: scannerRef.current is null. Scanner not ready.");
      showError("Scanner not ready for image analysis. Please try scanning again.");
      return;
    }

    updateState({ isImageAnalyzing: true, scanResult: null });
    const loadingToast = showLoading("Analyzing image...");

    try {
      const videoElement = await new Promise<HTMLVideoElement>((resolve, reject) => {
        const scannerContainer = document.getElementById('reader');
        if (!scannerContainer) {
          console.error("handleAutomaticImageAnalysis: Scanner container 'reader' not found.");
          return reject(new Error("Scanner container 'reader' not found."));
        }
        const video = scannerContainer.querySelector('video');
        if (!video) {
          console.error("handleAutomaticImageAnalysis: Video element not found within scanner container.");
          return reject(new Error("Video element not found within scanner container."));
        }

        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          console.log("handleAutomaticImageAnalysis: Video element already ready.");
          resolve(video);
        } else {
          console.log("handleAutomaticImageAnalysis: Waiting for video 'canplay' event.");
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            console.log("handleAutomaticImageAnalysis: Video 'canplay' event fired.");
            resolve(video);
          };
          video.addEventListener('canplay', onCanPlay);
          // Add a timeout in case 'canplay' never fires
          setTimeout(() => {
            video.removeEventListener('canplay', onCanPlay);
            console.error("handleAutomaticImageAnalysis: Video stream did not become ready in time for image capture.");
            reject(new Error("Video stream did not become ready in time for image capture."));
          }, 5000); // 5 seconds timeout
        }
      });

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error("handleAutomaticImageAnalysis: Could not get 2D context for canvas.");
        throw new Error("Could not get 2D context for canvas.");
      }

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      console.log("handleAutomaticImageAnalysis: Image captured, invoking edge function.");
      const { data, error } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', { body: { imageData } });
      if (error || data.error) {
        console.error("handleAutomaticImageAnalysis: Edge function error:", error?.message || data.error);
        throw new Error(error?.message || data.error);
      }
      dismissToast(loadingToast);

      if (data.is_plastic_bottle) {
        console.log("handleAutomaticImageAnalysis: Plastic bottle detected by AI simulation.");
        await handleSuccessfulRecycle();
        updateState({ scanResult: { type: 'success', message: t('scanner.imageSuccess', { points: POINTS_PER_BOTTLE }) } });
      } else {
        console.log("handleAutomaticImageAnalysis: Not a plastic bottle (simulated rejection).");
        const errorMessage = t('scanner.imageNotPlastic');
        showError(errorMessage);
        updateState({ scanResult: { type: 'error', message: errorMessage } });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      console.error("handleAutomaticImageAnalysis: Caught error:", err.message);
      showError(err.message || "An unknown error occurred during image analysis.");
      updateState({ scanResult: { type: 'error', message: err.message || "Image analysis failed." } });
      triggerPiConveyor('rejected');
    } finally {
      updateState({ isImageAnalyzing: false });
      // Keep scanResult visible for a bit longer after image analysis
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000); // Increased timeout
    }
  };

  const processBarcode = async (barcode: string, isManual: boolean = false) => {
    if (!barcode) return;

    // Prevent duplicate processing for camera scans, but allow for manual input
    if (!isManual && barcode === state.lastScanned) {
      console.log("Skipping duplicate camera scan:", barcode);
      return;
    }
    
    updateState({ lastScanned: barcode, scanResult: null });
    const loadingToast = showLoading(t('scanner.verifying'));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      if (error || data.error) throw new Error(error?.message || data.error);
      dismissToast(loadingToast);

      if (data.status === 1 && data.product) {
        const imageUrl = data.product.image_front_url || data.product.image_url;
        if (isPlasticBottle(data.product)) {
          await handleSuccessfulRecycle(barcode);
          updateState({ scanResult: { type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl } });
          return; // Exit after successful plastic bottle identification
        } else {
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          updateState({ scanResult: { type: 'error', message: errorMessage, imageUrl } });
          triggerPiConveyor('rejected');
          // If barcode analysis fails, automatically try image analysis after a delay
          setTimeout(handleAutomaticImageAnalysis, IMAGE_ANALYSIS_DELAY_MS);
        }
      } else { // Product not found by barcode
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        updateState({ scanResult: { type: 'error', message: errorMessage } });
        triggerPiConveyor('rejected');
        // If barcode analysis fails, automatically try image analysis after a delay
        setTimeout(handleAutomaticImageAnalysis, IMAGE_ANALYSIS_DELAY_MS);
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      updateState({ scanResult: { type: 'error', message: errorMessage } });
      triggerPiConveyor('rejected');
      // If barcode analysis fails, automatically try image analysis after a delay
      setTimeout(handleAutomaticImageAnalysis, IMAGE_ANALYSIS_DELAY_MS);
    } finally {
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000); // Increased timeout
    }
  };

  const handleRedeem = async () => {
    updateState({ showTicket: true, isRedeeming: true, qrCodeValue: null, generatedVoucherCode: null });
    try {
      const { data, error } = await supabase.functions.invoke('generate-voucher', { body: { points, userId: user?.id } }); // Pass userId
      if (error || data.error) throw new Error(error?.message || data.error);
      updateState({ qrCodeValue: data.voucherToken, generatedVoucherCode: data.voucherCode });
    } catch (err: any) {
      showError(`Voucher Error: ${err.message}`);
      updateState({ showTicket: false });
    } finally {
      updateState({ isRedeeming: false });
    }
  };

  const handleRedeemAndClose = () => {
    resetAnonymousPoints();
    updateState({ showTicket: false, qrCodeValue: null, generatedVoucherCode: null }); // Reset qrCodeValue and generatedVoucherCode
  };

  return {
    state,
    points,
    actions: {
      updateState,
      processBarcode,
      handleRedeem,
      handleRedeemAndClose,
      resetAnonymousPoints,
      handleManualSubmit: (e: React.FormEvent) => {
        e.preventDefault();
        processBarcode(state.manualBarcode.trim(), true); // Pass true for manual scan
        updateState({ manualBarcode: '' });
      },
    },
  };
};