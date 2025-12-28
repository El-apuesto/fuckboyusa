# Fuckboys USA - MVP Beta Launch

**Sophisticated Casual Dating Platform for Metrosexual Men**

## 🔥 Overview

Fuckboys USA is a niche dating platform designed specifically for style-conscious, emotionally intelligent men who value authentic connections without pretense. The platform combines Tinder's proven swipe mechanics with metrosexual-specific features and community values.

## ✨ MVP Features

### Core Functionality
- **Splash Screen** - Branded entry with smooth animations
- **Onboarding Sequence** - 3-screen flow showcasing platform features
- **User Authentication** - Email/password signup and login
- **Card-Based Discovery** - Swipe-based profile discovery with drag mechanics
- **Matches** - View and manage your matches with unread indicators
- **Chat** - Real-time messaging interface (frontend ready for backend integration)
- **User Profile** - Customizable profile with interests, stats, and bio
- **Bottom Navigation** - Seamless navigation between core features

### Design Philosophy
- **Professional Aesthetic** - Clean, modern interface reflecting metrosexual grooming standards
- **Playful Interaction** - Fun animations and micro-interactions without sacrificing sophistication
- **Mobile-First** - Optimized for mobile experience with touch-friendly interactions
- **Responsive Design** - Works across all device sizes

## 🎨 Design System

### Color Palette
- **Primary (Hot Pink)**: `#FF2E63` - Bold, attention-grabbing call-to-action
- **Secondary (Turquoise)**: `#08d9d6` - Fresh, modern accent color
- **Accent (Charcoal)**: `#252a34` - Professional text and background elements
- **Status Colors**: Success (green), Error (red), Warning (yellow), Info (blue)

### Key Design Elements
- Gradient backgrounds for visual interest
- Smooth transitions (250ms standard, 350ms for cards)
- Consistent spacing system
- Rounded corners (0.5rem to 1.5rem)
- Subtle shadows for depth

## 📱 Screen Flow

```
Splash (2 sec) → Onboarding (3 screens) → Auth (Signup/Login) → Main App
                                         ↓
                              Main App (Discovery)
                                 ↓     ↓     ↓
                           Discover / Matches / Profile
```

## 🚀 Getting Started

### Installation
1. Clone the repository
2. Open `index.html` in a web browser
3. No build process required - pure HTML/CSS/JavaScript

### File Structure
```
fuckboyusa/
├── index.html      # Complete UI structure
├── app.js          # Application logic and state management
├── style.css       # Design system and styling
└── README.md       # Documentation
```

## 🛠️ Technical Stack

- **HTML5** - Semantic markup with accessibility considerations
- **CSS3** - Modern layout (Flexbox/Grid) with custom properties
- **Vanilla JavaScript (ES6+)** - No frameworks for maximum simplicity
- **Font Awesome** - Icon library for UI elements

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 State Management

The app maintains a global `userData` object:
```javascript
let userData = {
    id: null,
    email: null,
    name: null,
    referralCode: string,
    referralCount: 0,
    premiumCredits: 0,
    isPremium: false,
    swipesRemaining: 10,
    likes: 42,
    matches: 8,
    views: 128
};
```

## 🎮 Swipe Mechanics

### Desktop
- **Mouse drag** - Click and drag card left/right
- **Keyboard** - Arrow Left/Right keys

### Mobile
- **Touch drag** - Swipe card left/right with finger
- **Acceleration** - Cards animate with ease-out curves for natural feel

### Swipe Actions
- **Right swipe (> 100px)** - Like, shows match notification
- **Left swipe (< -100px)** - Pass
- **Small drag (±100px)** - Returns to center

## 💾 Data Persistence

Currently uses `localStorage` for development. Ready for backend integration:
```javascript
localStorage.setItem('fbu_user', JSON.stringify(userData));
```

## 🔄 Referral System

- **Unique Code Generation** - Auto-generated on signup
- **Referral Badge** - Fixed button (bottom-right) shows pending referrals
- **Share Modal** - Integrated sharing with native share API fallback
- **Reward Tracking** - Premium credits awarded per successful referral

## 🎯 Next Steps (Post-MVP)

### Backend Integration
- [ ] User authentication API
- [ ] Profile data synchronization
- [ ] Real-time messaging with WebSockets
- [ ] Card deck generation (AI-powered matching)
- [ ] Match notifications

### Premium Features
- [ ] Unlimited swipes
- [ ] Advanced filtering (style preferences, grooming habits)
- [ ] Profile boosts
- [ ] See who liked you
- [ ] Travel mode

### Community Features
- [ ] Discussion forums
- [ ] Grooming/style tips
- [ ] Event integration
- [ ] Brand partnerships (fashion, grooming)

## 📈 Analytics Ready

Key metrics tracked:
- Daily Active Users (DAU)
- Session length
- Swipe rate (likes/passes)
- Match rate
- Message response rate
- Profile completion %
- Premium conversion

## 🔒 Security Considerations

Current MVP:
- Frontend validation only
- No sensitive data transmission

Pre-Production Requirements:
- [ ] HTTPS only
- [ ] Secure password hashing (bcrypt)
- [ ] JWT token management
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Photo verification AI
- [ ] Content moderation
- [ ] Harassment detection

## 📝 Development Notes

### Swipe Card Flow
1. User initiates drag or keyboard input
2. Card transforms with rotation and translation
3. Badge visibility updates based on drag direction
4. Drag threshold (100px) determines action
5. Animation triggers card removal and deck advancement
6. New card generated and swipe handlers reinitialize

### Notification System
All notifications follow consistent pattern:
- Fixed top-center positioning
- 3-second auto-dismiss
- Smooth opacity/transform transitions
- Type-based color coding (success/error/info)

## 🐛 Known Limitations

- No backend connectivity yet
- Chat messages don't persist
- Profile edits not implemented
- No actual photo upload
- Limited to mock data

## 📱 Mobile Optimization

- Viewport meta tags for proper scaling
- Touch-friendly button sizes (min 44x44px)
- Optimized tap targets
- Smooth scrolling
- Hardware acceleration for animations
- Bottom navigation doesn't interfere with content

## 🚢 Beta Launch Checklist

- [x] Core UI complete
- [x] Swipe mechanics functional
- [x] Navigation working
- [x] Forms operational (mock)
- [x] Notifications system
- [x] Referral tracking
- [ ] Backend API integration
- [ ] Real authentication
- [ ] Profile photo upload
- [ ] Real chat functionality
- [ ] Analytics integration
- [ ] App store deployment

## 📄 License

Private - All rights reserved

## 👥 Team

**El Apuesto** - Founder & Product

---

**Last Updated**: December 28, 2025
**Version**: 0.1.0 (MVP Beta)
