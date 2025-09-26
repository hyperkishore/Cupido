# Debug Runbook - Cupido

## Prerequisites
- Node.js v16 or higher
- npm or yarn
- Git
- Terminal access

## Run Steps
1. Navigate to the project root:
   ```bash
   cd /Users/kishore/Desktop/Claude-experiments/Cupido
   ```
2. Install dependencies if needed:
   ```bash
   npm install
   ```
3. Stop any stale Expo or Node processes (safe to skip if none are running):
   ```bash
   pkill -f "expo" && pkill -f "node"
   ```
4. Launch the web debug server with an empty cache:
   ```bash
   EXPO_DEBUG=true npx expo start --clear --web
   ```
5. Wait for Metro to finish bundling; expect messages such as:
   - Starting Metro Bundler
   - warning: Bundler cache is empty, rebuilding (this may take a minute)
   - Web Bundled XXXXms index.ts (566 modules)

## Access Points
- Desktop browser: http://localhost:8081
- Mobile device on the same network: http://172.16.92.142:8081 (IP may change per network)
- Automatically open in default browser (optional):
  ```bash
  open http://localhost:8081
  ```

## Required Environment Variables
Create or update `.env` with the following keys:
```
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_ENVIRONMENT=development
REACT_APP_ANTHROPIC_API_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ENABLE_VOICE_NOTES=true
EXPO_PUBLIC_ENABLE_VIDEO_CALLS=true
EXPO_PUBLIC_ENABLE_AI_MATCHING=true
EXPO_PUBLIC_ENABLE_VOICE_INPUT=true
EXPO_PUBLIC_ENABLE_FEEDBACK_SYSTEM=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_MAX_DAILY_REFLECTIONS=10
EXPO_PUBLIC_MAX_DAILY_MATCHES=20
EXPO_PUBLIC_MAX_DAILY_MESSAGES=100
EXPO_PUBLIC_APP_NAME=Cupido
EXPO_PUBLIC_APP_VERSION=1.2.3
EXPO_PUBLIC_WEB_URL=http://localhost:8081
EXPO_PUBLIC_SHOW_DEV_TOOLS=true
EXPO_PUBLIC_DEBUG_MODE=true
```

## Alternative Commands
- Basic start without debug: `npm start`
- Web only: `npx expo start --web`
- Clear cache without debug flag: `npx expo start --clear`
- Run in background: `EXPO_DEBUG=true npx expo start --clear --web &`

## Troubleshooting
- Port 8081 busy:
  ```bash
  lsof -i :8081
  kill -9 <PID>
  ```
- Bundling failures:
  ```bash
  rm -rf node_modules
  npm install
  npx expo start --clear
  ```
- Debug logging:
  - Browser: open developer tools console
  - Terminal: logs appear automatically with `EXPO_DEBUG=true`

## Current Debug Defaults
- Debug mode enabled (`EXPO_DEBUG=true`)
- Port 8081
- Reference network IP: 172.16.92.142 (update if network changes)
- 566 modules bundled with React Native Web and Metro Bundler v0.20.17

## Quick Commands for Another Agent
```bash
cd /Users/kishore/Desktop/Claude-experiments/Cupido
pkill -f "expo" && pkill -f "node"
EXPO_DEBUG=true npx expo start --clear --web
```
