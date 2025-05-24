import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const ClientDashboardPage = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Bienvenue {user?.name}</h2>
          <p className="text-gray-600">
            Gérez vos rendez-vous et vos préférences depuis votre tableau de bord.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Prochains rendez-vous</h3>
            <p className="text-gray-600">Aucun rendez-vous prévu</p>
          </div>

          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Coiffeurs favoris</h3>
            <p className="text-gray-600">Aucun coiffeur favori</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage; 