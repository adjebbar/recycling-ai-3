"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

interface ConfettiContextType {
  fire: () => void;
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined);

export const ConfettiProvider = ({ children }: { children: ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const { width, height } = useWindowSize();

  const fire = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleConfettiComplete = () => {
    setIsRunning(false);
  };

  return (
    <ConfettiContext.Provider value={{ fire }}>
      {children}
      {isRunning && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          onConfettiComplete={handleConfettiComplete}
          style={{ zIndex: 9999 }}
        />
      )}
    </ConfettiContext.Provider>
  );
};

export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  if (context === undefined) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
};