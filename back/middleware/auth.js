import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async (req, res, next) => {
  try {
    // Récupérer le token du header (insensible à la casse, supporte 'bearer' ou 'Bearer')
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    // Récupérer l'utilisateur sans le mot de passe
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user._id,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const isCoiffeur = async (req, res, next) => {
  try {
    if (req.user.role !== 'coiffeur') {
      return res.status(403).json({ success: false, error: 'Coiffeur access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export { isAdmin, isCoiffeur }; 