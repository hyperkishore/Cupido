# API Documentation

Comprehensive guide to Cupido's API services, integrations, and setup requirements.

## Quick Start

1. **Clone the repository**
2. **Copy .env.example to .env**
3. **Set up Supabase** (see Database Setup section)
4. **Configure OAuth apps** for social platforms
5. **Set up push notifications** with OneSignal
6. **Configure SMS** with Twilio
7. **Run the app**:
   ```bash
   npm install
   npm start
   ```

## Required Services & Setup

### 1. Database & Backend (Supabase)
- **Purpose**: Main database, authentication, real-time features
- **Setup**:
  1. Create account at https://supabase.com
  2. Create new project
  3. Run the schema from `src/database/schema.sql`
  4. Get your project URL and anon key from Settings > API
  5. Enable Phone Auth in Authentication > Providers
  6. Configure SMS provider (Twilio recommended)

### 2. SMS/OTP Service (Twilio)
- **Purpose**: Send OTP codes for phone authentication
- **Setup**:
  1. Create account at https://www.twilio.com
  2. Get phone number
  3. Configure in Supabase Auth settings
- **Required Credentials**:
  - Account SID
  - Auth Token
  - Phone Number

### 3. Push Notifications (OneSignal)
- **Purpose**: Send push notifications
- **Setup**:
  1. Create account at https://onesignal.com
  2. Create new app
  3. Configure iOS/Android certificates
  4. Get App ID
- **Required**: App ID, REST API Key

### 4. Analytics & Monitoring
- **Mixpanel**: User behavior analytics (Project Token required)
- **Sentry**: Error tracking (DSN required)

### 5. File Storage
- **Options**: Supabase Storage (recommended), AWS S3, Cloudinary
- **Purpose**: Store user photos, voice notes

## Service Architecture

### Core Services

#### Authentication Service (`AuthScreen.tsx`)
Handles user registration, login, and session management.

```typescript
interface AuthService {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

#### Supabase Service (`supabase.production.ts`)
Production backend service integration.

```typescript
interface SupabaseService {
  // User Management
  createUser(userData: UserData): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  
  // Reflections
  createReflection(reflection: ReflectionData): Promise<Reflection>;
  getUserReflections(userId: string): Promise<Reflection[]>;
  
  // Matching
  findMatches(userId: string): Promise<Match[]>;
  createMatch(userA: string, userB: string): Promise<Match>;
  
  // Real-time subscriptions
  subscribeToMatches(userId: string, callback: (matches: Match[]) => void): Subscription;
  subscribeToMessages(matchId: string, callback: (messages: Message[]) => void): Subscription;
}
```

#### Questions Service (`questionsService.ts`)
Manages daily reflection prompts and question selection.

```typescript
interface QuestionsService {
  getDailyQuestion(userId: string): Promise<Question>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
  submitResponse(questionId: string, response: ResponseData): Promise<void>;
}

interface Question {
  id: string;
  text: string;
  category: 'personal_growth' | 'relationships' | 'values' | 'dreams';
  difficulty: 'easy' | 'medium' | 'deep';
  tags: string[];
}
```

#### Feedback Service (`feedbackDatabase.ts`)
User feedback and analytics collection.

```typescript
interface FeedbackService {
  submitFeedback(feedback: FeedbackData): Promise<void>;
  getFeedbackHistory(userId: string): Promise<Feedback[]>;
  updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void>;
}
```

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak INTEGER DEFAULT 0,
  last_prompt_date TIMESTAMP WITH TIME ZONE,
  persona_data JSONB,
  authenticity_score FLOAT DEFAULT 0
);
```

#### Reflections Table
```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  audio_url TEXT,
  hearts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Matches Table
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score FLOAT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'ended')),
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Real-time Features

#### Subscriptions
```typescript
// Real-time match notifications
const matchSubscription = supabase
  .channel('matches')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'matches',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    handleNewMatch(payload.new);
  })
  .subscribe();

// Real-time chat messages
const messageSubscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `match_id=eq.${matchId}`
  }, (payload) => {
    handleNewMessage(payload.new);
  })
  .subscribe();
```

## Social Media OAuth Integration

### LinkedIn
- **Purpose**: Professional network verification
- **Setup**: https://www.linkedin.com/developers/
- **Required**: Client ID, Client Secret, OAuth 2.0 redirect URL
- **Scopes**: r_liteprofile, r_emailaddress

### Instagram (Facebook)
- **Purpose**: Social presence verification
- **Setup**: https://developers.facebook.com/
- **Required**: App ID, App Secret, Instagram Basic Display API access
- **Scopes**: user_profile, user_media

### Twitter/X
- **Purpose**: Social engagement verification
- **Setup**: https://developer.twitter.com/
- **Required**: API Key, API Secret, Bearer Token
- **Scopes**: tweet.read, users.read

### Spotify
- **Purpose**: Music taste matching
- **Setup**: https://developer.spotify.com/
- **Required**: Client ID, Client Secret
- **Scopes**: user-top-read, user-library-read

### YouTube (Google)
- **Purpose**: Content preference matching
- **Setup**: https://console.cloud.google.com/
- **Required**: API Key, OAuth 2.0 credentials
- **APIs**: YouTube Data API v3

### GitHub
- **Purpose**: Developer profile verification
- **Setup**: https://github.com/settings/developers
- **Required**: OAuth App Client ID, Client Secret
- **Scopes**: read:user, user:email

## API Endpoints

### Reflection API

#### Get Daily Question
```typescript
GET /api/questions/daily
Authorization: Bearer <token>

Response:
{
  "id": "quest_123",
  "text": "What made you smile today, and why did it resonate with you?",
  "category": "personal_growth",
  "deadline": "2024-01-02T00:00:00Z"
}
```

#### Submit Reflection
```typescript
POST /api/reflections
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionId": "quest_123",
  "content": "A stranger helped an elderly person...",
  "type": "text"
}

Response:
{
  "id": "refl_456",
  "streakUpdated": true,
  "newStreak": 8,
  "authenticityScore": 87
}
```

### Matching API

#### Get Matches
```typescript
GET /api/matches
Authorization: Bearer <token>

Response:
{
  "matches": [
    {
      "id": "match_789",
      "compatibilityScore": 87,
      "sharedInterests": ["creativity", "personal_growth"],
      "unlockedAt": "2024-01-01T12:00:00Z",
      "isUnlocked": true
    }
  ],
  "requirements": {
    "nextUnlock": {
      "pointsNeeded": 25,
      "currentPoints": 50,
      "totalRequired": 75
    }
  }
}
```

### Chat API

#### Send Message
```typescript
POST /api/matches/{matchId}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello! I loved your reflection about kindness.",
  "type": "text"
}

Response:
{
  "id": "msg_101",
  "sentAt": "2024-01-01T12:30:00Z",
  "status": "delivered"
}
```

## Error Handling

### Standard Error Response
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Common error codes
const ErrorCodes = {
  UNAUTHORIZED: 'auth/unauthorized',
  RATE_LIMITED: 'api/rate_limited',
  VALIDATION_ERROR: 'api/validation_error',
  NOT_FOUND: 'api/not_found',
  SERVER_ERROR: 'api/server_error'
};
```

### Client Error Handling
```typescript
try {
  const response = await apiCall();
  return response.data;
} catch (error) {
  if (error.code === 'auth/unauthorized') {
    // Redirect to login
    navigateToAuth();
  } else if (error.code === 'api/rate_limited') {
    // Show rate limit message
    showRateLimitError();
  } else {
    // Show generic error
    showGenericError(error.message);
  }
}
```

## Environment Configuration

### Required Variables
```bash
# Backend Integration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services (Optional)
REACT_APP_ANTHROPIC_API_KEY=your-anthropic-key

# Feature Flags
EXPO_PUBLIC_ENABLE_AI_MATCHING=true
EXPO_PUBLIC_ENABLE_VOICE_INPUT=true
EXPO_PUBLIC_ENABLE_FEEDBACK_SYSTEM=true
```

### Rate Limiting
```bash
# API Rate Limits
EXPO_PUBLIC_MAX_DAILY_REFLECTIONS=5
EXPO_PUBLIC_MAX_DAILY_MATCHES=10
EXPO_PUBLIC_MAX_DAILY_MESSAGES=100
```

## Security

### Authentication
- JWT tokens for API authentication
- Refresh token rotation
- Session management with Supabase Auth

### Data Protection
- Row Level Security (RLS) on all tables
- Encrypted data transmission (HTTPS/WSS)
- Input validation and sanitization
- Rate limiting on all endpoints

### Privacy
- Anonymous matching before identity reveal
- User controls for data sharing
- GDPR compliance for data deletion
- Secure storage of sensitive information

## Performance

### Caching Strategy
- Client-side caching for questions and user data
- Real-time subscriptions for live updates
- Optimistic updates for better UX

### Optimization
- Lazy loading for large datasets
- Image optimization and CDN usage
- Efficient database queries with proper indexing
- Background sync for offline functionality

## Backend API Endpoints Implementation

### Core Endpoints Needed

#### Authentication
- POST /auth/send-otp
- POST /auth/verify-otp
- POST /auth/refresh
- POST /auth/logout

#### User Management
- GET /user/profile
- PUT /user/profile
- POST /user/avatar
- GET /user/authenticity-score

#### Questions & Reflections
- GET /questions/daily
- GET /questions/community
- POST /questions/create
- POST /questions/answer
- POST /questions/:id/like

#### Social Integration
- POST /social/connect
- DELETE /social/disconnect/:platform
- GET /social/connections
- POST /social/verify

#### Matching
- GET /matching/potential
- GET /matching/active
- POST /matching/request
- PUT /matching/:id/accept
- PUT /matching/:id/decline

#### Chat
- GET /chat/conversations
- GET /chat/messages/:matchId
- POST /chat/send
- PUT /chat/read/:messageId

#### Notifications
- GET /notifications
- PUT /notifications/:id/read
- POST /notifications/register-token

## Development vs Production

### Development Environment
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

### Production Environment
```env
EXPO_PUBLIC_API_BASE_URL=https://api.cupido.app
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

## Estimated Costs (Monthly)

- **Supabase**: $25-$50 (depends on usage)
- **Twilio**: $0.0075 per SMS
- **OneSignal**: Free up to 10k devices
- **Mixpanel**: Free up to 20M events
- **Sentry**: Free up to 5k errors
- **Social APIs**: Most free within limits
- **Total**: ~$50-100/month for MVP

## Monitoring & Maintenance

1. **Monitor API usage** for rate limits
2. **Track error rates** in Sentry
3. **Analyze user behavior** in Mixpanel
4. **Regular security audits**
5. **Database performance optimization**
6. **Cost monitoring** for all services

## Support & Documentation

- Supabase: https://supabase.com/docs
- Twilio: https://www.twilio.com/docs
- OneSignal: https://documentation.onesignal.com/
- OAuth Providers: See individual developer portals

## Database Setup Commands

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