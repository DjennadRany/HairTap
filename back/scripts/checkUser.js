import mongoose from 'mongoose';

// Configuration MongoDB
const mongoURI = 'mongodb://localhost:27017/taphair';

// Modèle User
const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  role: String,
  photo: String,
  // autres champs...
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function checkUser() {
  try {
    console.log('🔍 Vérification des utilisateurs...');
    
    // Connexion à MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`📊 Utilisateurs trouvés: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 Utilisateur ${index + 1}:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Nom: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rôle: ${user.role}`);
    });
    
    // Vérifier l'ID spécifique qui pose problème
    const problemId = '6839ca0736ec3cfc09c649ea';
    console.log(`\n🔍 Recherche de l'utilisateur avec l'ID: ${problemId}`);
    
    try {
      const user = await User.findById(problemId);
      if (user) {
        console.log('✅ Utilisateur trouvé:');
        console.log(`   - Nom: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Rôle: ${user.role}`);
      } else {
        console.log('❌ Utilisateur non trouvé');
      }
    } catch (error) {
      console.log('❌ Erreur lors de la recherche:', error.message);
    }
    
    console.log('\n✅ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
checkUser(); 