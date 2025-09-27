# Deployment Guide - Cupido Web App

## Quick Deploy Options (All Free!)

### Option 1: Vercel (Recommended - Easiest)
1. **Fork/Clone this repository to your GitHub account**
2. **Go to [vercel.com](https://vercel.com)**
3. **Sign up/Login with GitHub**
4. **Click "New Project"**
5. **Import your Cupido repository**
6. **Vercel will auto-detect the settings from `vercel.json`**
7. **Click "Deploy"**
8. **Your app will be live at: `https://your-project-name.vercel.app`**

### Option 2: Netlify
1. **Build the project locally:**
   ```bash
   npm install
   npx expo export --platform web
   ```
2. **Go to [netlify.com](https://netlify.com)**
3. **Drag and drop the `dist` folder to Netlify**
4. **Your app will be instantly deployed!**

### Option 3: GitHub Pages
1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```
2. **Add to package.json scripts:**
   ```json
   "predeploy": "expo export --platform web",
   "deploy": "gh-pages -d dist"
   ```
3. **Deploy:**
   ```bash
   npm run deploy
   ```
4. **Access at: `https://yourusername.github.io/Cupido`**

### Option 4: Surge.sh (Super Quick)
1. **Install surge:**
   ```bash
   npm install -g surge
   ```
2. **Build and deploy:**
   ```bash
   npx expo export --platform web
   cd dist
   surge
   ```
3. **Choose a domain or use the suggested one**

## Pre-deployment Checklist

- [x] Web build works: `npx expo export --platform web`
- [x] All dependencies installed
- [x] No TypeScript errors
- [x] Mobile responsive design
- [x] Loading states implemented
- [x] Error handling in place

## Share Your Link!

Once deployed, you can share the link with anyone. The app works fully in the browser without needing any installation.

### Features available on web:
- ✅ Full authentication flow
- ✅ AI-powered reflection questions
- ✅ Skip functionality
- ✅ Profile management
- ✅ Social connections
- ✅ Gamification (points, streaks)
- ✅ Beautiful responsive UI

### Note on Voice Features:
Voice recording features will work on most modern browsers but may require HTTPS (which all these hosting services provide).

## Quick Test Before Deploying

Run locally to test:
```bash
npm start
# Press 'w' to open in web browser
```

## Support

If you encounter any issues:
1. Make sure you're in the project root directory
2. Run `npm install` to ensure all dependencies are installed
3. Clear cache: `npx expo start -c`
4. Check browser console for any errors

Happy deploying! 🚀