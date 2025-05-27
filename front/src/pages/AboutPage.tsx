import type { FC } from 'react';

const AboutPage: FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">À propos de TapHair</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Notre Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            TapHair est né d'une vision simple : rendre la réservation de services de coiffure plus accessible, 
            plus pratique et plus transparente. Notre plateforme connecte les clients avec les meilleurs coiffeurs 
            de leur région, que ce soit en salon ou à domicile.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Notre Histoire</h2>
          <p className="text-gray-600 leading-relaxed">
            Fondée en 2024, TapHair est le fruit de l'expérience de professionnels du secteur de la coiffure 
            et du développement web. Nous avons constaté les défis auxquels font face les coiffeurs indépendants 
            et les clients dans la gestion des rendez-vous et la découverte de nouveaux talents.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Nos Valeurs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2 text-accent">Innovation</h3>
              <p className="text-gray-600">
                Nous développons constamment de nouvelles fonctionnalités pour améliorer l'expérience 
                utilisateur et répondre aux besoins évolutifs du secteur.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2 text-accent">Transparence</h3>
              <p className="text-gray-600">
                Nous croyons en la transparence des prix, des services et des avis pour aider les clients 
                à prendre des décisions éclairées.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2 text-accent">Communauté</h3>
              <p className="text-gray-600">
                Nous construisons une communauté de confiance où les coiffeurs peuvent développer leur 
                activité et les clients trouver les services qui leur conviennent.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Notre Équipe</h2>
          <p className="text-gray-600 leading-relaxed">
            Notre équipe est composée de passionnés du digital et de la coiffure, travaillant ensemble 
            pour créer la meilleure expérience possible pour nos utilisateurs. Nous combinons expertise 
            technique et connaissance du secteur pour offrir une plateforme intuitive et efficace.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contactez-nous</h2>
          <p className="text-gray-600 leading-relaxed">
            Vous avez des questions ou des suggestions ? N'hésitez pas à nous contacter via notre 
            <a href="/contact" className="text-accent hover:text-accent-dark ml-1">
              formulaire de contact
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 