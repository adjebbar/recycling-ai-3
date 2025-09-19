"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecyclingBinButtonProps {
  to: string;
  label: string;
  variant?: 'primary' | 'orange';
  className?: string;
}

const RecyclingBinButton = ({ to, label, variant = 'primary', className }: RecyclingBinButtonProps) => {
  const baseClasses = "relative flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group cursor-pointer min-h-[150px]";
  
  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/50",
    orange: "bg-orange hover:bg-orange/90 text-orange-foreground shadow-orange/50",
  };

  return (
    <Link to={to} className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="absolute top-4">
        <Recycle className="h-12 w-12 text-white group-hover:animate-spin-slow" />
      </div>
      <span className="mt-16 text-lg font-bold text-center leading-tight">
        {label}
      </span>
    </Link>
  );
};

export default RecyclingBinButton;