# Cupido API Requirements & Setup Guide

## Overview
This document outlines all the API services, credentials, and setup required for the Cupido dating app.

## Required Services & APIs

### 1. **Database & Backend (Supabase)**
- **Purpose**: Main database, authentication, real-time features
- **Setup**:
  1. Create account at https://supabase.com
  2. Create new project
  3. Run the schema from `src/database/schema.sql`
  4. Get your project URL and anon key from Settings > API
  5. Enable Phone Auth in Authentication > Providers
  6. Configure SMS provider (Twilio recommended)

### 2. **SMS/OTP Service (Twilio)**
- **Purpose**: Send OTP codes for phone authentication
- **Setup**:
  1. Create account at https://www.twilio.com
  2. Get phone number
  3. Configure in Supabase Auth settings
  4. Or implement custom OTP endpoint
- **Required Credentials**:
  - Account SID
  - Auth Token
  - Phone Number

### 3. **Social Media OAuth**

#### LinkedIn
- **Purpose**: Professional network verification
- **Setup**: https://www.linkedin.com/developers/
- **Required**:
  - Client ID
  - Client Secret
  - OAuth 2.0 redirect URL
- **Scopes**: r_liteprofile, r_emailaddress

#### Instagram (Facebook)
- **Purpose**: Social presence verification
- **Setup**: https://developers.facebook.com/
- **Required**:
  - App ID
  - App Secret
  - Instagram Basic Display API access
- **Scopes**: user_profile, user_media

#### Twitter/X
- **Purpose**: Social engagement verification
- **Setup**: https://developer.twitter.com/
- **Required**:
  - API Key
  - API Secret
  - Bearer Token
- **Scopes**: tweet.read, users.read

#### Spotify
- **Purpose**: Music taste matching
- **Setup**: https://developer.spotify.com/
- **Required**:
  - Client ID
  - Client Secret
- **Scopes**: user-top-read, user-library-read

#### YouTube (Google)
- **Purpose**: Content preference matching
- **Setup**: https://console.cloud.google.com/
- **Required**:
  - API Key
  - OAuth 2.0 credentials
- **APIs**: YouTube Data API v3

#### GitHub
- **Purpose**: Developer profile verification
- **Setup**: https://github.com/settings/developers
- **Required**:
  - OAuth App Client ID
  - Client Secret
- **Scopes**: read:user, user:email

### 4. **Push Notifications (OneSignal)**
- **Purpose**: Send push notifications
- **Setup**:
  1. Create account at https://onesignal.com
  2. Create new app
  3. Configure iOS/Android certificates
  4. Get App ID
- **Required**: App ID, REST API Key

### 5. **Analytics**

#### Mixpanel
- **Purpose**: User behavior analytics
- **Setup**: https://mixpanel.com/
- **Required**: Project Token

#### Sentry
- **Purpose**: Error tracking
- **Setup**: https://sentry.io/
- **Required**: DSN

### 6. **File Storage**
- **Purpose**: Store user photos, voice notes
- **Options**:
  - Supabase Storage (recommended)
  - AWS S3
  - Cloudinary
- **Required**: Configured in Supabase or separate credentials

### 7. **AI/ML Services (Optional)**
- **Purpose**: Enhanced matching, content moderation
- **Options**:
  - OpenAI API (GPT-4 for conversation starters)
  - Google Cloud Vision (image moderation)
  - Azure Cognitive Services (voice analysis)

## Backend API Endpoints Implementation

### Core Endpoints Needed:

1. **Authentication**
   - POST /auth/send-otp
   - POST /auth/verify-otp
   - POST /auth/refresh
   - POST /auth/logout

2. **User Management**
   - GET /user/profile
   - PUT /user/profile
   - POST /user/avatar
   - GET /user/authenticity-score

3. **Questions & Reflections**
   - GET /questions/daily
   - GET /questions/community
   - POST /questions/create
   - POST /questions/answer
   - POST /questions/:id/like

4. **Social Integration**
   - POST /social/connect
   - DELETE /social/disconnect/:platform
   - GET /social/connections
   - POST /social/verify

5. **Matching**
   - GET /matching/potential
   - GET /matching/active
   - POST /matching/request
   - PUT /matching/:id/accept
   - PUT /matching/:id/decline

6. **Chat**
   - GET /chat/conversations
   - GET /chat/messages/:matchId
   - POST /chat/send
   - PUT /chat/read/:messageId

7. **Notifications**
   - GET /notifications
   - PUT /notifications/:id/read
   - POST /notifications/register-token

## Security Considerations

1. **API Security**
   - Implement rate limiting
   - Use JWT tokens with short expiry
   - Validate all inputs
   - Implement CORS properly

2. **Data Privacy**
   - Encrypt sensitive data
   - Implement GDPR compliance
   - Anonymous mode for browsing
   - Data retention policies

3. **Content Moderation**
   - Profanity filter for user content
   - Image moderation for uploads
   - Report/block functionality
   - Admin moderation panel

## Development vs Production

### Development
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
```

### Production
```env
EXPO_PUBLIC_API_BASE_URL=https://api.cupido.app
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
```

## Quick Start

1. **Clone the repository**
2. **Copy .env.example to .env**
3. **Set up Supabase**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

4. **Configure OAuth apps** for each social platform
5. **Set up push notifications** with OneSignal
6. **Configure SMS** with Twilio
7. **Run the app**:
   ```bash
   npm install
   npm start
   ```

## Monitoring & Maintenance

1. **Monitor API usage** for rate limits
2. **Track error rates** in Sentry
3. **Analyze user behavior** in Mixpanel
4. **Regular security audits**
5. **Database performance optimization**
6. **Cost monitoring** for all services

## Estimated Costs (Monthly)

- Supabase: $25-$50 (depends on usage)
- Twilio: $0.0075 per SMS
- OneSignal: Free up to 10k devices
- Mixpanel: Free up to 20M events
- Sentry: Free up to 5k errors
- Social APIs: Most free within limits
- Total: ~$50-100/month for MVP

## Support & Documentation

- Supabase: https://supabase.com/docs
- Twilio: https://www.twilio.com/docs
- OneSignal: https://documentation.onesignal.com/
- OAuth Providers: See individual developer portals

## Next Steps

1. Set up all required accounts
2. Configure environment variables
3. Implement remaining API endpoints
4. Set up CI/CD pipeline
5. Configure monitoring
6. Launch beta testing