"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, LucideProps } from 'lucide-react'; // Changed icon to Globe
import { cn } from '@/lib/utils';

interface RecyclingBinButtonProps {
  to: string;
  label: string;
  variant?: 'primary' | 'orange';
  className?: string;
}

const RecyclingBinButton = ({ to, label, variant = 'primary', className }: RecyclingBinButtonProps) => {
  // Changed to rounded-full for a circular shape, removed clip-path
  const baseClasses = "relative flex flex-col items-center justify-center p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group cursor-pointer w-48 h-48 text-center";
  
  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/50",
    orange: "bg-orange hover:bg-orange/90 text-orange-foreground shadow-orange/50",
  };

  return (
    <Link to={to} className={cn(baseClasses, variantClasses[variant], className)}>
      <Globe className="h-12 w-12 text-white group-hover:animate-spin-slow mb-2" /> {/* Changed icon to Globe */}
      <span className="text-lg font-bold leading-tight px-2">
        {label}
      </span>
    </Link>
  );
};

export default RecyclingBinButton;