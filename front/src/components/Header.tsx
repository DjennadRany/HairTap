import type { FC } from 'react';
import { Link } from 'react-router-dom';

const Header: FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#DE6C5C]">TapHair</span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              to="/login"
              className="bg-[#DE6C5C] text-white px-4 py-2 rounded-lg hover:bg-[#DE6C5C]/90"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 