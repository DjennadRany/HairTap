import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import auth from '../middleware/auth.js';
import { validateAuth } from '../middleware/validate.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Inscription
router.post('/register', validateAuth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      name,
      email,
      password,
      role: role || 'user'
    });

    await user.save();

    // Créer le token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        ...(user.role === 'coiffeur' && {
          speciality: user.speciality,
          address: user.address,
          rating: user.rating,
          priceRange: user.priceRange
        })
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Remplacement temporaire de la génération de token JWT pour le dev
function generateFakeToken(user) {
  // Génère un token factice (à remplacer par JWT plus tard)
  return Buffer.from(`${user.id}:${user.email}:${user.role}`).toString('base64');
}

// Connexion
router.post('/login', validateAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Authentification Google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token Google requis' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { name, email, picture } = ticket.getPayload();

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (!user) {
      // Créer un nouvel utilisateur
      const tempPassword = Math.random().toString(36).slice(-8);

      user = new User({
        name,
        email,
        password: tempPassword, // Stockage en clair pour les tests
        photo: picture,
        role: 'client',
        googleId: ticket.getPayload().sub
      });

      await user.save();
    } else if (!user.googleId) {
      // Mettre à jour l'utilisateur existant avec l'ID Google
      user.googleId = ticket.getPayload().sub;
      user.photo = picture;
      await user.save();
    }

    // Créer le token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            photo: user.photo
          }
        });
      }
    );
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'authentification Google' });
  }
});

// Récupérer l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      ...(user.role === 'coiffeur' && {
        speciality: user.speciality,
        address: user.address,
        rating: user.rating,
        priceRange: user.priceRange
      })
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// Changer le mot de passe
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe (comparaison directe pour les tests)
    if (currentPassword !== user.password) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Sauvegarder le nouveau mot de passe en clair
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
});

// Réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = tempPassword; // Stockage en clair pour les tests
    await user.save();

    // TODO: Envoyer le mot de passe temporaire par email
    // Pour l'instant, on renvoie le mot de passe (à retirer en production)
    res.json({ 
      message: 'Un email de réinitialisation a été envoyé',
      tempPassword // À retirer en production
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// Déconnexion
router.post('/logout', auth, async (req, res) => {
  try {
    // Le token est géré côté client, donc pas besoin de le supprimer côté serveur
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
});

// Synchronisation d'un user Firebase/Google avec MongoDB
router.post('/firebase-sync', async (req, res) => {
  const { firebaseUid, email, name, picture, role } = req.body;
  if (!firebaseUid || !email || !role) {
    return res.status(400).json({ error: 'firebaseUid, email et role requis' });
  }
  try {
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      // Si pas trouvé, on cherche par email (migration d'un ancien compte)
      user = await User.findOne({ email });
      if (user) {
        user.firebaseUid = firebaseUid;
        user.name = name || user.name;
        user.picture = picture || user.picture;
        user.role = role || user.role;
        await user.save();
      } else {
        user = await User.create({ firebaseUid, email, name, picture, role });
      }
    }
    return res.json(user);
  } catch (err) {
    console.error('Firebase sync error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 