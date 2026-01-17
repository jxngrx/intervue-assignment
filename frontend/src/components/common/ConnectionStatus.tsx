import { useSocket } from '../../hooks/useSocket';

export const ConnectionStatus = () => {
  const { isConnected, error } = useSocket();

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <span className="material-icons text-sm">warning</span>
        <span className="text-sm font-medium">
          {error || 'Connecting to server...'}
        </span>
      </div>
    </div>
  );
};
