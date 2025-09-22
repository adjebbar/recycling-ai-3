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
  const callbacksRef = useRef({ onScanSuccess, onScanFailure, onCameraInitError });
  callbacksRef.current = { onScanSuccess, onScanFailure, onCameraInitError };
  const internalScannerRef = useRef<Html5QrcodeScanner | null>(null); // Internal ref to store scanner instance
  const mounted = useRef(false); // Track if component has truly mounted

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true; // Mark as truly mounted after the first render cycle
      console.log("BarcodeScanner: Initializing scanner for the first time.");

      const initErrorCallback = (errorMessage: string) => {
        console.error("BarcodeScanner: Camera initialization error:", errorMessage);
        callbacksRef.current.onCameraInitError(errorMessage);
      };

      const html5QrcodeScanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 20,
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [0], // 0 for camera
          videoConstraints: {
            facingMode: 'environment'
          }
        },
        /* verbose= */ false
      );
      internalScannerRef.current = html5QrcodeScanner; // Store scanner instance internally
      if (scannerRef) {
        scannerRef.current = html5QrcodeScanner; // Expose to parent if ref is provided
      }

      const successCallback = (decodedText: string) => {
        console.log("BarcodeScanner: Scan success:", decodedText);
        callbacksRef.current.onScanSuccess(decodedText);
      };

      const scanErrorCallback = (errorMessage: string) => {
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(errorMessage);
        } else {
          console.warn("BarcodeScanner: Scan failure (no handler):", errorMessage);
        }
      };

      // @ts-ignore: The html5-qrcode library's render method actually accepts 3 arguments, but TypeScript definitions might be outdated.
      html5QrcodeScanner.render(successCallback, scanErrorCallback, initErrorCallback);
    }

    return () => {
      if (internalScannerRef.current) {
        console.log("BarcodeScanner: Clearing scanner.");
        internalScannerRef.current.clear().catch(error => {
          console.error("BarcodeScanner: Failed to clear html5-qrcode-scanner.", error);
        });
        internalScannerRef.current = null;
        if (scannerRef) {
          scannerRef.current = null; // Clear exposed ref as well
        }
      }
      mounted.current = false; // Reset for next mount if component is truly unmounted
    };
  }, [scannerRef]); // Add scannerRef to dependencies to re-run if it changes

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;