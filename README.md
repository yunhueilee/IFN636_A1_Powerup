# PowerUp

A fitness‑class booking application built for IFN636. Members browse and book fitness
classes; instructors create, update, cancel and view the roster for their own classes.

- **Backend** – Node.js + Express + TypeScript REST API, MongoDB (Atlas) via Mongoose.
- **Frontend** – Expo / React Native (iOS, Android, web) written in TypeScript.
- **Auth** – phone‑number + password login, bcrypt hashing, JWT bearer tokens.

---

## Table of contents

- [Architecture summary](#architecture-summary)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Seeding the database](#seeding-the-database)
- [Running locally](#running-locally)
- [Testing](#testing)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## Architecture summary

```
┌─────────────────────────────┐         HTTPS/HTTP + JWT          ┌──────────────────────────────┐
│  Expo / React Native app    │  ─────────────────────────────▶  │  Express REST API (Node/TS)  │
│  (frontend/)                │        JSON over /api/*          │  (backend/)                  │
│                             │  ◀─────────────────────────────  │                              │
│  • React Navigation         │                                  │  routes → controllers →      │
│    - AuthNavigator (login)  │                                  │  services → Mongoose models  │
│    - AppNavigator (tabs)    │                                  │                              │
│  • Auth context + Async*    │                                  │  protect middleware verifies │
│    storage (token persist)  │                                  │  the JWT on every /api route │
│  • services/api/* (fetch)   │                                  │  except POST /api/auth/login │
└─────────────────────────────┘                                  └───────────────┬──────────────┘
                                                                                 │ Mongoose
                                                                                 ▼
                                                                   ┌──────────────────────────┐
                                                                   │   MongoDB Atlas          │
                                                                   │   collections:           │
                                                                   │   users, fitnessclasses, │
                                                                   │   bookings               │
                                                                   └──────────────────────────┘
```

### Backend layers (`backend/src/`)

| Layer | Responsibility | Files |
| --- | --- | --- |
| `server.ts` | Connects to MongoDB, then starts the HTTP listener | `server.ts`, `app.ts` |
| `routes/` | URL → handler wiring, applies the `protect` middleware | `routes/index.ts`, `authRoutes.ts`, `classRoutes.ts`, `bookingRoutes.ts` |
| `controllers/` | Parse the request, map service results/errors to HTTP status codes, enforce role checks | `authController.ts`, `classController.ts`, `bookingController.ts` |
| `services/` | Business logic – login, class CRUD, booking with capacity checks | `authService.ts`, `classService.ts`, `bookingService.ts` |
| `models/` | Mongoose schemas + hooks (password hashing, phone validation, unique booking index) | `User.ts`, `FitnessClass.ts`, `Booking.ts` |
| `middleware/` | `protect` – verifies the `Authorization: Bearer <token>` header | `authMiddleware.ts` |
| `config/` | Loads `.env` (from the **repo root**) and opens the DB connection | `config/env.ts`, `config/db.ts` |
| `database/` | One‑off seeders and migrations | `database/seeders/*`, `database/migrations/*` |

### Data model

- **User** – `name`, `phone` (unique login handle, must match `^04[0-9]{8}$`), `email` (unique),
  `dob`, `password` (bcrypt), `role` = `member` \| `instructor`. Password is hashed in a
  `pre('save')` hook; `comparePassword()` is used at login.
- **FitnessClass** – `title`, `description`, `instructor` (ref User), `scheduledAt`,
  `durationMinutes`, `location`, `capacity`, `intensity` (1–5),
  `visibility` = `public` \| `private` (private classes are only visible to the owning
  instructor), `status` = `active` \| `cancelled`, `cancellationReason`.
- **Booking** – `user` (ref User), `fitnessClass` (ref FitnessClass),
  `status` = `booked` \| `cancelled`, `bookedAt`. A **unique compound index on
  `{ user, fitnessClass }`** means there is one booking document per user/class pair whose
  `status` is toggled between `booked` and `cancelled`.

### Request flow highlights

- **Login** (`POST /api/auth/login`) is the only unauthenticated route. It looks the user up
  by phone, verifies the password with bcrypt, and returns the user profile plus a signed JWT
  (`{ id, role }`, 7‑day expiry by default).
- **Listing classes** (`GET /api/classes`) is role‑aware: members get `public` + `active`
  classes with `bookedCount` / `isBooked` attached; instructors get only their own classes.
- **Booking** (`POST /api/bookings`) runs inside a MongoDB transaction to re‑check capacity
  and prevent double‑booking. On a standalone (non‑replica‑set) MongoDB the code detects the
  "transactions unsupported" error and falls back to a best‑effort non‑transactional path.

### Frontend structure (`frontend/src/`)

- `App.tsx` → `store/` provides an `AuthProvider` context; the token is persisted to
  `AsyncStorage` under `powerup.auth` and restored on launch.
- `navigation/AuthNavigator` shows `LoginScreen` when signed out.
- `navigation/AppNavigator` shows a bottom‑tab navigator when signed in:
  - **member** → Available Items (`HomeScreen`), Booked Items (`BookingsScreen`), Profile
  - **instructor** → Class Management (`InstructorClassManagementScreen`), Profile
- `services/api/*` are thin `fetch` wrappers; `client.ts` adds the bearer token and a 10s
  timeout. The API base URL comes from `EXPO_PUBLIC_API_URL` (see below).

---

## Repository layout

```
PowerUp/
├── .env.example            # backend config template (backend loads .env from the repo ROOT)
├── backend/
│   ├── src/
│   │   ├── server.ts app.ts
│   │   ├── config/ controllers/ middleware/ models/ routes/ services/
│   │   └── database/seeders/  database/migrations/
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── App.tsx  app.json
    ├── .env.example        # EXPO_PUBLIC_API_URL template
    ├── src/
    │   ├── navigation/ screens/ components/ services/api/ store/ config/ types/
    └── package.json
```

---

## Prerequisites

- **Node.js 20 LTS** and npm.
- A **MongoDB** database – a free MongoDB Atlas cluster is what this project is configured for.
  A local `mongod` also works, but booking transactions require a replica set (see
  [Known limitations](#known-limitations)).
- **Expo** – no global install needed; `npx expo` is invoked via the npm scripts. Use the
  Expo Go app on a phone, an iOS Simulator / Android Emulator, or a browser for Expo web.

---

## Setup

```bash
# 1. Backend
cd backend
npm install
cp ../.env.example ../.env        # NB: the backend reads .env from the REPO ROOT, not backend/
#   then edit ../.env and set MONGODB_URI + JWT_SECRET

# 2. Frontend
cd ../frontend
npm install
cp .env.example .env
#   then edit .env and set EXPO_PUBLIC_API_URL to point at your running backend
```

---

## Environment variables

### Backend – `./.env` (repo root)

`backend/src/config/env.ts` resolves the env file as `../../../.env` relative to the compiled
file, i.e. the **repository root**. Running the backend from a different working directory will
prevent the file from loading.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | – | MongoDB / Atlas connection string. The server exits if this is unset. |
| `PORT` | no | `5001` | API listen port. Must be open as an inbound rule on the EC2 security group. |
| `JWT_SECRET` | recommended | `dev-secret-change-me` | Secret used to sign JWTs. Generate a long random value: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime. |

### Frontend – `frontend/.env`

Only `EXPO_PUBLIC_*` variables are exposed to the client bundle.

| Variable | Example | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:5001/api` | Base URL including the `/api` prefix. Falls back to `http://localhost:5001/api` if unset. |

Choose the value that matches how you run the app:

| Scenario | Value |
| --- | --- |
| Web / iOS simulator / Android emulator on the same machine | `http://localhost:5001/api` |
| Physical device on the same Wi‑Fi | `http://<your‑computer‑LAN‑IP>:5001/api` |
| Deployed backend | `http://<EC2_PUBLIC_IP>:5001/api` |

---

## Seeding the database

From `backend/` (run the users seeder first – the class seeder needs instructors to exist):

```bash
npm run seed:users     # inserts the 10 users in src/database/seeders/users.seed.json
npm run seed:classes   # replaces all classes with 5 sample classes owned by seeded instructors
npm run migrate:phones # one-off: normalises existing user phone numbers to 04xxxxxxxx
```

Sample credentials (login is by **phone number**):

| Name | Phone | Password | Role |
| --- | --- | --- | --- |
| Alice Johnson | `0412345678` | `password123` | member |
| Bob Smith | `0412345679` | `securePass456` | instructor |
| Carol Davis | `0412345680` | `myPass789` | member |
| David Lee | `0412345681` | `david1234` | instructor |

(See `users.seed.json` for the full list.)

---

## Running locally

**Backend** (`backend/`):

```bash
npm run dev      # ts-node src/server.ts  →  "Server running on port 5001"
npm run build    # tsc  →  dist/
```

> There is currently no `start` script for the compiled build. After `npm run build` run it
> with `node dist/server.js` (with the repo‑root `.env` in place).

**Frontend** (`frontend/`):

```bash
npm start          # expo start – then press i / a / w, or scan the QR with Expo Go
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

The suite (`authService.test.ts`) uses Node's built‑in `assert` and covers:

- successful login returns the user + a token,
- wrong password and missing fields are rejected,
- the `User` schema accepts a valid `04xxxxxxxx` phone and rejects malformed numbers.

It injects a fake user‑lookup, so **no database connection is required** to run it.

---

## API reference

Base path: `/api`. All routes except `POST /api/auth/login` require
`Authorization: Bearer <token>`.

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | public | Body `{ phone, password }` → `{ user, token }`. |
| `GET` | `/classes` | any | Members: public active classes with availability. Instructors: their own classes. |
| `POST` | `/classes` | instructor | Create a class. |
| `PATCH` | `/classes/:classId` | instructor | Update one of the caller's classes (capacity cannot drop below current bookings). |
| `POST` | `/classes/:classId/cancel` | instructor | Body `{ reason }` → marks the class `cancelled`. |
| `GET` | `/classes/:classId/members` | instructor | Roster (name / phone / email) of members booked into the class. |
| `GET` | `/bookings/me` | any | The caller's active bookings, each with the populated class. |
| `POST` | `/bookings` | member | Body `{ classId }` → books the class (capacity + duplicate checks). |
| `DELETE` | `/bookings/:classId` | any | Cancels the caller's booking for that class. |

---

## Deployment

The project is intended to run the API on an **AWS EC2** instance and the client via Expo.

> **Deployment URL:** `http://<EC2_PUBLIC_IP>:5001/api`
> _Replace `<EC2_PUBLIC_IP>` with the running instance's public IPv4 address (or public DNS)
> before submission, and set the same value as `EXPO_PUBLIC_API_URL` in `frontend/.env`._

Outline of the EC2 setup:

1. Launch an EC2 instance (Ubuntu), install Node.js 20.
2. Add an inbound rule for TCP **5001** (the `PORT` value) to the security group.
3. Clone the repo, `cd backend && npm install && npm run build`.
4. Create `.env` in the repo root with the production `MONGODB_URI` and a strong `JWT_SECRET`.
5. Whitelist the instance's IP in MongoDB Atlas → Network Access.
6. Run `node dist/server.js` under a process manager (e.g. `pm2`) so it restarts on reboot.
7. Seed the database once: `npm run seed:users && npm run seed:classes`.
8. Build/publish the Expo client with `EXPO_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>:5001/api`.

---

## Known limitations

**Auth & accounts**

- **No registration or password‑reset flow.** Users only exist via the seeder. The
  "Forgot Password?" link on the login screen is decorative.
- Login is by **phone number**, not email – emails are stored but not used as a credential.
- JWTs cannot be revoked server‑side; logout just deletes the token on the device. There is
  no refresh‑token mechanism, so sessions simply expire after `JWT_EXPIRES_IN` (7 days).

**Security**

- The documented EC2 setup serves plain **HTTP on port 5001** – credentials and tokens are
  sent unencrypted. Put it behind HTTPS (reverse proxy / load balancer) for anything real.
- **CORS is not configured** on the API. Native Expo builds work; **Expo web** served from a
  different origin will be blocked by the browser.
- A local `.env` in this repo may contain a live MongoDB Atlas connection string. It is
  git‑ignored, but rotate those credentials if they have ever been shared.

**Booking correctness**

- Atomic booking needs a MongoDB **replica set**. On a standalone `mongod` the code falls
  back to a non‑transactional path, where a capacity race is possible under heavy concurrency.
- Class and booking lists are **not paginated**.

**Backend completeness**

- Several files are empty placeholders: `middleware/validateMiddleware.ts`,
  `middleware/errorMiddleware.ts`, `controllers/userController.ts`, `routes/userRoutes.ts`,
  `database/connection.ts`. There is no shared request‑validation or error‑handling
  middleware; validation lives ad hoc in the services.
- `updateClass` uses `Object.assign(fitnessClass, input)`, so unexpected fields in the body
  are copied onto the document before save.
- The backend loads `.env` from the **repo root only**; running it from another working
  directory silently gives no configuration.
- No production `start` script (`package.json` `main` points at `dist/server.js` but nothing
  runs it).

**Frontend**

- UI copy is mid‑refactor from "classes" to generic "items" – tab labels read
  "Class Management" / "Available Items" / "Booked Items" inconsistently.
- Members filter out already‑booked classes on the client; the API still returns them.
- Instructor UX is limited to a single `InstructorClassManagementScreen`; there is no
  separate create/edit screen or member‑roster screen wired into navigation.

**Testing**

- Only one unit test file (auth service). No integration or end‑to‑end tests, and no CI
  workflow in the repo.
