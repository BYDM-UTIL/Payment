# Contributing

thanks for your interest in contributing to **Foreign Worker Payment Tracker**!

## 💰 No Cost Promise

This project is **100% free to use, modify, and deploy**:
- ✅ Firebase Free Tier
- ✅ GitHub (free public/private repos)
- ✅ GitHub Actions (unlimited CI/CD)
- ✅ No subscription required

## 🚀 How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/foreign-worker-payment-tracker.git
cd foreign-worker-payment-tracker
npm install
```

### 2. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 3. Make Changes

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Add translations to `src/i18n/{he,ru,en}.json`
- Test on mobile (iPhone preferred)

### 4. Commit & Push

```bash
git add -A
git commit -m "feat: describe your feature"
git push origin feature/my-feature
```

### 5. Open Pull Request

- Title: `feat: short description` or `fix: bug description`
- Description: why this change? what problem does it solve?
- Include screenshots for UI changes

## 🔍 Code Standards

- **TypeScript**: Strict mode, no `any`
- **React**: Functional components, hooks only
- **i18n**: Every user-facing text must be translated to he/ru/en
- **Mobile First**: Design for iPhone 12 first, then desktop
- **RTL Ready**: Test in Hebrew (RTL) and Russian (LTR)

## 🧪 Testing

Before submitting a PR:

```bash
npm run lint    # Check code quality
npm run build   # Ensure production build works
```

## 📱 Mobile Testing

Always test on an actual iPhone or iPhone simulator:

```bash
npm run dev
# Then open http://localhost:5173 on iPhone
```

## 📝 Translations

When adding new features, add translation keys to:
- `src/i18n/he.json` (Hebrew)
- `src/i18n/ru.json` (Russian)
- `src/i18n/en.json` (English)

Example:

```json
{
  "myFeature": {
    "title": "תיאור בעברית",
    "description": "הסבר למה זה טוב"
  }
}
```

## 🐛 Reporting Issues

1. Check if issue already exists
2. Describe what happened & what you expected
3. Include screenshots if UI-related
4. OS & browser info

## 💡 Ideas?

Have an idea for a feature? Open an issue or discussion first before coding.

---

**Made with ❤️ for foreign workers. Contributions welcome!**
