// Supabase Configuration
// Replace these with your actual Supabase credentials from your project dashboard
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Long JWT token from Supabase dashboard

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} userData - Additional user data (name, age, location, etc.)
 * @returns {Promise<object>} User data or error
 */
async function signUp(email, password, userData) {
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // 2. Create profile record (triggers automatically via database trigger)
        // But we'll update it with additional data
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                name: userData.name,
                age: userData.age,
                location: userData.location,
                occupation: userData.occupation || null,
            })
            .eq('id', authData.user.id);

        if (profileError) throw profileError;

        return { success: true, user: authData.user };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} User data or error
 */
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out the current user
 * @returns {Promise<object>} Success or error
 */
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Signout error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get the current logged-in user
 * @returns {Promise<object>} User object or null
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
async function isAuthenticated() {
    const user = await getCurrentUser();
    return user !== null;
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile by ID
 * @param {string} userId - User's UUID
 * @returns {Promise<object>} Profile data or null
 */
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

/**
 * Update user profile
 * @param {string} userId - User's UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Success or error
 */
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// SWIPE & MATCHING FUNCTIONS
// ============================================

/**
 * Get potential matches for swiping (users not yet swiped on)
 * @param {string} userId - Current user's ID
 * @param {number} limit - Number of profiles to fetch
 * @returns {Promise<array>} Array of profiles
 */
async function getPotentialMatches(userId, limit = 10) {
    try {
        // Get all users the current user has already swiped on
        const { data: swipedUsers, error: swipeError } = await supabase
            .from('swipes')
            .select('target_user_id')
            .eq('user_id', userId);

        if (swipeError) throw swipeError;

        const swipedIds = swipedUsers.map(s => s.target_user_id);

        // Get profiles not yet swiped on (excluding current user)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', userId)
            .not('id', 'in', `(${swipedIds.join(',') || 'null'})`)
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Get potential matches error:', error);
        return [];
    }
}

/**
 * Record a swipe (like or pass)
 * @param {string} userId - Current user's ID
 * @param {string} targetUserId - User being swiped on
 * @param {string} action - 'like' or 'pass'
 * @returns {Promise<object>} Match data if mutual like, or success status
 */
async function recordSwipe(userId, targetUserId, action) {
    try {
        // 1. Insert the swipe
        const { error: swipeError } = await supabase
            .from('swipes')
            .insert({
                user_id: userId,
                target_user_id: targetUserId,
                action: action
            });

        if (swipeError) throw swipeError;

        // 2. If it's a like, check for mutual match
        if (action === 'like') {
            const { data: mutualSwipe, error: mutualError } = await supabase
                .from('swipes')
                .select('*')
                .eq('user_id', targetUserId)
                .eq('target_user_id', userId)
                .eq('action', 'like')
                .single();

            // If mutual like exists, create a match
            if (mutualSwipe) {
                const { data: matchData, error: matchError } = await supabase
                    .from('matches')
                    .insert({
                        user1_id: userId < targetUserId ? userId : targetUserId,
                        user2_id: userId < targetUserId ? targetUserId : userId
                    })
                    .select()
                    .single();

                if (matchError) throw matchError;

                return { success: true, isMatch: true, matchData };
            }
        }

        return { success: true, isMatch: false };
    } catch (error) {
        console.error('Record swipe error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all matches for a user
 * @param {string} userId - User's ID
 * @returns {Promise<array>} Array of matches with profile data
 */
async function getMatches(userId) {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *,
                user1:profiles!matches_user1_id_fkey(*),
                user2:profiles!matches_user2_id_fkey(*)
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (error) throw error;

        // Format matches to include the OTHER user's profile
        const formattedMatches = data.map(match => {
            const otherUser = match.user1_id === userId ? match.user2 : match.user1;
            return {
                matchId: match.id,
                matchedAt: match.matched_at,
                profile: otherUser
            };
        });

        return formattedMatches;
    } catch (error) {
        console.error('Get matches error:', error);
        return [];
    }
}

// ============================================
// MESSAGING FUNCTIONS
// ============================================

/**
 * Get messages for a specific match
 * @param {string} matchId - Match ID
 * @returns {Promise<array>} Array of messages
 */
async function getMessages(matchId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Get messages error:', error);
        return [];
    }
}

/**
 * Send a message in a match
 * @param {string} matchId - Match ID
 * @param {string} senderId - Sender's user ID
 * @param {string} content - Message content
 * @returns {Promise<object>} Message data or error
 */
async function sendMessage(matchId, senderId, content) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                match_id: matchId,
                sender_id: senderId,
                content: content
            })
            .select()
            .single();

        if (error) throw error;

        // Update last_message_at in matches table
        await supabase
            .from('matches')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', matchId);

        return { success: true, data };
    } catch (error) {
        console.error('Send message error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Subscribe to new messages in real-time
 * @param {string} matchId - Match ID
 * @param {function} callback - Function to call when new message arrives
 * @returns {object} Subscription object
 */
function subscribeToMessages(matchId, callback) {
    return supabase
        .channel(`messages:${matchId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `match_id=eq.${matchId}`
            }, 
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
}

// ============================================
// AUTHENTICATION STATE LISTENER
// ============================================

/**
 * Listen for auth state changes (login/logout)
 * @param {function} callback - Function to call on auth state change
 */
function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// Export functions for use in app.js
window.supabaseAuth = {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isAuthenticated,
    getUserProfile,
    updateUserProfile,
    getPotentialMatches,
    recordSwipe,
    getMatches,
    getMessages,
    sendMessage,
    subscribeToMessages,
    onAuthStateChange
};

console.log('Supabase initialized successfully');
