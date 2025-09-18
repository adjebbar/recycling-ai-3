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
    const initErrorCallback = (errorMessage: string) => {
      callbacksRef.current.onCameraInitError(errorMessage);
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0],
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        // Explicitly request the back camera
        videoConstraints: { // Renamed from cameraConfig to videoConstraints
          facingMode: 'environment'
        }
      },
      false
    );

    const successCallback = (decodedText: string) => {
      callbacksRef.current.onScanSuccess(decodedText);
    };

    const scanErrorCallback = (errorMessage: string) => {
      if (callbacksRef.current.onScanFailure) {
        callbacksRef.current.onScanFailure(errorMessage);
      }
    };

    // @ts-ignore
    html5QrcodeScanner.render(successCallback, scanErrorCallback, initErrorCallback);

    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode-scanner.", error);
      });
    };
  }, []);

  return <div id="qr-reader" className="w-full" />;
};

export default QrCodeScanner;