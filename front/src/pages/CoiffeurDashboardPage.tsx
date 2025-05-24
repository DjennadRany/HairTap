import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { selectProfile } from '../store/slices/profileSlice';
import { Card } from '../components/ui/card';
import { CalendarIcon, EuroIcon, StarIcon, UserIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

const StatCard = ({ title, value, icon, description }: StatCardProps) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="p-3 bg-primary/10 rounded-full">
        {icon}
      </div>
    </div>
  </Card>
);

interface RecentBooking {
  id: string;
  clientName: string;
  service: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// Données mockées pour l'exemple
const mockRecentBookings: RecentBooking[] = [
  {
    id: '1',
    clientName: 'Sophie Martin',
    service: 'Coupe + Brushing',
    date: '2024-03-20 14:00',
    status: 'confirmed'
  },
  {
    id: '2',
    clientName: 'Lucas Dubois',
    service: 'Coupe Homme',
    date: '2024-03-21 10:30',
    status: 'pending'
  },
  {
    id: '3',
    clientName: 'Emma Bernard',
    service: 'Coloration',
    date: '2024-03-21 15:45',
    status: 'confirmed'
  }
];

const CoiffeurDashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const profile = useSelector(selectProfile);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
          Nouvelle réservation
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Réservations du jour"
          value="5"
          icon={<CalendarIcon className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Nouveaux clients"
          value="12"
          description="+2 cette semaine"
          icon={<UserIcon className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Note moyenne"
          value="4.8"
          description="Sur 45 avis"
          icon={<StarIcon className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Revenus du mois"
          value="2 450€"
          description="+15% vs mois dernier"
          icon={<EuroIcon className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Réservations récentes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Réservations récentes</h2>
        <div className="space-y-4">
          {mockRecentBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div>
                <p className="font-medium">{booking.clientName}</p>
                <p className="text-sm text-gray-500">{booking.service}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">{new Date(booking.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.status === 'confirmed' ? 'Confirmé' :
                   booking.status === 'pending' ? 'En attente' : 'Annulé'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CoiffeurDashboardPage; 