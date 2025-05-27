import type { FC } from 'react';

const CookiesPage: FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Politique des cookies</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Qu'est-ce qu'un cookie ?</h2>
          <p className="text-gray-600">
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, mobile ou tablette) 
            lors de la visite d'un site web. Il permet au site de mémoriser vos actions et préférences 
            pendant une période déterminée, afin que vous n'ayez pas à les saisir à chaque fois que vous 
            visitez le site ou naviguez d'une page à l'autre.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Types de cookies utilisés</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium mb-2">Cookies essentiels</h3>
              <p className="text-gray-600">
                Ces cookies sont nécessaires au fonctionnement du site. Ils vous permettent de naviguer 
                sur le site et d'utiliser ses fonctionnalités essentielles, comme l'accès aux zones 
                sécurisées.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Cookies de performance</h3>
              <p className="text-gray-600">
                Ces cookies collectent des informations sur la façon dont les visiteurs utilisent notre 
                site, par exemple quelles pages ils visitent le plus souvent. Ces cookies ne collectent 
                pas d'informations qui identifient un visiteur.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Cookies de fonctionnalité</h3>
              <p className="text-gray-600">
                Ces cookies permettent au site de se souvenir des choix que vous faites (comme votre nom 
                d'utilisateur, votre langue ou la région dans laquelle vous vous trouvez) et fournissent 
                des fonctionnalités améliorées et plus personnelles.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Cookies de ciblage</h3>
              <p className="text-gray-600">
                Ces cookies sont utilisés pour diffuser des publicités plus pertinentes pour vous et vos 
                intérêts. Ils sont également utilisés pour limiter le nombre de fois que vous voyez une 
                publicité et pour aider à mesurer l'efficacité des campagnes publicitaires.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Comment gérer les cookies ?</h2>
          <p className="text-gray-600">
            Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez 
            supprimer tous les cookies qui sont déjà sur votre ordinateur et vous pouvez configurer 
            la plupart des navigateurs pour les empêcher d'être placés. Si vous le faites, vous 
            devrez peut-être ajuster manuellement certaines préférences chaque fois que vous visitez 
            un site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Cookies tiers</h2>
          <p className="text-gray-600">
            Certains cookies sont placés par des services tiers qui apparaissent sur nos pages. Nous 
            n'avons aucun contrôle sur ces cookies. Ils sont utilisés pour permettre l'intégration de 
            contenu de services tiers, comme les vidéos, les cartes ou les boutons de partage social.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Durée de conservation</h2>
          <p className="text-gray-600">
            Les cookies de session sont temporaires et expirent lorsque vous fermez votre navigateur. 
            Les cookies persistants restent sur votre appareil jusqu'à leur expiration ou jusqu'à ce 
            que vous les supprimiez manuellement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Mises à jour de la politique</h2>
          <p className="text-gray-600">
            Nous pouvons mettre à jour cette politique des cookies de temps à autre. Toute modification 
            sera publiée sur cette page et, si les modifications sont importantes, nous vous en 
            informerons par email ou par une notification sur notre site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
          <p className="text-gray-600">
            Si vous avez des questions concernant notre utilisation des cookies, veuillez nous contacter à 
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

export default CookiesPage; 