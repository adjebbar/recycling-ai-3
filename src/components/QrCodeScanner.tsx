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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      console.log("QrCodeScanner: Initializing scanner for the first time.");

      const initErrorCallback = (errorMessage: string) => {
        console.error("QrCodeScanner: Camera initialization error:", errorMessage);
        callbacksRef.current.onCameraInitError(errorMessage);
      };

      const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [0],
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          videoConstraints: {
            facingMode: 'environment'
          }
        },
        false
      );
      scannerRef.current = html5QrcodeScanner;

      const successCallback = (decodedText: string) => {
        console.log("QrCodeScanner: Scan success:", decodedText);
        callbacksRef.current.onScanSuccess(decodedText);
      };

      const scanErrorCallback = (errorMessage: string) => {
        if (callbacksRef.current.onScanFailure) {
          callbacksRef.current.onScanFailure(errorMessage);
        }
      };

      // @ts-ignore
      html5QrcodeScanner.render(successCallback, scanErrorCallback, initErrorCallback);
    }

    return () => {
      if (scannerRef.current) {
        console.log("QrCodeScanner: Clearing scanner.");
        scannerRef.current.clear().catch(error => {
          console.error("QrCodeScanner: Failed to clear html5-qrcode-scanner.", error);
        });
        scannerRef.current = null;
      }
      mounted.current = false;
    };
  }, []);

  return <div id="qr-reader" className="w-full" />;
};

export default QrCodeScanner;