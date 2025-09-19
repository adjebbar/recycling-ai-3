"use client";

import { Link } from 'react-router-dom';
import { Recycle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LandingHeader = () => {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/scanner', label: 'Service' }, // Map 'Service' to 'Scanner'
    { href: '/about-us', label: 'About Us' }, // Placeholder for a potential 'About Us' page
    { href: '/contact', label: 'Contact' }, // Placeholder for a potential 'Contact' page
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="flex items-center space-x-2">
          <Recycle className="h-8 w-8 text-white" />
          <span className="text-2xl font-bold text-white">ECOLOGY ACTION</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-white text-lg font-medium hover:text-primary transition-colors"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Search className="h-5 w-5 text-white cursor-pointer hover:text-primary transition-colors" />
        </nav>
        {/* Mobile navigation will be handled by MobileNav if needed, or omitted for this specific landing page design */}
      </div>
    </header>
  );
};