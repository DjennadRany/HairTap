import type { FC } from 'react';

const PrivacyPage: FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Politique de confidentialité</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Collecte des informations</h2>
          <p className="text-gray-600">
            Nous collectons les informations suivantes :
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Informations d'identification (nom, prénom, email)</li>
            <li>Informations de contact (adresse, numéro de téléphone)</li>
            <li>Informations de paiement (traitées de manière sécurisée)</li>
            <li>Historique des rendez-vous et préférences</li>
            <li>Données de localisation (pour les services à domicile)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Utilisation des informations</h2>
          <p className="text-gray-600">
            Nous utilisons vos informations pour :
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Gérer votre compte et vos rendez-vous</li>
            <li>Traiter vos paiements</li>
            <li>Communiquer avec vous concernant vos réservations</li>
            <li>Améliorer nos services</li>
            <li>Envoyer des communications marketing (avec votre consentement)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Protection des informations</h2>
          <p className="text-gray-600">
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations 
            personnelles contre tout accès non autorisé, altération, divulgation ou destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Partage des informations</h2>
          <p className="text-gray-600">
            Nous ne vendons pas vos informations personnelles. Nous les partageons uniquement avec :
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Les coiffeurs concernés par vos rendez-vous</li>
            <li>Nos prestataires de services (paiement, hébergement)</li>
            <li>Les autorités légales si requis par la loi</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookies et technologies similaires</h2>
          <p className="text-gray-600">
            Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience 
            sur notre plateforme. Vous pouvez contrôler l'utilisation des cookies via les paramètres 
            de votre navigateur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Vos droits</h2>
          <p className="text-gray-600">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d'opposition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Conservation des données</h2>
          <p className="text-gray-600">
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos 
            services et respecter nos obligations légales. Vous pouvez demander la suppression de 
            vos données à tout moment.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Modifications de la politique</h2>
          <p className="text-gray-600">
            Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Les 
            modifications entrent en vigueur dès leur publication sur la plateforme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
          <p className="text-gray-600">
            Pour toute question concernant notre politique de confidentialité ou pour exercer vos 
            droits, contactez notre délégué à la protection des données à 
            <a href="mailto:privacy@taphair.com" className="text-accent hover:text-accent-dark ml-1">
              privacy@taphair.com
            </a>.
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage; 