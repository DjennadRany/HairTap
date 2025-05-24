import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';

const CoiffeurGalleryPage = () => {
  const user = useSelector(selectCurrentUser);
  if (user && user.role === 'coiffeur') {
    return <Navigate to={`/coiffeur/${user.id}`} replace />;
  }
  return <div className="container mx-auto px-4 py-8">Coiffeur introuvable.</div>;
};

export default CoiffeurGalleryPage; 