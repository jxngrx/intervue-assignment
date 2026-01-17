import { VoteCounts } from '../../types/poll';

interface PollResultsProps {
  voteCounts: VoteCounts;
  selectedOptionIndex?: number;
}

export const PollResults = ({ voteCounts, selectedOptionIndex }: PollResultsProps) => {
  return (
    <div className="space-y-4">
      {voteCounts.options.map((option, index) => {
        const isSelected = selectedOptionIndex === index;
        const isLeading = option.percentage === Math.max(...voteCounts.options.map((o) => o.percentage));

        return (
          <div key={index} className="relative group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    isSelected || isLeading
                      ? 'bg-primary text-white'
                      : 'bg-gray-light text-gray-dark'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="font-medium text-gray-dark">{option.text}</span>
              </div>
              <span className="text-sm font-bold text-primary">{option.percentage}%</span>
            </div>
            <div className="h-10 w-full bg-gray-light rounded-lg overflow-hidden relative">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                  isSelected || isLeading
                    ? 'bg-primary/30 border-r-2 border-primary'
                    : 'bg-gray-light/50 border-r-2 border-gray-light'
                }`}
                style={{ width: `${option.percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
