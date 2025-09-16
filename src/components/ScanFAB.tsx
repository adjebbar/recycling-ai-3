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
      <Button size="icon" className="rounded-full h-16 w-16 shadow-lg bg-primary hover:bg-primary/90">
        <ScanLine className="h-8 w-8 text-primary-foreground" />
        <span className="sr-only">{t('home.startScanning')}</span>
      </Button>
    </Link>
  );
};