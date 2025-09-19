"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, LucideProps, ScanLine, Recycle } from 'lucide-react'; // Import all necessary icons
import { cn } from '@/lib/utils';

interface RecyclingBinButtonProps {
  to: string;
  label: string;
  variant?: 'primary' | 'orange';
  className?: string;
  icon: React.ElementType<LucideProps>; // Now required
  shape?: 'circle' | 'scanner' | 'bin'; // New prop
}

const RecyclingBinButton = ({ to, label, variant = 'primary', className, icon: Icon, shape = 'circle' }: RecyclingBinButtonProps) => {
  // Standardized size for all shapes: w-40 h-40
  const baseClasses = "relative flex flex-col items-center justify-center p-4 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group cursor-pointer text-center w-40 h-40";
  
  const variantClasses = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/50",
    orange: "bg-orange hover:bg-orange/90 text-orange-foreground shadow-orange/50",
  };

  let shapeSpecificClasses = "";
  let iconSizeClasses = "h-10 w-10"; // Default icon size
  let textClasses = "text-sm"; // Default text size

  if (shape === 'scanner') {
    // A wider, slightly rounded rectangle for a scanner look, now with standardized overall dimensions
    shapeSpecificClasses = "rounded-xl"; 
    iconSizeClasses = "h-10 w-10";
    textClasses = "text-sm";
  } else if (shape === 'bin') {
    // Trapezoidal shape for a bin, now with standardized overall dimensions
    shapeSpecificClasses = "clip-path-[polygon(15%_0%,_85%_0%,_100%_100%,_0%_100%)]";
    iconSizeClasses = "h-12 w-12";
    textClasses = "text-base";
  } else { // 'circle' (default)
    shapeSpecificClasses = "rounded-full";
    iconSizeClasses = "h-10 w-10";
    textClasses = "text-base";
  }

  return (
    <Link to={to} className={cn(baseClasses, variantClasses[variant], shapeSpecificClasses, className)}>
      <Icon className={cn(iconSizeClasses, "text-white group-hover:animate-spin-slow mb-1")} />
      <span className={cn(textClasses, "font-bold leading-tight px-2")}>
        {label}
      </span>
    </Link>
  );
};

export default RecyclingBinButton;