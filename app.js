// ============================================
// GLOBAL STATE
// ============================================

let currentUser = null;
let currentScreen = 'splash';
let currentMatchId = null;
let messageSubscription = null;
let currentCardIndex = 0;
let potentialMatches = [];

// ============================================
// INITIALIZATION
// ============================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initialized');
    
    // Show splash screen for 2 seconds
    setTimeout(async () => {
        // Check if user is already logged in
        const user = await window.supabaseAuth.getCurrentUser();
        
        if (user) {
            // User is logged in, go straight to main app
            currentUser = user;
            await loadUserProfile();
            showMainApp();
        } else {
            // Not logged in, show onboarding
            showOnboarding();
        }
    }, 2000);
    
    // Set up form handlers
    setupFormHandlers();
    
    // Listen for auth state changes
    window.supabaseAuth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            showOnboarding();
        }
    });
});

// ============================================
// FORM HANDLERS
// ============================================

function setupFormHandlers() {
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Chat form
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    const age = parseInt(document.getElementById('signup-age').value);
    const location = document.getElementById('signup-location').value;
    const occupation = document.getElementById('signup-occupation').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        const result = await window.supabaseAuth.signUp(email, password, {
            name,
            age,
            location,
            occupation
        });
        
        if (result.success) {
            currentUser = result.user;
            showNotification('Account created! Welcome to Fuckboys USA!', 'success');
            await loadUserProfile();
            showMainApp();
        } else {
            showNotification(result.error || 'Signup failed. Please try again.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    
    try {
        const result = await window.supabaseAuth.signIn(email, password);
        
        if (result.success) {
            currentUser = result.user;
            showNotification('Welcome back!', 'success');
            await loadUserProfile();
            showMainApp();
        } else {
            showNotification(result.error || 'Login failed. Check your credentials.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSignOut() {
    const result = await window.supabaseAuth.signOut();
    if (result.success) {
        showNotification('Signed out successfully', 'success');
        currentUser = null;
        showOnboarding();
    }
}

// ============================================
// USER PROFILE
// ============================================

async function loadUserProfile() {
    if (!currentUser) return;
    
    const profile = await window.supabaseAuth.getUserProfile(currentUser.id);
    if (profile) {
        // Update profile screen
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            profileName.textContent = profile.name || 'Your Profile';
        }
    }
}

// ============================================
// SCREEN NAVIGATION
// ============================================

function hideAllScreens() {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('onboarding-container').classList.add('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('matches-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('bottom-nav').classList.add('hidden');
}

function showOnboarding() {
    hideAllScreens();
    document.getElementById('onboarding-container').classList.remove('hidden');
    
    // Reset to first screen
    const screens = document.querySelectorAll('.onboarding-screen');
    screens.forEach((screen, index) => {
        if (index === 0) {
            screen.classList.remove('hidden');
        } else {
            screen.classList.add('hidden');
        }
    });
    
    // Reset dots
    const dots = document.querySelectorAll('.onboarding-dot');
    dots.forEach((dot, index) => {
        if (index === 0) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    currentScreen = 'onboarding';
}

function nextOnboarding() {
    const currentScreenEl = document.querySelector('.onboarding-screen:not(.hidden)');
    const currentScreenNum = parseInt(currentScreenEl.dataset.screen);
    const nextScreenNum = currentScreenNum + 1;
    
    if (nextScreenNum <= 3) {
        // Hide current screen
        currentScreenEl.classList.add('hidden');
        
        // Show next screen
        const nextScreen = document.querySelector(`.onboarding-screen[data-screen="${nextScreenNum}"]`);
        nextScreen.classList.remove('hidden');
        
        // Update dots
        document.querySelectorAll('.onboarding-dot').forEach((dot, index) => {
            if (index === nextScreenNum - 1) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

function showSignup() {
    hideAllScreens();
    document.getElementById('signup-screen').classList.remove('hidden');
    currentScreen = 'signup';
}

function showLogin() {
    hideAllScreens();
    document.getElementById('login-screen').classList.remove('hidden');
    currentScreen = 'login';
}

async function showMainApp() {
    hideAllScreens();
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    currentScreen = 'main';
    
    // Update nav active state
    updateNavActive('main-app');
    
    // Load potential matches
    await loadPotentialMatches();
}

async function showMatches() {
    hideAllScreens();
    document.getElementById('matches-screen').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    currentScreen = 'matches';
    
    // Update nav active state
    updateNavActive('matches');
    
    // Load matches
    await loadMatches();
}

async function showProfile() {
    hideAllScreens();
    document.getElementById('profile-screen').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    currentScreen = 'profile';
    
    // Update nav active state
    updateNavActive('profile');
    
    // Reload profile data
    await loadUserProfile();
}

function updateNavActive(screen) {
    const navButtons = document.querySelectorAll('.nav-icon');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    if (screen === 'main-app') {
        navButtons[0].classList.add('active');
    } else if (screen === 'matches') {
        navButtons[1].classList.add('active');
    } else if (screen === 'profile') {
        navButtons[3].classList.add('active');
    }
}

// ============================================
// SWIPE FUNCTIONALITY
// ============================================

async function loadPotentialMatches() {
    if (!currentUser) return;
    
    const cardDeck = document.getElementById('card-deck');
    cardDeck.innerHTML = '<div class="text-center text-gray-500">Loading profiles...</div>';
    
    potentialMatches = await window.supabaseAuth.getPotentialMatches(currentUser.id, 10);
    
    if (potentialMatches.length === 0) {
        cardDeck.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
                <p class="text-lg font-semibold">No more profiles to show</p>
                <p class="text-sm">Check back later for new matches!</p>
            </div>
        `;
        return;
    }
    
    currentCardIndex = 0;
    renderCard(potentialMatches[currentCardIndex]);
}

function renderCard(profile) {
    if (!profile) return;
    
    const cardDeck = document.getElementById('card-deck');
    const randomGradient = getRandomGradient();
    
    cardDeck.innerHTML = `
        <div class="w-full max-w-sm">
            <div class="swipe-card relative bg-white rounded-2xl shadow-xl overflow-hidden" data-user-id="${profile.id}">
                <div class="relative h-96">
                    <div class="h-full ${randomGradient}"></div>
                    <div class="absolute inset-0 profile-gradient"></div>
                    <div class="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div class="nope-badge">NOPE</div>
                        <div class="like-badge">LIKE</div>
                    </div>
                    <div class="absolute bottom-6 left-6 right-6 text-white">
                        <div class="flex items-center space-x-2 mb-2">
                            <h3 class="text-2xl font-bold">${profile.name || 'Anonymous'}, ${profile.age || '??'}</h3>
                            ${profile.is_verified ? '<div class="verification-badge"><i class="fas fa-check text-xs"></i></div>' : ''}
                        </div>
                        <p class="text-sm opacity-90 mb-2">${profile.occupation || 'Professional'} • ${profile.location || 'Unknown'}</p>
                        <p class="text-sm opacity-80">${profile.bio || 'No bio yet'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add swipe handlers
    const card = cardDeck.querySelector('.swipe-card');
    setupSwipeHandlers(card);
}

function setupSwipeHandlers(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    // Mouse events
    card.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        card.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX / 20}deg)`;
        
        if (currentX > 50) {
            card.classList.add('swiping-right');
            card.classList.remove('swiping-left');
        } else if (currentX < -50) {
            card.classList.add('swiping-left');
            card.classList.remove('swiping-right');
        } else {
            card.classList.remove('swiping-left', 'swiping-right');
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        card.style.cursor = 'grab';
        
        if (currentX > 100) {
            // Swipe right (like)
            animateSwipeOff(card, 'right');
            handleSwipeAction('like');
        } else if (currentX < -100) {
            // Swipe left (pass)
            animateSwipeOff(card, 'left');
            handleSwipeAction('pass');
        } else {
            // Return to center
            card.style.transform = '';
            card.classList.remove('swiping-left', 'swiping-right');
        }
        
        currentX = 0;
    });
    
    // Touch events
    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    card.addEventListener('touchmove', (e) => {
        currentX = e.touches[0].clientX - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX / 20}deg)`;
        
        if (currentX > 50) {
            card.classList.add('swiping-right');
            card.classList.remove('swiping-left');
        } else if (currentX < -50) {
            card.classList.add('swiping-left');
            card.classList.remove('swiping-right');
        }
    });
    
    card.addEventListener('touchend', () => {
        if (currentX > 100) {
            animateSwipeOff(card, 'right');
            handleSwipeAction('like');
        } else if (currentX < -100) {
            animateSwipeOff(card, 'left');
            handleSwipeAction('pass');
        } else {
            card.style.transform = '';
            card.classList.remove('swiping-left', 'swiping-right');
        }
        currentX = 0;
    });
}

function animateSwipeOff(card, direction) {
    const distance = direction === 'right' ? 1000 : -1000;
    card.style.transition = 'transform 0.3s ease-out';
    card.style.transform = `translateX(${distance}px) rotate(${distance / 20}deg)`;
    
    setTimeout(() => {
        showNextCard();
    }, 300);
}

async function handleSwipeAction(action) {
    if (!currentUser || !potentialMatches[currentCardIndex]) return;
    
    const targetUser = potentialMatches[currentCardIndex];
    const result = await window.supabaseAuth.recordSwipe(
        currentUser.id,
        targetUser.id,
        action
    );
    
    if (result.success && result.isMatch) {
        showNotification(`🎉 It's a match with ${targetUser.name}!`, 'success');
    }
}

function showNextCard() {
    currentCardIndex++;
    
    if (currentCardIndex >= potentialMatches.length) {
        const cardDeck = document.getElementById('card-deck');
        cardDeck.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-heart text-6xl text-gray-300 mb-4"></i>
                <p class="text-lg font-semibold">No more profiles to show</p>
                <p class="text-sm">Check back later for new matches!</p>
            </div>
        `;
        return;
    }
    
    renderCard(potentialMatches[currentCardIndex]);
}

function swipeLeft() {
    const card = document.querySelector('.swipe-card');
    if (card) {
        animateSwipeOff(card, 'left');
        handleSwipeAction('pass');
    }
}

function swipeRight() {
    const card = document.querySelector('.swipe-card');
    if (card) {
        animateSwipeOff(card, 'right');
        handleSwipeAction('like');
    }
}

// ============================================
// MATCHES
// ============================================

async function loadMatches() {
    if (!currentUser) return;
    
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '<div class="text-center text-gray-500 py-8">Loading matches...</div>';
    
    const matches = await window.supabaseAuth.getMatches(currentUser.id);
    
    if (matches.length === 0) {
        matchesList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-heart-broken text-6xl text-gray-300 mb-4"></i>
                <p class="text-lg font-semibold">No matches yet</p>
                <p class="text-sm">Keep swiping to find your match!</p>
            </div>
        `;
        return;
    }
    
    matchesList.innerHTML = matches.map(match => {
        const profile = match.profile;
        const randomGradient = getRandomGradient();
        
        return `
            <div class="bg-white rounded-xl p-4 shadow-sm flex items-center space-x-4">
                <div class="relative">
                    <div class="w-16 h-16 ${randomGradient} rounded-full"></div>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <i class="fas fa-heart text-white text-xs"></i>
                    </div>
                </div>
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-semibold text-charcoal-800">${profile.name || 'Anonymous'}</h3>
                        ${profile.is_verified ? '<div class="verification-badge"><i class="fas fa-check text-xs"></i></div>' : ''}
                    </div>
                    <p class="text-sm text-charcoal-600">${profile.location || 'Unknown location'}</p>
                    <p class="text-xs text-charcoal-500">${getTimeAgo(match.matchedAt)}</p>
                </div>
                <button onclick="openChat('${match.matchId}', '${profile.id}', '${profile.name}')" class="bg-sage-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sage-700 transition-colors">
                    Message
                </button>
            </div>
        `;
    }).join('');
}

// ============================================
// CHAT
// ============================================

async function openChat(matchId, userId, userName) {
    currentMatchId = matchId;
    
    hideAllScreens();
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    
    // Update chat header
    document.getElementById('chat-name').textContent = userName || 'Chat';
    
    // Load messages
    await loadMessages(matchId);
    
    // Subscribe to new messages
    if (messageSubscription) {
        messageSubscription.unsubscribe();
    }
    messageSubscription = window.supabaseAuth.subscribeToMessages(matchId, (newMessage) => {
        appendMessage(newMessage);
    });
}

async function loadMessages(matchId) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '<div class="text-center text-gray-500">Loading messages...</div>';
    
    const messages = await window.supabaseAuth.getMessages(matchId);
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-comment text-4xl text-gray-300 mb-2"></i>
                <p>Say hi to start the conversation!</p>
            </div>
        `;
        return;
    }
    
    chatMessages.innerHTML = messages.map(msg => {
        const isSent = msg.sender_id === currentUser.id;
        return `
            <div class="chat-bubble ${isSent ? 'sent' : 'received'} p-3 rounded-2xl">
                <p class="text-sm">${msg.content}</p>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const isSent = message.sender_id === currentUser.id;
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-bubble ${isSent ? 'sent' : 'received'} p-3 rounded-2xl`;
    messageEl.innerHTML = `<p class="text-sm">${message.content}</p>`;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    
    if (!content || !currentMatchId || !currentUser) return;
    
    const result = await window.supabaseAuth.sendMessage(
        currentMatchId,
        currentUser.id,
        content
    );
    
    if (result.success) {
        input.value = '';
    } else {
        showNotification('Failed to send message', 'error');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getRandomGradient() {
    const gradients = [
        'bg-gradient-to-br from-blue-400 to-purple-500',
        'bg-gradient-to-br from-pink-400 to-red-500',
        'bg-gradient-to-br from-green-400 to-blue-500',
        'bg-gradient-to-br from-yellow-400 to-orange-500',
        'bg-gradient-to-br from-purple-400 to-pink-500',
        'bg-gradient-to-br from-indigo-400 to-purple-500',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

console.log('App.js loaded successfully');
