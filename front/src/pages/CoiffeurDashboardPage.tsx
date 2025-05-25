import { Link } from 'react-router-dom';

// MOCKS à remplacer par API plus tard
const mockStats = {
  upcoming: 2,
  revenue: 420,
  clients: 12,
  rating: 4.8,
};
const mockNextBookings = [
  {
    id: 'b1',
    client: 'John Client',
    date: '2024-06-20T10:00',
    service: 'Coupe',
    status: 'confirmed',
  },
  {
    id: 'b2',
    client: 'Alexis Duprez',
    date: '2024-06-21T14:30',
    service: 'Brushing',
    status: 'pending',
  },
];

const CoiffeurDashboardPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord coiffeur</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold text-accent">{mockStats.revenue}€</span>
          <span className="text-gray-600 mt-2">Revenus ce mois</span>
      </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold">{mockStats.clients}</span>
          <span className="text-gray-600 mt-2">Clients ce mois</span>
      </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl font-bold">{mockStats.rating}★</span>
          <span className="text-gray-600 mt-2">Note moyenne</span>
              </div>
            </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Prochains rendez-vous</h2>
          <Link to="/coiffeur/reservations" className="text-accent underline">Voir tout</Link>
        </div>
        {mockNextBookings.length === 0 ? (
          <p className="text-gray-600">Aucun rendez-vous à venir.</p>
        ) : (
          <ul className="divide-y">
            {mockNextBookings.map((b) => (
              <li key={b.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="font-medium">{b.service}</span> avec <span className="font-medium">{b.client}</span>
                  <span className="block text-sm text-gray-500">{new Date(b.date).toLocaleString()}</span>
                </div>
                <span className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status === 'confirmed' ? 'Confirmé' : 'En attente'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CoiffeurDashboardPage; 