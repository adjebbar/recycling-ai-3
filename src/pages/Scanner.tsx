"use client";

import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { useScannerLogic } from '@/hooks/useScannerLogic';
import { ScannerView } from '@/components/scanner/ScannerView.tsx';
import { AnonymousUserActions } from '@/components/scanner/AnonymousUserActions.tsx';
import { RewardTicketDialog } from '@/components/RewardTicketDialog';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import Html5QrcodeScanner type

const ScannerPage = () => {
  const { t } = useTranslation();
  const { user, points } = useAuth();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null); // Create a ref for the scanner instance
  const { state, actions } = useScannerLogic(scannerRef); // Pass the scannerRef to the hook

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground">
      <div className="container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('scanner.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('scanner.subtitle')}</p>
        </div>

        <ScannerView state={state} actions={actions} scannerRef={scannerRef} />

        {user ? (
          <div className="mt-4 w-full max-w-lg flex justify-center">
            <Button
              variant="default"
              size="lg"
              onClick={actions.handleRedeem}
              disabled={points === 0 || state.isRedeeming}
              className="w-full"
            >
              <Gift className="mr-2 h-5 w-5" />
              {state.isRedeeming ? t('scanner.generatingVoucher') : t('scanner.redeemPoints', { count: points })}
            </Button>
          </div>
        ) : (
          <AnonymousUserActions
            points={points}
            isRedeeming={state.isRedeeming}
            onRedeem={actions.handleRedeem}
            onReset={actions.resetAnonymousPoints}
          />
        )}

        <RewardTicketDialog
          open={!!state.qrCodeValue} // Open when QR code value is available
          onOpenChange={(open) => {
            if (!open) actions.handleRedeemAndClose();
          }}
          qrCodeValue={state.qrCodeValue}
          voucherCode={state.generatedVoucherCode}
          isLoading={state.isRedeeming}
          points={points}
          onRedeemAndClose={actions.handleRedeemAndClose}
        />
      </div>
    </div>
  );
};

export default ScannerPage;