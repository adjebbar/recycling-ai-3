"use client";

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Recycle } from 'lucide-react'; // Changed from ScanLine to Recycle
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
        className="rounded-full h-20 w-20 md:h-24 md:w-24 shadow-xl bg-primary hover:bg-primary/90 flex flex-col items-center justify-center text-center animate-color-pulse"
      >
        <Recycle className="h-10 w-10 text-primary-foreground mb-1" /> {/* Updated icon */}
        <span className="text-sm font-bold text-primary-foreground">{t('nav.scan')}</span>
      </Button>
    </Link>
  );
};