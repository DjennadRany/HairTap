import type { FC } from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';

interface ListCardToggleProps {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
  className?: string;
}

const ListCardToggle: FC<ListCardToggleProps> = ({ view, onChange, className = '' }) => {
  return (
    <div className={`inline-flex p-1 bg-gray-100 rounded-full shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-2 rounded-full transition-colors duration-200 ${
          view === 'grid' 
            ? 'bg-fashion-dark-gray text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        title="Vue en grille"
      >
        <FaThLarge className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`p-2 rounded-full transition-colors duration-200 ${
          view === 'list' 
            ? 'bg-fashion-dark-gray text-white shadow-sm' 
            : 'text-gray-600 hover:bg-gray-200'
        }`}
        title="Vue en liste"
      >
        <FaList className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ListCardToggle; 