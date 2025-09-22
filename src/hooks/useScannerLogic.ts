"use client";

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabaseClient';
import { achievementsList } from '@/lib/achievements';

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

  if (exclusionKeywords.some(k => searchText.includes(k))) return false;
  if (plasticKeywords.some(k => searchText.includes(k)) && bottleKeywords.some(k => searchText.includes(k))) return true;
  if (drinkKeywords.some(k => searchText.includes(k)) && bottleKeywords.some(k => searchText.includes(k))) return true;
  if ((searchText.includes('eau') || searchText.includes('water')) && !exclusionKeywords.some(k => searchText.includes(k))) return true;

  return false;
};

export const useScannerLogic = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addPoints, user, points, resetAnonymousPoints } = useAuth();

  const [state, setState] = useState({
    lastScanned: null as string | null,
    manualBarcode: '',
    scanResult: null as { type: 'success' | 'error'; message: string; imageUrl?: string } | null,
    cameraInitializationError: null as string | null,
    scanFailureMessage: null as string | null,
    showTicket: false,
    qrCodeValue: null as string | null,
    generatedVoucherCode: null as string | null,
    isRedeeming: false,
    imageAnalysisMode: false,
    capturedImage: null as string | null,
    isAnalyzingImage: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processBarcode = async (barcode: string) => {
    if (!barcode || barcode === state.lastScanned) return;
    updateState({ lastScanned: barcode, scanFailureMessage: null, scanResult: null });
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
        } else {
          const errorMessage = t('scanner.notPlastic');
          showError(errorMessage);
          updateState({ scanResult: { type: 'error', message: errorMessage, imageUrl }, imageAnalysisMode: true });
          triggerPiConveyor('rejected');
        }
      } else {
        const errorMessage = t('scanner.notFound');
        showError(errorMessage);
        updateState({ scanResult: { type: 'error', message: errorMessage }, imageAnalysisMode: true });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      updateState({ scanResult: { type: 'error', message: errorMessage }, imageAnalysisMode: true });
      triggerPiConveyor('rejected');
    } finally {
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 3000);
    }
  };

  const handleImageAnalysis = async () => {
    if (!state.capturedImage) return;
    updateState({ isAnalyzingImage: true, scanResult: null });
    const loadingToast = showLoading("Analyzing image...");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', { body: { imageData: state.capturedImage } });
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
      showError(err.message);
      updateState({ scanResult: { type: 'error', message: err.message } });
      triggerPiConveyor('rejected');
    } finally {
      updateState({ isAnalyzingImage: false, capturedImage: null, imageAnalysisMode: false });
      setTimeout(() => updateState({ scanResult: null }), 3000);
    }
  };

  const handleRedeem = async () => {
    updateState({ showTicket: true, isRedeeming: true, qrCodeValue: null, generatedVoucherCode: null });
    try {
      const { data, error } = await supabase.functions.invoke('generate-voucher', { body: { points } });
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
    updateState({ showTicket: false });
  };

  return {
    state,
    points,
    fileInputRef,
    actions: {
      updateState,
      processBarcode,
      handleImageAnalysis,
      handleRedeem,
      handleRedeemAndClose,
      resetAnonymousPoints,
      handleManualSubmit: (e: React.FormEvent) => {
        e.preventDefault();
        processBarcode(state.manualBarcode.trim());
        updateState({ manualBarcode: '' });
      },
      handleImageCapture: (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => updateState({ capturedImage: reader.result as string });
          reader.readAsDataURL(file);
        }
      },
    },
  };
};