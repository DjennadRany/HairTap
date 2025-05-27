import type { FC } from 'react';

const TermsPage: FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Conditions d'utilisation</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptation des conditions</h2>
          <p className="text-gray-600">
            En accédant et en utilisant TapHair, vous acceptez d'être lié par les présentes conditions 
            d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description du service</h2>
          <p className="text-gray-600">
            TapHair est une plateforme de mise en relation entre clients et coiffeurs professionnels. 
            Nous facilitons la réservation de rendez-vous de coiffure, que ce soit en salon ou à domicile.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Compte utilisateur</h2>
          <p className="text-gray-600">
            Pour utiliser certaines fonctionnalités de TapHair, vous devez créer un compte. Vous êtes 
            responsable de maintenir la confidentialité de vos identifiants et de toutes les activités 
            qui se produisent sous votre compte.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Réservations et paiements</h2>
          <p className="text-gray-600">
            Les réservations sont soumises à disponibilité. Les paiements sont traités de manière sécurisée 
            via notre plateforme. Les annulations sont régies par notre politique d'annulation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Responsabilités des coiffeurs</h2>
          <p className="text-gray-600">
            Les coiffeurs sont responsables de la qualité de leurs services, de leur ponctualité et du 
            respect des normes d'hygiène et de sécurité en vigueur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Propriété intellectuelle</h2>
          <p className="text-gray-600">
            Tout le contenu présent sur TapHair, y compris les textes, graphiques, logos et logiciels, 
            est la propriété de TapHair ou de ses concédants de licence et est protégé par les lois sur 
            la propriété intellectuelle.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Limitation de responsabilité</h2>
          <p className="text-gray-600">
            TapHair agit uniquement comme intermédiaire entre les clients et les coiffeurs. Nous ne sommes 
            pas responsables des services fournis par les coiffeurs ou des actions des utilisateurs.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Modifications des conditions</h2>
          <p className="text-gray-600">
            Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications 
            entrent en vigueur dès leur publication sur la plateforme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
          <p className="text-gray-600">
            Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter à 
            <a href="mailto:legal@taphair.com" className="text-accent hover:text-accent-dark ml-1">
              legal@taphair.com
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

export default TermsPage; 