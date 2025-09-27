# Cupido - Full System Architecture

## Overview
A production-ready reflection-based dating application with AI-powered questions, intelligent matching, and comprehensive safety features.

## Core Components

### 1. Database Schema (PostgreSQL/Supabase)

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  phone_number VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  username VARCHAR UNIQUE,
  display_name VARCHAR,
  bio TEXT,
  age INTEGER,
  location GEOGRAPHY,
  created_at TIMESTAMP,
  last_active TIMESTAMP,
  is_verified BOOLEAN,
  is_banned BOOLEAN,
  profile_complete BOOLEAN,
  preferences JSONB
)

-- User reflections/answers
reflections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  question_id UUID REFERENCES questions,
  answer TEXT,
  answer_embedding VECTOR(1536), -- For AI matching
  authenticity_score INTEGER,
  is_public BOOLEAN,
  created_at TIMESTAMP,
  sentiment JSONB,
  keywords TEXT[]
)

-- Questions database
questions (
  id UUID PRIMARY KEY,
  question TEXT,
  category VARCHAR,
  difficulty INTEGER,
  created_by UUID REFERENCES users,
  is_ai_generated BOOLEAN,
  is_approved BOOLEAN,
  usage_count INTEGER,
  avg_authenticity_score FLOAT,
  tags TEXT[]
)

-- Matches
matches (
  id UUID PRIMARY KEY,
  user1_id UUID REFERENCES users,
  user2_id UUID REFERENCES users,
  compatibility_score FLOAT,
  match_reasons JSONB,
  status VARCHAR, -- pending, accepted, rejected
  created_at TIMESTAMP,
  interaction_count INTEGER,
  last_interaction TIMESTAMP
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches,
  sender_id UUID REFERENCES users,
  content TEXT,
  message_type VARCHAR, -- text, image, voice
  is_read BOOLEAN,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- User reports/moderation
reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users,
  reported_user_id UUID REFERENCES users,
  reported_content_id UUID,
  report_type VARCHAR,
  description TEXT,
  status VARCHAR, -- pending, reviewed, resolved
  moderator_id UUID,
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
)

-- Q&A Repository
qa_posts (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions,
  answer TEXT,
  user_id UUID REFERENCES users,
  likes INTEGER,
  is_featured BOOLEAN,
  is_moderated BOOLEAN,
  created_at TIMESTAMP
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  type VARCHAR,
  title TEXT,
  body TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMP
)
```

### 2. Backend Services Architecture

#### A. Authentication Service
- Phone number verification (Twilio)
- JWT token management
- Session handling
- Multi-device support

#### B. Reflection Service
- Store user answers with encryption
- Calculate authenticity scores
- Generate embeddings for matching
- Track answer patterns and growth

#### C. Matching Algorithm Service
```javascript
// Matching factors:
1. Answer similarity (cosine similarity of embeddings)
2. Authenticity alignment
3. Category preferences overlap
4. Response depth compatibility
5. Geographical proximity (optional)
6. Activity patterns
7. Shared values (extracted from answers)
```

#### D. Chat/Messaging Service
- Real-time messaging (WebSocket)
- Message encryption
- Media sharing (images, voice notes)
- Typing indicators
- Read receipts
- Message history

#### E. Notification Service
- Push notifications (FCM/APNs)
- In-app notifications
- Email notifications
- SMS for critical updates
- Notification preferences

#### F. Content Moderation Service
- AI-powered content screening
- Human review queue
- Automated flagging rules
- User reporting system
- Shadow banning capabilities
- Appeal process

#### G. Q&A Repository Service
- Curated answers showcase
- Community voting
- Featured content
- Search and discovery
- Content categorization

### 3. Additional Production Requirements

#### A. Safety & Trust
- Photo verification
- Identity verification
- Block/report functionality
- Safety tips and guidelines
- Emergency contact features
- Inappropriate content detection

#### B. Analytics & Monitoring
- User engagement metrics
- Matching success rates
- Conversation quality metrics
- Retention analytics
- A/B testing framework
- Error tracking (Sentry)

#### C. Admin Dashboard
- User management
- Content moderation queue
- Analytics overview
- Question management
- Report handling
- System health monitoring

#### D. Infrastructure
- CDN for media content
- Redis for caching
- Queue system for async tasks
- Backup and disaster recovery
- Rate limiting
- DDoS protection

### 4. API Structure

```
/api/v1/
  /auth
    POST /login
    POST /verify-otp
    POST /refresh-token
    POST /logout
  
  /users
    GET /profile
    PUT /profile
    POST /preferences
    DELETE /account
  
  /reflections
    POST /answer
    GET /history
    GET /insights
    POST /skip
  
  /questions
    GET /daily
    GET /categories
    POST /create
    GET /trending
  
  /matches
    GET /potential
    POST /accept
    POST /reject
    GET /active
  
  /messages
    GET /conversations
    GET /messages/:matchId
    POST /send
    WS /realtime
  
  /qa
    GET /featured
    POST /submit
    POST /like
    GET /search
  
  /moderation
    POST /report
    GET /guidelines
  
  /notifications
    GET /list
    PUT /read
    POST /preferences
```

### 5. Security Considerations

1. **Data Privacy**
   - End-to-end encryption for messages
   - Secure storage of personal data
   - GDPR compliance
   - Right to deletion

2. **Authentication**
   - Multi-factor authentication
   - Biometric login option
   - Secure session management
   - Device fingerprinting

3. **Content Security**
   - Image scanning for inappropriate content
   - Text filtering for harmful content
   - Rate limiting on all endpoints
   - CAPTCHA for suspicious activity

### 6. Scalability Plan

1. **Phase 1 (0-10K users)**
   - Single Supabase instance
   - Basic CDN setup
   - Manual moderation

2. **Phase 2 (10K-100K users)**
   - Read replicas
   - Automated moderation
   - Enhanced caching

3. **Phase 3 (100K+ users)**
   - Microservices architecture
   - Multiple regions
   - ML-powered features
   - Dedicated moderation team

### 7. Launch Checklist

- [ ] Legal compliance (Terms of Service, Privacy Policy)
- [ ] Age verification system
- [ ] Payment integration (premium features)
- [ ] App store compliance
- [ ] Security audit
- [ ] Load testing
- [ ] Backup systems
- [ ] Customer support system
- [ ] Bug reporting mechanism
- [ ] Analytics integration
- [ ] Marketing website
- [ ] Social media presence
- [ ] Help center/FAQ
- [ ] Onboarding flow optimization
- [ ] Referral system