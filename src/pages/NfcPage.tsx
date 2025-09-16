"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess, showInfo } from '@/utils/toast';
import { Nfc } from 'lucide-react';

const NfcPage = () => {
  const { user } = useAuth();
  const [isWriting, setIsWriting] = useState(false);

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
    showInfo("Ready to write. Please tap your NFC card to your device.");

    try {
      const ndef = new NDEFReader();
      await ndef.write({
        records: [{ recordType: "text", data: user.id }],
      });
      showSuccess("Successfully wrote your ID to the NFC card!");
    } catch (error) {
      console.error("NFC write error:", error);
      showError(`Failed to write to NFC card: ${error.message}`);
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">NFC Card Management</h1>
        <p className="text-lg text-muted-foreground">
          Write your unique user ID to a physical NFC card to create a portable loyalty card.
        </p>
      </div>

      <Card className="max-w-md mx-auto bg-card/70 backdrop-blur-lg border">
        <CardHeader>
          <CardTitle>Write to NFC Card</CardTitle>
          <CardDescription>
            This will securely write your unique user ID to an NFC card. You can then use this card at partner locations to redeem your points.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <Nfc className={`h-24 w-24 mx-auto text-primary ${isWriting ? 'animate-pulse' : ''}`} />
          </div>
          <Button 
            size="lg" 
            onClick={handleWriteNfc} 
            disabled={isWriting}
          >
            {isWriting ? 'Waiting for Card...' : 'Start Writing to Card'}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Note: This feature requires a browser that supports Web NFC, such as Chrome on Android.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NfcPage;