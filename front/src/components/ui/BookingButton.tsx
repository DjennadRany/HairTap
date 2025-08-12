import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

interface BookingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const BookingButton: React.FC<BookingButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  children = 'Réserver ce service'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-gray-300 text-gray-700 px-8 py-3 rounded-lg 
        hover:bg-gray-800 hover:text-white 
        transition-colors flex items-center gap-2 mx-auto 
        font-medium shadow-lg disabled:opacity-50 
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      <FaCalendarAlt />
      {children}
    </button>
  );
};

export default BookingButton; 