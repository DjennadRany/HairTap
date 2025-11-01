import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile } from '../hooks/useIsMobile';

export const ClientDashboardLayout = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={`py-10 ${isMobile ? 'pb-16' : ''}`}>
        <Outlet />
      </main>
      {isMobile && <BottomNavigation />}
    </div>
  );
}; 