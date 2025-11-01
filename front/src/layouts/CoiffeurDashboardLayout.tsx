import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile } from '../hooks/useIsMobile';

export const CoiffeurDashboardLayout = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'pb-16' : ''}`}>
        <Outlet />
      </div>
      {isMobile && <BottomNavigation />}
    </div>
  );
}; 