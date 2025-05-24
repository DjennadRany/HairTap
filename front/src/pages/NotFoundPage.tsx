import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <img
          src="/404-illustration.svg"
          alt="404 Not Found"
          className="mx-auto mb-8 w-48 h-48 object-contain"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
        <h1 className="text-5xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Oups, page introuvable !</h2>
        <p className="text-gray-600 mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.<br />
          Retournez à l'accueil ou explorez nos services.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-accent text-white px-6 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Accueil
          </Link>
          <Link
            to="/search"
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Rechercher un coiffeur
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 