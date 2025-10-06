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
      {/* Large Recycle icon as background, slightly darker, more opaque, and rotating */}
      <Recycle className="absolute inset-0 h-full w-full text-primary/40 animate-spin-slow" />

      {/* Bottle image, slightly smaller and centered, with a higher z-index */}
      <img
        src="/images/plastic-bottle-scan-frame.png"
        alt="Plastic Bottle Scan Frame"
        className="absolute h-4/5 w-4/5 object-contain z-10" // z-index 10 to be above the background recycle icon
      />

      {/* Animated Scan Line, z-index 20 to be above the bottle */}
      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-primary shadow-[0_0_10px_hsl(var(--primary))] rounded-full animate-scan-line-sweep z-20" />

      {/* Central Scan Icon, z-index 30 to be above everything */}
      <ScanLine className="h-16 w-16 text-primary mb-2 group-hover:animate-pulse-once z-30" />

      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
    </Link>
  );
};

export default ScannerAnimationButton;