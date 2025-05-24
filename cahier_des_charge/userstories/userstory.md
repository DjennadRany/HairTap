4. User Stories V1 - Détaillées pour gestion agile Kanban (complètes et multi-chemins)

Pour les utilisateurs (clients)

US001 - Inscription via Google Auth

En tant que client, je veux pouvoir créer un compte ou me connecter via Google Auth pour accéder à la plateforme.

Si l'utilisateur est nouveau, rediriger vers l'onboarding client (US001-A).

Si le compte existe, rediriger vers le dashboard client (US001-B).

US001-A - Onboarding nouveau client

En tant que client nouvellement inscrit, je veux compléter mon profil (nom, téléphone, ville, préférences capillaires) pour recevoir des recommandations adaptées.

US002 - Recherche géographique

En tant que client, je veux pouvoir rechercher des coiffeurs via ma position GPS (permission navigateur) ou en saisissant une adresse/code postal.

Si géolocalisation refusée → fallback manuel (champ de recherche).

Résultats affichés sous forme de cartes ou de liste selon device.

US003 - Filtrage avancé

En tant que client, je veux filtrer les coiffeurs par :

Types de services proposés

Lieux d'exercice (salon, domicile)

Disponibilité (date, heure)

Prix croissant/décroissant

Notes des clients

US004 - Profil d’un coiffeur

En tant que client, je veux pouvoir cliquer sur un coiffeur pour voir :

Son profil complet

Ses photos de réalisations

Son agenda dispo

Ses services et tarifs

Les notes/commentaires d'autres clients

US005 - Réservation d’un créneau

En tant que client, je veux réserver une prestation chez un coiffeur à la date et heure de mon choix, en choisissant le lieu (salon/domicile).

Affichage dynamique des créneaux en fonction du service choisi (durée, compatibilité horaire).

Confirmation par e-mail ou notification.

US006 - Paiement sécurisé

En tant que client, je veux payer en ligne via Stripe de façon sécurisée.

Possibilité d’enregistrer une carte bancaire.

Gestion des erreurs de paiement (échec, refus, double paiement).

US007 - Historique & suivi

En tant que client, je veux pouvoir voir mes :

Réservations à venir

Réservations passées

État des paiements

Possibilité d’annuler une réservation selon la politique d’annulation

Pour les professionnels (coiffeurs)

US101 - Inscription Google Auth

En tant que coiffeur, je veux pouvoir m’inscrire via Google Auth pour accéder à la plateforme pro.

Redirection vers onboarding pro si nouveau (US101-A).

US101-A - Onboarding professionnel

En tant que coiffeur nouvel inscrit, je veux compléter mon profil professionnel avec :

Nom commercial, numéro pro, téléphone, adresse

Type de prestations, durée, prix

Localisation et rayon d’action (si domicile)

Téléversement de photos

Choix du mode d’encaissement (Stripe)

US102 - Modification du profil

En tant que coiffeur, je veux modifier à tout moment mon profil, mes prestations, tarifs, photos ou ma disponibilité.

Mise à jour en temps réel ou différée avec feedback de confirmation.

US103 - Gestion du mode d’exercice

En tant que coiffeur, je veux choisir si je travaille :

uniquement en salon

uniquement à domicile (adresse du client)

ou les deux

US104 - Réservations et agenda

En tant que coiffeur, je veux pouvoir voir :

Mes rendez-vous à venir (avec tri par date)

Mes rendez-vous passés (avec historique client)

Statut des paiements

US105 - Encaissement

En tant que coiffeur, je veux recevoir mes paiements via Stripe, voir mes gains et gérer mes préférences de versement.

Possibilité de connexion à un compte Stripe existant

Visualisation du solde et historique des transactions