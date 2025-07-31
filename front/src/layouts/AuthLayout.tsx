import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF1E0]">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-fashion-light-gray p-8 rounded-lg shadow-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}; 