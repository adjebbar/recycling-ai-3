"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess, showInfo } from '@/utils/toast';
import { Nfc, Scan, Star, Leaf, Zap, DollarSign, Info, BookOpenText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface GiftCardData {
  issuer: string;
  cardType: string;
  cardholderId: string;
  issuedAt: string;
  balance: {
    points: number;
    virtualValue: number;
    currency: string;
  };
  metadata: {
    totalScans: number;
    co2SavedKg: number;
    energySavedKWh: number;
  };
}

const AdminNfcReader = () => {
  const [isReading, setIsReading] = useState(false);
  const [readData, setReadData] = useState<GiftCardData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleReadNfc = async () => {
    if (!('NDEFReader' in window)) {
      showError("Web NFC is not supported on this browser. Try Chrome on Android.");
      return;
    }

    setIsReading(true);
    setReadData(null); // Clear previous read data
    showInfo("Ready to read. Please tap your NFC card to your device.");

    try {
      const ndef = new NDEFReader();
      const ac = new AbortController();
      abortControllerRef.current = ac;

      ndef.onreading = (event) => {
        const decoder = new TextDecoder();
        let dataFound = false;
        for (const record of event.message.records) {
          if (record.recordType === "mime" && record.mediaType === "application/vnd.ecoscan.giftcard+json") {
            const data = decoder.decode(record.data);
            try {
              const parsedData: GiftCardData = JSON.parse(data);
              setReadData(parsedData);
              showSuccess("Successfully read data from NFC card!");
              dataFound = true;
            } catch (parseError) {
              console.error("Failed to parse NFC data:", parseError);
              showError("Failed to parse data from NFC card.");
            }
            break; // Found our record, no need to check others
          }
        }
        if (!dataFound) {
          showError("No EcoScan AI data found on this NFC card.");
        }
        setIsReading(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort(); // Stop scanning after successful read
          abortControllerRef.current = null;
        }
      };

      ndef.onreadingerror = (error) => {
        console.error("NFC read error:", error);
        let errorMessage = "Failed to read NFC card. Please try again.";
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = "NFC permission was denied. Please grant permission in browser settings.";
          } else if (error.message.includes('Tag was lost')) {
            errorMessage = "Card was moved too quickly. Please hold it steady.";
          } else if (error.message.includes('No NFC tag found')) {
            errorMessage = "No NFC card detected. Ensure NFC is enabled and tap the card firmly.";
          }
        }
        showError(errorMessage);
        setIsReading(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };

      await ndef.scan({ signal: ac.signal });
    } catch (error) {
      console.error("NFC scan initiation error:", error);
      let errorMessage = "Could not start NFC scan. Ensure NFC is enabled and permissions are granted.";
      if (error instanceof Error && error.name === 'NotAllowedError') {
        errorMessage = "NFC permission was denied. Please grant permission in browser settings.";
      }
      showError(errorMessage);
      setIsReading(false);
    }
  };

  const handleStopReading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsReading(false);
      setReadData(null); // Clear read data when stopping
      showInfo("NFC reading stopped.");
    }
  };

  return (
    <Card className="bg-card/70 backdrop-blur-lg border">
      <CardHeader>
        <CardTitle>NFC Card Reader</CardTitle>
        <CardDescription>
          Tap an NFC card to read its contents and view user recycling data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>NFC Reading Tips</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Use Chrome on an Android device.</li>
              <li>Hold the NFC card steady against the back of your device.</li>
            </ul>
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <div className="mb-4">
            {isReading ? (
              <div className="flex flex-col items-center">
                <Nfc className="h-24 w-24 mx-auto text-secondary-foreground animate-pulse" />
                <p className="mt-2 text-sm text-muted-foreground">Tap an NFC card now...</p>
              </div>
            ) : (
              <BookOpenText className="h-24 w-24 mx-auto text-secondary-foreground" />
            )}
          </div>
          {isReading ? (
            <Button size="lg" onClick={handleStopReading} variant="outline">
              Stop Reading
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={handleReadNfc} 
            >
              Start Reading Card
            </Button>
          )}
        </div>

        {readData && (
          <div className="mt-6 p-4 border rounded-lg bg-background/50 space-y-3 animate-fade-in-up">
            <h4 className="font-semibold mb-2 text-center text-lg flex items-center justify-center">
              <Scan className="w-5 h-5 mr-2 text-primary" /> Card Data Read!
            </h4>
            <Separator />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p className="text-muted-foreground">Issuer:</p>
              <p className="font-bold text-right">{readData.issuer}</p>
              <p className="text-muted-foreground">Card Type:</p>
              <p className="font-bold text-right">{readData.cardType}</p>
              <p className="text-muted-foreground">Cardholder ID:</p>
              <p className="font-mono text-xs text-right break-all">{readData.cardholderId}</p>
              <p className="text-muted-foreground">Issued At:</p>
              <p className="text-right">{new Date(readData.issuedAt).toLocaleString()}</p>
            </div>
            <Separator />
            <h5 className="font-semibold text-center mt-4 mb-2">Balance & Impact</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center text-muted-foreground"><Star className="w-4 h-4 mr-2" /> Points Balance</span>
              <span className="font-bold text-primary text-right">{readData.balance.points}</span>
              <span className="flex items-center text-muted-foreground"><DollarSign className="w-4 h-4 mr-2" /> Virtual Cash Value</span>
              <span className="font-bold text-green-500 text-right">${readData.balance.virtualValue.toFixed(2)}</span>
              <span className="flex items-center text-muted-foreground"><Scan className="w-4 h-4 mr-2" /> Total Scans</span>
              <span className="font-bold text-right">{readData.metadata.totalScans}</span>
              <span className="flex items-center text-muted-foreground"><Leaf className="w-4 h-4 mr-2" /> CO₂ Saved</span>
              <span className="font-bold text-right">{readData.metadata.co2SavedKg} kg</span>
              <span className="flex items-center text-muted-foreground"><Zap className="w-4 h-4 mr-2" /> Energy Saved</span>
              <span className="font-bold text-right">{readData.metadata.energySavedKWh} kWh</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminNfcReader;