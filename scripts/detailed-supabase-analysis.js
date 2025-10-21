const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://fupoylarelcwiewnvoyu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cG95bGFyZWxjd2lld252b3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzE2NjEsImV4cCI6MjA3NDY0NzY2MX0.te1p1ZKdK1M3ARrT4sG3b-h-ukV7TIcGFHMI9XtPUi4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function detailedAnalysis() {
    console.log('\n🔍 DETAILED SUPABASE ANALYSIS - PRODUCTION CHAT DATA\n');
    console.log('=' .repeat(80));

    try {
        // 1. Fetch ALL chat messages
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching chat messages:', error);
            return;
        }

        if (!messages || messages.length === 0) {
            console.log('No chat messages found');
            return;
        }

        console.log(`\n📊 TOTAL MESSAGES FOUND: ${messages.length}\n`);

        // 2. Show sample record structure
        console.log('📋 SAMPLE MESSAGE STRUCTURE:');
        console.log(JSON.stringify(messages[0], null, 2));
        console.log('\n' + '-'.repeat(80));

        // 3. Group messages by session/user
        const sessions = {};
        const userIds = new Set();
        const allUserMessages = [];
        const allBotMessages = [];

        messages.forEach(msg => {
            // Extract session/user identifier
            const sessionId = msg.session_id || msg.user_id || msg.userId || 'unknown';
            const userId = msg.user_id || msg.userId || sessionId;

            userIds.add(userId);

            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    messages: [],
                    startTime: msg.created_at,
                    endTime: msg.created_at,
                    userId: userId
                };
            }

            sessions[sessionId].messages.push(msg);
            sessions[sessionId].endTime = msg.created_at;

            // Categorize messages
            if (msg.role === 'user' || msg.sender === 'user') {
                allUserMessages.push(msg);
            } else if (msg.role === 'assistant' || msg.role === 'bot' || msg.sender === 'bot') {
                allBotMessages.push(msg);
            }
        });

        // 4. User Statistics
        console.log('\n👥 USER STATISTICS:');
        console.log(`- Unique users: ${userIds.size}`);
        console.log(`- Total sessions: ${Object.keys(sessions).length}`);
        console.log(`- User messages: ${allUserMessages.length}`);
        console.log(`- Bot messages: ${allBotMessages.length}`);
        console.log(`- Average messages per session: ${Math.round(messages.length / Object.keys(sessions).length)}`);

        // 5. Analyze each session
        console.log('\n\n📊 SESSION ANALYSIS:\n');

        Object.entries(sessions).slice(0, 5).forEach(([sessionId, session], idx) => {
            console.log(`\n${idx + 1}. Session: ${sessionId.substring(0, 20)}...`);
            console.log(`   User ID: ${session.userId}`);
            console.log(`   Messages: ${session.messages.length}`);
            console.log(`   Duration: ${getTimeDiff(session.startTime, session.endTime)}`);

            // Analyze conversation content
            const conversation = session.messages;
            console.log('\n   CONVERSATION FLOW:');

            conversation.slice(0, 8).forEach((msg, i) => {
                const role = msg.role || msg.sender || 'unknown';
                const content = msg.content || msg.message || msg.text || '';
                const preview = content.substring(0, 80);
                console.log(`     ${i+1}. [${role}]: "${preview}${content.length > 80 ? '...' : ''}"`);
            });

            if (conversation.length > 8) {
                console.log(`     ... and ${conversation.length - 8} more messages`);
            }

            // Extract profile information collected
            const profileData = extractProfileInfo(conversation);
            console.log('\n   PROFILE DATA COLLECTED:');
            Object.entries(profileData).forEach(([key, value]) => {
                if (value) console.log(`     - ${key}: ${value}`);
            });
        });

        // 6. Content Analysis
        console.log('\n\n📝 CONTENT ANALYSIS:\n');

        // Analyze user response patterns
        if (allUserMessages.length > 0) {
            const userResponses = allUserMessages.map(m => m.content || m.message || m.text || '');
            const avgLength = userResponses.reduce((sum, msg) => sum + msg.length, 0) / userResponses.length;

            console.log('USER RESPONSE PATTERNS:');
            console.log(`- Average response length: ${Math.round(avgLength)} characters`);

            // Categorize response lengths
            const veryShort = userResponses.filter(r => r.length < 10).length;
            const short = userResponses.filter(r => r.length >= 10 && r.length < 30).length;
            const medium = userResponses.filter(r => r.length >= 30 && r.length < 100).length;
            const long = userResponses.filter(r => r.length >= 100).length;

            console.log(`- Very short (<10 chars): ${veryShort} (${Math.round(veryShort/userResponses.length*100)}%)`);
            console.log(`- Short (10-30 chars): ${short} (${Math.round(short/userResponses.length*100)}%)`);
            console.log(`- Medium (30-100 chars): ${medium} (${Math.round(medium/userResponses.length*100)}%)`);
            console.log(`- Long (>100 chars): ${long} (${Math.round(long/userResponses.length*100)}%)`);

            // Show example responses
            console.log('\nSAMPLE USER RESPONSES:');
            const sampleResponses = userResponses
                .filter(r => r.length > 5)
                .slice(0, 10);

            sampleResponses.forEach((response, i) => {
                console.log(`  ${i+1}. "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);
            });
        }

        // 7. Engagement Analysis
        console.log('\n\n🎯 ENGAGEMENT ANALYSIS:\n');

        // Find where users drop off
        const sessionLengths = Object.values(sessions).map(s => s.messages.length);
        const dropoffPoints = sessionLengths.filter(len => len < 10);

        console.log(`- Sessions with <10 messages (early dropoff): ${dropoffPoints.length} (${Math.round(dropoffPoints.length/sessionLengths.length*100)}%)`);
        console.log(`- Completed profile sessions (>15 messages): ${sessionLengths.filter(len => len > 15).length}`);

        // Time analysis
        console.log('\n⏰ TEMPORAL PATTERNS:');
        const hourlyActivity = {};
        messages.forEach(msg => {
            const hour = new Date(msg.created_at).getHours();
            hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourlyActivity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        console.log('- Peak activity hours:');
        peakHours.forEach(([hour, count]) => {
            console.log(`  ${hour}:00 - ${count} messages`);
        });

        // 8. Recommendations based on data
        console.log('\n\n💡 DATA-DRIVEN RECOMMENDATIONS:\n');
        generateDataDrivenRecommendations(messages, sessions, allUserMessages);

    } catch (error) {
        console.error('❌ Error:', error);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis Complete\n');
}

function extractProfileInfo(conversation) {
    const profile = {
        name: null,
        age: null,
        gender: null,
        location: null,
        occupation: null,
        interests: null,
        relationship_goal: null
    };

    conversation.forEach(msg => {
        const content = (msg.content || msg.message || msg.text || '').toLowerCase();
        const role = msg.role || msg.sender || '';

        if (role.includes('user')) {
            // Check for name
            if (!profile.name && (content.includes('my name is') || content.includes("i'm ") || content.includes('call me'))) {
                const nameMatch = content.match(/(?:name is|i'm |call me )([a-z]+)/i);
                if (nameMatch) profile.name = nameMatch[1];
            }

            // Check for age
            if (!profile.age) {
                const ageMatch = content.match(/\b(1[89]|[2-9]\d)\b/);
                if (ageMatch) profile.age = ageMatch[1];
            }

            // Check for location
            const locationMatch = content.match(/(?:from |in |at |live in )([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
            if (locationMatch) profile.location = locationMatch[1];

            // Check for occupation
            if (content.includes('work') || content.includes('job') || content.includes('career')) {
                profile.occupation = content.substring(0, 50);
            }

            // Check for interests
            if (content.includes('like') || content.includes('love') || content.includes('enjoy')) {
                profile.interests = content.substring(0, 50);
            }
        }
    });

    return profile;
}

function getTimeDiff(start, end) {
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

function generateDataDrivenRecommendations(messages, sessions, userMessages) {
    const avgUserResponseLength = userMessages.reduce((sum, m) => {
        const content = m.content || m.message || m.text || '';
        return sum + content.length;
    }, 0) / (userMessages.length || 1);

    const recommendations = [];

    // Based on response length
    if (avgUserResponseLength < 30) {
        recommendations.push({
            issue: 'Very short user responses',
            suggestion: 'Users are giving minimal responses. Add more engaging questions and show enthusiasm for their answers.'
        });
    }

    // Based on dropout rate
    const dropoutRate = Object.values(sessions).filter(s => s.messages.length < 10).length / Object.keys(sessions).length;
    if (dropoutRate > 0.3) {
        recommendations.push({
            issue: 'High early dropout rate (>30%)',
            suggestion: 'Too many users leaving early. Make opening more engaging and reduce formal data collection.'
        });
    }

    // Based on session patterns
    const avgSessionLength = Object.values(sessions).reduce((sum, s) => sum + s.messages.length, 0) / Object.keys(sessions).length;
    if (avgSessionLength < 15) {
        recommendations.push({
            issue: 'Short average conversations',
            suggestion: 'Add value exchanges - give dating tips, profile suggestions, or interesting facts during conversation.'
        });
    }

    console.log('RECOMMENDATIONS BASED ON ACTUAL DATA:\n');
    recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. Issue: ${rec.issue}`);
        console.log(`   Solution: ${rec.suggestion}\n`);
    });

    // Specific prompt improvements
    console.log('\nSUGGESTED PROMPT IMPROVEMENTS:\n');
    console.log(`1. Add personality traits:
   - Use enthusiastic language: "That's awesome!" instead of "Great!"
   - Show genuine interest: "Oh wow, [hobby] sounds fascinating! How did you get into that?"
   - Use occasional emojis: 💫 ✨ 😊

2. Implement engagement recovery:
   if (response.length < 20) {
     "I can see you're more of a person of few words - that's totally cool!
      Want me to ask more specific questions or should we skip to the fun part?"
   }

3. Add value throughout conversation:
   - After 3-4 questions: "Based on what you've shared, here's a dating profile tip..."
   - When they share interests: "Oh, [interest] is perfect for a first date activity!"
   - Build connections: "You know, people who like [X] often also enjoy [Y]"

4. Improve opening sequence:
   Instead of: "Hey! I'm here to help you create an authentic dating profile."
   Try: "Hey! Ready to stand out in the dating world? 💫 Let's create a profile that actually gets you matches!"`);
}

// Run the detailed analysis
detailedAnalysis().catch(console.error);