"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showInfo } from '@/utils/toast';
import { Nfc, Leaf, Zap, Star, Scan, DollarSign, Info, BookOpenText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const NfcPage = () => {
  const { user, points, totalScans } = useAuth();
  const [isWriting, setIsWriting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readData, setReadData] = useState<GiftCardData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Constants for impact calculation
  const CO2_SAVED_PER_BOTTLE_KG = 0.03;
  const ENERGY_SAVED_PER_BOTTLE_KWH = 0.18;
  const VIRTUAL_CASH_PER_POINT = 0.01; // $0.01 per point

  const co2Saved = (totalScans * CO2_SAVED_PER_BOTTLE_KG).toFixed(2);
  const energySaved = (totalScans * ENERGY_SAVED_PER_BOTTLE_KWH).toFixed(2);
  const virtualCashValue = (points * VIRTUAL_CASH_PER_POINT).toFixed(2);

  const handleWriteNfc = async () => {
    if (!('NDEFReader' in window)) {
      showError("Web NFC is not supported on this browser. Try Chrome on Android.");
      return;
    }
    if (!user) {
      showError("You must be logged in to write to an NFC card.");
      return;
    }

    setIsWriting(true);
    showInfo("Ready to write. Please tap and hold your NFC card to your device.");

    try {
      const ndef = new NDEFReader();
      
      const giftCardData = {
        issuer: "EcoScan AI",
        cardType: "Recycling Rewards Card",
        cardholderId: user.id,
        issuedAt: new Date().toISOString(),
        balance: {
          points: points,
          virtualValue: parseFloat(virtualCashValue),
          currency: "USD"
        },
        metadata: {
          totalScans: totalScans,
          co2SavedKg: parseFloat(co2Saved),
          energySavedKWh: parseFloat(energySaved)
        }
      };

      // Use compact JSON (no pretty-printing) to save space
      const compactJsonString = JSON.stringify(giftCardData);
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(compactJsonString);

      await ndef.write({
        records: [{
          recordType: "mime",
          mediaType: "application/vnd.ecoscan.giftcard+json",
          data: encodedData
        }],
      });

      showSuccess("Successfully wrote your recycling data to the NFC card!");
    } catch (error) {
      console.error("NFC write error:", error);
      let errorMessage = "Failed to write to NFC card. Please try again.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "NFC permission was denied.";
        } else if (error.message.includes('Tag was lost')) {
          errorMessage = "Card was moved too quickly. Please hold it steady.";
        }
      }
      showError(errorMessage);
    } finally {
      setIsWriting(false);
    }
  };

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
        for (const record of event.message.records) {
          if (record.recordType === "mime" && record.mediaType === "application/vnd.ecoscan.giftcard+json") {
            const data = decoder.decode(record.data);
            try {
              const parsedData: GiftCardData = JSON.parse(data);
              setReadData(parsedData);
              showSuccess("Successfully read data from NFC card!");
            } catch (parseError) {
              console.error("Failed to parse NFC data:", parseError);
              showError("Failed to parse data from NFC card.");
            }
            break; // Found our record, no need to check others
          }
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
            errorMessage = "NFC permission was denied.";
          } else if (error.message.includes('Tag was lost')) {
            errorMessage = "Card was moved too quickly. Please hold it steady.";
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
      showError("Could not start NFC scan. Ensure NFC is enabled and permissions are granted.");
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
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">NFC Card Management</h1>
        <p className="text-lg text-muted-foreground">
          Write your recycling stats to a physical NFC card for use with our partner apps.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Write to NFC Card</CardTitle>
            <CardDescription>
              This will securely write your recycling summary to an NFC card.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>NFC Writing Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Use Chrome on an Android device.</li>
                  <li>Hold the NFC card steady against the back of your phone until you see the success message.</li>
                  <li>Ensure your NFC card is writable and has enough space.</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="text-left p-4 border rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-semibold mb-2 text-center">Your Recycling Snapshot</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><Scan className="w-4 h-4 mr-2" /> Bottles Scanned</span>
                <span className="font-bold">{totalScans}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><Star className="w-4 h-4 mr-2" /> Current Points</span>
                <span className="font-bold text-primary">{points}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><Leaf className="w-4 h-4 mr-2" /> CO₂ Saved</span>
                <span className="font-bold">{co2Saved} kg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center text-muted-foreground"><Zap className="w-4 h-4 mr-2" /> Energy Saved</span>
                <span className="font-bold">{energySaved} kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center text-muted-foreground"><DollarSign className="w-4 h-4 mr-2" /> Virtual Cash Value</span>
                <span className="font-bold text-green-500">${virtualCashValue}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <Nfc className={`h-24 w-24 mx-auto text-primary ${isWriting ? 'animate-pulse' : ''}`} />
              </div>
              <Button 
                size="lg" 
                onClick={handleWriteNfc} 
                disabled={isWriting || !user}
              >
                {isWriting ? 'Waiting for Card...' : 'Start Writing to Card'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Read NFC Card</CardTitle>
            <CardDescription>
              Tap an NFC card to read its contents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>NFC Reading Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Use Chrome on an Android device.</li>
                  <li>Hold the NFC card steady against the back of your phone.</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <div className="mb-4">
                {isReading ? (
                  <div className="flex flex-col items-center">
                    <Nfc className="h-24 w-24 mx-auto text-secondary-foreground animate-pulse" />
                    <p className="mt-2 text-sm text-muted-foreground">Tap your NFC card now...</p>
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
                  disabled={isWriting}
                >
                  Start Reading Card
                </Button>
              )}
            </div>

            {readData && (
              <div className="mt-6 p-4 border rounded-lg bg-background/50 space-y-2 animate-fade-in-up">
                <h4 className="font-semibold mb-2 text-center text-lg">Card Data Read!</h4>
                <p className="text-sm text-muted-foreground text-center">Issued by: {readData.issuer}</p>
                <p className="text-sm text-muted-foreground text-center">Card Type: {readData.cardType}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><Scan className="w-4 h-4 mr-2" /> Bottles Scanned</span>
                  <span className="font-bold">{readData.metadata.totalScans}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><Star className="w-4 h-4 mr-2" /> Points Balance</span>
                  <span className="font-bold text-primary">{readData.balance.points}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><Leaf className="w-4 h-4 mr-2" /> CO₂ Saved</span>
                  <span className="font-bold">{readData.metadata.co2SavedKg} kg</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground"><Zap className="w-4 h-4 mr-2" /> Energy Saved</span>
                  <span className="font-bold">{readData.metadata.energySavedKWh} kWh</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="flex items-center text-muted-foreground"><DollarSign className="w-4 h-4 mr-2" /> Virtual Cash Value</span>
                  <span className="font-bold text-green-500">${readData.balance.virtualValue.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">Cardholder ID: {readData.cardholderId}</p>
                <p className="text-xs text-muted-foreground text-center">Issued At: {new Date(readData.issuedAt).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NfcPage;