// Fuckboys USA - App JavaScript
// Sophisticated casual dating platform for metrosexual men

// Global state
let currentScreen = 'splash';
let currentOnboardingScreen = 1;
let userData = {
    id: null,
    email: null,
    name: null,
    referralCode: generateReferralCode(),
    referralCount: 0,
    premiumCredits: 0,
    isPremium: false,
    swipesRemaining: 10,
    likes: 42,
    matches: 8,
    views: 128
};

let cardStack = [];
let isDraggingCard = false;
let dragStartX = 0;
let dragCurrentX = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Show splash screen for 2 seconds
    setTimeout(() => {
        hideSplashScreen();
        showOnboarding();
    }, 2000);
    
    // Initialize swipe functionality
    initializeSwipe();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize form handlers
    initializeFormHandlers();
}

// ============ SPLASH SCREEN ============
function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        splash.style.display = 'none';
    }, 500);
}

// ============ ONBOARDING ============
function showOnboarding() {
    currentScreen = 'onboarding';
    const onboarding = document.getElementById('onboarding-container');
    const signup = document.getElementById('signup-screen');
    const login = document.getElementById('login-screen');
    
    onboarding.classList.remove('hidden');
    signup.classList.add('hidden');
    login.classList.add('hidden');
    updateOnboardingDots();
}

function nextOnboarding() {
    if (currentOnboardingScreen < 3) {
        const current = document.querySelector(`[data-screen="${currentOnboardingScreen}"]`);
        current.classList.add('hidden');
        
        currentOnboardingScreen++;
        const next = document.querySelector(`[data-screen="${currentOnboardingScreen}"]`);
        next.classList.remove('hidden');
        
        updateOnboardingDots();
    }
}

function updateOnboardingDots() {
    const dots = document.querySelectorAll('.onboarding-dot');
    dots.forEach((dot, index) => {
        if (index + 1 === currentOnboardingScreen) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function showSignup() {
    currentScreen = 'signup';
    document.getElementById('onboarding-container').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('signup-screen').classList.remove('hidden');
}

function showLogin() {
    currentScreen = 'login';
    document.getElementById('onboarding-container').classList.add('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// ============ FORM HANDLERS ============
function initializeFormHandlers() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    
    userData.email = email;
    userData.name = name;
    userData.id = generateUserId();
    
    localStorage.setItem('fbu_user', JSON.stringify(userData));
    showMainApp();
    showNotification('Welcome to Fuckboys USA! 🔥', 'success');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    userData.email = email;
    localStorage.setItem('fbu_user', JSON.stringify(userData));
    showMainApp();
    showNotification('Welcome back! 👋', 'success');
}

// ============ MAIN APP SCREENS ============
function showMainApp() {
    currentScreen = 'main';
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('onboarding-container').classList.add('hidden');
    document.getElementById('matches-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    
    setActiveNav(0);
}

function showMatches() {
    currentScreen = 'matches';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('matches-screen').classList.remove('hidden');
    setActiveNav(1);
}

function showProfile() {
    currentScreen = 'profile';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('matches-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.remove('hidden');
    setActiveNav(2);
}

function openChat(userId) {
    currentScreen = 'chat';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('matches-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
}

// ============ SWIPE FUNCTIONALITY ============
function initializeSwipe() {
    const cards = document.querySelectorAll('.swipe-card');
    
    cards.forEach(card => {
        // Touch events
        card.addEventListener('touchstart', handleSwipeStart, { passive: true });
        card.addEventListener('touchmove', handleSwipeMove, { passive: false });
        card.addEventListener('touchend', handleSwipeEnd);
        
        // Mouse events for desktop
        card.addEventListener('mousedown', handleSwipeStart);
        card.addEventListener('mousemove', handleSwipeMove);
        card.addEventListener('mouseup', handleSwipeEnd);
        card.addEventListener('mouseleave', handleSwipeEnd);
    });
    
    function handleSwipeStart(e) {
        isDraggingCard = true;
        dragStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        e.target.closest('.swipe-card').style.transition = 'none';
    }
    
    function handleSwipeMove(e) {
        if (!isDraggingCard) return;
        e.preventDefault();
        
        const card = e.target.closest('.swipe-card');
        dragCurrentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - dragStartX;
        
        const maxDrag = 150;
        dragCurrentX = Math.max(-maxDrag, Math.min(maxDrag, dragCurrentX));
        
        const rotation = dragCurrentX * 0.1;
        card.style.transform = `translateX(${dragCurrentX}px) rotate(${rotation}deg)`;
        
        // Show badges
        if (dragCurrentX > 50) {
            card.classList.add('swiping-right');
            card.classList.remove('swiping-left');
        } else if (dragCurrentX < -50) {
            card.classList.add('swiping-left');
            card.classList.remove('swiping-right');
        } else {
            card.classList.remove('swiping-left', 'swiping-right');
        }
    }
    
    function handleSwipeEnd(e) {
        if (!isDraggingCard) return;
        isDraggingCard = false;
        
        const card = e.target.closest('.swipe-card');
        card.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        const threshold = 100;
        if (Math.abs(dragCurrentX) > threshold) {
            if (dragCurrentX > 0) {
                performSwipeRight(card);
            } else {
                performSwipeLeft(card);
            }
        } else {
            card.style.transform = '';
            card.classList.remove('swiping-left', 'swiping-right');
        }
    }
}

function performSwipeLeft(card) {
    card.style.transform = 'translateX(-400px) rotate(-45deg) scale(0.8)';
    card.style.opacity = '0';
    
    userData.swipesRemaining--;
    
    setTimeout(() => {
        nextCard();
    }, 300);
}

function performSwipeRight(card) {
    card.style.transform = 'translateX(400px) rotate(45deg) scale(0.8)';
    card.style.opacity = '0';
    
    userData.likes++;
    userData.swipesRemaining--;
    
    setTimeout(() => {
        showMatchNotification();
        nextCard();
    }, 300);
}

function swipeLeft() {
    const topCard = document.querySelector('.swipe-card[data-card="1"]');
    if (topCard && !isDraggingCard) {
        isDraggingCard = true;
        dragCurrentX = -150;
        topCard.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        performSwipeLeft(topCard);
    }
}

function swipeRight() {
    if (userData.swipesRemaining <= 0) {
        showNotification('Daily swipes used! Upgrade to Premium for unlimited', 'info');
        return;
    }
    
    const topCard = document.querySelector('.swipe-card[data-card="1"]');
    if (topCard && !isDraggingCard) {
        isDraggingCard = true;
        dragCurrentX = 150;
        topCard.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        performSwipeRight(topCard);
    }
}

function nextCard() {
    const currentCard = document.querySelector('.swipe-card[data-card="1"]');
    const nextCard = document.querySelector('.swipe-card[data-card="2"]');
    
    if (currentCard) {
        currentCard.remove();
    }
    
    if (nextCard) {
        nextCard.setAttribute('data-card', '1');
        nextCard.style.transform = '';
        nextCard.style.opacity = '1';
        nextCard.classList.remove('swiping-left', 'swiping-right');
        
        // Reinitialize swipe for new card
        setTimeout(() => {
            initializeSwipe();
        }, 100);
        
        // Create new card
        createNewCard();
    }
}

function createNewCard() {
    const cardsWrapper = document.querySelector('.cards-wrapper');
    if (!cardsWrapper) return;
    
    const newCard = document.createElement('div');
    newCard.className = 'swipe-card';
    newCard.setAttribute('data-card', '2');
    newCard.style.zIndex = '-1';
    
    const gradients = [
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    ];
    
    const names = ['Emma, 25', 'Sophia, 27', 'Olivia, 24', 'Ava, 26', 'Isabella, 23'];
    const bios = [
        'Marketing Manager • 4 miles away',
        'Designer • 2 miles away',
        'Entrepreneur • 3 miles away',
        'Photographer • 5 miles away',
        'Artist • 1 mile away'
    ];
    const interests = ['Eco-Conscious', 'Creative', 'Foodie', 'Adventurous', 'Minimalist'];
    
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomBio = bios[Math.floor(Math.random() * bios.length)];
    const randomInterest = interests[Math.floor(Math.random() * interests.length)];
    
    newCard.innerHTML = `
        <div class="card-content">
            <div class="card-image" style="background: ${randomGradient};"></div>
            <div class="card-overlay"></div>
            <div class="card-badges">
                <div class="badge badge-nope">NOPE</div>
                <div class="badge badge-like">LIKE</div>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3>${randomName}</h3>
                    <span class="verified-badge">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
                <p class="card-subtitle">${randomBio}</p>
                <p class="card-bio">Passionate about authentic connections ✨</p>
                <div class="card-tags">
                    <span class="tag">${randomInterest}</span>
                    <span class="tag">Active</span>
                </div>
            </div>
        </div>
    `;
    
    cardsWrapper.appendChild(newCard);
}

function showMatchNotification() {
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerHTML = `
        <div class="match-notification-content">
            <i class="fas fa-heart"></i>
            <span>It's a match!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 50);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function showSuperLike() {
    showNotification('Super Like sent! 💫', 'success');
}

// ============ NAVIGATION ============
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-icon');
    navButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            setActiveNav(index);
        });
    });
}

function setActiveNav(index) {
    const navButtons = document.querySelectorAll('.nav-icon');
    navButtons.forEach((button, i) => {
        if (i === index) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// ============ MODALS & POPUPS ============
function openFilters() {
    showNotification('Filter options coming soon', 'info');
}

function openSettings() {
    showNotification('Settings coming soon', 'info');
}

function showReferral() {
    const referralCode = userData.referralCode;
    const referralCount = userData.referralCount;
    const premiumCredits = userData.premiumCredits;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content referral-modal">
            <button class="modal-close" onclick="this.closest('.modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="modal-header">
                <h2>Share the Love 💕</h2>
                <p>Invite friends and earn premium credit</p>
            </div>
            <div class="referral-info">
                <div class="referral-stat">
                    <span class="stat-value">${referralCount}</span>
                    <span class="stat-label">Friends Invited</span>
                </div>
                <div class="referral-stat">
                    <span class="stat-value">${premiumCredits}</span>
                    <span class="stat-label">Premium Credit</span>
                </div>
            </div>
            <div class="referral-code-box">
                <p class="referral-code-label">Your Referral Code:</p>
                <div class="referral-code">
                    <input type="text" class="referral-code-input" value="${referralCode}" readonly>
                    <button class="btn-copy" onclick="copyReferralCode()">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <p class="referral-terms">Get 1 month of Premium for every friend who signs up with your code</p>
            <div class="modal-actions">
                <button class="btn btn-primary btn-lg btn-full" onclick="shareReferral()">
                    <i class="fas fa-share"></i> Share Now
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyReferralCode() {
    const input = document.querySelector('.referral-code-input');
    input.select();
    document.execCommand('copy');
    showNotification('Code copied to clipboard!', 'success');
}

function shareReferral() {
    if (navigator.share) {
        navigator.share({
            title: 'Fuckboys USA',
            text: `Join me on Fuckboys USA! Use my code: ${userData.referralCode}`,
            url: 'https://fuckboysusa.com'
        }).catch(err => console.log('Error sharing:', err));
    } else {
        showNotification('Share your referral code manually!', 'info');
    }
}

function showPremium() {
    showNotification('Premium upgrade coming soon', 'info');
}

function closePremiumPrompt() {
    document.getElementById('premium-prompt').classList.add('hidden');
}

// ============ UTILITY FUNCTIONS ============
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${type === 'error' ? '<i class="fas fa-times-circle"></i>' : ''}
            ${type === 'info' ? '<i class="fas fa-info-circle"></i>' : ''}
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 50);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function generateReferralCode() {
    return 'FBU' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', function(e) {
    if (currentScreen === 'main') {
        if (e.key === 'ArrowLeft') {
            swipeLeft();
        } else if (e.key === 'ArrowRight') {
            swipeRight();
        }
    }
});

// ============ TOUCH & RESIZE HANDLERS ============
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

window.addEventListener('resize', function() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.height = window.innerHeight + 'px';
    }
});

window.addEventListener('load', function() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.height = window.innerHeight + 'px';
    }
});
