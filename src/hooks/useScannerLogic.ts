"use client";

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { toast } from 'sonner';
import { useTranslation } from 'react-i1next';
import { supabase } from '@/lib/supabaseClient';
import { achievementsList } from '@/lib/achievements';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import Html5QrcodeScanner type

const POINTS_PER_BOTTLE = 10;
const IMAGE_ANALYSIS_DELAY_MS = 1500; // 1.5 seconds delay before triggering image analysis

type ValidationResult = 'accepted' | 'rejected' | 'inconclusive';

const analyzeProductData = (product: any): ValidationResult => {
  const packagingTags = (product.packaging_tags || []).join(' ').replace(/-/g, ' ');
  const packagingText = (product.packaging || '').replace(/,/g, ' ');

  const searchText = [
    product.product_name,
    product.generic_name,
    product.categories,
    packagingText,
    packagingTags,
    product.ingredients_text,
  ].filter(Boolean).join(' ').toLowerCase();

  console.log("analyzeProductData: Analyzing searchText:", searchText);

  const exclusionKeywords = ['glass', 'verre', 'vidrio', 'metal', 'métal', 'conserve', 'can', 'canette', 'aluminium', 'steel', 'acier', 'carton', 'brick', 'brique', 'tetrapak'];
  if (exclusionKeywords.some(k => searchText.includes(k))) {
    console.log("analyzeProductData: Conclusive rejection based on exclusion keywords.");
    return 'rejected';
  }

  const specificPlasticKeywords = ['pet', 'hdpe'];
  if (specificPlasticKeywords.some(k => searchText.includes(k))) {
    console.log("analyzeProductData: Conclusive acceptance based on specific plastic type.");
    return 'accepted';
  }

  const bottleKeywords = ['bottle', 'bouteille', 'botella', 'flacon'];
  if (bottleKeywords.some(k => searchText.includes(k))) {
    console.log("analyzeProductData: Conclusive acceptance based on 'bottle' keyword.");
    return 'accepted';
  }

  const plasticKeywords = ['plastic', 'plastique', 'polyethylene'];
  const drinkKeywords = ['boisson', 'beverage', 'drink', 'soda', 'jus', 'juice', 'limonade', 'cola', 'lait', 'milk', 'eau', 'water'];
  if (plasticKeywords.some(k => searchText.includes(k)) && drinkKeywords.some(k => searchText.includes(k))) {
    console.log("analyzeProductData: Conclusive acceptance based on 'plastic' + 'drink' keywords.");
    return 'accepted';
  }
  
  console.log("analyzeProductData: Text analysis is inconclusive. Recommending image analysis.");
  return 'inconclusive';
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
    isImageAnalyzing: false,
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
      showError("Scanner not ready for image analysis.");
      return;
    }

    updateState({ isImageAnalyzing: true, scanResult: null });
    const loadingToast = showLoading("Analyzing image...");

    try {
      const videoElement = document.querySelector('#reader video') as HTMLVideoElement;
      if (!videoElement) throw new Error("Video element not found.");

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error("Could not get 2D context.");

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      const { data, error } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', { body: { imageData } });
      if (error || data.error) throw new Error(error?.message || data.error);
      dismissToast(loadingToast);

      if (data.is_plastic_bottle) {
        await handleSuccessfulRecycle();
        updateState({ scanResult: { type: 'success', message: t('scanner.imageSuccess', { points: POINTS_PER_BOTTLE }) } });
      } else {
        const errorMessage = t('scanner.imageNotPlastic');
        showError(errorMessage);
        updateState({ scanResult: { type: 'error', message: errorMessage } });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.message || "Image analysis failed.");
      updateState({ scanResult: { type: 'error', message: err.message || "Image analysis failed." } });
      triggerPiConveyor('rejected');
    } finally {
      updateState({ isImageAnalyzing: false });
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000);
    }
  };

  const processBarcode = async (barcode: string, isManual: boolean = false) => {
    if (!barcode || (!isManual && barcode === state.lastScanned)) return;
    
    updateState({ lastScanned: barcode, scanResult: null });
    const loadingToast = showLoading(t('scanner.verifying'));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      if (error || data.error) throw new Error(error?.message || data.error);
      dismissToast(loadingToast);

      if (data.status === 1 && data.product) {
        const imageUrl = data.product.image_front_url || data.product.image_url;
        const validation = analyzeProductData(data.product);

        switch (validation) {
          case 'accepted':
            await handleSuccessfulRecycle(barcode);
            updateState({ scanResult: { type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl } });
            break;
          case 'rejected':
            const rejectMessage = t('scanner.notPlastic');
            showError(rejectMessage);
            updateState({ scanResult: { type: 'error', message: rejectMessage, imageUrl } });
            triggerPiConveyor('rejected');
            break;
          case 'inconclusive':
            if (isManual) {
              const inconclusiveMessage = "Barcode data is inconclusive. Please use the camera scanner for a visual check.";
              showError(inconclusiveMessage);
              updateState({ scanResult: { type: 'error', message: inconclusiveMessage, imageUrl } });
            } else {
              toast.info("Barcode data unclear. Analyzing camera feed for confirmation...");
              setTimeout(handleAutomaticImageAnalysis, IMAGE_ANALYSIS_DELAY_MS);
            }
            break;
        }
      } else {
        const notFoundMessage = t('scanner.notFound');
        showError(notFoundMessage);
        updateState({ scanResult: { type: 'error', message: notFoundMessage } });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      updateState({ scanResult: { type: 'error', message: errorMessage } });
      triggerPiConveyor('rejected');
    } finally {
      if (!state.isImageAnalyzing) {
        setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000);
      }
    }
  };

  const handleRedeem = async () => {
    updateState({ showTicket: true, isRedeeming: true, qrCodeValue: null, generatedVoucherCode: null });
    try {
      const { data, error } = await supabase.functions.invoke('generate-voucher', { body: { points, userId: user?.id } });
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
    updateState({ showTicket: false, qrCodeValue: null, generatedVoucherCode: null });
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
        processBarcode(state.manualBarcode.trim(), true);
        updateState({ manualBarcode: '' });
      },
    },
  };
};