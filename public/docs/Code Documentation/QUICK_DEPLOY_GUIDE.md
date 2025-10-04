# Quick Deploy Guide - Cupido Web App

## 🚀 Instant Deploy (No Login Required!)

### Option 1: Netlify Drop - Easiest
1. **Build the project:**
   ```bash
   npm install
   npx expo export --platform web
   ```
2. **Open [https://app.netlify.com/drop](https://app.netlify.com/drop)**
3. **Drag the `dist` folder onto the browser window**
4. **Done! You'll get an instant link like: `https://amazing-curie-a1b2c3.netlify.app`**

## 📦 Quick Deploy Options (Free with Account)

### Option 2: Vercel - Recommended
1. **Fork/Clone this repository to your GitHub account**
2. **Go to [vercel.com](https://vercel.com)**
3. **Sign up/Login with GitHub**
4. **Click "New Project"**
5. **Import your Cupido repository**
6. **Vercel will auto-detect settings from `vercel.json`**
7. **Click "Deploy"**
8. **Your app will be live at: `https://your-project-name.vercel.app`**

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

### Option 4: Surge.sh
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
3. **Choose your domain and you're live!**

### Option 5: Vercel CLI
```bash
npx vercel dist --prod
```

## 🧪 Test Locally First

```bash
# Build the app
npx expo export --platform web

# Test locally
cd dist && python3 -m http.server 8000
```
Then open: http://localhost:8000

## ✅ What's Included

Your built web app in the `dist` folder includes:
- **index.html** - Entry point
- **JavaScript bundle** - All app code
- **favicon.ico** - App icon
- **Optimized assets** - Production-ready

## 🎯 Available Features

- 🤖 AI-powered reflection questions
- ⏭️ Skip functionality with reasons
- 📊 Authenticity scoring
- 🎯 Gamification (points, streaks)
- 💝 Beautiful responsive design
- 🔐 Full authentication flow
- 💬 Real-time chat
- 🎭 Persona detection
- 📱 Progressive Web App support

## 🏭 Production Deployment

For production deployment with custom domains, SSL certificates, environment variables, and scaling options, see [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

## 🆘 Common Issues

### Build Errors
- Run `npm install` first
- Clear cache: `npx expo start --clear`
- Delete `node_modules` and reinstall

### Deployment Issues
- Ensure `dist` folder exists after build
- Check that all environment variables are set
- Verify API endpoints are accessible

### Need Help?
- Check [DEBUG_RUNBOOK.md](./DEBUG_RUNBOOK.md) for troubleshooting
- Review [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for technical details