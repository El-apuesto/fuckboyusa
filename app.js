// ============================================
// APP STATE MANAGEMENT
// ============================================

let currentUser = null;
let currentProfileIndex = 0;
let profileStack = [];
let currentMatch = null;

// ============================================
// INITIALIZATION
// ============================================

// Check auth state on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Hide splash screen after 2 seconds
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
        checkAuthAndShowScreen();
    }, 2000);
});

// Check if user is authenticated and show appropriate screen
async function checkAuthAndShowScreen() {
    const user = await supabaseAuth.getCurrentUser();
    
    if (user) {
        currentUser = user;
        await loadUserProfile();
        showMainApp();
        await loadProfilesToSwipe();
    } else {
        showOnboarding();
    }
}

// Load current user's profile
async function loadUserProfile() {
    if (!currentUser) return;
    
    const profile = await supabaseAuth.getUserProfile(currentUser.id);
    if (profile && profile.name) {
        document.getElementById('profile-name').textContent = profile.name;
    }
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

let onboardingStep = 1;

function showOnboarding() {
    hideAllScreens();
    document.getElementById('onboarding-container').classList.remove('hidden');
    updateOnboardingScreen(1);
}

function nextOnboarding() {
    onboardingStep++;
    if (onboardingStep > 3) {
        showSignup();
    } else {
        updateOnboardingScreen(onboardingStep);
    }
}

function updateOnboardingScreen(step) {
    // Hide all screens
    document.querySelectorAll('.onboarding-screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show current screen
    document.querySelector(`[data-screen="${step}"]`).classList.remove('hidden');
    
    // Update dots
    document.querySelectorAll('.onboarding-dot').forEach(dot => {
        const dotNum = parseInt(dot.dataset.dot);
        if (dotNum === step) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function showSignup() {
    hideAllScreens();
    document.getElementById('signup-screen').classList.remove('hidden');
}

function showLogin() {
    hideAllScreens();
    document.getElementById('login-screen').classList.remove('hidden');
}

function showMainApp() {
    hideAllScreens();
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    updateNavigation('swipe');
}

function showMatches() {
    hideAllScreens();
    document.getElementById('matches-screen').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    updateNavigation('matches');
    loadMatches();
}

function showProfile() {
    hideAllScreens();
    document.getElementById('profile-screen').classList.remove('hidden');
    document.getElementById('profile-screen').style.display = 'flex';
    document.getElementById('bottom-nav').classList.remove('hidden');
    updateNavigation('profile');
}

function showChat(matchId, matchProfile) {
    hideAllScreens();
    currentMatch = { id: matchId, profile: matchProfile };
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('chat-name').textContent = matchProfile.name || 'User';
    loadMessages(matchId);
}

function hideAllScreens() {
    document.getElementById('onboarding-container').classList.add('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('matches-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('profile-screen').style.display = 'none';
    document.getElementById('bottom-nav').classList.add('hidden');
}

function updateNavigation(active) {
    document.querySelectorAll('.nav-icon').forEach(icon => {
        icon.classList.remove('active');
    });
    
    const activeMap = {
        'swipe': 0,
        'matches': 1,
        'profile': 3
    };
    
    const icons = document.querySelectorAll('.nav-icon');
    if (icons[activeMap[active]]) {
        icons[activeMap[active]].classList.add('active');
    }
}

// ============================================
// AUTHENTICATION HANDLERS
// ============================================

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    const age = parseInt(document.getElementById('signup-age').value);
    const location = document.getElementById('signup-location').value;
    const occupation = document.getElementById('signup-occupation').value;
    
    const result = await supabaseAuth.signUp(email, password, {
        name,
        age,
        location,
        occupation
    });
    
    if (result.success) {
        alert('Account created! Please check your email to verify.');
        currentUser = result.user;
        showMainApp();
        await loadProfilesToSwipe();
    } else {
        alert('Signup failed: ' + result.error);
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const result = await supabaseAuth.signIn(email, password);
    
    if (result.success) {
        currentUser = result.user;
        showMainApp();
        await loadProfilesToSwipe();
    } else {
        alert('Login failed: ' + result.error);
    }
});

async function handleSignOut() {
    const result = await supabaseAuth.signOut();
    if (result.success) {
        currentUser = null;
        profileStack = [];
        showOnboarding();
    }
}

// ============================================
// SWIPE SYSTEM - CONNECTED TO REAL PROFILES
// ============================================

async function loadProfilesToSwipe() {
    if (!currentUser) return;
    
    // Get potential matches from database
    const profiles = await supabaseAuth.getPotentialMatches(currentUser.id, 20);
    
    if (profiles.length === 0) {
        showNoMoreProfiles();
        return;
    }
    
    profileStack = profiles;
    currentProfileIndex = 0;
    displayCurrentProfile();
}

function displayCurrentProfile() {
    const cardDeck = document.getElementById('card-deck');
    
    if (currentProfileIndex >= profileStack.length) {
        showNoMoreProfiles();
        return;
    }
    
    const profile = profileStack[currentProfileIndex];
    
    cardDeck.innerHTML = `
        <div class="swipe-card" style="width: 100%; max-width: 380px; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <div class="nope-badge">NOPE</div>
            <div class="like-badge">LIKE</div>
            
            <!-- Profile Image -->
            <div style="height: 480px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative; display: flex; align-items: center; justify-content: center;">
                <svg style="width: 100px; height: 100px; color: rgba(255,255,255,0.3);" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                
                <!-- Profile Info Overlay -->
                <div class="profile-gradient" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px;">
                                ${profile.name || 'Anonymous'}, ${profile.age || '??'}
                            </h3>
                            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 8px;">
                                <i class="fas fa-map-marker-alt"></i> ${profile.location || 'Location unknown'}
                            </p>
                            ${profile.occupation ? `<p style="color: rgba(255,255,255,0.8); font-size: 13px;">${profile.occupation}</p>` : ''}
                        </div>
                        ${profile.is_verified ? '<div class="verification-badge"><i class="fas fa-check"></i></div>' : ''}
                    </div>
                    ${profile.bio ? `<p style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 12px; line-height: 1.5;">${profile.bio}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

function showNoMoreProfiles() {
    const cardDeck = document.getElementById('card-deck');
    cardDeck.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 60px; margin-bottom: 20px;">😔</div>
            <h3 style="font-size: 24px; font-weight: bold; color: #3d3d3d; margin-bottom: 12px;">No More Profiles</h3>
            <p style="color: #6d6d6d; margin-bottom: 24px;">Check back later for new matches!</p>
            <button onclick="loadProfilesToSwipe()" style="background: linear-gradient(135deg, #6b7d70, #5a6b5f); color: white; padding: 12px 24px; border: none; border-radius: 24px; font-weight: 600; cursor: pointer;">
                Refresh
            </button>
        </div>
    `;
}

async function swipeLeft() {
    if (!currentUser || currentProfileIndex >= profileStack.length) return;
    
    const profile = profileStack[currentProfileIndex];
    
    // Animate card
    const card = document.querySelector('.swipe-card');
    if (card) {
        card.classList.add('swiping-left');
        setTimeout(async () => {
            // Record the pass in database
            await supabaseAuth.recordSwipe(currentUser.id, profile.id, 'pass');
            
            // Move to next profile
            currentProfileIndex++;
            displayCurrentProfile();
        }, 300);
    }
}

async function swipeRight() {
    if (!currentUser || currentProfileIndex >= profileStack.length) return;
    
    const profile = profileStack[currentProfileIndex];
    
    // Animate card
    const card = document.querySelector('.swipe-card');
    if (card) {
        card.classList.add('swiping-right');
        setTimeout(async () => {
            // Record the like in database
            const result = await supabaseAuth.recordSwipe(currentUser.id, profile.id, 'like');
            
            // Check if it's a match!
            if (result.isMatch) {
                showMatchNotification(profile);
            }
            
            // Move to next profile
            currentProfileIndex++;
            displayCurrentProfile();
        }, 300);
    }
}

function showMatchNotification(profile) {
    // Create match popup
    const popup = document.createElement('div');
    popup.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s;">
            <div style="background: white; border-radius: 24px; padding: 40px; text-align: center; max-width: 90%; animation: scaleIn 0.3s;">
                <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
                <h2 style="font-size: 32px; font-weight: bold; background: linear-gradient(to right, #ec4899, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px;">
                    It's a Match!
                </h2>
                <p style="color: #6d6d6d; font-size: 16px; margin-bottom: 32px;">
                    You and ${profile.name || 'this user'} liked each other!
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="this.closest('div').parentElement.remove()" style="background: #e5e7eb; color: #3d3d3d; padding: 12px 24px; border: none; border-radius: 24px; font-weight: 600; cursor: pointer;">
                        Keep Swiping
                    </button>
                    <button onclick="this.closest('div').parentElement.remove(); showMatches();" style="background: linear-gradient(135deg, #ec4899, #a855f7); color: white; padding: 12px 24px; border: none; border-radius: 24px; font-weight: 600; cursor: pointer;">
                        Send Message
                    </button>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        </style>
    `;
    document.body.appendChild(popup);
}

// ============================================
// MATCHES SCREEN
// ============================================

async function loadMatches() {
    if (!currentUser) return;
    
    const matches = await supabaseAuth.getMatches(currentUser.id);
    const matchesList = document.getElementById('matches-list');
    
    if (matches.length === 0) {
        matchesList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 60px; margin-bottom: 20px;">💔</div>
                <h3 style="font-size: 20px; font-weight: bold; color: #3d3d3d; margin-bottom: 12px;">No Matches Yet</h3>
                <p style="color: #6d6d6d;">Keep swiping to find your matches!</p>
            </div>
        `;
        return;
    }
    
    matchesList.innerHTML = matches.map(match => `
        <div onclick="showChat('${match.matchId}', ${JSON.stringify(match.profile).replace(/"/g, '&quot;')})" style="background: white; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                ${(match.profile.name || 'U')[0].toUpperCase()}
            </div>
            <div style="flex: 1;">
                <h4 style="font-weight: 600; color: #3d3d3d; margin-bottom: 4px;">${match.profile.name || 'Anonymous'}</h4>
                <p style="color: #6d6d6d; font-size: 14px;">Matched ${new Date(match.matchedAt).toLocaleDateString()}</p>
            </div>
            <i class="fas fa-chevron-right" style="color: #a3a3a3;"></i>
        </div>
    `).join('');
}

// ============================================
// CHAT SYSTEM
// ============================================

async function loadMessages(matchId) {
    const messages = await supabaseAuth.getMessages(matchId);
    const chatMessages = document.getElementById('chat-messages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6d6d6d;">
                <p>Start the conversation! Say hi 👋</p>
            </div>
        `;
        return;
    }
    
    chatMessages.innerHTML = messages.map(msg => `
        <div class="chat-bubble ${msg.sender_id === currentUser.id ? 'sent' : 'received'}" style="padding: 12px 16px; border-radius: 20px; margin-bottom: 8px;">
            ${msg.content}
        </div>
    `).join('');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !currentMatch) return;
    
    const result = await supabaseAuth.sendMessage(currentMatch.id, currentUser.id, message);
    
    if (result.success) {
        input.value = '';
        loadMessages(currentMatch.id);
    }
});

console.log('App initialized');
