# 🔍 AUDIT ET PLAN D'ACTION - PARCOURS RÉSERVATION

**Date:** 2025-01-XX  
**Objectif:** Restaurer toutes les fonctionnalités v0.7.17 avec l'architecture v0.7.18

---

## 🔴 **PROBLÈMES IDENTIFIÉS**

### **1. Agenda mode domicile - Logique incorrecte ❌**

**Problème actuel :**
- Mode domicile : 9h-00h (minuit) ❌
- Devrait être : 00h-00h (24h/24h) ✅

**Fichiers concernés :**
- `front/src/utils/dateUtils.ts` - `generateTimeSlots()`
- `front/src/components/shared/booking/BookingForm.tsx` - `generateTimeSlotsForDay()`
- `front/src/components/calendar/IntelligentCalendar.tsx` - `generateTimeSlotsForDay()`

---

### **2. Boutons non fonctionnels ❌**

#### **Côté Client (`ClientBookings.tsx`) :**
- ✅ "Laisser un avis" - Fonctionnel
- ✅ "Confirmer le début" - Fonctionnel
- ✅ "Confirmer la fin" - Fonctionnel
- ✅ "Signaler un incident" - Fonctionnel
- ✅ "Régulariser" - Fonctionnel
- ⚠️ **À vérifier :** Boutons de tri/filtres

#### **Côté Coiffeur (`CoiffeurBookings.tsx`) :**
- ✅ "Confirmer" - Fonctionnel
- ✅ "Refuser" - Fonctionnel
- ✅ "Terminer" - Fonctionnel
- ❌ **MANQUANT :** Boutons de confirmation début/fin
- ❌ **MANQUANT :** Modal de signalement d'incident
- ❌ **MANQUANT :** Modal de pénalité retard
- ❌ **MANQUANT :** Toggle mode salon/domicile dans l'agenda

---

### **3. Fonctionnalités v0.7.17 manquantes ❌**

#### **Côté Client :**
- ✅ Tri des réservations - Restauré
- ✅ Modals avancés - Restaurés
- ✅ Système d'alertes - Restauré
- ⚠️ **À vérifier :** Géolocalisation pour domicile

#### **Côté Coiffeur :**
- ✅ Agenda IntelligentCalendar - Restauré
- ✅ Vue liste/calendrier - Restauré
- ❌ **MANQUANT :** Toggle mode salon/domicile
- ❌ **MANQUANT :** Boutons de confirmation début/fin
- ❌ **MANQUANT :** Modals incidents/pénalités

---

## ✅ **PLAN D'ACTION**

### **PHASE 1 : Correction logique agenda domicile (00h-00h)**

1. **Modifier `generateTimeSlots()` dans `dateUtils.ts`**
   - Ajouter support pour `startHour = 0` (00h)
   - Gérer correctement `endHour = 24` (00h du lendemain)
   - Générer créneaux de 00h00 à 23h59

2. **Mettre à jour `BookingForm.tsx`**
   - Mode domicile : `generateTimeSlots(0, 24, 60)` au lieu de `(9, 24, 60)`

3. **Mettre à jour `IntelligentCalendar.tsx`**
   - Mode domicile : `generateTimeSlots(0, 24, 60)` au lieu de `(9, 24, 60)`

---

### **PHASE 2 : Restaurer fonctionnalités coiffeur**

1. **Ajouter toggle mode salon/domicile dans `CoiffeurBookings.tsx`**
   - Bouton pour basculer entre salon et domicile
   - Passer le mode à `IntelligentCalendar`

2. **Ajouter boutons de confirmation début/fin**
   - Utiliser `canConfirmServiceStart()` et `canConfirmServiceEnd()`
   - Afficher uniquement le jour du RDV

3. **Ajouter modals manquants**
   - `IncidentReportForm` pour coiffeur
   - `RetardPenaltyModal` pour coiffeur
   - `ConfirmationModal` pour coiffeur

---

### **PHASE 3 : Vérifier et tester**

1. **Tester parcours client complet**
   - Créer réservation
   - Confirmer début/fin
   - Laisser avis
   - Signaler incident

2. **Tester parcours coiffeur complet**
   - Voir réservations (liste/calendrier)
   - Toggle mode salon/domicile
   - Confirmer/refuser réservation
   - Confirmer début/fin
   - Signaler incident

3. **Tester logique agenda**
   - Mode salon : 9h-19h
   - Mode domicile : 00h-00h (24h/24h)

---

## 📋 **CHECKLIST**

### **Corrections agenda domicile**
- [ ] Modifier `generateTimeSlots()` pour supporter 00h-00h
- [ ] Mettre à jour `BookingForm.tsx` (mode domicile)
- [ ] Mettre à jour `IntelligentCalendar.tsx` (mode domicile)
- [ ] Tester génération créneaux 00h-23h59

### **Fonctionnalités coiffeur**
- [ ] Ajouter toggle mode salon/domicile
- [ ] Ajouter boutons confirmation début/fin
- [ ] Ajouter modal incident coiffeur
- [ ] Ajouter modal pénalité retard coiffeur
- [ ] Ajouter modal confirmation coiffeur

### **Tests**
- [ ] Tester parcours client
- [ ] Tester parcours coiffeur
- [ ] Tester agenda mode salon
- [ ] Tester agenda mode domicile (00h-00h)

---

**Prochaine étape :** Commencer par la correction de la logique agenda domicile.


