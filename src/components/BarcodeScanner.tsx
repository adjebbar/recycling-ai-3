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

  useEffect(() => {
    const initErrorCallback = (errorMessage: string) => {
      // This callback is specifically for camera initialization errors (e.g., permissions, camera in use).
      callbacksRef.current.onCameraInitError(errorMessage);
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 20,
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [0], // 0 for camera
      },
      /* verbose= */ false
    );

    const successCallback = (decodedText: string) => {
      callbacksRef.current.onScanSuccess(decodedText);
    };

    const scanErrorCallback = (errorMessage: string) => {
      // This callback is for errors during scanning, like not finding a code.
      if (callbacksRef.current.onScanFailure) {
        callbacksRef.current.onScanFailure(errorMessage);
      } else {
        console.warn("Barcode scan failure (no handler):", errorMessage);
      }
    };

    // @ts-ignore: The html5-qrcode library's render method actually accepts 3 arguments, but TypeScript definitions might be outdated.
    html5QrcodeScanner.render(successCallback, scanErrorCallback, initErrorCallback);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode-scanner. This is expected on rapid navigation.", error);
      });
    };
  }, []); // Empty dependency array means this runs once on mount

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;