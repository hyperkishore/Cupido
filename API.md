# API Documentation

This document describes the service layer and API integrations in the Cupido app.

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