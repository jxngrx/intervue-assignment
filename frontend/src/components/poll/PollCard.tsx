import { Poll } from '../../types/poll';

interface PollCardProps {
  poll: Poll;
  children?: React.ReactNode;
}

export const PollCard = ({ poll, children }: PollCardProps) => {
  return (
    <div className="bg-white border border-gray-light shadow-xl overflow-hidden rounded-2xl">
      <div className="bg-gray-dark px-8 py-5">
        <h3 className="text-lg font-medium text-white leading-relaxed">
          {poll.question}
        </h3>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
};
