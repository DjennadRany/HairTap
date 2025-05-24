 STRUCTURE COMPLÈTE – V1 FRONTEND
🧱 TEMPLATES / LAYOUTS (5 principaux)
Nom	Description
PublicLayout	Header + Footer pour pages publiques (home, 404…)
AuthLayout	Layout centré sans navigation pour login/signup
ClientDashboardLayout	Sidebar, header et routing spécifique client
CoiffeurDashboardLayout	Idem, version pro
ErrorBoundaryLayout	Gestion erreurs globales (fallback UI)

🧩 COMPOSANTS (modulaires et réutilisables – 35 estimés)
🔹 UI génériques (10)
Button, Input, Select, TextArea, Avatar, Badge, Card, Tabs, Loader, Toast

🔹 Auth & Profil (6)
GoogleLoginButton

UserAvatarDropdown

StepByStepOnboarding

ProfileForm

StripeConnectBanner

AccountDeletionModal

🔹 Recherche & réservation (9)
SearchBar

FilterPanel (services, localisation, prix…)

CoiffeurCard

ScheduleCalendar

DateTimePicker

BookingSummary

PriceBreakdown

ServiceSelector

RatingStars

🔹 Réservations & paiements (5)
ReservationCard

PaymentForm

PaymentStatusBadge

CancellationModal

StripeErrorHandler

🔹 Spécifiques pro (5)
CoiffeurAgenda

ReservationListPro

ServiceManager

PhotoUploader

RevenueTracker

📄 PAGES À DÉVELOPPER (15 pages totales)
🔐 Auth & Onboarding (4)
LoginPage – Connexion Google Auth

OnboardingClientPage – Formulaire profil client

OnboardingProPage – Formulaire complet pro

LogoutPage (optionnelle pour confirmation + redirect)

🏠 Pages publiques (2)
HomePage – Présentation app, choix du rôle

NotFoundPage (404)

👤 Espace client (5)
ClientDashboardPage

SearchPage (avec filtres avancés)

CoiffeurProfilePage – Détail, services, avis

BookingPage

ClientReservationsPage

💼 Espace pro (4)
CoiffeurDashboardPage

ProfileEditPage

CoiffeurReservationsPage

CoiffeurRevenuePage

🧠 KANBAN – SUGGESTION DE SPRINTS (PAR PRIORITÉ)
🔹 Sprint 1 – Structure & Auth (P1)
Mise en place architecture / routing

Layouts globaux

Auth Google (Firebase/Auth0)

Onboarding client & pro (step-by-step)

🔹 Sprint 2 – Dashboard client (P1)
Recherche, fiche coiffeur

Réservation + choix lieu/date/service

Page paiement (mock Stripe)

Réservation list client

🔹 Sprint 3 – Dashboard coiffeur (P1)
Formulaire profil complet

Agenda pro

Gestion des prestations

Affichage des réservations

🔹 Sprint 4 – Intégration Stripe (P2)
Connexion compte pro à Stripe

Paiement client réel

Statut paiement + historique revenus

🔹 Sprint 5 – Finitions & QA (P2)
Notifications toast + e-mail (mock)

Accessibilité + responsive

Test end-to-end + fallback UI

Mise en place README + déploiement

🎯 TOTAL À LIVRER (min V1 stable)
5 layouts

35+ composants

15 pages

5 sprints logiques

Mock APIs REST côté front (JSON ou MirageJS)

