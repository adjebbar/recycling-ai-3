"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void; // For scan failures (e.g., no code detected after camera starts)
  onCameraInitError: (error: string) => void; // For camera initialization errors (e.g., permissions)
}

export interface BarcodeScannerRef {
  clear: () => Promise<void>;
  start: () => void; // Add a start method to re-initialize the scanner
}

const BarcodeScanner = forwardRef<BarcodeScannerRef, BarcodeScannerProps>(
  ({ onScanSuccess, onScanFailure, onCameraInitError }, ref) => {
    const callbacksRef = useRef({ onScanSuccess, onScanFailure, onCameraInitError });
    callbacksRef.current = { onScanSuccess, onScanFailure, onCameraInitError };
    const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);

    const initializeScanner = () => {
      const initErrorCallback = (errorMessage: string) => {
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
      scannerInstanceRef.current = html5QrcodeScanner;

      const successCallback = (decodedText: string) => {
        callbacksRef.current.onScanSuccess(decodedText);
      };

      const scanErrorCallback = (errorMessage: string) => {
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(errorMessage);
        } else {
          console.warn("Barcode scan failure (no handler):", errorMessage);
        }
      };

      // @ts-ignore: The html5-qrcode library's render method actually accepts 3 arguments, but TypeScript definitions might be outdated.
      html5QrcodeScanner.render(successCallback, scanErrorCallback, initErrorCallback);
    };

    useImperativeHandle(ref, () => ({
      clear: async () => {
        if (scannerInstanceRef.current) {
          try {
            await scannerInstanceRef.current.clear();
            scannerInstanceRef.current = null; // Clear the instance after stopping
            console.log("BarcodeScanner: Scanner cleared via imperative handle.");
          } catch (error) {
            console.error("BarcodeScanner: Failed to clear scanner via imperative handle:", error);
          }
        }
      },
      start: () => {
        if (!scannerInstanceRef.current) { // Only re-initialize if not already running
          initializeScanner();
        }
      }
    }));

    useEffect(() => {
      initializeScanner();

      return () => {
        if (scannerInstanceRef.current) {
          scannerInstanceRef.current.clear().catch(error => {
            console.error("Failed to clear html5-qrcode-scanner on unmount.", error);
          });
        }
      };
    }, []); // Empty dependency array means this runs once on mount

    return <div id="reader" className="w-full" />;
  }
);

export default BarcodeScanner;