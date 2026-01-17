import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showBackButton?: boolean;
}

export const Header = ({ showBackButton = false }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
          <span className="material-icons text-primary text-sm">auto_awesome</span>
          <span className="text-primary font-bold text-xs uppercase tracking-wider">
            Intervue Poll
          </span>
        </div>
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-dark hover:text-primary transition-colors"
            >
              <span className="material-icons">arrow_back</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
