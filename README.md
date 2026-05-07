# Foreign Worker Payment Tracker

Production-ready web + mobile PWA for managing salary, pension, signatures, and reports for a foreign worker.

This project is intentionally built on free services only:
- Firebase Spark (Auth, Firestore, Storage, Hosting)
- GitHub public repository
- No paid infrastructure

## Privacy and Demo Data Policy

This repository must never include real personal names or private identities.

Rules:
- Demo data uses fictional names only.
- Example identities are synthetic and generated for testing.
- Do not commit real worker names, employer names, phone numbers, or IDs.

## Fictional Full Demo Dataset (2026)

The app includes a complete fictional demo dataset:
- 1 fictional employer profile
- 1 fictional employee profile
- 12 monthly payment records (full year)
- 12 pension payment records (full year)
- year settings + seed audit log

Seed source files:
- src/data/seed2026.ts
- src/services/firebase/seed.service.ts

### Load Demo Dataset

Use the seed service in admin code:

```ts
import { seedInitial2026Data } from '@/services/firebase/seed.service'

await seedInitial2026Data({ userId: currentUser.uid })
```

Result:
- Creates/updates fictional employer and employee records
- Creates all months for salary and pension in year 2026
- Leaves no real names in the seeded data

## Local Development

### Requirements
- Node.js 18+
- npm
- Firebase project on Spark plan

### Setup

```bash
npm install
cp .env.example .env.local
```

Set Firebase values in `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Run app:

```bash
npm run dev
```

Build app:

```bash
npm run build
```

## Deployment (Free)

```bash
npx firebase-tools deploy --only hosting --project <your-project-id>
```

For rules/indexes:

```bash
npx firebase-tools deploy --only firestore --project <your-project-id>
npx firebase-tools deploy --only storage --project <your-project-id>
```

## Full QA Test Plan (All Pages, End-to-End)

This checklist is designed to prove all routes and critical flows are working.

### Preconditions
- Auth user exists in Firebase Auth
- Corresponding profile exists in `/users/{uid}`
- Firestore rules deployed
- Storage initialized in Firebase Console
- Demo seed loaded (recommended)

### Route Coverage

1. Login (`/login`)
- Enter valid credentials and confirm redirect to `/`
- Enter invalid credentials and confirm error message
- Switch language and confirm UI updates

2. Dashboard (`/`)
- Confirm KPI cards render
- Confirm yearly chart renders
- Confirm reminders section renders
- Use quick action button and navigate to Payments

3. Payments (`/payments`)
- Open monthly edit modal
- Save salary components and paid amounts
- Verify status updates (paid/partial/pending)
- Add signature and verify it appears
- Upload attachment (after Storage setup)

4. Pension (`/pension`)
- Open month edit
- Save pension amount paid
- Verify yearly pension totals update

5. Employees (`/employees`)
- Create a new fictional employee
- Edit employee and save changes
- Select active employee and verify context switches

6. Reports (`/reports`)
- Generate PDF yearly report
- Generate monthly report
- Export Excel and verify file download

7. Settings (`/settings`)
- Change year and verify page data context updates
- Edit rates and basic details (fictional only)
- Save and verify success state

8. Guide (`/guide`)
- Open FAQ/help content
- Confirm translations and layout on mobile/desktop

### Integration Checks

1. i18n
- Validate Hebrew, Russian, English across every page
- Validate RTL/LTR layout direction switching

2. Firestore persistence
- Refresh browser after edits and verify data persists
- Verify data appears under correct employee/year path

3. Authorization
- Verify authenticated user can only access allowed records
- Verify logout returns user to login route

4. PWA
- Install from mobile browser
- Open from home screen
- Verify app shell loads correctly

### Exit Criteria
- All routes open without runtime errors
- CRUD succeeds on Employees, Payments, Pension
- Reports export successfully
- No real names exist in code, seeds, or screenshots
- Build passes without TypeScript errors

## Latest Verification Run

Date: 2026-05-07

Executed smoke navigation (authenticated session) on production hosting:
- Login page loaded and authenticated successfully
- Dashboard opened
- Payments opened
- Pension opened
- Employees opened
- Reports opened
- Settings opened
- Guide opened

Technical checks completed in the same iteration:
- `npm run build` passed
- `npm run lint` passed (TypeScript version warning only)
- Firestore rules deployed successfully
- Hosting deployed successfully

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Security

Review and keep these updated:
- firestore.rules
- storage.rules

## License

MIT
