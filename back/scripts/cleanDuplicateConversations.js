import mongoose from 'mongoose';
import mongoURI from '../config/mongoURI.js';

// Modèle de conversation (si pas déjà défini)
const ConversationSchema = new mongoose.Schema({
  userId: String,
  lastMessage: {
    from: String,
    to: String,
    content: String,
    date: Date,
    read: Boolean
  },
  unread: Number
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

async function cleanDuplicateConversations() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les conversations
    const allConversations = await Conversation.find({});
    console.log(`📊 Total conversations trouvées: ${allConversations.length}`);

    // Grouper par userId
    const conversationsByUser = {};
    allConversations.forEach(conv => {
      if (!conversationsByUser[conv.userId]) {
        conversationsByUser[conv.userId] = [];
      }
      conversationsByUser[conv.userId].push(conv);
    });

    // Identifier les doublons
    let totalDuplicates = 0;
    const toDelete = [];

    Object.entries(conversationsByUser).forEach(([userId, conversations]) => {
      if (conversations.length > 1) {
        console.log(`⚠️  Utilisateur ${userId}: ${conversations.length} conversations`);
        
        // Garder la plus récente, supprimer les autres
        const sortedConversations = conversations.sort((a, b) => {
          const dateA = a.lastMessage?.date ? new Date(a.lastMessage.date) : new Date(0);
          const dateB = b.lastMessage?.date ? new Date(b.lastMessage.date) : new Date(0);
          return dateB - dateA;
        });

        // Supprimer toutes sauf la première (la plus récente)
        const duplicates = sortedConversations.slice(1);
        toDelete.push(...duplicates);
        totalDuplicates += duplicates.length;
        
        console.log(`  → Garde: ${sortedConversations[0]._id} (${sortedConversations[0].lastMessage?.date || 'pas de message'})`);
        console.log(`  → Supprime: ${duplicates.length} doublons`);
      }
    });

    if (toDelete.length > 0) {
      console.log(`\n🗑️  Suppression de ${toDelete.length} conversations dupliquées...`);
      
      const deleteIds = toDelete.map(conv => conv._id);
      const result = await Conversation.deleteMany({ _id: { $in: deleteIds } });
      
      console.log(`✅ ${result.deletedCount} conversations supprimées`);
    } else {
      console.log('✅ Aucun doublon trouvé');
    }

    // Vérifier le résultat final
    const finalCount = await Conversation.countDocuments();
    console.log(`\n📊 Résultat final: ${finalCount} conversations`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter le script
cleanDuplicateConversations();
