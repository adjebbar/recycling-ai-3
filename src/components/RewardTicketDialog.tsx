"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Download } from "lucide-react"; // Added Download icon
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRef } from "react"; // Import useRef
import domtoimage from 'dom-to-image'; // Import domtoimage
import { showSuccess, showError } from '@/utils/toast'; // Import toast utilities

interface RewardTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeValue: string | null; // This will be the JWT
  voucherCode: string | null; // New prop for human-readable code
  isLoading: boolean;
  points: number;
  onRedeemAndClose: () => void;
}

const VIRTUAL_CASH_PER_POINT = 0.01;
const SHOPPING_CENTER_ID = "SC-12345";

export const RewardTicketDialog = ({ open, onOpenChange, qrCodeValue, voucherCode, isLoading, points, onRedeemAndClose }: RewardTicketDialogProps) => {
  const cashValue = (points * VIRTUAL_CASH_PER_POINT).toFixed(2);
  const qrCodeRef = useRef<HTMLDivElement>(null); // Create ref for QR code container

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQrCode = async () => {
    if (qrCodeRef.current) {
      try {
        // Ensure the background is white for the downloaded image
        const dataUrl = await domtoimage.toPng(qrCodeRef.current, {
          bgcolor: '#ffffff', 
          width: qrCodeRef.current.offsetWidth,
          height: qrCodeRef.current.offsetHeight,
        });
        const link = document.createElement('a');
        link.download = `ecoscan-voucher-${voucherCode || 'qr-code'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess("QR Code downloaded successfully!");
      } catch (error) {
        console.error("Failed to download QR code as image:", error);
        showError("Failed to download QR Code. Please try again.");
      }
    }
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
          
          <div ref={qrCodeRef} className="bg-white p-4 rounded-md flex justify-center items-center my-4 h-[216px]"> {/* Apply ref here */}
            {isLoading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : qrCodeValue ? ( // QR code still uses the JWT
              <QRCode value={qrCodeValue} size={200} />
            ) : (
              <p className="text-destructive text-center">Failed to generate voucher. Please try again.</p>
            )}
          </div>

          {voucherCode && ( // Display human-readable code if available
            <div className="text-center my-4">
              <p className="text-sm text-muted-foreground">Voucher Code</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-foreground">{voucherCode}</p>
            </div>
          )}

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
          <Button variant="secondary" onClick={handleDownloadQrCode} disabled={isLoading || !qrCodeValue}> {/* New Download button */}
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </Button>
          <AlertDialogAction onClick={onRedeemAndClose} disabled={isLoading}>
            Close & Redeem
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};