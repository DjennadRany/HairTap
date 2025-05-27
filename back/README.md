# TapHair Back-end (Node.js/Express/MongoDB)

## Installation

```bash
cd back
npm install
```

## Seed la base de test

```bash
npm run seed
```

## Lancer le serveur

```bash
npm start
```

## Endpoints principaux

- `POST /auth/login` (email, password)
- `GET /users` (tous les users)
- `GET /users/clients` (clients)
- `GET /coiffeurs` (coiffeurs)
- `GET /coiffeurs/:id` (profil public coiffeur)

## Config

- MongoDB local par défaut : `mongodb://localhost:27017/taphair`
- Modifiable dans `.env` 