import mongoose from 'mongoose';

const checkCollections = async () => {
  try {
    const mongoURI = 'mongodb://localhost:27017/taphair';
    console.log('🔌 Connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');
    
    // Lister toutes les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Collections existantes:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Compter les documents dans chaque collection
    console.log('\n📊 Nombre de documents par collection:');
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
    // Vérifier les index existants
    console.log('\n🔍 Index existants:');
    for (const collection of collections) {
      const indexes = await mongoose.connection.db.collection(collection.name).indexes();
      console.log(`\n📋 ${collection.name}:`);
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

checkCollections();
