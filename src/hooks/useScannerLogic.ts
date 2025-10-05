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
const IMAGE_ANALYSIS_DELAY_MS = 1500; // 1.5 seconds delay before triggering image analysis

type ValidationResult = 'accepted' | 'rejected' | { type: 'inconclusive', reason: 'no_packaging_info' | 'vague_text_info' };

const analyzeProductData = (product: any): ValidationResult => {
  // Aggregate all relevant text fields for comprehensive analysis
  const productName = (product.product_name || '').toLowerCase();
  const genericName = (product.generic_name || '').toLowerCase();
  const categories = (Array.isArray(product.categories) ? product.categories.join(' ') : product.categories || '').toLowerCase();
  const packaging = (product.packaging || '').toLowerCase();
  const packagingTags = (Array.isArray(product.packaging_tags) ? product.packaging_tags.join(' ') : product.packaging_tags || '').toLowerCase();
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  const traces = (product.traces || '').toLowerCase();
  const manufacturingPlaces = (product.manufacturing_places || '').toLowerCase();
  const labels = (product.labels || '').toLowerCase();
  const brands = (product.brands || '').toLowerCase();
  const quantity = (product.quantity || '').toLowerCase();
  const stores = (product.stores || '').toLowerCase(); // Added stores field

  const searchText = [
    productName, genericName, categories, packaging, packagingTags,
    ingredientsText, traces, manufacturingPlaces, labels, brands, quantity, stores // Include stores
  ].filter(Boolean).join(' ');

  console.log("analyzeProductData: Final searchText for analysis:", searchText);
  console.log("analyzeProductData: Raw product packaging:", product.packaging);
  console.log("analyzeProductData: Raw product packaging_tags:", product.packaging_tags);


  // --- Phase 1: Prioritize direct packaging info for plastic ---
  const directPackagingPlasticTerms = ['plastic', 'plastique', 'bouteille en plastique', 'flacon en plastique', 'emballage en plastique', 'pet', 'hdpe', 'ldpe', 'pp', 'ps', 'pvc'];
  const isPackagingExplicitlyPlastic = directPackagingPlasticTerms.some(k => {
    const foundInPackaging = packaging.includes(k) || packagingTags.includes(k);
    if (foundInPackaging) console.log(`DEBUG: ACCEPTED - Found direct plastic term in packaging: '${k}'.`);
    return foundInPackaging;
  });

  if (isPackagingExplicitlyPlastic) {
    return 'accepted';
  }

  // --- Phase 2: Strong Positive Identification (if it's definitely a plastic bottle from product name/category) ---
  const directPlasticProductKeywords = [
    'water bottle', 'soda bottle', 'juice bottle', 'milk bottle', 'detergent bottle', 'shampoo bottle', // Common product types
    'bouteille d\'eau', 'bouteille de soda', 'bouteille de jus', 'bouteille de lait', 'bouteille de détergent', 'bouteille de shampoing', // French variations
    'botella de agua', 'botella de refresco', 'botella de jugo', 'botella de leche', 'botella de detergente', 'botella de champú', // Spanish variations
    'eau minérale', 'boisson gazeuse', 'soft drink', 'boisson rafraîchissante', // Common liquid products often in plastic bottles
    'huile végétale', 'vegetable oil', 'aceite vegetal', // Oils often in plastic bottles
    'coca-cola', 'pepsi', 'fanta', 'sprite', // Specific brand names often in plastic bottles
    'evian', 'volvic', 'vittel', // Specific water brands
  ];

  const isPlasticProductDirectlyIdentified = directPlasticProductKeywords.some(k => {
    const found = searchText.includes(k);
    if (found) console.log(`DEBUG: ACCEPTED - Found direct plastic product keyword: '${k}' in searchText.`);
    return found;
  });

  if (isPlasticProductDirectlyIdentified) {
    return 'accepted';
  }

  // --- Phase 3: Strict Exclusion (if it's definitely NOT plastic) ---
  const definitiveNonPlasticKeywords = [
    'glass', 'verre', 'vidrio', 'cristal', // Glass
    'metal', 'métal', 'aluminium', 'can', 'canette', 'tin', 'acier', 'steel', 'lata', 'hojalata', // Metal
    'carton', 'paper', 'papier', 'wood', 'bois', 'brique', 'tetrapak', 'cartón', 'papel', 'madera', // Paper/Cardboard/Wood
    'ceramic', 'céramique', 'cerámica', // Ceramic
    'aerosol', 'spray', 'bombe', // Aerosol cans
    'film', 'pellicule', 'wrap', 'emballage souple', 'película', 'envoltura', // Films/wraps
    'box', 'boîte', 'caja', // Boxes
    'pouch', 'sachet', 'bolsa', // Pouches/bags
    'bag', 'sac', 'sachet', // Bags
    'cup', 'tasse', 'gobelet', 'plate', 'assiette', 'tray', 'barquette', // Non-bottle containers
    'jar', 'pot', 'bocal', 'tarro', 'frasco', // Often glass jars, but can be plastic, so lower priority than direct plastic terms
  ];

  const isDefinitelyNonPlastic = definitiveNonPlasticKeywords.some(k => {
    const found = searchText.includes(k);
    if (found) console.log(`DEBUG: REJECTED - Found definitive non-plastic keyword: '${k}' in searchText.`);
    return found;
  });

  if (isDefinitelyNonPlastic) {
    return 'rejected';
  }

  // --- Phase 4: Heuristics for common bottle types (if not explicitly identified or excluded) ---
  const bottleTerms = ['bottle', 'bouteille', 'botella', 'flacon', 'container', 'récipient', 'envase', 'frasco'];
  const liquidProductKeywords = [
    'water', 'eau', 'agua', 'mineral water', 'eau minérale', 'agua mineral',
    'drink', 'boisson', 'bebida', 'soda', 'jus', 'juice', 'zumo',
    'milk', 'lait', 'leche', 'yogurt drink', 'boisson lactée', 'bebida láctea',
    'oil', 'huile', 'aceite', 'vinegar', 'vinaigre', 'vinagre',
    'shampoo', 'conditioner', 'gel douche', 'body wash', 'lotion', 'detergent', 'liquide vaisselle', 'champú', 'acondicionador', 'gel de ducha', 'loción', 'detergente',
  ];

  const isBottleAndLiquid = bottleTerms.some(k => searchText.includes(k)) && liquidProductKeywords.some(k => searchText.includes(k));
  if (isBottleAndLiquid) {
    console.log("DEBUG: ACCEPTED - Found combination of bottle and liquid product keywords.");
    return 'accepted';
  }

  // --- Phase 5: Inconclusive (if no strong decision can be made from text) ---
  const packagingInfoPresent = packaging.length > 0 || packagingTags.length > 0;
  if (!packagingInfoPresent) {
    console.log("DEBUG: INCONCLUSIVE - No packaging info found. Recommending image analysis.");
    return { type: 'inconclusive', reason: 'no_packaging_info' };
  } else {
    console.log("DEBUG: INCONCLUSIVE - Vague text analysis. Recommending image analysis.");
    return { type: 'inconclusive', reason: 'vague_text_info' };
  }
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

  const handleImageAnalysisFromProductData = async (imageUrl: string, barcode?: string, productName?: string) => {
    updateState({ isImageAnalyzing: true, scanResult: null });
    const loadingToast = showLoading("Analyzing product image...");

    try {
      // Call the new YOLOv8 Edge Function
      const { data, error } = await supabase.functions.invoke('yolov8-detect-bottle', { body: { imageUrl, productName } });
      if (error || data.error) throw new Error(error?.message || data.error);
      dismissToast(loadingToast);

      if (data.is_plastic_bottle) {
        await handleSuccessfulRecycle(barcode);
        updateState({ scanResult: { type: 'success', message: t('scanner.imageSuccess', { points: POINTS_PER_BOTTLE }), imageUrl } });
      } else {
        const errorMessage = t('scanner.imageNotPlastic');
        showError(errorMessage);
        updateState({ scanResult: { type: 'error', message: errorMessage, imageUrl } });
        triggerPiConveyor('rejected');
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.message || "Image analysis failed.");
      updateState({ scanResult: { type: 'error', message: err.message || "Image analysis failed.", imageUrl } });
      triggerPiConveyor('rejected');
    } finally {
      updateState({ isImageAnalyzing: false });
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000);
    }
  };

  const handleAutomaticImageAnalysisFromLiveCamera = async () => {
    if (!scannerRef.current) {
      showError("Scanner not ready for image analysis.");
      return;
    }

    updateState({ isImageAnalyzing: true, scanResult: null });
    const loadingToast = showLoading("Analyzing image from camera...");

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

      // No product name available for live camera image analysis
      // Call the new YOLOv8 Edge Function
      const { data, error } = await supabase.functions.invoke('yolov8-detect-bottle', { body: { imageData } });
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
    let imageAnalysisTriggered = false; // Flag to track if image analysis was initiated

    try {
      const { data, error } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      if (error || data.error) throw new Error(error?.message || data.error);
      dismissToast(loadingToast);

      if (data.status === 1 && data.product) {
        console.log("processBarcode: Product data received from API:", data.product); // Added log
        const imageUrl = data.product.image_front_url || data.product.image_url;
        const productName = data.product.product_name; // Get product name
        const validation = analyzeProductData(data.product);
        console.log("processBarcode: Product validation result:", validation); // Log the validation result

        if (validation === 'accepted') {
          await handleSuccessfulRecycle(barcode);
          updateState({ scanResult: { type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl } });
        } else if (validation === 'rejected') {
          const rejectMessage = t('scanner.notPlastic');
          showError(rejectMessage);
          updateState({ scanResult: { type: 'error', message: rejectMessage } }); 
          triggerPiConveyor('rejected');
        } else { // validation is { type: 'inconclusive', reason: ... }
          imageAnalysisTriggered = true;
          const reason = validation.reason; // Access the specific reason

          if (imageUrl) {
            toast.info(`Barcode data inconclusive (${reason}). Analyzing product image from Open Food Facts for confirmation...`);
            await handleImageAnalysisFromProductData(imageUrl, barcode, productName); // Pass productName
          } else if (isManual) {
            const inconclusiveMessage = `Barcode data is inconclusive (${reason}) and no product image is available. Please use the camera scanner for a visual check.`;
            showError(inconclusiveMessage);
            updateState({ scanResult: { type: 'error', message: inconclusiveMessage, imageUrl } });
          } else {
            toast.info(`Barcode data inconclusive (${reason}). Analyzing camera feed for confirmation...`);
            setTimeout(handleAutomaticImageAnalysisFromLiveCamera, IMAGE_ANALYSIS_DELAY_MS);
          }
        }
      } else {
        // ** NOUVELLE LOGIQUE **
        // Si le produit n'est pas trouvé, on lance l'analyse d'image
        imageAnalysisTriggered = true;
        toast.info(t('scanner.notFoundInDb'), {
          description: t('scanner.checkingWithAi'),
        });
        // On attend un peu pour que l'utilisateur lise le message
        setTimeout(handleAutomaticImageAnalysisFromLiveCamera, IMAGE_ANALYSIS_DELAY_MS);
      }
    } catch (err: any) {
      dismissToast(loadingToast);
      const errorMessage = err.message || t('scanner.connectionError');
      showError(errorMessage);
      updateState({ scanResult: { type: 'error', message: errorMessage } });
      triggerPiConveyor('rejected');
    } finally {
      // Only clear scanResult here if image analysis was NOT triggered
      if (!imageAnalysisTriggered) {
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
      handleManualSubmit: (barcode: string) => { // Now accepts barcode directly
        processBarcode(barcode.trim(), true);
        updateState({ manualBarcode: '' });
      },
    },
  };
};