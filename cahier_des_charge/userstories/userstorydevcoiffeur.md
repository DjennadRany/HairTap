Bloc 1 : Inscription et création de profil Coiffeur
(Partie 1/5)

US-001 – Inscription simplifiée avec authentification sécurisée
En tant que coiffeur,
Je veux pouvoir m’inscrire facilement via Google ou par e-mail/mot de passe,
Afin de pouvoir créer un compte sans friction et sécuriser mon accès.

Critères d’acceptation :
 Un bouton "S’inscrire avec Google" (OAuth2)

 Un formulaire classique (Nom, Prénom, Email, Mot de passe, Confirmation)

 Contrôle du mot de passe (8 caractères minimum, 1 majuscule, 1 chiffre)

 Vérification par e-mail avant activation du compte

 Termes et conditions à valider obligatoirement

 Message d’erreur clair si e-mail déjà utilisé

US-002 – Choix du mode de travail
En tant que coiffeur,
Je veux choisir si je travaille à domicile, en salon, ou les deux,
Afin de personnaliser mes prestations selon mes capacités réelles.

Critères d’acceptation :
 Case à cocher : "À domicile", "En salon", "Les deux"

 Possibilité d’indiquer une ou plusieurs adresses de salon

 Adresse enregistrée automatiquement avec géolocalisation (si autorisée)

 Option “rayon de déplacement” si le coiffeur est à domicile

US-003 – Saisie des informations professionnelles & légales
En tant que coiffeur,
Je veux pouvoir renseigner mes données légales et professionnelles (SIREN ou en cours),
Afin de facturer en conformité avec la loi française.

Critères d’acceptation :
 Champ pour SIREN

 Bouton “Je n’ai pas encore de SIREN”

 Bloc explicatif sur la législation française

 Limitation à 3 commandes max sans SIREN (message d’avertissement clair)

 Historique du statut de l’auto-entrepreneur dans l’admin panel

US-004 – Configuration des disponibilités et agenda
En tant que coiffeur,
Je veux configurer mes horaires précis par jour de la semaine,
Afin que les clients ne puissent réserver que quand je suis disponible.

Critères d’acceptation :
 Système d’agenda à la semaine, découpé en tranches horaires

 Possibilité de travailler 24h/24 (contrairement à la concurrence)

 Système de “créneaux fermés” manuellement par l'utilisateur

 Synchronisation optionnelle avec Google Agenda (future feature)

 Notification si chevauchement ou incohérence d’horaire

US-005 – Géolocalisation précise et logique de proximité
En tant que coiffeur,
Je veux que ma fiche utilise ma position (ou mon adresse) pour apparaître dans les recherches locales,
Afin de maximiser mes chances d’être réservé.

Critères d’acceptation :
 Auto-géolocalisation (avec autorisation navigateur)

 Saisie manuelle possible si refus GPS

 Rayon d’intervention personnalisable (5 à 50 km)

 Compatibilité mobile et desktop

US-006 – Création de fiche professionnelle enrichie
En tant que coiffeur,
Je veux créer une fiche visible côté client avec photo, bio, spécialités, tags,
Afin de me démarquer et séduire mes clients potentiels.

Critères d’acceptation :
 Upload photo de profil + galerie (max 10 images)

 Champ bio (limité à 400 caractères)

 Tags dynamiques : “Spécialiste bouclés”, “Coloriste”, etc. (auto-suggest)

 Prévisualisation de la fiche

 Option pour masquer certaines infos (ex : n° de téléphone)

US-007 – Contrôle qualité sur les médias
En tant que PO,
Je veux qu’un système de validation automatique ou manuel filtre les images uploadées,
Afin de protéger l’image de marque et éviter les abus.

Critères d’acceptation :
 Rejet automatique des formats non autorisés (.jpg/.png/.webp seulement)

 Système de détection automatique (ML, modération d’image via API type Sightengine)

 Possibilité de modération humaine si doute

 Limite de taille (5 Mo max / image)

 Images taguées automatiquement selon leur contenu ou manuellement par l’utilisateur

US-008 – Guidage intelligent à la création de fiche
En tant que coiffeur,
Je veux être guidé avec des suggestions de texte, images, tags,
Afin de rendre ma fiche claire, professionnelle et optimisée sans me prendre la tête.

Critères d’acceptation :
 Aide contextuelle sur chaque champ

 Suggestions automatiques selon le texte saisi

 Mise en avant des meilleurs profils du même type en exemple

 Barre de progression de complétion du profil

 Statut "profil certifié" quand tous les champs sont remplis

Bloc 2 : Dashboard, Agenda, Réservations, Revenus
(Partie 2/5)

US-009 – Accès à un tableau de bord centralisé
En tant que coiffeur,
Je veux accéder à un tableau de bord clair dès ma connexion,
Afin de voir en un coup d’œil mes rendez-vous, revenus, évaluations et messages.

Critères d’acceptation :
 Affichage des réservations à venir avec statut (confirmée, en attente, annulée)

 Résumé des revenus du mois (graphique + chiffres clés)

 Statut de complétion de profil

 Derniers avis clients reçus

 Accès rapide à chaque onglet : "Agenda", "Mes services", "Messagerie", "Revenus"

US-010 – Visualisation complète de mon agenda
En tant que coiffeur,
Je veux voir tous mes créneaux et RDV sur un calendrier,
Afin de gérer facilement mes disponibilités et éviter les doublons.

Critères d’acceptation :
 Affichage en mode “Jour”, “Semaine”, “Mois”

 Couleur selon le statut du rendez-vous (ex : vert confirmé, orange en attente)

 Clic sur un créneau = détails du rendez-vous

 Synchronisation avec Google Calendar (optionnelle)

 Blocage automatique des créneaux déjà réservés

US-011 – Réception et gestion des réservations
En tant que coiffeur,
Je veux recevoir une notification quand une réservation est effectuée,
Afin de pouvoir accepter ou refuser la prestation rapidement.

Critères d’acceptation :
 Notification immédiate (push + email)

 Possibilité d'accepter ou refuser avec un message

 Si refus : obligation de motiver (non dispo, maladie, etc.)

 Le créneau est automatiquement libéré en cas de refus

 Historique des réservations disponibles

US-012 – Détail d’une réservation
En tant que coiffeur,
Je veux accéder à une fiche complète pour chaque réservation,
Afin de connaître les besoins du client et anticiper le rendez-vous.

Critères d’acceptation :
 Affichage de l’adresse (ou point GPS)

 Service réservé + durée + prix

 Informations client : prénom, note moyenne, nombre d’avis

 Historique du client (si déjà venu)

 Bouton “contacter le client” (messagerie intégrée)

US-013 – Suivi de mes revenus et paiements
En tant que coiffeur,
Je veux suivre mes revenus en temps réel,
Afin de savoir combien j’ai gagné, ce qui est en attente et ce qui est payé.

Critères d’acceptation :
 Solde disponible (argent transférable)

 Montant en attente (réservation passée mais non versée)

 Relevé mensuel téléchargeable (PDF)

 Détail des commissions retenues

 Intégration future avec Stripe Connect (vérification d’identité + IBAN)

US-014 – Vue statistique de mes performances
En tant que coiffeur,
Je veux consulter des stats sur mon activité (avis, réservations, pics horaires),
Afin de m’améliorer et mieux piloter mon business.

Critères d’acceptation :
 Nombre de réservations / semaine

 Plages horaires les plus demandées

 Panier moyen

 Taux de rétention client

 Graphique des évaluations (évolution dans le temps)

US-015 – Historique complet de mes réservations
En tant que coiffeur,
Je veux consulter l’historique de toutes mes prestations passées,
Afin de suivre mon activité et retrouver les infos d’un ancien client.

Critères d’acceptation :
 Liste chronologique filtrable (par mois, par client, par service)

 Bouton “recontacter ce client”

 Téléchargement du reçu ou facture

 Export en CSV

Bloc 3 : Messagerie, avis, interactions sociales (likes, tags, etc.)
US-016 – Système de messagerie interne entre client et coiffeur
En tant que coiffeur,
Je veux pouvoir discuter avec un client via la messagerie intégrée,
Afin de clarifier une demande, fixer des détails ou prévenir d’un changement.

Critères d’acceptation :
 Interface type chat classique (mobile friendly)

 Messages horodatés avec statut (envoyé / lu)

 Filtrage par client

 Alertes (push/email) à chaque nouveau message

 Messagerie désactivée pour les clients qui n’ont pas encore réservé

US-017 – Réception des avis après prestation
En tant que coiffeur,
Je veux recevoir une note et un commentaire de la part du client,
Afin de valoriser mon travail ou m’améliorer.

Critères d’acceptation :
 Note sur 5 étoiles + commentaire (facultatif)

 L’avis est visible sur ma fiche

 Notification lorsqu’un avis est déposé

 Moyenne des avis mise à jour en temps réel

 Possibilité de répondre à un avis (1 fois)

US-018 – Affichage des avis sur la fiche coiffeur
En tant que client,
Je veux lire les retours d'autres clients sur un coiffeur,
Afin de prendre une décision éclairée.

Critères d’acceptation :
 Les avis sont affichés par date décroissante

 Tri possible par note

 Affichage du prénom, photo de profil et date

 Avis mis en avant si "coup de cœur" (algorithme basé sur pertinence)

US-019 – Système de like sur les fiches coiffeurs
En tant que client,
Je veux pouvoir “liker” une fiche coiffeur,
Afin de l’ajouter à mes favoris pour une réservation future.

En tant que coiffeur,
Je veux savoir combien de clients ont aimé mon profil,
Afin de mesurer ma popularité.

Critères d’acceptation :
 Bouton ❤️ visible pour le client

 Historique des likes visibles dans l’onglet “favoris”

 Le nombre de likes est visible dans le dashboard du coiffeur

 Pas de like possible sans compte client

US-020 – Mur social / actualités du coiffeur
En tant que coiffeur,
Je veux pouvoir publier du contenu sur mon espace (photos, actus, promos),
Afin de fidéliser et engager ma clientèle.

Critères d’acceptation :
 Publication texte + image + hashtags

 Planification possible (programmation de post)

 Affichage en “fil d’actualités” sur le profil

 Possibilité pour les clients de commenter ou liker

 Modération automatique du contenu (API d’analyse)

US-021 – Profil client enrichi (côté coiffeur)
En tant que coiffeur,
Je veux accéder à une fiche client avec historique et notes,
Afin de personnaliser mes rendez-vous et fidéliser.

Critères d’acceptation :
 Historique des prestations réalisées avec ce client

 Tags automatiques : “Fidèle”, “Coloration”, etc.

 Note du coiffeur sur le client (privée)

 Informations personnelles affichées : prénom, ville, nombre de prestations, avis laissés

US-022 – Blocage d’un utilisateur
En tant que coiffeur,
Je veux pouvoir bloquer un client problématique,
Afin de ne plus recevoir de demandes de sa part.

Critères d’acceptation :
 Bouton “Bloquer ce client” dans la fiche client

 Confirmation avant action

 Le client bloqué ne peut plus réserver ni envoyer de messages

 L’historique reste visible mais grisé
Bloc 4 : Services personnalisés, prix, catalogue, images, suggestion marché
US-023 – Ajout d’un service coiffure personnalisé
En tant que coiffeur,
Je veux pouvoir créer mes propres services (nom, description, durée, prix),
Afin de proposer une offre qui correspond à mon savoir-faire.

Critères d’acceptation :
 Champ "Nom du service"

 Champ "Description détaillée"

 Sélection d’une durée (par pas de 15 min)

 Définition d’un prix libre

 Ajout facultatif d’une image illustrative

 Classement automatique par catégorie (ex : coupe, brushing, soin…)

US-024 – Galerie de services avec aperçu visuel
En tant que coiffeur,
Je veux que mes services soient visibles dans une galerie claire avec photo + tarif,
Afin que les clients comprennent rapidement ce que je propose.

Critères d’acceptation :
 Affichage en grille responsive

 Image de couverture par service (ou icône par défaut si absent)

 Filtrage par catégorie

 Tarif, durée, tags visibles directement

US-025 – Système de tags pour identifier chaque service
En tant que coiffeur,
Je veux associer des mots-clés à chaque service,
Afin de faciliter la recherche des clients et le référencement dans l’appli.

Critères d’acceptation :
 Suggestions automatiques selon le nom du service

 Ajout manuel de tags personnalisés

 Limite de 5 tags par service

 Tags affichés sur la fiche service

US-026 – Comparateur de prix intelligent
En tant que coiffeur,
Je veux voir le prix moyen des services similaires autour de moi,
Afin de ajuster ma tarification intelligemment.

Critères d’acceptation :
 Lorsque je crée un service, l’app me propose un comparatif :

Prix moyen local

Fourchette basse/haute

Nombres de concurrents analysés

 Une jauge (vert/jaune/rouge) indique si mon prix est aligné ou non

 Option “Je m’aligne” qui ajuste automatiquement mon prix à la moyenne

US-027 – Galerie d’images professionnelles contrôlées
En tant que coiffeur,
Je veux pouvoir illustrer mes services avec des photos vérifiées,
Afin de rassurer le client sans compromettre l’image de la plateforme.

Critères d’acceptation :
 Upload limité à 5 Mo / image

 Filtres automatiques contre contenu inapproprié (API modération IA)

 Rejet automatique si :

Image floue

Texte agressif

Contenu sensible détecté

 Galerie personnelle + bibliothèque d’images HairTap (suggestions libres de droits)

US-028 – Preview complète de la fiche service côté client
En tant que coiffeur,
Je veux voir exactement ce que verra le client pour chaque service,
Afin de m’assurer que c’est vendeur, clair et attractif.

Critères d’acceptation :
 Bouton “Prévisualiser” après création/modif d’un service

 Aperçu : nom, durée, tarif, photo, description, tags

 Affichage mobile + desktop

 Possibilité d’envoyer la fiche par lien (test client)

US-029 – Planification d’un service temporaire / promotionnel
En tant que coiffeur,
Je veux pouvoir créer des prestations limitées dans le temps (promo, événements),
Afin de dynamiser mes ventes selon les périodes.

Critères d’acceptation :
 Option “Offre temporaire” à activer

 Date de début/fin obligatoire

 Badge "Promo" ou "Éphémère" sur la fiche

 Notification push possible aux clients favoris

US-030 – Duplication rapide d’un service
En tant que coiffeur,
Je veux pouvoir dupliquer un service existant,
Afin de créer facilement une déclinaison (ex : coupe courte vs coupe longue).

Critères d’acceptation :
 Bouton "Dupliquer" dans la liste de services

 Tous les champs sont pré-remplis sauf le nom

 Modification libre après duplication

 Indication “copie de…” en préfixe

Bloc 5 : Légal, administratif, limitations, conformité, back-office invisible
US-031 – Saisie et vérification du numéro SIREN
En tant que coiffeur,
Je veux pouvoir saisir mon numéro SIREN,
Afin de me conformer à la législation et pouvoir facturer.

Critères d’acceptation :
 Champ SIREN obligatoire pour facturation illimitée

 Vérification automatique via API INSEE (si dispo)

 Message d’erreur si le numéro est invalide

 Statut “Vérifié” affiché dans le back-office

 Message pédagogique expliquant son utilité

US-032 – Mode “SIREN en cours de création” avec limitation
En tant que coiffeur,
Je veux pouvoir indiquer que mon SIREN est en cours de création,
Afin de commencer à vendre sans attendre, dans la limite légale.

Critères d’acceptation :
 Case à cocher “Je suis en cours de création d’entreprise”

 Affichage clair : “Vous pouvez effectuer 3 prestations sans SIREN”

 Compteur visible sur le dashboard

 Blocage automatique après 3 ventes (avec message d’avertissement)

 Notification automatique envoyée à l’approche de la limite

US-033 – Génération automatique de factures conformes
En tant que coiffeur,
Je veux que chaque vente génère une facture légale,
Afin de respecter les obligations comptables et rassurer mes clients.

Critères d’acceptation :
 Facture PDF envoyée automatiquement au client et au coiffeur

 Numérotation unique, horodatée

 Mentions légales obligatoires (nom, adresse, SIREN, TVA si applicable…)

 Mention spéciale “SIREN en cours” si activée

 Téléchargement possible depuis l’historique des ventes

US-034 – Gestion des données personnelles RGPD
En tant que coiffeur,
Je veux accéder, modifier ou supprimer mes données personnelles,
Afin de respecter mes droits RGPD.

Critères d’acceptation :
 Page “Mon compte” avec :

Données modifiables

Téléchargement des données (format JSON ou CSV)

Suppression complète du compte (avec délai de 15 jours)

 Affichage d’un bandeau cookie + gestion des consentements

 Politique de confidentialité accessible dès l’inscription

US-035 – Sécurité des paiements et des comptes
En tant que coiffeur,
Je veux que mon compte et mes revenus soient protégés,
Afin de travailler sereinement.

Critères d’acceptation :
 Authentification forte (2FA optionnelle)

 Stockage sécurisé des IBANs via Stripe Connect

 Logs de connexion et alertes en cas de tentative suspecte

 Historique des connexions visibles dans l’interface

US-036 – Hub invisible de gestion (admin platform)
En tant que équipe HairTap,
Je veux accéder à un espace d'administration non visible par les coiffeurs,
Afin de modérer, analyser et contrôler l’usage de la plateforme.

Critères d’acceptation :
 Liste des coiffeurs inscrits, triables, filtrables (statut vérifié, actif, inactif)

 Accès aux avis et contenus signalés

 Activation / suspension d’un compte

 Visualisation de l’agenda pour détection des fraudes

 Export des données statistiques (CSV / PDF)

US-037 – Page de prévisualisation publique du profil coiffeur
En tant que coiffeur,
Je veux voir à quoi ressemblera ma page publique côté client,
Afin de l’optimiser et tester son attractivité.

Critères d’acceptation :
 Bouton "Voir ma page client" dans le dashboard

 URL publique partageable (ex : hairtap.fr/coiffeur/julien-paris18)

 Affichage conforme à la version client : photos, services, avis, likes

 Statistiques de vues (nombre de fois où la fiche a été consultée)


optionnel ; 
. Proposition de Roadmap Produit HairTap (avec les user stories intégrées)
Phase 0 – Préparatoire (Design & Architecture)
UI/UX sur Figma (mobile-first, fluide, inspire-toi de Glamsquad/Uber)

Architecture front (React + Tailwind)

Back à définir (Node ou Spring Boot comme prévu)

Auth via Firebase ou Auth0 (Google OAuth)

Phase 1 – MVP (0–3 mois) → Objectif : tester le modèle avec 100 coiffeurs
🎯 Fonctionnalités :

US-001 à US-015 :

Inscription simple

Création de profil

Ajout de services personnalisés

Agenda, réservations, paiements Stripe

Avis et messagerie intégrée

Factures conformes, légalité (SIREN ou 3 réservations max)

Dashboard de base

💸 Take rate : 8 %
📍 Cible : Île-de-France

Phase 2 – V1 (4–6 mois) → Objectif : booster conversion & fidélité
🎯 Fonctionnalités :

US-016 à US-030 :

Galerie intelligente avec contrôle d’image

Comparateur de prix automatique

Système de likes, favoris, tags auto

Mur social (posts promo)

Prévisualisation publique du profil

Statistiques coiffeur (réservations, vues, retours clients)

💰 Take rate : 8 % standard, +5 % premium avec mise en avant
📍 Lancement grandes villes (Lyon, Marseille, Lille…)

Phase 3 – V2 (7–12 mois) → Objectif : internationalisation + monétisation avancée
🎯 Fonctionnalités :

US-031 à US-037 :

Back-office invisible (modération, suivi)

Offres sponsorisées (type Google Ads)

Marketplace produits pros (V3)

Traduction anglais, espagnol, portugais

API ouverte (partenariats, salons)
