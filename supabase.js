// Supabase Configuration
// Replace these with your actual Supabase credentials from:
// Supabase Dashboard -> Settings -> API

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Your anon/public key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication Functions
const SupabaseAuth = {
    // Sign up new user
    async signUp(email, password, userData) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: userData.name,
                        age: userData.age,
                        location: userData.location,
                        occupation: userData.occupation
                    }
                }
            });

            if (error) throw error;
            
            // Profile is auto-created by database trigger
            // Update profile with additional data
            if (data.user) {
                await this.updateProfile(data.user.id, userData);
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in existing user
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Signout error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },

    // Update user profile
    async updateProfile(userId, profileData) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    name: profileData.name,
                    age: profileData.age,
                    location: profileData.location,
                    occupation: profileData.occupation,
                    bio: profileData.bio || '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select();

            if (error) throw error;
            return { success: true, profile: data[0] };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user profile
    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, profile: data };
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Swipe Functions
const SupabaseSwipes = {
    // Record a swipe (like or pass)
    async recordSwipe(targetUserId, action) {
        try {
            const user = await SupabaseAuth.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('swipes')
                .insert({
                    user_id: user.id,
                    target_user_id: targetUserId,
                    action: action
                })
                .select();

            if (error) throw error;

            // Check for mutual like (match)
            if (action === 'like') {
                const match = await this.checkForMatch(user.id, targetUserId);
                return { success: true, swipe: data[0], match: match };
            }

            return { success: true, swipe: data[0], match: null };
        } catch (error) {
            console.error('Record swipe error:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if two users have matched
    async checkForMatch(userId, targetUserId) {
        try {
            // Check if target user also liked current user
            const { data, error } = await supabase
                .from('swipes')
                .select('*')
                .eq('user_id', targetUserId)
                .eq('target_user_id', userId)
                .eq('action', 'like')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            // If mutual like exists, create match
            if (data) {
                return await this.createMatch(userId, targetUserId);
            }

            return null;
        } catch (error) {
            console.error('Check match error:', error);
            return null;
        }
    },

    // Create a match between two users
    async createMatch(user1Id, user2Id) {
        try {
            // Ensure user1Id < user2Id for uniqueness
            const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

            const { data, error } = await supabase
                .from('matches')
                .insert({
                    user1_id: smallerId,
                    user2_id: largerId
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create match error:', error);
            return null;
        }
    },

    // Get potential matches (users not yet swiped on)
    async getPotentialMatches(limit = 10) {
        try {
            const user = await SupabaseAuth.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            // Get users the current user hasn't swiped on yet
            const { data: swipedUserIds, error: swipeError } = await supabase
                .from('swipes')
                .select('target_user_id')
                .eq('user_id', user.id);

            if (swipeError) throw swipeError;

            const swipedIds = swipedUserIds.map(s => s.target_user_id);
            swipedIds.push(user.id); // Exclude current user

            // Get profiles not yet swiped on
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .not('id', 'in', `(${swipedIds.join(',')})`)
                .limit(limit);

            if (profileError) throw profileError;
            return { success: true, profiles: profiles };
        } catch (error) {
            console.error('Get potential matches error:', error);
            return { success: false, error: error.message, profiles: [] };
        }
    }
};

// Match Functions
const SupabaseMatches = {
    // Get all matches for current user
    async getMatches() {
        try {
            const user = await SupabaseAuth.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    user1:profiles!matches_user1_id_fkey(*),
                    user2:profiles!matches_user2_id_fkey(*)
                `)
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order('matched_at', { ascending: false });

            if (error) throw error;

            // Format matches to show the other user
            const formattedMatches = data.map(match => {
                const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
                return {
                    matchId: match.id,
                    matchedAt: match.matched_at,
                    lastMessageAt: match.last_message_at,
                    otherUser: otherUser
                };
            });

            return { success: true, matches: formattedMatches };
        } catch (error) {
            console.error('Get matches error:', error);
            return { success: false, error: error.message, matches: [] };
        }
    }
};

// Message Functions
const SupabaseMessages = {
    // Send a message
    async sendMessage(matchId, content) {
        try {
            const user = await SupabaseAuth.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    match_id: matchId,
                    sender_id: user.id,
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

            return { success: true, message: data };
        } catch (error) {
            console.error('Send message error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get messages for a match
    async getMessages(matchId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*, sender:profiles(name, profile_photo_url)')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, messages: data };
        } catch (error) {
            console.error('Get messages error:', error);
            return { success: false, error: error.message, messages: [] };
        }
    },

    // Subscribe to new messages in a match (real-time)
    subscribeToMessages(matchId, callback) {
        const subscription = supabase
            .channel(`messages:${matchId}`)
            .on(
                'postgres_changes',
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

        return subscription;
    },

    // Unsubscribe from messages
    unsubscribeFromMessages(subscription) {
        supabase.removeChannel(subscription);
    }
};

// Export all functions
window.SupabaseAuth = SupabaseAuth;
window.SupabaseSwipes = SupabaseSwipes;
window.SupabaseMatches = SupabaseMatches;
window.SupabaseMessages = SupabaseMessages;
