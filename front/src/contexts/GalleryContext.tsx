import React, { createContext, useContext, useState, ReactNode } from 'react';

type GalleryTab = 'gallery' | 'coiffeurs';

interface GalleryContextType {
  activeTab: GalleryTab;
  setActiveTab: (tab: GalleryTab) => void;
  toggleTab: () => void;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

interface GalleryProviderProps {
  children: ReactNode;
}

export const GalleryProvider: React.FC<GalleryProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>('gallery');

  const toggleTab = () => {
    setActiveTab(prev => prev === 'gallery' ? 'coiffeurs' : 'gallery');
  };

  return (
    <GalleryContext.Provider value={{ activeTab, setActiveTab, toggleTab }}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};
