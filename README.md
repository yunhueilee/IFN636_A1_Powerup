# Community Source Sharing

A community item‑sharing application built for IFN636.

People in the community may have useful items that they no longer need, while others may have
difficulty affording the items they need for everyday life. Without a centralised community
sharing system, information about available items can be difficult to discover and manage.
This can result in useful items being wasted, people spending unnecessary money to purchase
items, and individuals experiencing greater difficulty meeting their everyday needs.

This app gives the community one place to do that. **Sharers** list items they no longer need;
**recipients** browse available items and claim the ones they need; each sharer can see who has
claimed each of their items.

- **Backend** – Node.js + Express + TypeScript REST API, MongoDB (Atlas) via Mongoose.
- **Frontend** – Expo / React Native (iOS, Android, web) in TypeScript.
- **Auth** – phone‑number + password login, bcrypt hashing, JWT bearer tokens.

---

## Architecture summary

```
┌─────────────────────────────┐        JSON over HTTP + JWT       ┌──────────────────────────────┐
│  Expo / React Native app    │  ─────────────────────────────▶  │  Express REST API (Node/TS)  │
│  (frontend/)                │            /api/*                │  (backend/)                  │
│                             │  ◀─────────────────────────────  │  routes → controllers →      │
│  • React Navigation         │                                  │  services → Mongoose models  │
│    - AuthNavigator (login)  │                                  │                              │
│    - AppNavigator (tabs)    │                                  │  protect middleware verifies │
│  • Auth context + Async     │                                  │  the JWT on every /api route │
│    Storage (token persist)  │                                  │  except POST /api/auth/login │
│  • services/api/* (fetch)   │                                  └───────────────┬──────────────┘
└─────────────────────────────┘                                                  │ Mongoose
                                                                                 ▼
                                                                   ┌──────────────────────────┐
                                                                   │  MongoDB Atlas           │
                                                                   │  users, items, claims    │
                                                                   └──────────────────────────┘
```

**Backend layers (`backend/src/`)**

| Layer | Responsibility |
| --- | --- |
| `server.ts` / `app.ts` | Connect to MongoDB, then start the HTTP listener |
| `routes/` | URL → handler wiring; applies the `protect` (JWT) middleware |
| `controllers/` | Parse the request, enforce role checks, map results/errors to HTTP status codes |
| `services/` | Business logic – login, item CRUD, claiming with quantity checks |
| `models/` | Mongoose schemas + hooks (password hashing, phone validation, one‑claim‑per‑pair index) |
| `middleware/authMiddleware.ts` | Verifies the `Authorization: Bearer <token>` header |
| `config/` | Loads `.env` (from the repo **root**) and opens the DB connection |
| `database/` | One‑off seeders and migrations |

**Data model**

- **User** – `name`, `phone` (login handle, must match `^04[0-9]{8}$`), `email` (unique),
  `dob`, `password` (bcrypt), `role` = *recipient* or *sharer*.
- **Item** – `title`, `description`, owning `sharer`, `location` (pickup point),
  `capacity` (quantity available), `scheduledAt` (availability time),
  `visibility` = `public` \| `private` (private items are visible only to the owning sharer),
  `status` = `active` \| `cancelled`, `cancellationReason`.
- **Claim** – links a `recipient` to an `item`, `status` = `booked` (claimed) \| `cancelled`,
  `bookedAt`. A **unique index on `{ recipient, item }`** means one claim record per
  recipient/item pair; its status is toggled rather than duplicated.

> **Naming note:** the frontend UI uses the Community Source Sharing terms above. The backend
> code and database keep the original identifiers from the project template —
> `role: 'member'` = recipient, `role: 'instructor'` = sharer, and the item/claim collections
> are named `fitnessclasses` / `bookings`. Behaviour is unchanged; only the labels differ.

**Frontend structure (`frontend/src/`)**

- `App.tsx` → `store/` provides an `AuthProvider`; the token is persisted to `AsyncStorage`
  (`powerup.auth`) and restored on launch.
- Signed out → `AuthNavigator` shows the login screen.
- Signed in → `AppNavigator` bottom tabs:
  - **recipient** → Available Items, Claimed Items, Profile
  - **sharer** → Item Management, Profile
- `services/api/*` are `fetch` wrappers; `client.ts` attaches the bearer token and a 10 s timeout.

---

## Repository layout

```
PowerUp/
├── .env.example              # backend config template (backend loads .env from the repo ROOT)
├── backend/
│   └── src/
│       ├── server.ts app.ts
│       ├── config/ controllers/ middleware/ models/ routes/ services/
│       └── database/seeders/  database/migrations/
└── frontend/
    ├── App.tsx app.json .env.example
    └── src/  navigation/ screens/ components/ services/api/ store/ config/ types/
```

---

## Prerequisites

- **Node.js 20 LTS** and npm.
- A **MongoDB** database (configured for MongoDB Atlas). Claiming uses transactions, which
  require a replica set; a standalone `mongod` falls back to a non‑transactional path.
- **Expo** – no global install needed; `npx expo` runs via the npm scripts. Use Expo Go, an
  iOS Simulator / Android Emulator, or a browser for Expo web.

---

## Setup

```bash
# Backend
cd backend
npm install
cp ../.env.example ../.env        # NB: the backend reads .env from the REPO ROOT, not backend/
#   then edit ../.env: set MONGODB_URI and JWT_SECRET

# Frontend
cd ../frontend
npm install
cp .env.example .env
#   then edit .env: set EXPO_PUBLIC_API_URL to your running backend
```

### Environment variables

**Backend – `./.env` (repo root).** `backend/src/config/env.ts` resolves the file as the
repository root; running the backend from another directory prevents it loading.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | – | MongoDB / Atlas connection string. Server exits if unset. |
| `PORT` | no | `5001` | API listen port. Must be open in the EC2 security group. |
| `JWT_SECRET` | recommended | `dev-secret-change-me` | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime. |

**Frontend – `frontend/.env`.** Only `EXPO_PUBLIC_*` vars reach the client bundle.

| Variable | Example | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:5001/api` | Base URL including `/api`. Falls back to `http://localhost:5001/api`. |

| Scenario | Value |
| --- | --- |
| Web / simulator / emulator on the same machine | `http://localhost:5001/api` |
| Physical device on the same Wi‑Fi | `http://<computer-LAN-IP>:5001/api` |
| Deployed backend | `http://<EC2_PUBLIC_IP>:5001/api` |

---

## Seeding the database

From `backend/` (users first – the item seeder needs sharers to exist):

```bash
npm run seed:users     # inserts the users in src/database/seeders/users.seed.json
npm run seed:classes   # replaces all items with sample items owned by seeded sharers
npm run migrate:phones # one-off: normalises stored phone numbers to 04xxxxxxxx
```

Sample credentials (login is by **phone number**):

| Name | Phone | Password | Role |
| --- | --- | --- | --- |
| Alice Johnson | `0412345678` | `password123` | recipient |
| Bob Smith | `0412345679` | `securePass456` | sharer |
| Carol Davis | `0412345680` | `myPass789` | recipient |
| David Lee | `0412345681` | `david1234` | sharer |

(Full list in `users.seed.json`.)

---

## Running locally

**Backend** (`backend/`):

```bash
npm run dev      # ts-node src/server.ts  →  "Server running on port 5001"
npm run build    # tsc → dist/  (then: node dist/server.js — there is no start script)
```

**Frontend** (`frontend/`):

```bash
npm start          # expo start – press i / a / w, or scan the QR with Expo Go
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run typecheck  # tsc --noEmit
```

---

## Testing

```bash
cd backend
npm test           # ts-node src/services/authService.test.ts
```

Covers successful login returning a user + token, rejection of wrong password / missing
fields, and phone‑number validation on the `User` schema. A fake user‑lookup is injected, so
no database connection is needed.

---

## API reference

Base path `/api`. All routes except `POST /api/auth/login` require
`Authorization: Bearer <token>`.

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | public | Body `{ phone, password }` → `{ user, token }`. |
| `GET` | `/classes` | any | Recipients: public active items with availability. Sharers: their own items. |
| `POST` | `/classes` | sharer | Create an item. |
| `PATCH` | `/classes/:id` | sharer | Update one of the caller's items (quantity cannot drop below current claims). |
| `POST` | `/classes/:id/cancel` | sharer | Body `{ reason }` → marks the item `cancelled`. |
| `GET` | `/classes/:id/members` | sharer | Recipients (name / phone / email) who have claimed the item. |
| `GET` | `/bookings/me` | any | The caller's active claims, each with the populated item. |
| `POST` | `/bookings` | recipient | Body `{ classId }` → claims the item (quantity + duplicate checks). |
| `DELETE` | `/bookings/:id` | any | Cancels the caller's claim for that item. |

---

## Deployment

The API runs on an **AWS EC2** instance; the client runs via Expo.

> **Deployment URL:** `http://<EC2_PUBLIC_IP>:5001/api`
> _Replace `<EC2_PUBLIC_IP>` with the running instance's public IPv4 address before
> submission, and set the same value as `EXPO_PUBLIC_API_URL` in `frontend/.env`._

Outline:

1. Launch an EC2 instance (Ubuntu), install Node.js 20.
2. Open inbound TCP **5001** in the security group; restrict SSH (22) to your own IP.
3. `git clone` the repo, then `cd backend && npm install && npm run build`.
4. Create `.env` in the repo root with the production `MONGODB_URI` and a strong `JWT_SECRET`.
5. Whitelist the instance IP in MongoDB Atlas → Network Access.
6. Run `node dist/server.js` under a process manager (e.g. `pm2`) so it restarts on reboot.
7. Seed once: `npm run seed:users && npm run seed:classes`.
8. Build/publish the Expo client with `EXPO_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>:5001/api`.

---

## Known limitations

- **No registration or password reset.** Users exist only via the seeder; the "Forgot
  Password?" link is not wired. Login is by phone number, not email.
- **Legacy naming in code.** The backend/database still use `member` (recipient),
  `instructor` (sharer), and `fitnessclasses` / `bookings` collections. Only the UI uses the
  Community Source Sharing terms.
- **Plain HTTP** on port 5001 for the EC2 deployment – credentials and tokens are unencrypted.
- **CORS is not configured** – native Expo works; Expo **web** from another origin is blocked.
- **Claiming atomicity** needs a MongoDB replica set; on standalone MongoDB the fallback path
  is not transactional, so a quantity race is possible under heavy concurrency.
- **No pagination** on item or claim lists.
- Several backend files are empty placeholders (`middleware/validateMiddleware.ts`,
  `middleware/errorMiddleware.ts`, `controllers/userController.ts`, `routes/userRoutes.ts`,
  `database/connection.ts`); validation is ad hoc in the services.
- The backend loads `.env` from the **repo root only**, and there is no production `start`
  script (run `node dist/server.js` after `npm run build`).
- **One unit test file** (auth service); no integration/e2e tests and no CI workflow.
