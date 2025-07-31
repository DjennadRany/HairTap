import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const coiffeurAuth = async (req, res, next) => {
  try {
    // Vérifier le token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le rôle
    if (user.role !== 'coiffeur') {
      return res.status(403).json({ message: 'Accès réservé aux coiffeurs' });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

export { coiffeurAuth }; 