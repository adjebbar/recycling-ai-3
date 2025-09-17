"use client";

import { Link, useLocation } from 'react-router-dom';
import { Home, ScanLine, Trophy, BarChart, User as UserIcon, Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const MobileNav = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/scanner', label: t('nav.scan'), icon: ScanLine },
    { href: '/rewards', label: t('nav.rewards'), icon: Gift, authRequired: true },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: BarChart },
    { href: '/profile', label: t('nav.profile'), icon: UserIcon, authRequired: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navLinks.map((link) => {
          if (link.authRequired && !user) {
            return null; // Hide auth-required links if not logged in
          }
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="sr-only sm:not-sr-only">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};