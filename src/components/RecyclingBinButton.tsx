"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecyclingBinButtonProps {
  to: string;
  label: string;
  variant?: 'primary' | 'orange';
  className?: string;
}

const RecyclingBinButton = ({ to, label, variant = 'primary', className }: RecyclingBinButtonProps) => {
  // Removed rounded-2xl as clip-path will define the shape
  const baseClasses = "relative flex flex-col items-center justify-center px-4 py-8 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group cursor-pointer min-h-[180px]";
  
  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/50",
    orange: "bg-orange hover:bg-orange/90 text-orange-foreground shadow-orange/50",
  };

  // Define the clip-path for a recycling bin shape (trapezoid)
  // Using arbitrary value syntax for Tailwind CSS
  const binShapeClasses = "clip-path-[polygon(15%_0%,_85%_0%,_100%_100%,_0%_100%)]";

  return (
    <Link to={to} className={cn(baseClasses, variantClasses[variant], binShapeClasses, className)}>
      <Recycle className="h-12 w-12 text-white group-hover:animate-spin-slow mb-4" />
      <span className="text-lg font-bold text-center leading-tight">
        {label}
      </span>
    </Link>
  );
};

export default RecyclingBinButton;