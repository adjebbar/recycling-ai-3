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

type ValidationResult = 'accepted' | 'rejected' | 'inconclusive';

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
  const labels = (Array.isArray(product.labels) ? product.labels.join(' ') : product.labels || '').toLowerCase();
  const brands = (product.brands || '').toLowerCase();
  const quantity = (product.quantity || '').toLowerCase(); // Added quantity

  const searchText = [
    productName, genericName, categories, packaging, packagingTags,
    ingredientsText, traces, manufacturingPlaces, labels, brands, quantity
  ].filter(Boolean).join(' ');

  console.log("analyzeProductData: Final searchText for analysis:", searchText);
  console.log("DEBUG: Raw product.packaging:", product.packaging);
  console.log("DEBUG: Lowercase packaging:", packaging);
  console.log("DEBUG: Raw product.packaging_tags:", product.packaging_tags);
  console.log("DEBUG: Lowercase packaging_tags (joined):", packagingTags);

  // --- Phase 1: Strong Positive Identification (if it's definitely a plastic bottle) ---
  // Direct check for 'plastic' in packaging fields (highest priority for acceptance)
  const directPlasticTerms = ['plastic', 'plastique', 'plastico', 'pet', 'hdpe', 'ldpe', 'pp', 'pvc', 'polyethylene', 'polypropylene', 'polystyrene', 'polyvinyl chloride', 'polyéthylène', 'polypropylène', 'polystyrène', 'chlorure de polyvinyle', 'polyethylene terephthalate'];
  console.log("DEBUG: Checking directPlasticTerms in packaging/packagingTags:", directPlasticTerms);

  const isPlasticInPackaging = directPlasticTerms.some(k => {
    const found = packaging.includes(k);
    console.log(`DEBUG: packaging.includes('${k}') for packaging='${packaging}' = ${found}`);
    return found;
  });

  const isPlasticInPackagingTags = directPlasticTerms.some(k => {
    const found = packagingTags.includes(k);
    console.log(`DEBUG: packagingTags.includes('${k}') for packagingTags='${packagingTags}' = ${found}`);
    return found;
  });

  if (isPlasticInPackaging || isPlasticInPackagingTags) {
    console.log("analyzeProductData: ACCEPTED - Found 'plastic' directly in packaging fields (multi-language).");
    return 'accepted';
  }

  // --- Phase 2: Strict Exclusion (if it's definitely NOT plastic, after checking for explicit plastic) ---
  const definitiveNonPlasticKeywords = [
    'glass', 'verre', 'vidrio', 'cristal', // Glass
    'metal', 'métal', 'aluminium', 'can', 'canette', 'tin', 'acier', 'steel', 'lata', 'hojalata', // Metal
    'carton', 'paper', 'papier', 'wood', 'bois', 'brique', 'tetrapak', 'cartón', 'papel', 'madera', // Paper/Cardboard/Wood
    'ceramic', 'céramique', 'cerámica', // Ceramic
    'jar', 'pot', 'bocal', 'tarro', 'frasco', // Often glass jars
    'bag', 'sac', 'sachet', 'pouch', 'sachet refermable', 'bolsa', 'saquito', // Flexible packaging (usually not bottles)
    'cup', 'tasse', 'gobelet', 'plate', 'assiette', 'tray', 'barquette', 'taza', 'vaso', 'plato', 'bandeja', // Non-bottle containers
    'aerosol', 'spray', 'bombe', 'aerosol', // Aerosol cans
    'film', 'pellicule', 'wrap', 'emballage souple', 'película', 'envoltura', // Films/wraps
    'box', 'boîte', 'caja', // Boxes
    'pouch', 'sachet', 'bolsa', // Pouches/bags
  ];

  if (definitiveNonPlasticKeywords.some(k => searchText.includes(k))) {
    console.log("analyzeProductData: REJECTED - Found definitive non-plastic keyword in searchText.");
    return 'rejected';
  }

  // --- Phase 3: Combined Heuristics (if it's likely a plastic bottle based on context) ---
  const bottleTerms = ['bottle', 'bouteille', 'botella', 'flacon', 'container', 'récipient', 'envase'];
  const liquidProductKeywords = [
    'water', 'eau', 'agua', 'mineral water', 'eau minérale', 'agua mineral',
    'drink', 'boisson', 'bebida', 'soda', 'jus', 'juice', 'zumo',
    'milk', 'lait', 'leche', 'yogurt drink', 'boisson lactée', 'bebida láctea',
    'oil', 'huile', 'aceite', 'vinegar', 'vinaigre', 'vinagre',
    'shampoo', 'conditioner', 'gel douche', 'body wash', 'lotion', 'detergent', 'liquide vaisselle', 'champú', 'acondicionador', 'gel de ducha', 'loción', 'detergente',
  ];

  // Check for "bottle" combined with liquid product keywords (often implies plastic if not excluded)
  if (
    bottleTerms.some(k => searchText.includes(k)) &&
    liquidProductKeywords.some(k => searchText.includes(k))
  ) {
    console.log("analyzeProductData: ACCEPTED - Found bottle and liquid product keywords.");
    return 'accepted';
  }

  const strongPlasticBottleKeywords = [
    'plastic bottle', 'bouteille plastique', 'flacon plastique', 'botella de plástico', // Explicit plastic bottle
    'pet bottle', 'bouteille pet', 'botella pet', // Specific plastic type
    'hdpe bottle', 'bouteille hdpe', 'botella hdpe', // Specific plastic type
    'plastic packaging', 'emballage plastique', 'envase plástico', // General plastic packaging
    'polyethylene', 'polypropylene', 'polystyrene', 'polyvinyl chloride', // Plastic polymers
    'pet', 'hdpe', 'ldpe', 'pp', 'pvc', 'ps', 'pe', // Common plastic abbreviations
    'water bottle', 'bouteille d\'eau', 'botella de agua', // Common water bottle terms
  ];

  if (strongPlasticBottleKeywords.some(k => searchText.includes(k))) {
    console.log("analyzeProductData: ACCEPTED - Found strong plastic bottle identifier in general text.");
    return 'accepted';
  }

  const generalPlasticTerms = ['plastic', 'plastique', 'plastico', 'polymère', 'polymer', 'polímero'];
  const generalContainerTerms = ['bottle', 'bouteille', 'flacon', 'container', 'récipient', 'envase', 'botella', 'frasco'];

  if (
    generalPlasticTerms.some(k => searchText.includes(k)) &&
    generalContainerTerms.some(k => searchText.includes(k))
  ) {
    console.log("analyzeProductData: ACCEPTED - Found general plastic and container terms.");
    return 'accepted';
  }

  // --- Phase 4: Inconclusive (if no strong decision can be made from text) ---
  console.log("analyzeProductData: INCONCLUSIVE - Text analysis not definitive. Recommending image analysis.");
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

  const handleImageAnalysisFromProductData = async (imageUrl: string, barcode?: string) => {
    updateState({ isImageAnalyzing: true, scanResult: null });
    const loadingToast = showLoading("Analyzing product image...");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-image-for-plastic-bottle', { body: { imageUrl } });
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
        console.log("processBarcode: Product data received from API:", data.product); // Added log
        const imageUrl = data.product.image_front_url || data.product.image_url;
        const validation = analyzeProductData(data.product);
        console.log("processBarcode: Product validation result:", validation); // Log the validation result

        switch (validation) {
          case 'accepted':
            await handleSuccessfulRecycle(barcode);
            updateState({ scanResult: { type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl } });
            break;
          case 'rejected':
            const rejectMessage = t('scanner.notPlastic');
            showError(rejectMessage);
            updateState({ scanResult: { type: 'error', message: rejectMessage } }); 
            triggerPiConveyor('rejected');
            break;
          case 'inconclusive':
            if (imageUrl) {
              toast.info("Barcode data unclear. Analyzing product image for confirmation...");
              await handleImageAnalysisFromProductData(imageUrl, barcode);
            } else if (isManual) {
              const inconclusiveMessage = "Barcode data is inconclusive and no product image is available. Please use the camera scanner for a visual check.";
              showError(inconclusiveMessage);
              updateState({ scanResult: { type: 'error', message: inconclusiveMessage, imageUrl } });
            } else {
              toast.info("Barcode data unclear. Analyzing camera feed for confirmation...");
              setTimeout(handleAutomaticImageAnalysisFromLiveCamera, IMAGE_ANALYSIS_DELAY_MS);
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