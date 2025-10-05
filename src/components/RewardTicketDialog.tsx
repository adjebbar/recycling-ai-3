"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';

interface RewardTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeValue: string | null;
  voucherCode: string | null;
  isLoading: boolean;
  points: number;
  onRedeemAndClose: () => void;
  rewardName: string | null;
}

const VIRTUAL_CASH_PER_POINT = 0.01;
const SHOPPING_CENTER_ID = "SC-12345";

export const RewardTicketDialog = ({ open, onOpenChange, qrCodeValue, voucherCode, isLoading, points, onRedeemAndClose, rewardName }: RewardTicketDialogProps) => {
  const cashValue = (points * VIRTUAL_CASH_PER_POINT).toFixed(2);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!emailRecipient || !qrCodeValue || !voucherCode || !rewardName) {
      showError("Please provide an email address and ensure voucher details are available.");
      return;
    }

    setIsSendingEmail(true);
    const loadingToast = showLoading("Sending voucher via email...");

    try {
      const { data, error } = await supabase.functions.invoke('send-voucher-email', {
        body: {
          toEmail: emailRecipient,
          voucherCode: voucherCode,
          qrCodeValue: qrCodeValue,
          points: points,
          cashValue: cashValue,
          rewardName: rewardName,
        },
      });

      dismissToast(loadingToast);

      if (error) {
        let errorMessage = 'Failed to send email.';
        try {
          const errorBody = await error.context.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) {
          console.error("Could not parse error response from edge function:", e);
        }
        throw new Error(errorMessage);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess("Voucher sent to email successfully!");
      setEmailRecipient(''); // Clear email field
    } catch (err: any) {
      dismissToast(loadingToast);
      console.error("Error sending email:", err);
      showError(`Email sending failed: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent id="printable-voucher" className="w-[280px] p-0"> {/* Moved ID here */}
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="text-center text-xl font-bold text-primary-dark">Shopping Voucher</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground no-print">
            Present this QR code at checkout. Your points will be reset after closing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="qr-code-container flex justify-center items-center my-4">
            {isLoading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary-dark" />
            ) : ( 
              qrCodeValue ? (
                <QRCode value={qrCodeValue} size={160} />
              ) : (
                <p className="text-destructive text-center text-sm">Failed to generate voucher. Please try again.</p>
              )
            )}
          </div>

          {voucherCode && (
            <div className="text-center my-4">
              <p className="text-xs text-muted-foreground">Voucher Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-foreground">{voucherCode}</p>
            </div>
          )}

          <div className="text-center my-4">
            <p className="text-xs text-muted-foreground">Voucher Value</p>
            <p className="text-3xl font-bold text-primary-dark">${cashValue}</p>
            <p className="text-xs text-muted-foreground">From {points} points</p>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1 mt-4">
            <p>ID: {SHOPPING_CENTER_ID}</p>
            <p className="no-print">This is a one-time use voucher.</p>
          </div>
        
        {/* Email Sending Section - Hidden during print */}
        <div className="mt-6 pt-4 border-t border-muted-foreground/20 no-print p-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Send Voucher via Email</h3>
          <div className="grid gap-2">
            <Label htmlFor="email-recipient">Recipient Email</Label>
            <Input
              id="email-recipient"
              type="email"
              placeholder="recipient@example.com"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              disabled={isLoading || isSendingEmail || !qrCodeValue}
            />
          </div>
          <Button
            className="w-full mt-4"
            onClick={handleSendEmail}
            disabled={isLoading || isSendingEmail || !emailRecipient || !qrCodeValue}
          >
            {isSendingEmail ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Send via Email</>
            )}
          </Button>
        </div>

        <AlertDialogFooter className="no-print p-4 flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={isLoading || !qrCodeValue} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <AlertDialogAction onClick={onRedeemAndClose} disabled={isLoading} className="w-full sm:w-auto">
            Close & Redeem
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};