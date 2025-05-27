import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Map } from '../features/search/presentation/components/Map';

const mockReservations = [
  {
    id: 'r1',
    clientId: '1',
    clientName: 'John Client',
    clientPhoto: 'https://ui-avatars.com/api/?name=John+Client',
    clientEmail: 'client@test.com',
    clientPhone: '0601020304',
    date: '2024-06-22T10:00',
    service: 'Coupe',
    price: 40,
    status: 'confirmed',
    mode: 'domicile',
    address: '15 rue de Paris, 75010 Paris',
    lat: 48.880, lon: 2.370
  },
  {
    id: 'r2',
    clientId: '1',
    clientName: 'John Client',
    clientPhoto: 'https://ui-avatars.com/api/?name=John+Client',
    clientEmail: 'client@test.com',
    clientPhone: '0601020304',
    date: '2024-06-23T14:30',
    service: 'Brushing',
    price: 30,
    status: 'pending',
    mode: 'salon',
    address: 'Salon Marie, 12 rue des Artistes, 75010 Paris',
    lat: 48.881, lon: 2.371
  },
];

const CoiffeurReservationsPage = () => {
  const user = useSelector(selectCurrentUser);
  if (!user || user.role !== 'coiffeur') {
    return <div className="container mx-auto px-4 py-8">Erreur : accès réservé aux coiffeurs connectés.</div>;
  }
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Mes réservations</h1>
      {mockReservations.length === 0 ? (
        <p className="text-gray-600">Aucune réservation à venir.</p>
      ) : (
        <ul className="space-y-6">
          {mockReservations.map((r) => (
            <li key={r.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Fiche client */}
              <div className="flex items-center gap-4 flex-1">
                <img src={r.clientPhoto} alt={r.clientName} className="w-14 h-14 rounded-full object-cover border" />
                  <div>
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {r.clientName}
                    <a href={`/client/profile`} className="text-accent underline text-sm ml-2">Voir profil</a>
                  </div>
                  <div className="text-gray-500 text-sm">{r.clientEmail} • {r.clientPhone}</div>
                </div>
                  </div>
              {/* Détail réservation */}
              <div className="flex-1">
                <div className="font-medium">{r.service} <span className="text-gray-400">- {r.price}€</span></div>
                <div className="text-gray-500 text-sm">{new Date(r.date).toLocaleString()}</div>
                <div className="text-xs mt-1 px-2 py-1 rounded-full inline-block font-semibold
                  ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}">
                  {r.status === 'confirmed' ? 'Confirmé' : r.status === 'pending' ? 'En attente' : 'Terminé'}
                </div>
                {r.mode === 'domicile' && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Prestation à domicile</div>
                    <div className="h-32 w-full rounded overflow-hidden">
                      <Map
                        center={{ latitude: r.lat, longitude: r.lon }}
                        markers={[{
                          id: Number(r.id),
                          name: r.clientName,
                          type: 'domicile',
                          address: r.address,
                          rating: 5,
                          reviews: 1,
                          price: r.price,
                          location: { latitude: r.lat, longitude: r.lon },
                          services: [r.service],
                          image: r.clientPhoto
                        }]}
                        className="min-h-[120px]"
                      />
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline text-xs mt-1 inline-block"
                      >
                      Itinéraire Google Maps
                    </a>
                    </div>
                  )}
                </div>
              {/* Actions */}
              <div className="flex flex-col gap-2 items-end">
                {r.status !== 'done' && (
                  <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Marquer comme fait</button>
                )}
                {r.status !== 'cancelled' && (
                  <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Annuler</button>
                )}
              </div>
            </li>
          ))}
        </ul>
          )}
    </div>
  );
};

export default CoiffeurReservationsPage; 