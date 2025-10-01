"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void; // For scan failures (e.g., no code detected after camera starts)
  onCameraInitError: (error: string) => void; // For camera initialization errors (e.g., permissions)
  message?: string | null; // New prop for displaying messages
}

const BarcodeScanner = ({ onScanSuccess, onScanFailure, onCameraInitError, message }: BarcodeScannerProps) => {
  const callbacksRef = useRef({ onScanSuccess, onScanFailure, onCameraInitError });
  callbacksRef.current = { onScanSuccess, onScanFailure, onCameraInitError };

  useEffect(() => {
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

    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode-scanner. This is expected on rapid navigation.", error);
      });
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="relative w-full h-full"> {/* Make this wrapper relative */}
      <div id="reader" className="w-full h-full" /> {/* Ensure reader takes full height */}
      {message && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-muted-foreground bg-background/70 px-3 py-1 rounded-md z-30">
          {message}
        </p>
      )}
    </div>
  );
};

export default BarcodeScanner;