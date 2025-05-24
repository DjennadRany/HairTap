import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page non trouvée</h2>
        <p className="mt-2 text-gray-600">Désolé, la page que vous recherchez n'existe pas.</p>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-accent text-white rounded-md hover:bg-accent/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 