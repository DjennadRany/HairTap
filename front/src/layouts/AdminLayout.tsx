import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavigation from '../components/AdminNavigation';

const AdminLayout: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Admin */}
      <AdminNavigation isOpen={isNavOpen} onToggle={toggleNav} />
      
      {/* Contenu Principal */}
      <div className="lg:ml-64 transition-all duration-300">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
