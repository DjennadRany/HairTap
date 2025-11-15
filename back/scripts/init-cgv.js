import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CGV from '../models/CGV.js';

dotenv.config();

const defaultCGVContent = `
<h1>Conditions Générales de Vente - TapHair</h1>

<h2>1. Objet</h2>
<p>Les présentes Conditions Générales de Vente (CGV) régissent l'utilisation de la plateforme TapHair, service de réservation en ligne pour des prestations de coiffure.</p>

<h2>2. Services proposés</h2>
<p>TapHair propose une plateforme de mise en relation entre des clients et des coiffeurs professionnels pour la réservation de prestations de coiffure à domicile ou en salon.</p>

<h2>3. Tarifs</h2>
<p>Les tarifs des prestations sont indiqués en euros, toutes taxes comprises. Les prix peuvent varier selon le type de prestation et le coiffeur choisi.</p>

<h2>4. Réservation</h2>
<p>La réservation d'une prestation implique l'acceptation sans réserve des présentes CGV. La réservation est confirmée après validation par le coiffeur et paiement du montant total.</p>

<h2>5. Annulation et remboursement</h2>
<p>L'annulation d'une réservation est possible selon les conditions suivantes :</p>
<ul>
  <li>Annulation plus de 48h avant le rendez-vous : remboursement intégral</li>
  <li>Annulation entre 24h et 48h avant le rendez-vous : remboursement de 75%</li>
  <li>Annulation moins de 24h avant le rendez-vous : remboursement de 25%</li>
</ul>

<h2>6. Droit de rétractation</h2>
<p>Conformément à la législation française, vous disposez d'un droit de rétractation de 14 jours à compter de la date de réservation, sauf pour les prestations de services dont l'exécution a commencé avec votre accord avant la fin du délai de rétractation.</p>

<h2>7. Protection des données personnelles</h2>
<p>Vos données personnelles sont traitées conformément au Règlement Général sur la Protection des Données (RGPD). Pour plus d'informations, consultez notre politique de confidentialité.</p>

<h2>8. Responsabilité</h2>
<p>TapHair agit en tant qu'intermédiaire entre les clients et les coiffeurs. La responsabilité de TapHair est limitée à la mise en relation. La qualité des prestations relève de la responsabilité du coiffeur.</p>

<h2>9. Litiges</h2>
<p>En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux français seront compétents.</p>

<h2>10. Acceptation</h2>
<p>L'utilisation de la plateforme TapHair implique l'acceptation sans réserve des présentes CGV.</p>

<p><strong>Date d'entrée en vigueur :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
`;

const initCGV = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté pour l\'initialisation des CGV...');

    // Vérifier si des CGV existent déjà
    const existingCGV = await CGV.findOne({ isActive: true });
    
    if (existingCGV) {
      console.log('⚠️ Des CGV actives existent déjà. Version:', existingCGV.version);
      console.log('Pour créer de nouvelles CGV, utilisez l\'API ou désactivez les CGV existantes.');
      return;
    }

    // Créer les CGV par défaut
    const version = `v1.0-${new Date().toISOString().split('T')[0]}`;
    const cgv = new CGV({
      version,
      content: defaultCGVContent,
      isActive: true,
      effectiveDate: new Date()
    });

    await cgv.save();
    console.log('✅ CGV créées avec succès !');
    console.log('Version:', version);
    console.log('Date d\'entrée en vigueur:', cgv.effectiveDate.toLocaleDateString('fr-FR'));
    
    mongoose.disconnect();
    console.log('✅ Connexion fermée');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des CGV:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

initCGV();

