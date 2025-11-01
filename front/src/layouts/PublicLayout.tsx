import type { FC } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile } from '../hooks/useIsMobile';

export const PublicLayout: FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Pages où le footer doit être caché sur mobile
  const hideFooterOnMobile = ['/search'];
  const shouldHideFooter = isMobile && hideFooterOnMobile.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-grow ${isMobile ? 'pb-16' : ''}`}>
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
      {isMobile && <BottomNavigation />}
    </div>
  );
}; 