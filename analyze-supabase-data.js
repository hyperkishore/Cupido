const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env
const SUPABASE_URL = 'https://fupoylarelcwiewnvoyu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cG95bGFyZWxjd2lld252b3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzE2NjEsImV4cCI6MjA3NDY0NzY2MX0.te1p1ZKdK1M3ARrT4sG3b-h-ukV7TIcGFHMI9XtPUi4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeSupabaseData() {
    console.log('🔍 Analyzing Supabase Production Data...\n');
    console.log('=' .repeat(80));

    try {
        // 1. Check for conversations table
        console.log('\n📊 Checking for conversation tables...');

        // Try different possible table names
        const tableNames = ['conversations', 'chats', 'messages', 'chat_messages', 'user_chats', 'chat_sessions'];
        let foundTables = [];

        for (const tableName of tableNames) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (!error) {
                    foundTables.push(tableName);
                    console.log(`✅ Found table: ${tableName}`);
                }
            } catch (e) {
                // Table doesn't exist, continue
            }
        }

        if (foundTables.length === 0) {
            console.log('❌ No conversation tables found in Supabase');

            // Check for profiles/users table instead
            console.log('\n📊 Checking for user profiles...');
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .limit(10);

            if (!profileError && profiles) {
                console.log(`✅ Found ${profiles.length} user profiles`);
                analyzeProfiles(profiles);
            }

            const { data: users, error: userError } = await supabase
                .from('users')
                .select('*')
                .limit(10);

            if (!userError && users) {
                console.log(`✅ Found ${users.length} users`);
                analyzeUsers(users);
            }
            return;
        }

        // 2. Analyze each found table
        for (const tableName of foundTables) {
            console.log(`\n\n📊 Analyzing table: ${tableName}`);
            console.log('-'.repeat(50));

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error(`Error fetching from ${tableName}:`, error.message);
                continue;
            }

            if (!data || data.length === 0) {
                console.log(`No data found in ${tableName}`);
                continue;
            }

            // 3. Analyze the conversations
            console.log(`Found ${data.length} records`);

            // Group by user if possible
            const userGroups = {};
            const messageTypes = { user: 0, assistant: 0, system: 0 };
            const messageContents = [];
            const timestamps = [];

            data.forEach(record => {
                // Try to identify user field
                const userId = record.user_id || record.userId || record.user || 'unknown';
                if (!userGroups[userId]) {
                    userGroups[userId] = [];
                }
                userGroups[userId].push(record);

                // Analyze message content
                if (record.message || record.content || record.text) {
                    const content = record.message || record.content || record.text;
                    messageContents.push(content);

                    // Count message types
                    const role = record.role || record.sender || 'unknown';
                    if (role.includes('user')) messageTypes.user++;
                    else if (role.includes('assistant') || role.includes('bot')) messageTypes.assistant++;
                    else if (role.includes('system')) messageTypes.system++;
                }

                // Collect timestamps
                if (record.created_at || record.timestamp) {
                    timestamps.push(record.created_at || record.timestamp);
                }
            });

            // 4. Generate insights
            console.log('\n📈 INSIGHTS:');
            console.log(`- Unique users: ${Object.keys(userGroups).length}`);
            console.log(`- Message breakdown: User: ${messageTypes.user}, Assistant: ${messageTypes.assistant}, System: ${messageTypes.system}`);
            console.log(`- Average messages per user: ${Math.round(data.length / Object.keys(userGroups).length)}`);

            // 5. Analyze conversation patterns
            console.log('\n🔍 CONVERSATION PATTERNS:');

            // Find common user responses
            const userMessages = messageContents.filter((msg, idx) => {
                const record = data[idx];
                const role = record.role || record.sender || '';
                return role.includes('user');
            });

            if (userMessages.length > 0) {
                console.log(`\nSample User Messages (first 10):`);
                userMessages.slice(0, 10).forEach(msg => {
                    console.log(`  - "${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}"`);
                });

                // Analyze message lengths
                const avgLength = userMessages.reduce((sum, msg) => sum + msg.length, 0) / userMessages.length;
                console.log(`\nAverage user message length: ${Math.round(avgLength)} characters`);

                // Find short responses (potential disengagement)
                const shortResponses = userMessages.filter(msg => msg.length < 20);
                console.log(`Short responses (<20 chars): ${shortResponses.length} (${Math.round(shortResponses.length/userMessages.length*100)}%)`);
            }

            // 6. User engagement analysis
            console.log('\n👥 USER ENGAGEMENT:');
            Object.entries(userGroups).forEach(([userId, messages]) => {
                if (messages.length > 3) { // Only analyze users with multiple messages
                    console.log(`\nUser ${userId.substring(0, 8)}...:`);
                    console.log(`  - Total messages: ${messages.length}`);

                    // Check if conversation completed
                    const hasName = messages.some(m => (m.message || m.content || '').toLowerCase().match(/my name|i'm |i am /));
                    const hasAge = messages.some(m => (m.message || m.content || '').match(/\d{2}/));
                    const hasLocation = messages.some(m => (m.message || m.content || '').match(/[A-Z][a-z]+/));

                    console.log(`  - Profile completion: Name:${hasName ? '✓' : '✗'} Age:${hasAge ? '✓' : '✗'} Location:${hasLocation ? '✓' : '✗'}`);
                }
            });

            // 7. Time-based analysis
            if (timestamps.length > 0) {
                console.log('\n⏰ TEMPORAL ANALYSIS:');
                const sortedTimes = timestamps.sort();
                console.log(`- First conversation: ${sortedTimes[0]}`);
                console.log(`- Latest conversation: ${sortedTimes[sortedTimes.length - 1]}`);

                // Activity by day of week
                const dayActivity = {};
                timestamps.forEach(ts => {
                    const day = new Date(ts).toLocaleDateString('en-US', { weekday: 'long' });
                    dayActivity[day] = (dayActivity[day] || 0) + 1;
                });
                console.log(`- Activity by day:`, dayActivity);
            }
        }

    } catch (error) {
        console.error('❌ Error analyzing Supabase data:', error);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis Complete');
}

function analyzeProfiles(profiles) {
    console.log('\n👤 PROFILE ANALYSIS:');
    profiles.forEach(profile => {
        console.log(`\nUser: ${profile.id || profile.user_id}`);
        console.log(`- Name: ${profile.name || profile.full_name || 'Not set'}`);
        console.log(`- Email: ${profile.email || 'Not set'}`);
        console.log(`- Created: ${profile.created_at || profile.updated_at || 'Unknown'}`);

        // Check for any chat-related fields
        if (profile.last_message || profile.chat_count || profile.conversation_count) {
            console.log(`- Chat activity: ${JSON.stringify({
                last_message: profile.last_message,
                chat_count: profile.chat_count,
                conversation_count: profile.conversation_count
            })}`);
        }
    });
}

function analyzeUsers(users) {
    console.log('\n👥 USER ANALYSIS:');
    users.forEach(user => {
        console.log(`\nUser: ${user.id}`);
        console.log(`- Email: ${user.email || 'Not set'}`);
        console.log(`- Created: ${user.created_at || 'Unknown'}`);
        console.log(`- Last sign in: ${user.last_sign_in_at || 'Never'}`);
    });
}

// Run the analysis
analyzeSupabaseData().catch(console.error);