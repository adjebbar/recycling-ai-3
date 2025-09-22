"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void; // For scan failures (e.g., no code detected after camera starts)
  onCameraInitError: (error: string) => void; // For camera initialization errors (e.g., permissions)
}

const BarcodeScanner = ({ onScanSuccess, onScanFailure, onCameraInitError }: BarcodeScannerProps) => {
  const callbacksRef = useRef({ onScanSuccess, onScanFailure, onCameraInitError });
  callbacksRef.current = { onScanSuccess, onScanFailure, onCameraInitError };
  const scannerRef = useRef<Html5QrcodeScanner | null>(null); // Ref to store scanner instance
  const mounted = useRef(false); // Track if component has truly mounted

  useEffect(() => {
    // In React StrictMode, effects run twice (mount -> unmount -> mount).
    // We only want to initialize the scanner once per actual component lifecycle.
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
          // Explicitly request the back camera
          videoConstraints: {
            facingMode: 'environment'
          }
        },
        /* verbose= */ false
      );
      scannerRef.current = html5QrcodeScanner; // Store scanner instance

      const successCallback = (decodedText: string) => {
        console.log("BarcodeScanner: Scan success:", decodedText);
        callbacksRef.current.onScanSuccess(decodedText);
      };

      const scanErrorCallback = (errorMessage: string) => {
        // This callback is for errors during scanning, like not finding a code.
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(errorMessage);
        } else {
          console.warn("BarcodeScanner: Scan failure (no handler):", errorMessage);
        }
      };

      // @ts-ignore: The html5-qrcode library's render method actually accepts 3 arguments, but TypeScript definitions might be outdated.
      html5QrcodeScanner.render(successCallback, scanErrorCallback, initErrorCallback);
    }

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      // This cleanup runs on unmount (and also after the first mount in StrictMode)
      if (scannerRef.current) {
        console.log("BarcodeScanner: Clearing scanner.");
        scannerRef.current.clear().catch(error => {
          console.error("BarcodeScanner: Failed to clear html5-qrcode-scanner.", error);
        });
        scannerRef.current = null;
      }
      mounted.current = false; // Reset for next mount if component is truly unmounted
    };
  }, []); // Empty dependency array means this runs once on mount

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;