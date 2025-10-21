# 🚀 Cupido Production Deployment Guide

## Deployment Platform: Netlify (Recommended)

Netlify is the optimal choice for Cupido because:
- ✅ Zero server management (serverless functions handle API)
- ✅ Automatic HTTPS and SSL certificates
- ✅ Built-in CI/CD from Git
- ✅ Free tier sufficient for most use cases
- ✅ Edge functions for global performance

## 📋 Pre-Deployment Checklist

### 1. ✅ Environment Setup
```bash
# Required Environment Variables for Netlify:
ANTHROPIC_API_KEY=your_claude_api_key_here
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### 2. ✅ Production Supabase Setup
- [ ] Create production Supabase project at https://supabase.com
- [ ] Run database migrations:
  ```sql
  -- Copy schema from development to production
  -- Ensure RLS policies are configured
  -- Set up proper authentication rules
  ```
- [ ] Configure authentication providers (if using phone auth)
- [ ] Get production API keys

### 3. ✅ Build Configuration
- [x] `netlify.toml` configured for React Native Web
- [x] `netlify/functions/chat.ts` created for Claude API proxy
- [x] `package.json` has `build:web` script
- [ ] Test local build: `npm run build:web`

## 🚀 Deployment Steps

### Option A: Automatic Deployment (Recommended)

1. **Connect Repository to Netlify**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "feat: Add production deployment configuration"
   git push origin main
   ```

2. **Configure Netlify**
   - Go to https://netlify.com
   - Click "Import from Git"
   - Select your Cupido repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Set Environment Variables**
   - In Netlify dashboard: Site Settings → Environment Variables
   - Add:
     - `ANTHROPIC_API_KEY`
     - `SUPABASE_URL` 
     - `SUPABASE_ANON_KEY`

### Option B: Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the app
npm run build:web

# Deploy
netlify deploy --prod --dir=web-build
```

## 🔧 Production Configuration Changes Needed

### 1. Update API Resolver for Production
The app will automatically detect production environment and use Netlify functions:

```typescript
// In src/utils/apiResolver.ts - already configured
if (location.hostname.includes('netlify.app')) {
  return '/.netlify/functions/chat';
}
```

### 2. Supabase Configuration
Update your Supabase settings in production:

```typescript
// Make sure these point to production Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

## 📊 What's Deployed

### ✅ Already Configured:
- React Native Web build pipeline
- Netlify Functions for Claude API proxy
- CORS configuration
- Security headers
- Caching strategy
- SPA routing

### ⚠️ Manual Setup Required:
- Supabase production database
- Environment variables
- Domain configuration (optional)

## 🔍 Validation Steps

After deployment, test:

1. **Basic functionality**: Visit your Netlify URL
2. **Chat functionality**: Send a test message
3. **Image upload**: Try uploading an image
4. **Mobile browser**: Test on actual mobile device
5. **API connectivity**: Check Network tab for successful API calls

## 📱 Mobile Browser Access

Your deployed app will be available at:
```
https://your-app-name.netlify.app
```

Users can:
- Access via mobile browser
- Add to home screen (PWA)
- Use like a native app

## 🔒 Security & Performance

### Automatic Security Features:
- HTTPS by default
- Security headers configured
- CORS properly set up
- API key secured in environment variables

### Performance Optimizations:
- Static asset caching (1 year)
- HTML cache disabled for updates
- Edge function deployment
- Image compression enabled

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails**: Check `npm run build:web` works locally
2. **API Errors**: Verify environment variables are set
3. **Mobile Issues**: Test the fixes we implemented
4. **Database Errors**: Check Supabase production setup

### Debug Steps:
```bash
# Test local build
npm run build:web

# Check if files are generated
ls web-build/

# Test locally
npx serve web-build
```

## 💰 Cost Estimation

### Netlify Free Tier Includes:
- 100GB bandwidth/month
- 300 build minutes/month  
- 125,000 function invocations/month
- Custom domain support

**Expected Usage**: Well within free tier for most use cases.

### Supabase Free Tier Includes:
- 50,000 monthly active users
- 500MB database storage
- 2GB bandwidth
- 5GB file storage

## 🎯 Next Steps

1. Set up production Supabase project
2. Deploy to Netlify
3. Test thoroughly on multiple devices
4. Consider setting up analytics (optional)
5. Set up monitoring (optional)

## 📈 Optional Enhancements

### Analytics & Monitoring:
- Google Analytics
- Netlify Analytics
- Sentry for error tracking

### PWA Features:
- Service worker for offline support
- Push notifications
- Better app manifest

### Performance:
- Image optimization service
- CDN for static assets (already handled by Netlify)

---

**Ready for Production**: The current codebase is production-ready with all mobile browser fixes implemented. The main requirement is setting up the production Supabase database and deploying to Netlify.