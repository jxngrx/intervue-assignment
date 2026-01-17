import { PollOption as PollOptionType } from '../../types/poll';

interface PollOptionProps {
  option: PollOptionType;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
  showVotes?: boolean;
  percentage?: number;
  disabled?: boolean;
}

export const PollOption = ({
  option,
  index,
  isSelected = false,
  onClick,
  showVotes = false,
  percentage = 0,
  disabled = false,
}: PollOptionProps) => {
  const baseStyles =
    'w-full flex items-center p-4 rounded-xl border-2 transition-all text-left';

  const selectedStyles = isSelected
    ? 'border-primary bg-primary/10'
    : 'border-gray-light hover:border-primary/50 bg-gray-light/50';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${selectedStyles} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-4 ${
          isSelected
            ? 'bg-primary text-white'
            : 'bg-gray-light text-gray-dark'
        }`}
      >
        {index + 1}
      </span>
      <span className="flex-1 font-medium text-gray-dark">{option.text}</span>
      {isSelected && !showVotes && (
        <span className="material-icons text-primary">check_circle</span>
      )}
      {showVotes && (
        <span className="text-sm font-bold text-primary ml-2">{percentage}%</span>
      )}
    </button>
  );
};
