# ToyX - Toy Exchange Mobile App

## Overview

ToyX is a cross-platform mobile application designed to help parents exchange toys within their community. The app allows users to list toys their children have outgrown, browse available toys, and facilitate exchanges with other families. Built with modern web technologies optimized for mobile experiences, ToyX features a playful design with custom branding and a focus on user safety and trust.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with custom design system (shadcn/ui components)
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **Mobile-First Design**: Responsive layout optimized for mobile devices (max-width: 480px)

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session-based authentication
- **Real-time Communication**: WebSocket support for live messaging

### Design System
- **Component Library**: Custom implementation based on Radix UI primitives
- **Color Palette**: Custom ToyX brand colors (peach, mint, powder blue, lilac)
- **Typography**: Rounded, playful design elements optimized for families
- **Icons**: Lucide React icon library

## Key Components

### Authentication System ✅
- Replit-based authentication with session management
- User profiles with first name, last name, email, and profile images
- Session storage using PostgreSQL with automatic cleanup

### Toy Management ✅
- Complete toy upload form with image upload functionality
- Search and filtering capabilities by category, age group, and keywords
- Image upload support using base64 encoding
- Availability status tracking
- Detailed toy view pages with image galleries

### Exchange System ✅
- Direct messaging between users for exchange coordination
- Exchange request workflow with status tracking
- Real-time messaging using WebSocket connections
- Exchange history and activity tracking
- Chat interface with conversation list

### User Interface ✅
- Mobile-optimized bottom navigation
- Card-based layout for toy browsing
- Modal overlays for toy uploads and detailed views
- Responsive design with dark/light theme support
- Complete profile page with settings and toy management

## Recent Changes (July 23, 2025)

✅ **Database Setup & Migration**
- All database tables created and functional
- Sample toy data added for testing

✅ **Toy Upload Functionality**
- Complete upload form with image handling
- Multiple image upload support with preview
- Category, age group, and condition selection
- Form validation and error handling

✅ **Toy Detail Pages**
- Enhanced detail view with image galleries
- Owner information display
- Favorite/unfavorite functionality
- Exchange request buttons

✅ **Chat System**
- Real-time messaging with WebSocket integration
- Conversation list showing all exchanges
- Message history and sender identification
- Exchange context in chat headers

✅ **Profile Management**
- Complete user profile with statistics
- User's toy listings display
- Settings panel with theme toggle
- Logout functionality

✅ **Search & Filtering**
- Shows all toys by default for better discovery
- Multiple category selection support
- Multiple age group selection support  
- Location-based filtering with Bay Area locations
- Real-time search with instant filtering
- Active filter badges with remove buttons
- Clear all filters functionality
- Frontend filtering for fast response

✅ **Geolocation Integration**
- GPS location detection for toy uploads
- Distance-based filtering (1, 3, 5, 10+ miles)
- Sort toys by distance from user location
- Automatic location detection with manual override
- Distance display on toy cards
- Privacy-conscious location handling

✅ **Settings & Preferences**
- Distance unit selection (Miles/Kilometers)
- Settings persist in localStorage
- Dynamic unit display throughout app
- Seamless metric conversion for distance calculations

✅ **New 5-Step Onboarding System**
- **Step 1: Discover** - Browse toys with smart search and filters
- **Step 2: Exchange** - Learn about toy trading and safe meetups
- **Step 3: Connect** - Chat with parents and join community groups
- **Step 4: Sustainable** - Eco-friendly sharing and money saving benefits
- **Step 5: Safety** - Verified profiles and secure messaging features
- Full-screen immersive experience with gradient backgrounds
- Interactive animations and visual elements for engagement
- Progress indicators with step navigation
- localStorage-based completion tracking
- Seamless integration with authentication flow

✅ **User Rating & Review System**
- Complete review database schema with ratings and comments
- Star rating component with interactive and display modes
- Review card component for displaying user feedback
- Review form with rating, comment, and anonymous options
- Integration into user profiles with average ratings
- Review functionality in chat interface for completed exchanges
- Sample users and toy listings for exchange testing

✅ **Two-Party Exchange Completion System**
- Mutual confirmation required from both parties before exchange completion
- "Mark Exchange Complete" buttons in chat interface for pending exchanges
- Smart status indicators showing waiting states when one party confirms
- Automatic status change to "completed" when both parties confirm
- Review system integration - reviews only available after mutual completion
- Database fields: requester_confirmed and owner_confirmed in exchanges table
- Comprehensive workflow from exchange request to completion and review

✅ **Enhanced Exchange Request System**
- Fixed critical GET request body error causing loading hangs
- Complete URL parameter parsing and navigation flow
- Automatic default message creation for all exchange requests
- Default message: "Hi! I'd love to exchange toys with you. My kid would really enjoy your toy, and I think yours would like mine too!"
- Custom message support with visual feedback on what message will be sent
- Server automatically creates first chat message when exchange is created
- End-to-end flow: toy selection → exchange request → automatic chat message → conversation

✅ **Modern UI Design System Implementation**
- Updated home screen with purple/pink gradient theme and sticky header design
- Enhanced browse/search screen with grid/list view toggle and advanced filtering
- Redesigned profile screen with modern cards, settings toggles, and logout modal
- Updated user-profile page (/users/:userId) with matching modern design system
- **NEW: Updated toy detail page with modern design featuring:**
  - Purple/pink gradient background theme
  - Enhanced image gallery with navigation arrows and indicators
  - Modern card-based information layout with rounded corners
  - Redesigned owner information section with gradient avatars
  - Fixed bottom action buttons with modern styling
  - Interactive modals for exchange requests and messaging
- Consistent sticky header pattern across all major screens
- Purple/pink gradient branding throughout the application
- Modern card-based layouts with hover animations and shadows
- Mobile-optimized responsive design with proper bottom navigation spacing
- Fixed routing issue where "View Profile" from toy listings now shows modern UI

✅ **Updated Authentication Flow Implementation**
- **NEW: Welcome Screen** - Colorful animated toy illustration with gradient background
- **NEW: Create Account Screen** - Complete signup form with password visibility toggles and prioritized social login
- **NEW: Login Screen** - Modern login form with social authentication options and enlarged logo
- **NEW: Forgot Password Screen** - Password reset functionality with support contact
- **UPDATED: Landing Page** - Modern purple/pink gradient design with larger ToyX logo (h-60) and intuitive feature icons
- **UPDATED: Home Page** - Official ToyX logo in header (h-20) replacing text-based branding
- **Enhanced Search UX** - Added clear button (X) to search input that appears when typing
- All screens maintain consistent mobile-first scaling and sizing (max-width: 480px)
- Purple/pink gradient theme consistent throughout entire application
- Latest official social media brand icons (Google, Facebook, Apple) on authentication screens
- ToyX transparent background logo implemented across all relevant screens with optimized sizing
- Updated landing page to navigate to new welcome screen instead of direct auth
- All authentication screens properly registered in routing system

✅ **Functional Wishlist/Favorites System (July 24, 2025)**
- **Interactive Heart Icons** - Clickable hearts on all toy cards that toggle favorite status
- **Visual Feedback** - Hearts change from gray outline to red filled when favorited
- **Real-time Updates** - Immediate UI updates when hearts are clicked
- **Cross-page Consistency** - Heart functionality works on home, search, and detail pages
- **API Integration** - Complete favorites CRUD operations (add, remove, check status)
- **Database Storage** - Favorites properly stored and retrieved from PostgreSQL database
- **Authentication Required** - Favorites tied to user accounts with session-based auth
- **Dedicated Favorites Page** - Full wishlist view accessible through profile menu
- **Grid/List Views** - Multiple display options for saved toys in favorites page
- **Proper Error Handling** - Debug logging and mutation state management
- **Button States** - Hearts disable during API requests to prevent double-clicks

✅ **Comprehensive Dark Mode Implementation (July 28, 2025)**
- **Global Theme System** - Integrated existing ThemeProvider with all major screens
- **Profile Integration** - Profile page now uses global theme instead of isolated dark mode toggle
- **Cross-Application Coverage** - Dark mode support across all screens: Home, Search, Chat, Landing, Profile, Toy Detail, Favorites
- **Component Consistency** - Updated BottomNav, headers, cards, and UI elements with dark mode styling
- **Theme Persistence** - Settings stored in localStorage with automatic system theme detection
- **Visual Consistency** - Proper dark/light color variants for backgrounds, text, borders, and interactive elements
- **Gradient Themes** - Dark versions of purple/pink gradients for consistent brand experience
- **Toggle Functionality** - Working theme toggle with visual feedback (Sun/Moon icons) in Profile settings
- **Complete Home Page Dark Mode** - Fixed all elements including search bar, category tabs, toy cards, arrows, and conditions
- **Logo Dark Mode Support** - ToyX logo properly inverts to white in dark theme with brightness/invert filters
- **Enhanced Logo Size** - Updated logo from h-20 to h-32 for better visibility and prominence

## Data Flow

### User Authentication Flow
1. User accesses the application
2. Replit Auth handles authentication and session creation
3. User profile is created/retrieved from PostgreSQL
4. Session is maintained using connect-pg-simple

### Toy Exchange Flow
1. User uploads toy with photos and details
2. Other users browse and search available toys
3. Interested users send exchange requests
4. Direct messaging facilitates exchange coordination
5. Exchange status is tracked throughout the process

### Real-time Messaging Flow
1. WebSocket connection established on chat page load
2. Messages are sent via REST API and broadcast via WebSocket
3. Real-time updates are reflected in the chat interface
4. Message history is persisted in PostgreSQL

## External Dependencies

### Core Libraries
- **React**: UI framework with hooks and context
- **Drizzle ORM**: Type-safe database operations
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework

### Database
- **PostgreSQL**: Primary database via Neon serverless
- **Session Storage**: PostgreSQL-backed session management

### Authentication
- **Replit Auth**: OpenID Connect-based authentication
- **Passport.js**: Authentication middleware integration

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast bundling for production builds

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Replit-specific development tooling and error overlays
- Environment-based configuration for database connections

### Production Build
- Vite builds the client-side application to `dist/public`
- ESBuild bundles the server-side code to `dist/index.js`
- Static file serving for the built React application

### Environment Configuration
- Database URL configuration for PostgreSQL connection
- Session secret for secure session management
- Replit domain configuration for authentication

### File Structure
- `client/`: React frontend application
- `server/`: Express.js backend with API routes
- `shared/`: Common schemas and types used by both client and server
- `migrations/`: Database migration files managed by Drizzle