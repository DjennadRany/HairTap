import type { FC } from 'react';
import { Link } from 'react-router-dom';

const HomePage: FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#FAF1E0]">
      <h1 className="text-4xl font-bold text-[#000000] mb-8">
        Bienvenue sur Taper
      </h1>
      <div className="flex gap-4">
        <Link
          to="/search"
          className="px-6 py-3 bg-[#DE6C5C] text-white rounded-lg hover:bg-[#DE6C5C]/90 transition"
        >
          Rechercher un coiffeur
        </Link>
        <Link
          to="/login"
          className="px-6 py-3 border-2 border-[#DE6C5C] text-[#DE6C5C] rounded-lg hover:bg-[#DE6C5C] hover:text-white transition"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
};

export default HomePage; 