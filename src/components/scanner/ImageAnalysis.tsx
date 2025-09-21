"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageAnalysisProps {
  capturedImage: string | null;
  isAnalyzing: boolean;
  onCapture: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onCancel: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ImageAnalysis = ({ capturedImage, isAnalyzing, onCapture, onAnalyze, onCancel, fileInputRef }: ImageAnalysisProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <ImageIcon className="h-16 w-16 text-muted-foreground" />
      <h3 className="text-xl font-bold">Analyze with Image</h3>
      <p className="text-muted-foreground text-center">
        Barcode scan was inconclusive. Take a photo of the item to determine if it's a plastic bottle.
      </p>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onCapture}
        ref={fileInputRef}
        className="hidden"
      />
      {capturedImage && (
        <div className="relative w-48 h-48 rounded-md overflow-hidden border-2 border-primary">
          <img src={capturedImage} alt="Captured for analysis" className="w-full h-full object-cover" />
        </div>
      )}
      <Button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
        {capturedImage ? "Retake Photo" : "Take Photo"}
      </Button>
      <Button onClick={onAnalyze} disabled={!capturedImage || isAnalyzing} className="w-full">
        {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Analyze Image"}
      </Button>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
    </div>
  );
};