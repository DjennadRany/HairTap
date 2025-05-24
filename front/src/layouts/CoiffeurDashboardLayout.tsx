import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export const CoiffeurDashboardLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}; 