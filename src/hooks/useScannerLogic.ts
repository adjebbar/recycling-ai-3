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

type ValidationResult = 'accepted' | 'rejected' | { type: 'inconclusive', reason: 'no_packaging_info' | 'vague_text_info' };

const analyzeProductData = (product: any): ValidationResult => {
  console.log("--- analyzeProductData START ---");
  console.log("Full Product Data:", JSON.stringify(product, null, 2));

  // Normalize relevant fields to lowercase strings for easier searching
  const productName = (product.product_name || '').toLowerCase();
  const genericName = (product.generic_name || '').toLowerCase();
  const categories = (Array.isArray(product.categories) ? product.categories.join(' ') : product.categories || '').toLowerCase();
  const packaging = (product.packaging || '').toLowerCase();
  const packagingTags = (Array.isArray(product.packaging_tags) ? product.packaging_tags.join(' ') : product.packaging_tags || '').toLowerCase();
  const stores = (product.stores || '').toLowerCase();

  console.log("Normalized packaging field:", packaging);
  console.log("Normalized packaging_tags field:", packagingTags);

  // Combine all relevant text for a broader search later, but prioritize direct packaging checks first
  const combinedSearchText = [
    productName, genericName, categories, packaging, packagingTags, stores
  ].filter(Boolean).join(' ');

  console.log("Combined Search Text for analysis:", combinedSearchText);

  // --- Phase 1: Direct Packaging Check for Non-Plastic (Highest Priority REJECT) ---
  const definitiveNonPlasticPackagingTerms = [
    'glass', 'verre', 'vidrio', 'cristal',
    'metal', 'métal', 'aluminium', 'can', 'canette', 'tin', 'acier', 'steel', 'lata', 'hojalata',
    'carton', 'paper', 'papier', 'wood', 'bois', 'brique', 'tetrapak', 'cartón', 'papel', 'madera',
    'aerosol', 'spray', 'bombe',
  ];
  console.log("Phase 1: Checking for explicit non-plastic packaging terms in packaging/packaging_tags...");
  const isPackagingDirectlyNonPlastic = definitiveNonPlasticPackagingTerms.some(term => {
    const foundInPackaging = packaging.includes(term);
    const foundInPackagingTags = packagingTags.includes(term);
    if (foundInPackaging) console.log(`DEBUG: Found definitive non-plastic term '${term}' in 'packaging'.`);
    if (foundInPackagingTags) console.log(`DEBUG: Found definitive non-plastic term '${term}' in 'packaging_tags'.`);
    return foundInPackaging || foundInPackagingTags;
  });

  if (isPackagingDirectlyNonPlastic) {
    console.log("--- analyzeProductData END: REJECTED (Explicit Non-Plastic Packaging) ---");
    return 'rejected';
  }

  // --- Phase 2: Direct Packaging Check for Plastic (Highest Priority ACCEPT) ---
  const directPackagingPlasticTerms = [
    'plastic', 'plastique', 'bouteille en plastique', 'flacon en plastique', 'emballage en plastique',
    'pet', 'hdpe', 'ldpe', 'pp', 'ps', 'pvc',
    'bottle (plastic)', 'bouteille (plastique)' // Explicitly added for common patterns
  ];
  console.log("Phase 2: Checking for explicit plastic packaging terms in packaging/packaging_tags...");
  const isPackagingDirectlyPlastic = directPackagingPlasticTerms.some(term => {
    const foundInPackaging = packaging.includes(term);
    const foundInPackagingTags = packagingTags.includes(term);
    if (foundInPackaging) console.log(`DEBUG: Found direct plastic term '${term}' in 'packaging'.`);
    if (foundInPackagingTags) console.log(`DEBUG: Found direct plastic term '${term}' in 'packaging_tags'.`);
    return foundInPackaging || foundInPackagingTags;
  });

  if (isPackagingDirectlyPlastic) {
    console.log("--- analyzeProductData END: ACCEPTED (Explicit Plastic Packaging) ---");
    return 'accepted';
  }

  // --- Phase 3: Heuristics for Plastic Bottle Products (ACCEPT based on product type/name in combined text) ---
  const strongPlasticProductKeywords = [
    'water bottle', 'soda bottle', 'juice bottle', 'milk bottle', 'detergent bottle', 'shampoo bottle',
    'bouteille d\'eau', 'bouteille de soda', 'bouteille de jus', 'bouteille de lait', 'bouteille de détergent', 'bouteille de shampoing',
    'botella de agua', 'botella de refresco', 'botella de jugo', 'botella de leche', 'botella de detergente', 'botella de champú',
    'eau minérale', 'boisson gazeuse', 'soft drink', 'boisson rafraîchissante',
    'huile végétale', 'vegetable oil', 'aceite vegetal',
    'shampoo', 'conditioner', 'gel douche', 'body wash', 'lotion', 'detergent', 'liquide vaisselle',
    'champú', 'acondicionador', 'gel de ducha', 'loción', 'detergente',
    'bouteille', 'flacon', 'bottle', // Generic bottle terms
  ];
  console.log("Phase 3: Checking for strong plastic product keywords in combined text...");
  const isStronglyPlasticProduct = strongPlasticProductKeywords.some(k => {
    const found = combinedSearchText.includes(k);
    if (found) console.log(`DEBUG: Found strong plastic product keyword: '${k}'.`);
    return found;
  });

  if (isStronglyPlasticProduct) {
    console.log("--- analyzeProductData END: ACCEPTED (Strong Plastic Product Heuristic) ---");
    return 'accepted';
  }

  // --- Phase 4: Heuristics for Non-Plastic Products (REJECT based on product type/name in combined text) ---
  const strongNonPlasticProductKeywords = [
    'can of', 'canette de', 'lata de',
    'glass jar', 'pot en verre', 'tarro de cristal',
    'carton of', 'brique de',
    'beer', 'bière', 'cerveza',
    'wine', 'vin', 'vino',
    'coffee', 'café',
    'tea', 'thé',
    'chocolate bar', 'barre de chocolat',
    'crisps', 'chips',
    'film', 'pellicule', 'wrap', 'emballage souple', 'película', 'envoltura',
    'box', 'boîte', 'caja',
    'pouch', 'sachet', 'bolsa',
    'bag', 'sac', 'sachet',
    'cup', 'tasse', 'gobelet', 'plate', 'assiette', 'tray', 'barquette',
    'jar', 'pot', 'bocal', 'tarro', 'frasco',
  ];
  console.log("Phase 4: Checking for strong non-plastic product keywords in combined text...");
  const isStronglyNonPlasticProduct = strongNonPlasticProductKeywords.some(k => {
    const found = combinedSearchText.includes(k);
    if (found) console.log(`DEBUG: Found strong non-plastic product keyword: '${k}'.`);
    return found;
  });

  if (isStronglyNonPlasticProduct) {
    console.log("--- analyzeProductData END: REJECTED (Strong Non-Plastic Product Heuristic) ---");
    return 'rejected';
  }

  // --- Phase 5: Inconclusive (if no strong decision can be made) ---
  const packagingInfoPresent = packaging.length > 0 || packagingTags.length > 0;
  console.log("Phase 5: Checking for packaging info presence. Present:", packagingInfoPresent);
  if (!packagingInfoPresent) {
    console.log("--- analyzeProductData END: INCONCLUSIVE (No packaging info found) ---");
    return { type: 'inconclusive', reason: 'no_packaging_info' };
  } else {
    console.log("--- analyzeProductData END: INCONCLUSIVE (Vague text analysis) ---");
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

  const processBarcode = async (barcode: string, isManual: boolean = false) => {
    if (!barcode || (!isManual && barcode === state.lastScanned)) return;
    
    updateState({ lastScanned: barcode, scanResult: null });
    const loadingToast = showLoading(t('scanner.verifying'));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-product-info', { body: { barcode } });
      if (error || data.error) throw new Error(error?.message || data.error);
      dismissToast(loadingToast);

      if (data.status === 1 && data.product) {
        console.log("processBarcode: Product data received from API:", data.product);
        const imageUrl = data.product.image_front_url || data.product.image_url;
        const validation = analyzeProductData(data.product);
        console.log("processBarcode: Product validation result:", validation);

        if (validation === 'accepted') {
          await handleSuccessfulRecycle(barcode);
          updateState({ scanResult: { type: 'success', message: t('scanner.success', { points: POINTS_PER_BOTTLE }), imageUrl } });
        } else if (validation === 'rejected') {
          const rejectMessage = t('scanner.notPlastic');
          showError(rejectMessage);
          updateState({ scanResult: { type: 'error', message: rejectMessage, imageUrl } }); 
          triggerPiConveyor('rejected');
        } else { // validation is { type: 'inconclusive', reason: ... }
          const inconclusiveMessage = t('scanner.inconclusiveBarcode');
          showError(inconclusiveMessage);
          updateState({ scanResult: { type: 'error', message: inconclusiveMessage, imageUrl } });
          triggerPiConveyor('rejected');
        }
      } else {
        // Product not found in DB
        const notFoundMessage = t('scanner.notFoundInDbNoImage');
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
      setTimeout(() => updateState({ scanResult: null, lastScanned: null }), 5000);
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