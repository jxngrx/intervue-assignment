import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // Longer duration for errors, especially on mobile
  const actualDuration = type === 'error' && isMobile ? 15000 : type === 'error' ? 10000 : duration;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for fade out
    }, actualDuration);

    return () => clearTimeout(timer);
  }, [actualDuration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-primary text-white',
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed ${isMobile ? 'top-2 left-2 right-2' : 'top-4 right-4'} z-[9999] ${isMobile ? 'max-w-full' : 'max-w-md'} px-4 py-3 rounded-lg shadow-2xl ${typeStyles[type]} transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className={`${isMobile ? 'text-sm' : 'text-base'} break-words whitespace-pre-wrap`}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className={`${isMobile ? 'text-lg' : 'text-xl'} text-white hover:text-gray-200 flex-shrink-0 font-bold`}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>;
  removeToast: (id: string) => void;
}

export const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className={`fixed ${isMobile ? 'top-2 left-2 right-2' : 'top-4 right-4'} z-[9999] space-y-2 pointer-events-none`}>
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto" style={{ marginTop: index > 0 ? '0.5rem' : '0' }}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.type === 'error' && isMobile ? 15000 : toast.type === 'error' ? 10000 : 5000}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
