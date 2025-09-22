"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void; // For scan failures (e.g., no code detected after camera starts)
  onCameraInitError: (error: string) => void; // For camera initialization errors (e.g., permissions)
  scannerRef?: React.MutableRefObject<Html5QrcodeScanner | null>; // New prop to expose scanner instance
}

const BarcodeScanner = ({ onScanSuccess, onScanFailure, onCameraInitError, scannerRef }: BarcodeScannerProps) => {
  // Use a ref for callbacks to ensure the latest functions are always used inside the effect.
  const callbacksRef = useRef({ onScanSuccess, onScanFailure, onCameraInitError });
  callbacksRef.current = { onScanSuccess, onScanFailure, onCameraInitError };

  useEffect(() => {
    // This local variable will hold the scanner instance for the scope of this effect.
    let scanner: Html5QrcodeScanner | null = null;

    try {
      const successCallback = (decodedText: string) => {
        callbacksRef.current.onScanSuccess(decodedText);
      };

      const errorCallback = (errorMessage: string) => {
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(errorMessage);
        }
      };

      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 20,
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [0],
          videoConstraints: { facingMode: 'environment' }
        },
        false
      );

      if (scannerRef) {
        scannerRef.current = scanner;
      }

      scanner.render(successCallback, errorCallback);

    } catch (error: any) {
      callbacksRef.current.onCameraInitError(error.message || "Failed to initialize camera.");
    }

    // Cleanup function to run when the component unmounts.
    return () => {
      if (scanner) {
        scanner.clear().catch(err => {
          // This error is expected in development with React Strict Mode.
          // It happens when the component unmounts while the camera is starting.
          // We can safely ignore it as it doesn't affect functionality.
          console.warn("Scanner cleanup error:", err);
        });
      }
      if (scannerRef) {
        scannerRef.current = null;
      }
    };
  }, [scannerRef]); // Rerun effect if the parent's ref object changes.

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;