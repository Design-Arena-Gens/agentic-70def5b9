# WorkFlicks.in CMS

Modern operations console for WorkFlicks.in built with Next.js, Firebase, and Google Cloud. The CMS centralises job publishing, employer management, RBAC administration, and editorial workflows with end-to-end security enforcement.

## Architecture

- **Frontend:** Next.js App Router (React, TypeScript, TailwindCSS) deployable to Vercel.
- **Authentication:** Firebase Auth (email/password & Google SSO) with Custom Claims for RBAC.
- **Database:** Cloud Firestore (jobs, companies, users, CMS content, audit logs).
- **Storage:** Firebase Cloud Storage (logos, resumes).
- **Serverless logic:** Firebase Cloud Functions (sanitisation, notifications, webhooks).
- **Security:** Firestore & Storage rules generated under least-privilege policies.

## Prerequisites

1. Firebase project with:
   - Firestore & Storage enabled.
   - Authentication providers (Email/Password, Google) configured.
2. Service account with `Firebase Admin` & `Cloud Functions Admin` roles.
3. Vercel account (or another Next.js-compatible host).

## Environment variables

Create `.env.local` for local development and configure the same keys in your hosting provider:

```ini
# Firebase client (NEXT_PUBLIC_* must be exposed to the browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase admin (service account)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=...
```

> Tip: Base64-encode the private key for CI/CD and decode at runtime to avoid multiline export issues.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use the built-in login form to authenticate against Firebase. Seed data with the Firebase Console or via the API endpoints.

## Production build

```bash
npm run build
npm run start
```

The build step runs ESLint + TypeScript checks and produces an optimised production bundle.

## Firebase setup

1. **Deploy security rules**

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage:rules
   ```

2. **Cloud Functions**

   - Functions source lives in `functions/` (TypeScript). Adjust notification transports (e.g. SendGrid/Nodemailer).
   - Build & deploy:

     ```bash
     cd functions
     npm install
     npm run build
     firebase deploy --only functions
     ```

3. **RBAC bootstrap**

   - Assign custom claims via the `/api/users` endpoint or Admin SDK:

     ```ts
     await admin.auth().setCustomUserClaims(uid, {
       role: "superAdmin",
       permissions: ["manageAdmins", "manageJobs", ...],
     });
     ```

   - Firestore `config/rbac` document is auto-created when updating permissions through the UI.

## Deployment (Vercel)

1. Ensure all environment variables are configured in the Vercel dashboard.
2. Build locally first (`npm run build`), then deploy:

   ```bash
   vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-70def5b9
   ```

3. After deployment, verify the live site:

   ```bash
   curl https://agentic-70def5b9.vercel.app
   ```

## Project structure

```
src/
  app/                  # App Router routes (auth + dashboard modules + API handlers)
  components/           # Reusable UI + layout components
  lib/                  # Firebase clients, validators, auth helpers
  providers/            # React context providers (Auth)
  types/                # Shared TypeScript contracts
functions/              # Firebase Cloud Functions (TypeScript)
firebase.json           # Firebase project configuration
firestore.rules         # Firestore security rules
storage.rules           # Storage security rules
firestore.indexes.json  # Firestore composite indexes
```

## Testing & quality

- `npm run lint` – ESLint (Next.js + TypeScript rules).
- `npm run build` – type-checks & builds the production bundle.

Integrate automated tests (Playwright, Vitest) as the data model and workflows expand.
