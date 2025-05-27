import User from '../models/User.js';

const users = [
  {
    name: 'Alice Client',
    email: 'alice.client@test.com',
    password: 'Test1234', // Mot de passe en clair pour les tests
    role: 'client',
    photo: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    name: 'Bob Coiffeur',
    email: 'bob.coiffeur@test.com',
    password: 'Test1234', // Mot de passe en clair pour les tests
    role: 'coiffeur',
    photo: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    name: 'Marie Coiffeuse',
    email: 'marie.coiffeuse@test.com',
    password: 'Test1234', // Mot de passe en clair pour les tests
    role: 'coiffeur',
    photo: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Admin1234', // Mot de passe en clair pour les tests
    role: 'admin',
    photo: 'https://randomuser.me/api/portraits/men/2.jpg'
  }
];

const seedUsers = async () => {
  try {
    // Supprimer tous les utilisateurs existants
    await User.deleteMany({});
    
    // Créer les nouveaux utilisateurs
    for (const u of users) {
      const user = new User(u);
      await user.save();
    }
    
    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

export default seedUsers; 