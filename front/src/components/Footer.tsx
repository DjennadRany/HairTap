import type { FC } from 'react';
import { Link } from 'react-router-dom';

const Footer: FC = () => {
  return (
    <footer className="bg-[#000000] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">TapHair</h3>
            <p className="text-gray-300">
              La plateforme qui connecte les clients avec les meilleurs coiffeurs.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Légal</h3>
            <p className="text-gray-300">
              Mentions légales et conditions d'utilisation à venir.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} TapHair. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 