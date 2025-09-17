"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface RewardTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeValue: string | null;
  isLoading: boolean;
  points: number;
  onRedeemAndClose: () => void;
}

const VIRTUAL_CASH_PER_POINT = 0.01;
const SHOPPING_CENTER_ID = "SC-12345";

export const RewardTicketDialog = ({ open, onOpenChange, qrCodeValue, isLoading, points, onRedeemAndClose }: RewardTicketDialogProps) => {
  const cashValue = (points * VIRTUAL_CASH_PER_POINT).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="print:p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl font-bold text-primary">Shopping Voucher</AlertDialogTitle>
            <AlertDialogDescription className="text-center print:hidden">
              Present this QR code at checkout. Your points will be reset after closing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-white p-4 rounded-md flex justify-center items-center my-4 h-[216px]">
            {isLoading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : qrCodeValue ? (
              <QRCode value={qrCodeValue} size={200} />
            ) : (
              <p className="text-destructive text-center">Failed to generate voucher. Please try again.</p>
            )}
          </div>

          <div className="text-center my-4">
            <p className="text-sm text-muted-foreground">Voucher Value</p>
            <p className="text-4xl font-bold">${cashValue}</p>
            <p className="text-xs text-muted-foreground">From {points} points</p>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1 mt-4">
            <p>ID: {SHOPPING_CENTER_ID}</p>
            <p className="print:hidden">This is a one-time use voucher.</p>
          </div>
        </div>
        
        <AlertDialogFooter className="print:hidden">
          <Button variant="outline" onClick={handlePrint} disabled={isLoading || !qrCodeValue}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <AlertDialogAction onClick={onRedeemAndClose} disabled={isLoading}>
            Close & Redeem
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};