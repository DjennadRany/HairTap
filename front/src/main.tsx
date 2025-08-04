import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App.tsx';
import './index.css';
import AuthProvider from './components/AuthProvider';
import './utils/debugAuth'; // Import du script de débogage
import './utils/testCors'; // Import du script de test CORS
import './utils/testImageFix'; // Import du script de test d'images
import './utils/testGalleryImages'; // Import du script de test de gallery
import './utils/testDefaultImages'; // Import du script de test des images par défaut

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
