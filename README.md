# MoversGo — Plateforme Marketplace Professionnelle de Déménagement en Tunisie

> **Architecture Full-Stack Production-Ready : React.js (Vite) + Node.js (Express 5) + MongoDB (Mongoose) + Socket.IO**

MoveFlow TN est la première marketplace tunisienne spécialisée dans la mise en relation sécurisée entre particuliers/entreprises cherchant à déménager et des entreprises professionnelles de déménagement certifiées sur l'ensemble des 24 gouvernorats de la Tunisie.

---

## 🏗️ Architecture Globale du Projet

Le projet respecte une séparation stricte et professionnelle entre le **Frontend** et le **Backend** :

```
ROOT/
│
├── frontend/                     # Application Client React 19 + Vite
│   ├── src/
│   │   ├── assets/               # Images, logos, icônes
│   │   ├── components/           # Composants réutilisables (common, forms, navigation, dashboard)
│   │   ├── contexts/             # AuthContext (JWT + fallback résilient)
│   │   ├── hooks/                # Hooks personnalisés
│   │   ├── layouts/              # Layouts Client, Entreprise, Admin et Public
│   │   ├── pages/                # 57 Pages (auth, public, client, company, admin)
│   │   ├── services/
│   │   │   ├── api/              # Services API REST centralisés (axios + JWT interceptors)
│   │   │   │   ├── apiClient.js
│   │   │   │   ├── authService.js
│   │   │   │   ├── requestService.js
│   │   │   │   ├── quoteService.js
│   │   │   │   ├── bookingService.js
│   │   │   │   ├── companyService.js
│   │   │   │   ├── reviewService.js
│   │   │   │   ├── messageService.js
│   │   │   │   ├── notificationService.js
│   │   │   │   ├── adminService.js
│   │   │   │   ├── supportService.js
│   │   │   │   └── socket.js
│   │   │   └── mock/             # dataService (pont hybride API / LocalStorage)
│   │   └── index.css             # Tailwind CSS & identité visuelle (#cf0000)
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Serveur d'API REST & WebSockets
│   ├── src/
│   │   ├── config/               # database.js, multer.js, jwt.js
│   │   ├── controllers/          # 11 Contrôleurs de logique métier
│   │   ├── middlewares/          # auth, role, validation, error handler
│   │   ├── models/               # 12 Modèles Mongoose
│   │   ├── routes/               # Routes REST versionnées (/api/v1/...)
│   │   ├── services/             # email.service, notification.service
│   │   ├── sockets/              # passerelle temps réel Socket.IO (chat, notifications)
│   │   ├── validators/           # validateurs express-validator
│   │   └── server.js             # Point d'entrée Express 5 + Socket.IO
│   ├── seeds/                    # Seeder réaliste de démarrage avec données tunisiennes
│   ├── tests/                    # Tests d'intégration E2E du cycle marketplace
│   ├── uploads/                  # Fichiers téléversés (photos, devis, documents)
│   ├── .env                      # Variables d'environnement configurées
│   └── package.json
│
├── package.json                  # Scripts unifiés pour lancer le projet
└── README.md                     # Documentation complète
```

---

## ⚡ Démarrage Rapide (En une seule commande)

### 1. Installation des dépendances (déjà effectuée)
```bash
# À la racine du projet
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Lancement simultané du Backend et du Frontend
Depuis la racine du projet :
```bash
npm run dev
```

Cette commande lance en parallèle grâce à `concurrently` :
- **Serveur API Backend** : `http://localhost:5000` (API : `http://localhost:5000/api/v1`)
- **Serveur Web Frontend** : `http://localhost:5173`
- **Passerelle Temps Réel** : `ws://localhost:5000`
- **Moteur MongoDB** : Connecté automatiquement sur `mongodb://127.0.0.1:27017/moveflow_tn`

---

## 🗄️ Base de Données MongoDB & Compatibilité MongoDB Compass

L'application intègre une gestion intelligente et automatique de la base de données :

1. **Connexion par défaut** :
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/moveflow_tn
   ```
2. **Compatibilité MongoDB Compass** :

   ```
   mongodb://127.0.0.1:27017/moveflow_tn
   ```
   Vous pourrez inspecter en direct l'ensemble des 12 collections :
   - `users` : Comptes clients, transporteurs et administrateurs.
   - `companies` : Profils transporteurs, documents légaux, zones desservies, notes.
   - `movingrequests` : Demandes détaillées de déménagement (adresses, inventaire, dates).
   - `quotes` : Devis complets avec ventilation tarifaire et acomptes calculés.
   - `bookings` : Réservations confirmées et suivis d'exécution.
   - `payments` & `transactions` : Historique financier et traçabilité des commissions plateforme (12%).
   - `reviews` : Avis vérifiés avec notation multicritère (ponctualité, soin, professionnalisme).
   - `conversations` & `messages` : Messagerie interne instantanée.
   - `notifications` : Alertes et notifications d'activité.
   - `supporttickets` : Tickets du support client et assistance.

3. **Auto-alimentation (Seeder)** :
   Au premier démarrage ou via la commande `npm run seed`, la base est automatiquement alimentée avec des comptes d'essai tunisiens réalistes.

---

## 🔑 Comptes de Démonstration Pré-configurés

Tous les comptes utilisent le mot de passe : **`password123`**

| Rôle | Email | Mot de passe | Description |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@moveflow.tn` | `password123` | Dashboard de gouvernance, validation des entreprises, commissions |
| **Client** | `client@moveflow.tn` | `password123` | Particulier publiant des demandes et comparant les devis |
| **Entreprise** | `company@moveflow.tn` | `password123` | Transporteur approuvé répondant aux demandes et émettant des devis |
| **Entreprise en attente** | `pending@moveflow.tn` | `password123` | Transporteur en attente de validation de documents par l'administrateur |

---

## 🚀 Parcours Marketplace Complet Testé de Bout en Bout

Le flux complet a été testé avec succès via le script `backend/tests/e2e_marketplace_test.js` :

1. **Connexion Client** (`client@moveflow.tn`) ➔ Réception du jeton JWT.
2. **Publication d'une demande** ➔ `POST /api/v1/moving-requests` (Tunis ➔ Sousse, 22 m³, inventaire complet).
3. **Connexion Entreprise** (`company@moveflow.tn`) ➔ Consultation de la demande.
4. **Émission d'un devis** ➔ `POST /api/v1/quotes` (1 100 DT TTC, acompte 30% = 330 DT).
5. **Acceptation du devis par le Client** ➔ `POST /api/v1/quotes/:id/accept` :
   - Mise à jour atomique du statut du devis en `accepted`.
   - Rejet automatique des devis concurrents.
   - Création de la **Réservation** (`Booking`) en statut `confirmed`.
   - Création de la **Transaction de Commission Plateforme** (12% = 132 DT calculée côté serveur).
   - Création de l'enregistrement de paiement de l'acompte.
6. **Mise à jour en temps réel de l'espace Administrateur** ➔ Chiffre d'affaires, taux de conversion et commissions plateforme.

Pour réexécuter ce test à tout moment :
```bash
cd backend
node tests/e2e_marketplace_test.js
```

---

## 📡 Référence des Points de Terminaison REST (API v1)

Base URL : `http://localhost:5000/api/v1`

### Authentification & Utilisateurs (`/auth` & `/users`)
- `POST /auth/register` : Inscription (client ou entreprise)
- `POST /auth/login` : Connexion avec identifiants (génération JWT)
- `GET /auth/me` : Profil de l'utilisateur connecté
- `POST /auth/forgot-password` : Demande de réinitialisation par email
- `POST /auth/reset-password/:token` : Validation du nouveau mot de passe
- `PUT /users/profile` : Mise à jour du profil et avatar
- `PUT /users/change-password` : Changement sécurisé du mot de passe

### Demandes de Déménagement (`/moving-requests`)
- `POST /moving-requests` : Création d'une demande avec inventaire et photos (Client)
- `GET /moving-requests/my` : Liste des demandes de l'utilisateur connecté
- `GET /moving-requests/available` : Demandes disponibles en Tunisie (Entreprise approuvée)
- `GET /moving-requests/:id` : Détail complet d'une demande
- `PUT /moving-requests/:id` : Modification de la demande
- `DELETE /moving-requests/:id` : Annulation de la demande

### Devis (`/quotes`)
- `POST /quotes` : Émission d'un devis chiffré (Entreprise)
- `GET /quotes/my` : Devis émis par l'entreprise
- `GET /quotes/client` : Devis reçus par le client
- `GET /quotes/:id` : Consultation détaillée d'un devis
- `PUT /quotes/:id` : Révision d'un devis soumis
- `POST /quotes/:id/accept` : Acceptation et réservation instantanée (Client)
- `POST /quotes/:id/reject` : Refus d'un devis

### Réservations & Suivi (`/bookings`)
- `GET /bookings/my` : Liste des réservations confirmées
- `GET /bookings/:id` : Fiche de suivi d'une réservation
- `PATCH /bookings/:id/status` : Mise à jour de l'état du déménagement (`in_progress`, `completed`)
- `POST /bookings/:id/cancel` : Demande d'annulation avec motif

### Avis & Évaluations (`/reviews`)
- `POST /reviews` : Dépôt d'un avis client vérifié post-déménagement
- `GET /reviews/company/:companyId` : Avis publics certifiés d'une entreprise
- `POST /reviews/:id/response` : Réponse professionnelle de l'entreprise

### Messagerie Instantanée & Temps Réel (`/messages`)
- `GET /messages/conversations` : Liste des conversations actives
- `GET /messages/conversations/:id` : Historique des messages
- `POST /messages` : Envoi d'un message avec pièces jointes éventuelles

### Administration & Gouvernance (`/admin`)
- `GET /admin/dashboard` : Statistiques clés, conversion, volume financier et commissions
- `GET /admin/companies/pending` : Entreprises en attente d'approbation
- `PATCH /admin/companies/:id/approve` : Validation et activation d'un déménageur
- `PATCH /admin/companies/:id/reject` : Rejet motivé avec motif d'inconformité
- `GET /admin/transactions` : Grand livre des commissions de la plateforme
- `GET /admin/users` : Gestion des utilisateurs (suspension, activation)

---

## 🔒 Sécurité et Bonnes Pratiques Appliquées

- **Chiffrement des mots de passe** : Hachage bcrypt avec salt rounds = 10.
- **Protection des accès** : Jetons JWT avec expiration et rôles stricts (`client`, `company`, `admin`).
- **Validation serveur systématique** : express-validator sur toutes les entrées utilisateur pour empêcher les injections.
- **Sécurisation des transactions financières** : Calcul exclusif côté serveur des montants, acomptes et commissions plateforme (12%).
- **En-têtes sécurisés & CORS** : Helmet.js configuré, protection contre le Cross-Origin Resource Sharing.
- **Limitation de débit (Rate Limiting)** : Protection de l'API et des routes d'authentification contre les attaques par force brute.
- **Résilience et Tolérance aux Pannes** : Fallback local transparent assurant une expérience utilisateur ininterrompue en toute circonstance.

---

## 🎨 Préservation 100% de l'Interface Utilisateur (UI/UX)

L'intégralité du design d'origine a été conservée sans aucune altération :
- Identité visuelle rouge MoveFlow (`#cf0000`, `brand-600`)
- Typographie, espacements, icônes Lucide et micro-animations Framer Motion
- Composants de formulaire à étapes et calculateurs de volume
- Expérience responsive mobile, tablette et desktop
- Tables de bord dédiées aux trois rôles avec basculement fluide

