# Cupido - Privacy-First Dating App

Cupido is a privacy-first, habit-forming dating app that replaces swipe fatigue with a daily self-discovery ritual. Users answer short, introspective prompts which an AI engine converts into evolving "personas" for trait-based matching.

## Features

### Core Functionality
- **Daily Introspective Prompts**: Text and voice responses to thoughtful questions
- **AI Persona Generation**: Machine learning creates personality profiles from responses
- **Graph-Based Matching**: Neo4j-powered compatibility matching using personality traits
- **Anonymous Q&A Rooms**: Get to know matches before revealing identities
- **Real-time Messaging**: Stream Chat integration for private conversations

### Gamification
- **Streak System**: Maintain daily reflection habits
- **Badges & Achievements**: Unlock rewards for consistent engagement
- **Weekly Digest**: Personalized insights and progress summaries
- **Personality Insights**: Understand your evolving traits and growth

### Safety & Privacy
- **AI Moderation**: Automated content filtering and safety measures
- **Privacy-First**: Anonymous matching before identity reveal
- **Secure Storage**: Encrypted data with Supabase
- **Report System**: User reporting and moderation tools

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Graph Database**: Neo4j Aura for matching algorithms
- **Real-time Chat**: Stream Chat SDK
- **AI/ML**: Custom personality analysis engine
- **Design**: Minimalist black-and-white UI theme

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Supabase account
- Neo4j Aura account
- Stream Chat account

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
Create a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_NEO4J_URI=your_neo4j_uri
EXPO_PUBLIC_NEO4J_USERNAME=your_neo4j_username
EXPO_PUBLIC_NEO4J_PASSWORD=your_neo4j_password
EXPO_PUBLIC_STREAM_API_KEY=your_stream_api_key
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

5. Start the development server
```bash
npm start
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── navigation/         # Navigation setup
├── screens/            # Main app screens
├── services/           # API services and business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and theme
```

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
- **Minimalist Design**: Clean, distraction-free interface
- **Safe Environment**: Robust moderation and reporting systems

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