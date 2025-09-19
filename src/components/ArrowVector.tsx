"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ArrowVectorProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const ArrowVector = ({ className, ...props }: ArrowVectorProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      {...props}
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
};

export default ArrowVector;