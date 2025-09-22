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

const isPlasticBottle = (product: any): boolean => {
  const searchText = [
    product.product_name,
    product.generic_name,
    product.categories,
    product.packaging,
    ...(product.packaging_tags || []),
    ...(product.ingredients_text ? [product.ingredients_text] : []), // Add ingredients for more keywords
  ].filter(Boolean).join(' ').toLowerCase();

  console.log("isPlasticBottle: Analyzing searchText:", searchText);

  const plasticKeywords = ['plastic', 'plastique', 'pet', 'hdpe', 'ldpe', 'pp', 'ps', 'pvc', 'polyethylene', 'polypropylene', 'polystyrene', 'polyvinyl chloride', 'bpa-free', 'bottle plastic', 'plastic bottle', 'plastique recyclé', 'recycled plastic'];
  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon', 'container', 'récipient', 'packaging', 'emballage', 'pack', 'flask', 'carafe'];
  const drinkKeywords = ['boisson', 'beverage', 'drink', 'soda', 'eau', 'water', 'jus', 'juice', 'limonade', 'cola', 'milk', 'lait', 'soft drink', 'energy drink', 'yogurt', 'yaourt', 'smoothie', 'iced tea', 'thé glacé', 'sport drink'];
  const exclusionKeywords = ['glass', 'verre', 'vidrio', 'metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier', 'carton', 'brick', 'brique', 'tetrapak', 'paper', 'papier', 'wood', 'bois', 'ceramic', 'céramique', 'bag', 'sachet', 'cup', 'tasse', 'pot', 'jar', 'bocal'];

  // 1. Check for strong exclusion keywords first
  if (exclusionKeywords.some(k => searchText.includes(k))) {
    console.log("isPlasticBottle: Excluded by keyword.");
    return false;
  }

  // 2. Check for explicit plastic bottle indicators
  if (product.packaging_tags?.some((tag: string) => tag.includes('plastic-bottle'))) {
    console.log("isPlasticBottle: Detected by plastic-bottle packaging tag.");
    return true;
  }

  // 3. Check for combination of plastic material and bottle shape
  const hasPlasticKeyword = plasticKeywords.some(k => searchText.includes(k));
  const hasBottleKeyword = bottleKeywords.some(k => searchText.includes(k));
  if (hasPlasticKeyword && hasBottleKeyword) {
    console.log("isPlasticBottle: Detected by plastic + bottle keywords.");
    return true;
  }

  // 4. Check for common drinks in bottles (assuming plastic if not explicitly excluded)
  const hasDrinkKeyword = drinkKeywords.some(k => searchText.includes(k));
  if (hasDrinkKeyword && hasBottleKeyword) {
    console.log("isPlasticBottle: Detected by drink + bottle keywords.");
    return true;
  }

  // 5. Fallback for common water/soda products if no strong indicators or exclusions
  if ((searchText.includes('eau') || searchText.includes('water') || searchText.includes('soda')) && !exclusionKeywords.some(k => searchText.includes(k))) {
    console.log("isPlasticBottle: Detected by water/soda fallback.");
    return true;
  }

  console.log("isPlasticBottle: No plastic bottle indicators found.");
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
    console.log("handleAutomaticImageAnalysis: Starting image analysis process.");

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

        const checkVideoReady = () => {
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) { // HAVE_CURRENT_DATA and valid dimensions
            console.log("handleAutomaticImageAnalysis: Video element ready with dimensions:", video.videoWidth, "x", video.videoHeight);
            resolve(video);
          } else {
            console.log("handleAutomaticImageAnalysis: Video not yet ready or dimensions invalid. ReadyState:", video.readyState, "Dimensions:", video.videoWidth, "x", video.videoHeight);
            setTimeout(checkVideoReady, 100); // Re-check after a short delay
          }
        };

        console.log("handleAutomaticImageAnalysis: Waiting for video 'canplay' event or ready state.");
        video.addEventListener('canplay', checkVideoReady, { once: true });
        // Also start checking immediately in case 'canplay' already fired or video is already ready
        checkVideoReady();

        // Add a timeout in case video never becomes ready
        setTimeout(() => {
          video.removeEventListener('canplay', checkVideoReady);
          console.error("handleAutomaticImageAnalysis: Video stream did not become ready in time for image capture.");
          reject(new Error("Video stream did not become ready in time for image capture."));
        }, 7000); // Increased timeout to 7 seconds
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
      console.log("handleAutomaticImageAnalysis: Image captured successfully. Invoking edge function.");

      const { data, error } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', { body: { imageData } });
      if (error || data.error) {
        console.error("handleAutomaticImageAnalysis: Edge function error:", error?.message || data.error);
        throw new Error(error?.message || data.error);
      }
      dismissToast(loadingToast);
      console.log("handleAutomaticImageAnalysis: Edge function response received:", data);

      if (data.is_plastic_bottle) {
        console.log("handleAutomaticImageAnalysis: Plastic bottle detected by AI simulation. Proceeding to successful recycle.");
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
      console.error("handleAutomaticImageAnalysis: Caught error during image analysis:", err.message);
      showError(err.message || "An unknown error occurred during image analysis.");
      updateState({ scanResult: { type: 'error', message: err.message || "Image analysis failed." } });
      triggerPiConveyor('rejected');
    } finally {
      updateState({ isImageAnalyzing: false });
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000);
    }
  };

  const processBarcode = async (barcode: string) => {
    if (!barcode || barcode === state.lastScanned) return;
    updateState({ lastScanned: barcode, scanResult: null });
    const loadingToast = showLoading(t('scanner.verifying'));
    console.log("processBarcode: Processing barcode:", barcode);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      if (error || data.error) {
        console.error("processBarcode: Error fetching product info from edge function:", error?.message || data.error);
        throw new Error(error?.message || data.error);
      }
      dismissToast(loadingToast);
      console.log("processBarcode: Product info received:", data);

      if (data.status === 1 && data.product) {
        console.log("processBarcode: Product found. Raw product data:", data.product);
        const imageUrl = data.product.image_front_url || data.product.image_url;
        if (isPlasticBottle(data.product)) {
          console.log("processBarcode: isPlasticBottle returned TRUE. Proceeding to successful recycle.");
          await handleSuccessfulRecycle(barcode);
          updateState({ scanResult: { type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl } });
        } else {
          console.log("processBarcode: isPlasticBottle returned FALSE. Falling back to image analysis.");
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          updateState({ scanResult: { type: 'error', message: errorMessage, imageUrl } });
          triggerPiConveyor('rejected');
          handleAutomaticImageAnalysis(); // Fallback to image analysis
        }
      } else {
        console.log("processBarcode: Product not found or API status not 1. Falling back to image analysis.");
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        updateState({ scanResult: { type: 'error', message: errorMessage } });
        triggerPiConveyor('rejected');
        handleAutomaticImageAnalysis(); // Fallback to image analysis
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      console.error("processBarcode: Caught error during barcode processing:", err.message);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      updateState({ scanResult: { type: 'error', message: errorMessage } });
      triggerPiConveyor('rejected');
      handleAutomaticImageAnalysis(); // Fallback to image analysis
    } finally {
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000);
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
    updateState({ 
      showTicket: false,
      qrCodeValue: null, // Reset QR code value to close the dialog
      generatedVoucherCode: null, // Reset generated voucher code
    });
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
        processBarcode(state.manualBarcode.trim());
        updateState({ manualBarcode: '' });
      },
    },
  };
};