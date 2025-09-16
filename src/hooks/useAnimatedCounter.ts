import { useState, useEffect, useRef } from 'react';

export const useAnimatedCounter = (target: number, duration = 500) => {
  const [count, setCount] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const start = prevTargetRef.current;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.floor(progress * (target - start) + start);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = target;
      }
    };

    requestAnimationFrame(animate);

    return () => {
      prevTargetRef.current = target;
    }
  }, [target, duration]);

  return count;
};