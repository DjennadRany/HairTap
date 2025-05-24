import React from 'react';
import type { FC } from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';
import 'leaflet.markercluster';

interface ListCardToggleProps {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
}

const ListCardToggle: FC<ListCardToggleProps> = ({ view, onChange }) => {
  return (
    <div className="inline-flex p-1 bg-gray-200 rounded-full">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-2 rounded-full ${
          view === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'
        }`}
      >
        <FaThLarge />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`p-2 rounded-full ${
          view === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'
        }`}
      >
        <FaList />
      </button>
    </div>
  );
};

export default ListCardToggle; 