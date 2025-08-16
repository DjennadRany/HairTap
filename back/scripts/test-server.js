import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Serveur fonctionne !' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Serveur de test démarré sur le port ${PORT}`);
  console.log(`🌐 Testez: http://localhost:${PORT}/test`);
});

// Arrêter après 5 secondes
setTimeout(() => {
  console.log('🛑 Arrêt du serveur de test');
  process.exit(0);
}, 5000);
