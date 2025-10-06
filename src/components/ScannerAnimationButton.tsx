"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, Recycle } from 'lucide-react'; // Import Recycle icon
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ScannerAnimationButtonProps {
  className?: string;
}

const ScannerAnimationButton = ({ className }: ScannerAnimationButtonProps) => {
  const { t } = useTranslation();

  return (
    <Link
      to="/scanner"
      className={cn(
        "relative flex flex-col items-center justify-center w-40 h-60 shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group cursor-pointer",
        "overflow-hidden", // Ensure content stays within bounds
        className
      )}
      aria-label={t('home.startScanning')}
    >
      {/* Background Image of the Plastic Bottle */}
      <img 
        src="/images/plastic-bottle-scan-frame.png" 
        alt="Plastic Bottle Scan Frame" 
        className="absolute inset-0 w-full h-full object-contain" // Use object-contain to fit the image
      />

      {/* Animated Scan Line */}
      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-primary shadow-[0_0_10px_hsl(var(--primary))] rounded-full animate-scan-line-sweep z-10" />

      {/* Central Scan Icon */}
      <ScanLine className="h-16 w-16 text-primary mb-2 group-hover:animate-pulse-once z-20" />

      {/* Rotating Recycling Logo */}
      <Recycle className="absolute h-10 w-10 text-primary/80 animate-spin-slow z-10 -top-4 -left-4" />
      <Recycle className="absolute h-10 w-10 text-primary/80 animate-spin-slow z-10 -bottom-4 -right-4" style={{ animationDirection: 'reverse' }} />


      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
    </Link>
  );
};

export default ScannerAnimationButton;