"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

const BarcodeScanner = ({ onScanSuccess, onScanFailure }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const callbacksRef = useRef({ onScanSuccess, onScanFailure });
  callbacksRef.current = { onScanSuccess, onScanFailure };

  useEffect(() => {
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [0],
        },
        false
      );

      const successCallback = (decodedText: string) => {
        callbacksRef.current.onScanSuccess(decodedText);
      };

      const errorCallback = (errorMessage: string) => {
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(errorMessage);
        }
      };

      scanner.render(successCallback, errorCallback);
      scannerRef.current = scanner;
    }

    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.clear().catch(error => {
            console.error("Failed to clear html5-qrcode-scanner.", error);
          });
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;