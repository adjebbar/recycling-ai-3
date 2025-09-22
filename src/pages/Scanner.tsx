"use client";

import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { CameraOff } from 'lucide-react';
import { useScannerLogic } from '@/hooks/useScannerLogic';
import { ScannerView } from '@/components/scanner/ScannerView.tsx';
import { AnonymousUserActions } from '@/components/scanner/AnonymousUserActions.tsx';
import { RewardTicketDialog } from '@/components/RewardTicketDialog';

const ScannerPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { state, points, fileInputRef, actions } = useScannerLogic();

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full text-foreground">
      <div className="container mx-auto p-4 flex flex-col items-center animate-fade-in-up">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-4 text-foreground">{t('scanner.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('scanner.subtitle')}</p>
        </div>

        <ScannerView state={state} actions={actions} fileInputRef={fileInputRef} />

        {!user && (
          <AnonymousUserActions
            points={points}
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
          points={points}
          onRedeemAndClose={actions.handleRedeemAndClose}
        />

        {/* The 'camera permission' message has been removed from here. */}
      </div>
    </div>
  );
};

export default ScannerPage;