"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface TypewriterEffectProps {
  phrases: string[];
  typingSpeed?: number; // Speed to type each character (ms)
  deletingSpeed?: number; // Speed to delete each character (ms)
  pauseBeforeDelete?: number; // Pause after typing before deleting (ms)
  pauseBeforeType?: number; // Pause after deleting before typing next (ms)
  className?: string;
  cursorClassName?: string;
}

const TypewriterEffect = ({
  phrases,
  typingSpeed = 150,
  deletingSpeed = 100,
  pauseBeforeDelete = 1500,
  pauseBeforeType = 500,
  className,
  cursorClassName,
}: TypewriterEffectProps) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;

    const handleTyping = () => {
      const fullText = phrases[currentPhraseIndex];
      if (isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length - 1));
      } else {
        setCurrentText(fullText.substring(0, currentText.length + 1));
      }
    };

    let timer: NodeJS.Timeout;
    const currentFullText = phrases[currentPhraseIndex];

    if (!isDeleting && currentText.length === currentFullText.length) {
      // Typed out full phrase, now pause and start deleting
      timer = setTimeout(() => setIsDeleting(true), pauseBeforeDelete);
    } else if (isDeleting && currentText.length === 0) {
      // Deleted full phrase, now pause and move to next
      setIsDeleting(false);
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      timer = setTimeout(() => {}, pauseBeforeType); // Small pause before typing next
    } else {
      // Continue typing or deleting
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timer = setTimeout(handleTyping, speed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseBeforeDelete, pauseBeforeType]);

  return (
    <span className={cn("relative inline-block", className)}>
      {currentText}
      <span className={cn(
        "inline-block w-0.5 h-full bg-primary-dark align-middle ml-1 animate-blink-cursor",
        cursorClassName
      )} />
    </span>
  );
};

export default TypewriterEffect;