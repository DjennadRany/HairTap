import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { auth } from '../middleware/auth.js';
import { validateAuth } from '../middleware/validate.js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';
import PasswordResetToken from '../models/PasswordResetToken.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Vérification téléphone
router.get('/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ message: 'Téléphone requis' });
    }

    // Vérifier si le téléphone existe déjà
    const existingUser = await User.findOne({ phone });
    
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? 'Téléphone déjà utilisé' : 'Téléphone disponible'
    });
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
});

// Vérification email (étape 1, contrôle temps réel)
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    // Vérifier si l'email existe déjà (contrôle strict)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? 'Email déjà utilisé' : 'Email disponible'
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
});

// Vérification SIREN
router.get('/check-siren', async (req, res) => {
  try {
    const { siren } = req.query;
    
    if (!siren) {
      return res.status(400).json({ message: 'SIREN requis' });
    }

    // Vérifier si le SIREN existe déjà
    const existingUser = await User.findOne({ siren });
    
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? 'SIREN déjà utilisé' : 'SIREN disponible'
    });
  } catch (error) {
    console.error('Check SIREN error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
});

// Inscription
router.post('/register', validateAuth, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      bio, 
      addresses, 
      preferences,
      siren,
      sirenStatus,
      experience,
      formation,
      specialities,
      workingMode,
      travelRadius,
      salonAddress,
      workingHours,
      services
    } = req.body;

    // SUPPRIMÉ : Contrôle d'email de fin - cause de problèmes

    // Créer le nouvel utilisateur avec TOUTES les données
    const userData = {
      name,
      email,
      password,
      role: role || 'user'
    };

    // Ajouter les champs optionnels s'ils existent et ne sont pas vides
    if (phone && phone.trim()) userData.phone = phone.trim();
    if (bio && bio.trim()) userData.bio = bio.trim();
    
    // Champs coiffeur (simplifiés pour debug)
    if (siren) userData.siren = siren;
    if (sirenStatus) userData.sirenStatus = sirenStatus;
    if (experience) userData.experience = experience;
    if (formation) userData.formation = formation;
    if (specialities) userData.specialities = specialities;
    if (workingMode) userData.workingMode = workingMode;
    if (travelRadius) userData.travelRadius = travelRadius;
    if (salonAddress) userData.salonAddress = salonAddress;
    if (workingHours) userData.workingHours = workingHours;
    if (services) userData.services = services;
    // Adresses simplifiées pour éviter les plantages
    if (addresses) {
      userData.addresses = addresses;
    }
    if (preferences && Object.keys(preferences).length > 0) {
      userData.preferences = preferences;
    }

    const user = new User(userData);
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
        phone: user.phone,
        bio: user.bio,
        addresses: user.addresses,
        preferences: user.preferences,
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
    console.log('LOGIN DEBUG - body:', req.body);
    const user = await User.findOne({ email }).select('+password');
    console.log('LOGIN DEBUG - user:', user);
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur inexistant.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect.' });
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
      const tempPassword = crypto.randomBytes(32).toString('hex');

      user = new User({
        name,
        email,
        password: tempPassword,
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
            _id: user.id,
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

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
});

// Réinitialiser le mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({ message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
    }

    await PasswordResetToken.deleteMany({ user: user._id });

    const tokenId = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const jwtResetToken = jwt.sign(
      {
        tokenId,
        sub: user._id.toString(),
        type: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${jwtResetToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        resetUrl,
        expiresInMinutes: 60
      });
    } catch (emailError) {
      await PasswordResetToken.deleteMany({ user: user._id, tokenHash });
      throw emailError;
    }

    res.json({ message: 'Un lien de réinitialisation a été envoyé par email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation de mot de passe' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (verificationError) {
      if (verificationError.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Lien de réinitialisation expiré' });
      }

      return res.status(400).json({ message: 'Lien de réinitialisation invalide' });
    }

    if (!decodedToken?.tokenId || decodedToken.type !== 'password_reset') {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide' });
    }

    const tokenHash = crypto.createHash('sha256').update(decodedToken.tokenId).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      user: decodedToken.sub,
      tokenHash,
      expiresAt: { $gt: new Date() },
      consumedAt: { $exists: false }
    });

    if (!resetToken) {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré' });
    }

    const user = await User.findById(decodedToken.sub).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.password = password;
    await user.save();

    resetToken.consumedAt = new Date();
    await resetToken.save();
    await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: resetToken._id } });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// Vérifier la validité du token
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un nouveau token (refresh)
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
    console.error('Verify token error:', error);
    res.status(401).json({ message: 'Token invalide' });
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
