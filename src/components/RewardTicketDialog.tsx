"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Printer } from "lucide-react";
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
}

const VIRTUAL_CASH_PER_POINT = 0.01; // $0.01 per point
const SHOPPING_CENTER_ID = "SC-12345";

export const RewardTicketDialog = ({ open, onOpenChange }: RewardTicketDialogProps) => {
  const { points, resetAnonymousPoints } = useAuth();
  const cashValue = (points * VIRTUAL_CASH_PER_POINT).toFixed(2);

  const qrCodeValue = JSON.stringify({
    shoppingCenterId: SHOPPING_CENTER_ID,
    amount: parseFloat(cashValue),
    currency: "USD",
    points: points,
    issuedAt: new Date().toISOString(),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleRedeemAndClose = () => {
    resetAnonymousPoints();
    onOpenChange(false);
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
          
          <div className="bg-white p-4 rounded-md flex justify-center my-4">
            <QRCode value={qrCodeValue} size={200} />
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
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <AlertDialogAction onClick={handleRedeemAndClose}>
            Close & Redeem
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};