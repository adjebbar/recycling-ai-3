"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
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
        "relative flex flex-col items-center justify-center w-48 h-48 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group cursor-pointer",
        "bg-foreground text-white overflow-hidden", // Dark background from theme
        "border-2 border-transparent hover:border-primary", // Subtle border
        className
      )}
      aria-label={t('home.startScanning')}
    >
      {/* Simulated Scanner Screen/Lens Area */}
      <div className="relative w-3/4 h-3/4 bg-muted rounded-lg flex items-center justify-center border border-border shadow-inner">
        {/* Animated Scan Line */}
        <div className="absolute inset-x-0 top-1/2 h-1 bg-primary shadow-[0_0_15px_hsl(var(--primary))] rounded-full animate-scan-line-sweep" />
        
        {/* Central Scan Icon */}
        <ScanLine className="h-12 w-12 text-primary group-hover:animate-pulse-once z-10" />
      </div>

      {/* Text Label */}
      <span className="mt-4 text-xl font-bold leading-tight px-2 drop-shadow-md text-white">
        {t('nav.scanNow')}
      </span>

      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
};

export default ScannerAnimationButton;