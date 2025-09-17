"use client";

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ScanFAB = () => {
  const { t } = useTranslation();

  return (
    <Link 
      to="/scanner" 
      className="fixed bottom-6 right-6 z-50 animate-fade-in-up"
      aria-label={t('home.startScanning')}
    >
      <Button 
        className="rounded-full h-24 w-24 md:h-28 md:w-28 shadow-xl bg-primary hover:bg-primary/90 flex flex-col items-center justify-center text-center animate-subtle-pulse"
      >
        <ScanLine className="h-12 w-12 text-primary-foreground mb-1" />
        <span className="text-base font-bold text-primary-foreground">{t('nav.scan')}</span>
      </Button>
    </Link>
  );
};