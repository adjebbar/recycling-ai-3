"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

const BarcodeScanner = ({ onScanSuccess, onScanFailure }: BarcodeScannerProps) => {
  const callbacksRef = useRef({ onScanSuccess, onScanFailure });
  callbacksRef.current = { onScanSuccess, onScanFailure };

  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 20, // Increased FPS for faster scanning
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [0], // 0 for camera
      },
      /* verbose= */ false
    );

    const successCallback = (decodedText: string) => {
      callbacksRef.current.onScanSuccess(decodedText);
    };

    const errorCallback = (errorMessage: string) => {
      if (callbacksRef.current.onScanFailure) {
        callbacksRef.current.onScanFailure(errorMessage);
      }
    };

    html5QrcodeScanner.render(successCallback, errorCallback);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        // This can happen if the component unmounts before the scanner is fully initialized.
        // It's safe to ignore, as the camera will be released anyway.
        console.error("Failed to clear html5-qrcode-scanner. This is expected on rapid navigation.", error);
      });
    };
  }, []);

  return <div id="reader" className="w-full" />;
};

export default BarcodeScanner;