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

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
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

    if (scannerRef) {
      scannerRef.current = scanner;
    }

    const successCallback = (decodedText: string) => callbacksRef.current.onScanSuccess(decodedText);
    const errorCallback = (errorMessage: string) => {
      if (callbacksRef.current.onScanFailure) {
        callbacksRef.current.onScanFailure(errorMessage);
      }
    };

    // @ts-ignore
    scanner.render(successCallback, errorCallback, callbacksRef.current.onCameraInitError);

    return () => {
      // This cleanup function is designed to be safe with React 18's Strict Mode.
      // It checks if the scanner's UI element is still in the DOM before trying to clear it.
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        scanner.clear().catch(error => {
          console.error("BarcodeScanner: Failed to clear scanner on unmount.", error);
        });
      }
      if (scannerRef) {
        scannerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;