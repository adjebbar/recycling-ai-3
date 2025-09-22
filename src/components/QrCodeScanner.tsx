"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  onCameraInitError: (error: string) => void;
}

const QrCodeScanner = ({ onScanSuccess, onScanFailure, onCameraInitError }: QrCodeScannerProps) => {
  const callbacksRef = useRef({ onScanSuccess, onScanFailure, onCameraInitError });
  callbacksRef.current = { onScanSuccess, onScanFailure, onCameraInitError };

  useEffect(() => {
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
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [0],
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          videoConstraints: { facingMode: 'environment' }
        },
        false
      );

      scanner.render(successCallback, errorCallback);

    } catch (error: any) {
      callbacksRef.current.onCameraInitError(error.message || "Failed to initialize camera.");
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => {
          console.warn("QR Scanner cleanup error:", err);
        });
      }
    };
  }, []); // Empty dependency array.

  return <div id="qr-reader" className="w-full" />;
};

export default QrCodeScanner;