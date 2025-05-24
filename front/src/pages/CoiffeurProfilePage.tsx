import { useParams, useNavigate } from 'react-router-dom';
import { idfCoiffeurs, franceCoiffeurs } from '../features/search/domain/mockData';
import React from 'react';

const CoiffeurProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const coiffeurId = Number(id);
  const coiffeur = React.useMemo(() => {
    return (
      idfCoiffeurs.find(c => c.id === coiffeurId) ||
      franceCoiffeurs?.find?.(c => c.id === coiffeurId) ||
      null
    );
  }, [coiffeurId]);

  if (!coiffeur) {
    return <div className="p-8 text-center text-lg text-gray-500">Coiffeur introuvable.</div>;
    }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
              <img
          src={coiffeur.image}
                alt={coiffeur.name}
          className="w-40 h-40 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold">{coiffeur.name}</h1>
          <div className="flex items-center mt-2">
            <span className="text-yellow-400">★</span>
            <span className="ml-1 text-lg">{coiffeur.rating.toFixed(1)}</span>
            <span className="ml-3 text-gray-500">({coiffeur.reviews} avis)</span>
                </div>
          <div className="mt-2 text-gray-600">{coiffeur.address}</div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Services proposés</h2>
            <ul className="list-disc ml-5">
              {coiffeur.services.map((service, idx) => (
                <li key={service + idx}>{service}</li>
              ))}
            </ul>
            </div>
        </div>
      </div>
      <div className="mt-8">
            <button 
          onClick={() => navigate(`/booking/${coiffeur.id}`)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
          Prendre rendez-vous
            </button>
      </div>
    </div>
  );
};

export default CoiffeurProfilePage; 