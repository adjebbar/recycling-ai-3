"use client";

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Recycle, ScanLine, Trophy, LogOut, Shield, BarChart, User as UserIcon, Globe, Settings, Gift, Nfc, History } from 'lucide-react'; // Added History icon
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './theme-toggle';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';
import { showSuccess, showError } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from 'react-i18next';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, points, firstName, lastName } = useAuth();
  const animatedPoints = useAnimatedCounter(points);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide the main app navbar on the landing page for logged-out users
  if (!user && location.pathname === '/') {
    return null;
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(`Logout failed: ${error.message}`);
    } else {
      showSuccess("You have been logged out.");
      navigate('/');
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const publicLinks = [
    { href: '/scanner', label: t('nav.scan'), icon: ScanLine },
  ];

  const privateLinks = [
    { href: '/rewards', label: 'Rewards', icon: Gift },
    { href: '/leaderboard', label: t('nav.leaderboard'), icon: BarChart },
  ];

  const renderLink = (link: { href: string, label: string, icon: React.ElementType }) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.href;
    return (
      <Link
        key={link.href}
        to={link.href}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <Icon className="mr-2 h-4 w-4" />
        {link.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-lg hidden md:flex"> {/* Added hidden md:flex */}
      <div className="container flex h-16 items-center">
        <div className="mr-6 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">{t('nav.appName')}</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-2 sm:space-x-4">
          {publicLinks.map(renderLink)}
          {user && privateLinks.map(renderLink)}
        </nav>
        <div className="flex items-center justify-end space-x-2">
          {user ? (
            <>
              <Badge variant="secondary" className="hidden sm:flex text-base font-semibold">
                {t('nav.points', { count: animatedPoints })}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{firstName?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{firstName && lastName ? `${firstName} ${lastName}` : t('nav.myAccount')}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/reward-history"> {/* New link */}
                      <History className="mr-2 h-4 w-4" />
                      <span>{t('nav.rewardHistory')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/nfc">
                      <Nfc className="mr-2 h-4 w-4" />
                      <span>NFC Card</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.email === 'adjebbar83@gmail.com' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>{t('nav.admin')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {points > 0 && (
                <Badge variant="secondary" className="hidden sm:flex text-base font-semibold">
                  {t('nav.points', { count: animatedPoints })}
                </Badge>
              )}
              <div className="space-x-2">
                <Button asChild variant="ghost">
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">{t('nav.signup')}</Link>
                </Button>
              </div>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                العربية (Arabic)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};