# מעקב תשלומים לעובדת זרה
# Foreign Worker Payment Tracker
# Учёт платежей иностранному работнику

[![CI](https://github.com/your-username/foreign-worker-payment-tracker/workflows/CI/badge.svg)](https://github.com/your-username/foreign-worker-payment-tracker/actions)

אפליקציה **100% חינמית** לניהול תשלומים ופנסיה לעובדים זרים. תומכת בעברית, רוסית ואנגלית. עובדת ב-iPhone ודסקטופ, PWA מלא.

---

## 📱 תכונות

- **ניהול תשלומים** - מעקב חודשי בתשלומים (משכורת, דמי כיס, שבת, חופש, חגים)
- **פנסיה ופיצויים** - ניהול חישוב 12.5% פנסיה ודמי הבראה
- **חתימה דיגיטלית** - חתימת עובדת ישירות על המסך
- **דוחות וייצוא** - PDF שנתי/חודשי, Excel, דוח חתום
- **עברית RTL מלא** - ממשק מותאם בעברית, רוסית ואנגלית
- **PWA** - התקנה למסך הבית באייפון
- **Offline ready** - עבודה חלקית ללא אינטרנט
- **Mobile-first** - ממשק אופטימלי לסמארטפון

---

## 🔧 טכנולוגיות

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router
- React Hook Form + Zod
- i18next (תרגומים)
- Recharts (גרפים)
- Zustand (state)

**Backend (Firebase Free Tier):**
- Firestore (בסיס נתונים)
- Firebase Auth (משתמשים)
- Firebase Storage (קבצים)
- Firebase Hosting (פריסה חינמית)

**CI/CD:**
- GitHub Actions (בדיקות build/lint)

---

## 💰 עלויות

### **עלות: 0₪ לחלוטין!**

- ✅ Firebase Free Tier - חינמי לחלוטין
- ✅ GitHub - חינמי (private/public)
- ✅ GitHub Actions - חינמי לחלוטין
- ✅ Firebase Hosting - 10GB חינמי חודשי (יותר מספיק)
- ✅ Firestore - 1GB חינמי + 50K קריאות/כתיבות/מחיקות יומיות
- ✅ Storage - 5GB חינמי
- ✅ SSL/HTTPS - חינמי

---

## ⚙️ התקנה מקומית

### דרישות

- Node.js 18+ (תקחו מ- [nodejs.org](https://nodejs.org), חינמי)
- npm או yarn
- חשבון Firebase (יצור ב-[firebase.google.com](https://firebase.google.com), חינמי)
- חשבון GitHub (יצור ב-[github.com](https://github.com), חינמי)

### צעדים

#### 1. Clone ה-Repository

```bash
git clone https://github.com/your-username/foreign-worker-payment-tracker.git
cd foreign-worker-payment-tracker
```

#### 2. התקנת Dependencies

```bash
npm install
```

#### 3. הגדרת Firebase (חינמי!)

1. צור project חדש ב-[Firebase Console](https://console.firebase.google.com/)
2. בחר **"Free Plan"** (Spark)
3. כדי להשתמש ב-Firestore ו-Storage, אפשר אותם בקונסול
4. לך ל-**Project Settings** → **Service Accounts** → **Generate New Private Key**
5. העתק ה-Config ממסך ה-SDK:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

#### 4. יצירת `.env.local` (משתנים סביבה)

העתק את ה-.env.example וחכום אותו:

```bash
cp .env.example .env.local
```

מלא ב-Firebase config values שלך:

```env
VITE_FIREBASE_API_KEY=xxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxxxx
VITE_FIREBASE_APP_ID=x:xxxxxxxxxxxxx:web:xxxxxxxxxxxxx
```

#### 5. הרצה מקומית

```bash
npm run dev
```

התוכנה תפתח ב- http://localhost:5173

#### 6. Build לפריסה

```bash
npm run build
```

הקבצים המוכנים יהיו בתיקייה `dist/`

---

## 🚀 פריסה ל-Firebase Hosting (חינמי!)

### דרישות

- [Firebase CLI](https://firebase.google.com/docs/cli) (חינמי)
  ```bash
  npm install -g firebase-tools
  ```

### צעדים

#### 1. Login ל-Firebase

```bash
firebase login
```

#### 2. Initialize Firebase Hosting

```bash
firebase init hosting
# בחר את ה-project שלך
# בשאלה "What do you want to use as your public directory?" תשובה: dist
# בשאלה "Configure as a single-page app?" תשובה: y
```

#### 3. Build והעלאה

```bash
npm run build
firebase deploy
```

ה-URL שלך יהיה: `https://your-project.firebaseapp.com`

---

## 👤 משתמשים וקומפוזיציה (Firebase Auth - חינמי)

Firebase Auth מאפשר:
- Email/Password auth
- Google Sign-In (חינמי)
- GitHub Sign-In (חינמי)

### יצירת משתמש ראשון (Admin)

1. בקונסול Firebase → **Authentication** → **Users**
2. לחץ **Add User**
3. הזן email וסיסמה
4. בקונסול Firebase → **Firestore** → **Collections** → **users** → **{uid}**
5. הוסף document עם:

```json
{
  "displayName": "Admin Name",
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": "2026-01-01T00:00:00Z",
  "defaultLanguage": "he"
}
```

---

## 📊 מבנה הנתונים (Firestore Free Tier)

```
users/{userId}
  - displayName, email, role, defaultLanguage

employees/{employeeId}
  - fullName, startDate, baseSalary, ...
  
  years/{year}
    monthlyPayments/{month}
      - baseSalary, cashPaid, payslipPaid, bankTransferPaid, ...
    
    pensionPayments/{month}
      - requiredPensionAmount, amountPaid, ...
    
    auditLog/{logId}
      - action, entityType, before, after, ...
```

---

## 🔒 אבטחה (Firestore Security Rules חינמיות)

- ✅ כל משתמש רואה רק את הנתונים שלו
- ✅ Admin רואה הכל
- ✅ חתימות ופרטיות שמורים בעיצומם בענן (Firebase Storage)

צפה ב-`firestore.rules` ו-`storage.rules`

---

## 🌍 שפות

- 🇮🇱 עברית (RTL, ברירת מחדל)
- 🇷🇺 רוסית
- 🇬🇧 אנגלית

בחר שפה מלחצן בחלק העליון של האפליקציה.

---

## 🗂️ מבנה תיקייה

```
src/
├── app/
├── components/            # UI components (Modal, Form, Layout)
├── features/             # Pages (Dashboard, Payments, Pension, etc)
├── services/
│   └── firebase/        # Auth, Firestore, Storage
├── hooks/               # useAuth, usePayments, usePension
├── store/               # Zustand stores
├── utils/
│   ├── calculations.ts  # Business logic
│   ├── dates.ts
│   └── validation.ts
├── i18n/                # Translations (he.json, ru.json, en.json)
├── types/               # TypeScript interfaces
└── styles/              # Tailwind CSS globals
```

---

## 🧪 בדיקות ובניה

```bash
# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 מידע ביוני ערך (Demo Seed Data)

בפרויקט מצורפים נתוני seed 2026 עם:
- עובדת: KABULOVA MOKHCHEKHRA
- מעסיק: דותן זיוה
- תשלומים: ינואר–אפריל (מלא)
- פנסיה: ינואר–יולי (מלא)

כדי לטעון seed:

```typescript
import { seedInitial2026Data } from '@/services/firebase/seed.service'

// בקוד admin
await seedInitial2026Data({ userId: currentUser.uid })
```

---

## 📱 PWA – הוסף למסך בעיתון

### ב-iPhone:

1. פתח את האפליקציה בסאפארי
2. לחץ **Share** (משולש עם חצים)
3. בחר **Add to Home Screen**
4. אישר

האפליקציה תיראה כמו אפליקציה מקומית.

---

## 🛠️ CI/CD - GitHub Actions (חינמי!)

כל push ל-`main` רץ:
- npm install
- npm run lint
- npm run build

צפה ב-`.github/workflows/ci.yml`

---

## 📄 רישיון

זה פרויקט פתוח. השתמש בחופש.

---

## 💬 תמיכה

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/foreign-worker-payment-tracker/issues)

---

## 🚀 Roadmap

- [ ] טוב יותר QR codes ל-invoices
- [ ] Export ל-WhatsApp/Email עם טבלה
- [ ] Dark mode
- [ ] Notifications/Reminders
- [ ] Multi-employee dashboard
- [ ] Bank connection integration
- [ ] SMS/Email reminders

---

## ⚡ עצות ביצוע

- **Firebase Free Tier** מספיק ל-10,000 משתמשים פעילים יומית
- **GitHub Pages + Firebase Hosting** = hosting מושלם וחינמי
- **GitHub Actions** בדוק כל push בחינם
- **PWA** תוכנית בדומה לאפליקציה מקומית

---

**Made with ❤️ for foreign workers in Israel**

עברית | Русский | English
