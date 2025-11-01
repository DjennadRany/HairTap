import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

// Styles CSS pour l'animation
const bottomSheetStyles = `
  @keyframes slideUp {
    0% {
      transform: translateY(100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  .bottom-sheet-enter {
    animation: slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .bottom-sheet-exit {
    animation: slideDown 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  }
`;

// Injecter les styles dans le document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = bottomSheetStyles;
  document.head.appendChild(styleSheet);
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  showHandle = true
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />
      
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-all duration-500 ease-out ${className}`}
        style={{ 
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: 'translateY(0)',
          opacity: 1
        }}
      >
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}
        
        <div 
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: '120px' // Espace pour les boutons
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
