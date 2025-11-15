import { Suspense } from 'react';

import NotificationManager from './components/ui/NotificationManager';
import LoadingScreen from './components/LoadingScreen';
import { GalleryProvider } from './contexts/GalleryContext';
import AppRoutes from './routes';

function App() {
  return (
    <NotificationManager>
      <GalleryProvider>
        <Suspense fallback={<LoadingScreen message="Chargement de la page..." />}>
          <AppRoutes />
        </Suspense>
      </GalleryProvider>
    </NotificationManager>
  );
}

export default App;
