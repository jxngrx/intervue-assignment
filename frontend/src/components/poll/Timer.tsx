import { TimerState } from '../../types/socket';
import { formatters } from '../../utils/formatters';

interface TimerProps {
  timerState: TimerState | null;
  className?: string;
}

export const Timer = ({ timerState, className = '' }: TimerProps) => {
  if (!timerState || !timerState.isActive) {
    return null;
  }

  const formattedTime = formatters.formatTime(timerState.remaining);
  const isLowTime = timerState.remaining <= 10;

  return (
    <div className={`flex items-center gap-2 ${isLowTime ? 'text-red-500' : 'text-gray-dark'} ${className}`}>
      <span className="material-icons text-xl">schedule</span>
      <span className="font-semibold text-lg">{formattedTime}</span>
    </div>
  );
};
