# Component Guide

This guide explains the different screen variants and components in the Cupido app.

## Screen Variants

The app contains multiple screen implementations for different purposes:

### Production Screens (Currently Active)
- **PixelPerfectHomeScreen.tsx** - Main home screen with reflection feed
- **PixelPerfectReflectScreen.tsx** - Daily reflection interface  
- **PixelPerfectMatchesScreen.tsx** - Matches and compatibility view
- **PixelPerfectProfileScreen.tsx** - User profile management
- **PixelPerfectMessagesScreen.tsx** - Real-time messaging interface

### Core Functional Screens
- **AuthScreen.tsx** - User authentication and registration
- **ChatScreen.tsx** - Real-time messaging system
- **MatchingScreen.tsx** - Swipe-based matching interface
- **ProfileGenerationScreen.tsx** - AI-generated profile creation
- **MainApp.tsx** - Main app coordinator with navigation

### Development/Testing Variants

#### Functional Variants
- **FunctionalHomeScreen.tsx** - Basic functional implementation
- **FunctionalReflectScreen.tsx** - Core reflection functionality
- **FunctionalMatchesScreen.tsx** - Basic matching interface
- **FunctionalProfileScreen.tsx** - Simple profile view

#### Clean Variants  
- **CleanHomeScreen.tsx** - Simplified clean design
- **CleanReflectScreen.tsx** - Minimal reflection interface
- **CleanMatchesScreen.tsx** - Clean matches view
- **CleanProfileScreen.tsx** - Simplified profile

#### Enhanced Variants
- **EnhancedReflectScreen.tsx** - Advanced reflection with analytics
- **EnhancedReflectionScreen.tsx** - Extended reflection features

#### Legacy/Demo Screens
- **HomeScreen.tsx** - Original home implementation
- **ReflectScreen.tsx** - Original reflection screen  
- **SimpleReflectScreen.tsx** - Basic demo reflection
- **WorkingHomeScreen.tsx** - Working prototype

### Utility Screens
- **FeedbackManagementScreen.tsx** - User feedback system
- **TermsScreen.tsx** - Terms of service
- **PrivacyScreen.tsx** - Privacy policy

## Design Philosophy

### Current Production Design (PixelPerfect Series)
- **Apple/Airbnb-inspired minimalism**
- **Two-color palette**: Black (#000000) and White (#FFFFFF)  
- **No emojis**: Clean text-based interface
- **Flat icons**: Simple geometric shapes
- **Generous whitespace**: Focus and clarity
- **System typography**: Clean, readable fonts

### Component Naming Convention
- **PixelPerfect***: Production-ready screens with final design
- **Functional***: Core functionality without design polish
- **Clean***: Minimal design implementations  
- **Enhanced***: Extended feature implementations
- **Simple***: Basic demo/prototype screens

## Recommended Architecture

For new features, follow this pattern:

1. **Start with Functional**: Build core functionality first
2. **Apply PixelPerfect design**: Implement final UI/UX  
3. **Archive alternatives**: Keep Clean/Enhanced variants for reference
4. **Document purpose**: Clear comments on screen variants

## File Organization

```
src/screens/
├── [Production]             # PixelPerfect* screens
├── [Core Features]          # Auth, Chat, Matching, etc.
├── [Development Variants]   # Functional*, Clean*, Enhanced*
└── [Utility]               # Terms, Privacy, Feedback
```

This structure allows for:
- **Clear production path**: PixelPerfect screens are the current implementation
- **Development flexibility**: Multiple approaches for testing
- **Design consistency**: All variants follow established patterns
- **Easy maintenance**: Clear separation of concerns