"use client";

import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { CameraOff, Gift } from 'lucide-react';
import { useScannerLogic } from '@/hooks/useScannerLogic';
import { ScannerView } from '@/components/scanner/ScannerView.tsx';
import { AnonymousUserActions } from '@/components/scanner/AnonymousUserActions.tsx';
import { RewardTicketDialog } from '@/components/RewardTicketDialog';
import { Button } from '@/components/ui/button';

const ScannerPage = () => {
  const { t } = useTranslation();
  const { user, points } = useAuth(); // Get points from AuthContext
  const { state, fileInputRef, actions } = useScannerLogic(); // useScannerLogic also gets points from useAuth, but we'll use the direct one for clarity in UI

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground">
      <div className="container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('scanner.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('scanner.subtitle')}</p>
        </div>

        <ScannerView state={state} actions={actions} fileInputRef={fileInputRef} />

        {user ? (
          // For logged-in users, show a redeem button
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
          // For anonymous users, show the AnonymousUserActions component
          <AnonymousUserActions
            points={points} // This will be anonymousPoints from AuthContext when user is null
            isRedeeming={state.isRedeeming}
            onRedeem={actions.handleRedeem}
            onReset={actions.resetAnonymousPoints}
          />
        )}

        <RewardTicketDialog
          open={state.showTicket}
          onOpenChange={(open) => actions.updateState({ showTicket: open })}
          qrCodeValue={state.qrCodeValue}
          voucherCode={state.generatedVoucherCode}
          isLoading={state.isRedeeming}
          points={points} // This will be the correct points (user's or anonymous)
          onRedeemAndClose={actions.handleRedeemAndClose}
        />

        {/* The 'camera permission' message has been removed from here. */}
      </div>
    </div>
  );
};

export default ScannerPage;