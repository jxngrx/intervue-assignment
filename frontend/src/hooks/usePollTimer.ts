import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerState } from '../types/socket';
import { formatters } from '../utils/formatters';

interface UsePollTimerProps {
  startTime?: string | Date;
  duration: number;
  isActive: boolean;
  onComplete?: () => void;
}

export const usePollTimer = ({
  startTime,
  duration,
  isActive,
  onComplete,
}: UsePollTimerProps) => {
  const [remaining, setRemaining] = useState<number>(duration);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateRemaining = useCallback((): number => {
    if (!startTime) {
      return 0;
    }

    // Timer continues based on poll status and time, not whether student voted
    // isActive should reflect poll status, not vote status
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const remaining = Math.max(0, duration - elapsed);

    return remaining;
  }, [startTime, duration]);

  useEffect(() => {
    // Timer continues as long as poll is active and time hasn't expired
    // isActive parameter indicates poll status, timer should run independently of vote status
    if (isActive && startTime) {
      // Calculate initial remaining time (handles late-joining students)
      const initialRemaining = calculateRemaining();
      setRemaining(initialRemaining);
      setIsTimerActive(initialRemaining > 0);

      // Update timer every second
      intervalRef.current = setInterval(() => {
        const newRemaining = calculateRemaining();
        setRemaining(newRemaining);
        setIsTimerActive(newRemaining > 0);

        if (newRemaining === 0 && onComplete) {
          onComplete();
        }
      }, 1000);
    } else if (startTime) {
      // Even if isActive is false, if we have a startTime, calculate remaining
      // This allows timer to continue showing time even after vote
      const currentRemaining = calculateRemaining();
      setRemaining(currentRemaining);
      setIsTimerActive(currentRemaining > 0);

      if (currentRemaining > 0) {
        // Continue updating timer
        intervalRef.current = setInterval(() => {
          const newRemaining = calculateRemaining();
          setRemaining(newRemaining);
          setIsTimerActive(newRemaining > 0);

          if (newRemaining === 0 && onComplete) {
            onComplete();
          }
        }, 1000);
      }
    } else {
      setRemaining(0);
      setIsTimerActive(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, startTime, duration, calculateRemaining, onComplete]);

  const formattedTime = formatters.formatTime(remaining);

  return {
    remaining,
    isActive: isTimerActive,
    formattedTime,
    elapsed: duration - remaining,
  };
};
