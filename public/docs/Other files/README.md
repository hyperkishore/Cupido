# Cupido - Privacy-First Dating App

Cupido is a privacy-first, habit-forming dating app that replaces swipe fatigue with a daily self-discovery ritual. Users answer short, introspective prompts which an AI engine converts into evolving "personas" for trait-based matching.

## Features

### Core Functionality
- **Daily Introspective Prompts**: Text and voice responses to thoughtful questions
- **AI Persona Generation**: Machine learning creates personality profiles from responses
- **Compatibility Matching**: Smart matching using personality traits and reflection patterns
- **Anonymous Q&A Rooms**: Get to know matches before revealing identities
- **Real-time Messaging**: Instant messaging between matched users
- **Progressive Unlock System**: Earn access to features through consistent reflection

### Gamification & Growth
- **Streak Tracking**: Maintain daily reflection habits with visual progress
- **Authenticity Scoring**: Encourage genuine self-expression
- **Reflection Analytics**: Personal insights and growth tracking
- **Heart System**: Community engagement through reflection appreciation
- **Achievement Unlocks**: Access new features by completing reflections

### Safety & Privacy
- **Privacy-First Design**: Anonymous matching before identity reveal
- **Content Moderation**: AI-powered safety measures
- **Secure Storage**: End-to-end encrypted data protection
- **User Controls**: Comprehensive privacy and safety settings

## Tech Stack

- **Frontend**: React Native with Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Real-time Features**: Supabase real-time subscriptions
- **Voice Processing**: React Native Voice integration
- **Design System**: Apple/Airbnb-inspired minimalist UI (two-color palette)
- **Build Tools**: Metro bundler, ESLint, TypeScript compiler

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- TypeScript knowledge (recommended)
- iOS Simulator or Android Emulator (for mobile testing)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cupido
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required environment variables:
```
# Development Settings
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG_MODE=true

# Feature Flags
EXPO_PUBLIC_ENABLE_VOICE_INPUT=true
EXPO_PUBLIC_ENABLE_FEEDBACK_SYSTEM=true
EXPO_PUBLIC_ENABLE_AI_MATCHING=true

# Optional: Backend Integration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Set up Supabase Database
Run the following SQL in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak INTEGER DEFAULT 0,
  last_prompt_date TIMESTAMP WITH TIME ZONE,
  persona_data JSONB
);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility FLOAT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QA Rooms table
CREATE TABLE qa_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  users UUID[] NOT NULL,
  messages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  revealed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly digests table
CREATE TABLE weekly_digests (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  insights TEXT[] DEFAULT '{}',
  matches INTEGER DEFAULT 0,
  streak_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation logs table
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  flagged_reasons TEXT[] DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  suggested_action TEXT NOT NULL CHECK (suggested_action IN ('allow', 'warn', 'block', 'review')),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reports table
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. Start the development server
```bash
# Start in development mode
npm start

# Or with debug logging
EXPO_DEBUG=true npm start

# For web development
npm run web

# For production build
npm run build:production
```

5. Open the app
- Web: http://localhost:8081
- Mobile: Scan QR code with Expo Go app
- Simulator: Press 'i' for iOS or 'a' for Android

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CleanVoiceInput.tsx      # Voice input component
│   ├── FeedbackSystem.tsx       # User feedback system
│   └── withSimpleFeedback.tsx   # HOC for feedback integration
├── contexts/           # React contexts for state management
│   ├── AppStateContext.tsx      # Global app state
│   └── FeedbackContext.tsx      # Feedback system state
├── screens/            # Main app screens
│   ├── PixelPerfectHomeScreen.tsx       # Main home screen
│   ├── PixelPerfectReflectScreen.tsx    # Daily reflection screen
│   ├── PixelPerfectMatchesScreen.tsx    # Matches and compatibility
│   ├── PixelPerfectProfileScreen.tsx    # User profile
│   ├── AuthScreen.tsx                   # Authentication
│   ├── ChatScreen.tsx                   # Real-time messaging
│   └── [Other screen variants]          # Development/testing screens
├── services/           # API services and business logic
│   ├── supabase.production.ts   # Backend service integration
│   ├── questionsService.ts      # Question management
│   └── feedbackDatabase.ts      # Feedback storage
├── database/           # Database schemas and migrations
│   └── production-schema.sql    # Complete PostgreSQL schema
└── utils/              # Utility functions and helpers
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run web` - Start web development server
- `npm run build` - Build for web deployment
- `npm run lint` - Run ESLint code analysis
- `npm run type-check` - Run TypeScript type checking

## Key Services

- **AuthService**: User authentication and management
- **PromptService**: Daily prompts and response handling
- **PersonaAI**: AI-powered personality analysis
- **MatchingService**: Compatibility matching algorithms
- **QARoomService**: Anonymous Q&A functionality
- **StreamChatService**: Real-time messaging
- **GamificationService**: Badges, streaks, and achievements
- **WeeklyDigestService**: Personalized insights generation
- **ModerationService**: Content safety and user reporting

## Design Philosophy

Cupido emphasizes:
- **Privacy First**: Users control when to reveal their identity
- **Meaningful Connections**: Focus on personality over appearance
- **Habit Formation**: Daily reflection builds self-awareness
- **Minimalist Design**: Apple/Airbnb-inspired clean interface with two-color palette
- **Progressive Disclosure**: Features unlock through consistent engagement
- **Safe Environment**: Robust moderation and reporting systems

## Design System

The app follows a strict minimalist design philosophy:

### Visual Design
- **Two-color palette**: Primary black (#000000) and white (#FFFFFF)
- **Accent colors**: Subtle grays for secondary elements
- **No emojis**: Clean text-based interface throughout
- **Flat icons**: Simple geometric shapes and symbols
- **Typography**: System fonts with clean, readable hierarchy

### UI Principles
- **White space**: Generous spacing for clarity and focus
- **Consistent patterns**: Reusable component design
- **Touch-friendly**: Minimum 44px touch targets
- **Accessibility**: High contrast and screen reader support
- **Progressive enhancement**: Core functionality works without JavaScript

## Product Documentation - Current and Roadmap

### Current Experience
- [`DEMO_GUIDE.md`](../Product%20Documentation/DEMO_GUIDE.md) walks through the end-to-end reflective dating flow.
- [`QUICK_START.md`](../Code%20Documentation/QUICK_START.md) covers onboarding steps for internal demos and pilots.
- [`APP_ANALYSIS.md`](../Product%20Documentation/APP_ANALYSIS.md) breaks down user personas, behaviors, and engagement loops.

### Research & Feedback
- [`FEEDBACK_SYSTEM.md`](../Product%20Documentation/FEEDBACK_SYSTEM.md) details the in-app feedback loops and moderation escalations.
- [`IMPROVEMENTS_SUMMARY.md`](../Product%20Documentation/IMPROVEMENTS_SUMMARY.md) captures recent qualitative learnings and shipped refinements.
- [`REFLECTION_UI_IMPROVEMENTS.md`](../Product%20Documentation/REFLECTION_UI_IMPROVEMENTS.md) outlines UX adjustments driven by user testing.

### Roadmap Highlights
- [`PRODUCT_ROADMAP.md`](../Product%20Documentation/PRODUCT_ROADMAP.md) lists near-, mid-, and long-term feature priorities.
- [`DEPLOYMENT_ROADMAP.md`](../Product%20Documentation/DEPLOYMENT_ROADMAP.md) sequences release milestones across environments.
- [`PRODUCTION_READY_SUMMARY.md`](../Product%20Documentation/PRODUCTION_READY_SUMMARY.md) summarizes remaining gaps before a GA launch.

## Code Documentation

### Architecture & Data Flow
- [`SYSTEM_ARCHITECTURE.md`](../Code%20Documentation/SYSTEM_ARCHITECTURE.md) diagrams the client, services, and Supabase integration.
- [`API.md`](../Code%20Documentation/API.md) and [`API_REQUIREMENTS.md`](../Code%20Documentation/API_REQUIREMENTS.md) describe current contracts and expected evolutions.
- [`DESIGN_ANALYSIS.md`](../Product%20Documentation/DESIGN_ANALYSIS.md) explains design principles that influence component structure.

### Component & Screen Reference
- `COMPONENT_GUIDE.md` catalogs reusable UI primitives and their props.
- `src/screens/` contains pixel-perfect screen variants for home, reflect, matches, and profile views.
- `src/components/` houses shared inputs, feedback utilities, and higher-order wrappers.

### Services, State, and Data
- `src/services/` centralizes Supabase access, matching logic, and analytics helpers.
- `src/contexts/` documents global state providers for app flow and feedback.
- `database/production-schema.sql` reflects the canonical PostgreSQL schema.

### Testing & Quality
- `tests/` holds integration and scenario-driven test cases.
- [`DEBUG_RUNBOOK.md`](../Code%20Documentation/DEBUG_RUNBOOK.md) and [`RESTORE_INSTRUCTIONS.md`](../Code%20Documentation/RESTORE_INSTRUCTIONS.md) provide workflows for diagnosing issues and recovering environments.
- [`VERSIONING_GUIDE.md`](../Code%20Documentation/VERSIONING_GUIDE.md) establishes release numbering and changelog expectations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact [support@cupido.app](mailto:support@cupido.app)
# Test dashboard deployment fix
