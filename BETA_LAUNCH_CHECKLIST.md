# Beta Production Launch Checklist

## 🔴 Critical Issues to Fix (Must Have)

### 1. API Key Security
**Problem**: API keys in client-side code
**Fix Needed**: 
- Move all AI calls to server-side proxy
- Never expose Anthropic/OpenAI keys in client
- Implement server endpoint: `/api/chat` 
```javascript
// server.js
app.post('/api/chat', authenticateUser, async (req, res) => {
  const response = await callAnthropicAPI(req.body.message);
  res.json(response);
});
```

### 2. Rate Limiting
**Problem**: Users can spam expensive AI calls
**Fix Needed**:
- Limit to 50 messages per user per day
- Add cooldown between messages (2-3 seconds)
- Track usage in database
```sql
ALTER TABLE profiles ADD COLUMN daily_message_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_message_reset DATE;
```

### 3. Error Recovery
**Problem**: App crashes on network errors
**Fix Needed**:
- Wrap all API calls in try-catch
- Show user-friendly error messages
- Add retry logic for transient failures
- Fallback responses when AI unavailable

### 4. Data Cleanup
**Problem**: 26 demo users and invalid profiles in database
**Fix Needed**:
```sql
-- Clean up demo and invalid profiles
DELETE FROM profiles WHERE phone_number LIKE 'demo_%';
DELETE FROM profiles WHERE phone_number IS NULL;
DELETE FROM profiles WHERE LENGTH(phone_number) > 20 AND phone_number LIKE '%-%-%-%';
```

## 🟡 Important for Beta (Should Have)

### 5. Loading States
**Current**: No feedback during AI responses
**Fix**: 
- Add typing indicator when AI is thinking
- Show message send progress
- Disable send button while processing
- Add skeleton loaders for message history

### 6. Session Management
**Current**: Sessions never expire
**Fix**:
- Add 24-hour session timeout
- Clear old sessions from active_sessions table
- Auto-logout inactive users after 30 minutes
```javascript
// Add to sessionManager.ts
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
```

### 7. Basic Analytics
**Track**:
- Daily active users
- Messages sent per day
- AI model usage (Haiku vs Sonnet)
- Error rates
```sql
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8. Mobile Responsiveness
**Current Issues**:
- Send button sometimes unresponsive on mobile
- Keyboard covers input on some devices
**Fix**:
- Test on real iOS/Android devices
- Fix keyboard avoidance
- Ensure touch targets are 44x44px minimum

## 🟢 Nice to Have for Beta

### 9. Privacy & Legal
- Add `/privacy` page with basic privacy policy
- Add `/terms` page with terms of service
- Add cookie consent banner for web
- GDPR compliance basics (data export/delete)

### 10. User Feedback
- Add "Report Issue" button
- Simple feedback form
- Version number visible to users
- Contact email for support

### 11. Performance
- Lazy load old messages (pagination)
- Compress images before upload
- Cache AI responses for common questions
- Minimize bundle size (<500KB)

### 12. Monitoring
- Set up error tracking (Sentry free tier)
- Add health check endpoint
- Monitor API response times
- Alert on high error rates

## 📝 Pre-Launch Checklist

### Environment Setup
- [ ] Production Supabase instance (not dev)
- [ ] Domain name configured
- [ ] SSL certificate active
- [ ] Environment variables set correctly
- [ ] API keys rotated from dev

### Database
- [ ] Run all migrations
- [ ] Create indexes on frequently queried columns
- [ ] Set up automated backups
- [ ] Test restore procedure

### Security
- [ ] API keys server-side only
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] XSS prevention in place
- [ ] SQL injection prevention verified

### Testing
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test with slow network (3G)
- [ ] Test with no network (offline)

### Documentation
- [ ] Update README with setup instructions
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Add troubleshooting section

## 🚀 Quick Fixes for Immediate Beta

If you need to launch ASAP, these are the absolute minimums:

1. **Move API keys server-side** (2 hours)
2. **Add rate limiting** (1 hour)
3. **Clean up demo data** (30 min)
4. **Add error handling** (2 hours)
5. **Fix mobile send button** (1 hour)
6. **Add loading states** (1 hour)
7. **Add privacy/terms pages** (1 hour)

**Total: ~8 hours of work for minimal viable beta**

## 📊 Success Metrics for Beta

- No exposed API keys
- <1% error rate
- <3 second AI response time
- 90% mobile compatibility
- Zero data loss incidents
- User can have full conversation without crashes

## 🎯 Launch Strategy

1. **Soft Launch**: 10-20 friends/family first
2. **Gather Feedback**: 1 week of testing
3. **Fix Critical Issues**: Address top complaints
4. **Expand Beta**: 100-200 users
5. **Monitor & Iterate**: Daily monitoring
6. **Public Beta**: After 2 weeks stable

## 💡 MVP Feature Set

Current features that work and should be highlighted:
- AI-powered conversations
- Image sharing and analysis
- Message history
- Cross-device sync (same phone number)
- Reflection prompts

Features to disable/hide for beta:
- Voice notes (if unstable)
- Video calls (if not ready)
- Complex matching algorithms
- Payment/subscription flows

## 🛑 Blockers for Launch

Must fix before ANY users:
1. API keys exposed in client
2. No rate limiting
3. Database has test data

Should fix before beta:
1. No error recovery
2. No loading states
3. No session timeout

Can fix after beta launch:
1. Advanced analytics
2. Performance optimization
3. Additional features