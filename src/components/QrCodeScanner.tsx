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
    const scanner = new Html5QrcodeScanner(
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
      const readerElement = document.getElementById('qr-reader');
      if (readerElement) {
        scanner.clear().catch(error => {
          console.error("QrCodeScanner: Failed to clear scanner on unmount.", error);
        });
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  return <div id="qr-reader" className="w-full" />;
};

export default QrCodeScanner;