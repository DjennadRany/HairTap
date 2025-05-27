import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/taphair';

async function checkMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB OK');

    // Affiche les collections de la base courante
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('Aucune collection trouvée dans la base taphair.');
    } else {
      console.log('Collections trouvées :', collections.map(c => c.name));
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`- ${col.name} : ${count} documents`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB :', err);
    process.exit(1);
  }
}

checkMongo(); 