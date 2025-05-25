import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';

export const ClientDashboardLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/client/chat';
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={isChatPage ? '' : 'py-10'}>
        <Outlet />
      </main>
    </div>
  );
}; 