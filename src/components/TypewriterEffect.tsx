"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterSegment {
  text: string;
  className?: string;
}

interface TypewriterEffectProps {
  segments: TypewriterSegment[];
  speed?: number; // typing speed per character in ms
  initialDelay?: number; // delay before starting in ms
  cursorClassName?: string;
  loop?: boolean; // whether to loop the animation
}

const TypewriterEffect = ({
  segments,
  speed = 50,
  initialDelay = 0,
  cursorClassName,
  loop = false,
}: TypewriterEffectProps) => {
  const [displayedContent, setDisplayedContent] = useState<TypewriterSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetAnimation = () => {
    setDisplayedContent([]);
    setCurrentSegmentIndex(0);
    setCurrentCharIndex(0);
    setShowCursor(true);
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);

    const startTyping = () => {
      if (currentSegmentIndex < segments.length) {
        const currentSegment = segments[currentSegmentIndex];
        if (currentCharIndex < currentSegment.text.length) {
          // Type next character
          setDisplayedContent(prev => {
            const newContent = [...prev];
            if (newContent[currentSegmentIndex]) {
              newContent[currentSegmentIndex].text += currentSegment.text[currentCharIndex];
            } else {
              newContent.push({ text: currentSegment.text[currentCharIndex], className: currentSegment.className });
            }
            return newContent;
          });
          setCurrentCharIndex(prev => prev + 1);
          timeoutRef.current = setTimeout(startTyping, speed);
        } else {
          // Move to next segment
          setCurrentSegmentIndex(prev => prev + 1);
          setCurrentCharIndex(0);
          timeoutRef.current = setTimeout(startTyping, speed * 2); // Small pause between segments
        }
      } else {
        // Typing complete
        if (loop) {
          timeoutRef.current = setTimeout(() => {
            resetAnimation();
            startTyping(); // Restart after a delay
          }, 3000); // Pause before looping
        } else {
          // Start cursor blinking after typing is complete
          cursorIntervalRef.current = setInterval(() => {
            setShowCursor(prev => !prev);
          }, 500);
        }
      }
    };

    timeoutRef.current = setTimeout(startTyping, initialDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, [segments, speed, initialDelay, currentSegmentIndex, currentCharIndex, loop]);

  return (
    <>
      {displayedContent.map((segment, index) => (
        <span key={index} className={segment.className}>
          {segment.text}
        </span>
      ))}
      <span
        className={cn(
          "inline-block w-0.5 h-full bg-white align-bottom ml-1 transition-opacity duration-100",
          (showCursor && !loop) ? "opacity-100 animate-blink" : "opacity-0", // Cursor only blinks if not looping
          cursorClassName
        )}
      >
        &nbsp;
      </span>
    </>
  );
};

export default TypewriterEffect;