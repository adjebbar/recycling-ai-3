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
        "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
        "border-2 border-transparent animate-border-color-change", // Animated border
        className
      )}
      aria-label={t('home.startScanning')}
    >
      {/* Animated Scan Line */}
      <div className="absolute inset-x-0 top-1/2 h-1 bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.8)] rounded-full animate-scan-line-sweep" />

      {/* Central Scan Icon */}
      <ScanLine className="h-16 w-16 text-white mb-2 group-hover:animate-pulse-once" />

      {/* Text Label */}
      <span className="text-xl font-bold leading-tight px-2 drop-shadow-md">
        {t('nav.scanNow')}
      </span>

      {/* Subtle background glow */}
      <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
};

export default ScannerAnimationButton;