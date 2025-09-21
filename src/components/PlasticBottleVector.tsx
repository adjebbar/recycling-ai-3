"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PlasticBottleVectorProps {
  className?: string;
  style?: React.CSSProperties;
  colorClass?: string; // New prop for color control
}

const PlasticBottleVector = ({ className, style, colorClass = "text-blue-400" }: PlasticBottleVectorProps) => {
  return (
    <svg 
      className={cn("h-24 w-12", className)} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      {/* Bottle Cap */}
      <rect x="9" y="2" width="6" height="3" rx="1.5" fill="currentColor" className={cn(colorClass.replace('text-blue', 'text-sky-500'))} />
      {/* Bottle Neck */}
      <rect x="10" y="5" width="4" height="2" rx="1" fill="currentColor" className={cn(colorClass.replace('text-blue', 'text-sky-400'))} />
      {/* Bottle Body */}
      <path 
        d="M7 7C7 6.44772 7.44772 6 8 6H16C16.5523 6 17 6.44772 17 7V21C17 21.5523 16.5523 22 16 22H8C7.44772 22 7 21.5523 7 21V7Z" 
        fill="currentColor" 
        className={cn(colorClass)} 
      />
      {/* Water Level */}
      <path 
        d="M7 10C7 9.44772 7.44772 9 8 9H16C16.5523 9 17 9.44772 17 10V21C17 21.5523 16.5523 22 16 22H8C7.44772 22 7 21.5523 7 21V10Z" 
        fill="currentColor" 
        className={cn(colorClass.replace('text-blue', 'text-sky-400'))} 
      />
      {/* Highlight */}
      <path d="M8.5 7.5L8.5 20.5C8.5 20.7761 8.27614 21 8 21C7.72386 21 7.5 20.7761 7.5 20.5L7.5 7.5C7.5 7.22386 7.72386 7 8 7C8.27614 7 8.5 7.22386 8.5 7.5Z" fill="white" opacity="0.5"/>
    </svg>
  );
};

export default PlasticBottleVector;