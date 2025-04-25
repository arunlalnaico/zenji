# Zenji Features Reference

> This document serves as a comprehensive reference of all implemented features in the Zenji VS Code extension. Use this as a guide when developing new features to maintain consistency with the existing architecture.

## 🔍 Overview

Zenji is a mindful AI coding companion VS Code extension designed to promote mental wellness for developers. The extension offers a range of features including focus timers, ambient sounds, journaling, and mindfulness tools to help developers maintain balance during coding sessions.

## 🏗️ Architecture

Zenji is built as a VS Code extension with a WebView-based UI. The architecture consists of:

1. **Extension Core** - TypeScript code that handles the VS Code integration, manages data persistence, and controls the WebView lifecycle.
2. **WebView UI** - HTML/CSS/JS-based dashboard with multiple tabs for different features.
3. **State Management** - Uses VS Code's state API for persisting user data locally.
4. **Cloud Sync** - Optional functionality to synchronize user data across devices.

## 🌱 Onboarding Experience

The onboarding flow consists of a multi-step wizard that introduces users to Zenji:

1. **Welcome Screen** - Features a logo and tagline with animated transitions.
2. **Name Input** - Captures the user's name with validation.
3. **Profile Picture** - Allows avatar upload or selection of default avatar.
4. **Completion** - Confirmation screen with the option to enter the Zenji dashboard.

Key implementation files:
- `resources/webviews/onboarding/onboarding.html` - Onboarding UI
- `resources/styles/components.css` - Styling for onboarding components
- `src/extension.ts` - Logic for handling onboarding completion

UI components:
- Step indicators
- Form inputs with validation
- Navigation buttons
- Avatar upload and preview

## 📊 Dashboard Interface

The main dashboard serves as the central hub for all Zenji features:

### Header Section
- Personalized greeting with user's name
- Avatar display with upload capability
- Daily mindfulness quote
- Settings button to access preferences

### AI Assistant Section
- Zenji avatar/logo display
- Customized greeting message
- Mindfulness suggestion

### Main Navigation
The dashboard uses a tab-based navigation system with four main sections:
1. **Mindfulness** - Focus tools and breathing exercises
2. **Sounds** - Ambient soundscapes
3. **Journal** - Reflection journal with entries
4. **Chat** - AI assistant conversation interface

Key implementation files:
- `resources/webviews/dashboard/dashboard.html` - Main dashboard UI
- `resources/scripts/zenji-core.js` - Core functionality for all dashboard features
- `resources/styles/main.css` and `resources/styles/components.css` - Styling

## 🧘 Mindfulness Features

### Focus Timer
- Pomodoro-style timer with 25-minute focus sessions
- 5-minute break timer
- Statistics tracking (sessions, minutes, breaks)
- Persistent statistics across sessions

### Breathing Exercise
- Interactive breathing circle animation
- Click-to-activate breathing guidance
- Visual cues for inhale/exhale timing

Implementation details:
- Uses CSS animations for the breathing circle
- Tracks focus statistics in VS Code's global state
- Updates UI elements with current statistics

## 🎵 Ambient Sounds

A collection of calming background sounds to enhance focus:

- Rain sounds
- Forest ambience
- Ocean waves
- Café background noise
- White noise
- Lo-Fi music

Each sound includes:
- Descriptive icon
- Name and description
- Click-to-play functionality
- Visual indication of currently playing sound

Implementation details:
- Sound data stored in the application state
- Hidden audio player element for playback
- Click handlers for starting/stopping sounds
- Persistence of sound selection across sessions

## 📓 Journal

A reflective journaling tool with:

- Text area for writing entries
- Date/time stamping of entries
- Storage of entries in VS Code global state
- Display of recent entries (last 5 shown by default)
- Persistent journal data across sessions

Implementation:
- Form for creating new entries
- Rendering of existing entries
- Nested tab navigation for journal/insights
- Cloud synchronization support

## 💬 Chat with Zenji

An AI assistant interface for mindfulness guidance:

- Chat input for asking questions
- Message history display
- Typing indicator animation
- Simulated AI responses (placeholder for actual AI integration)
- Chat history persistence

Implementation details:
- Message rendering with user/AI distinction
- Typing animation effects
- Scrolling behavior for chat history
- State management for conversation history

## 🔄 Data Persistence and Sync

User data is stored using VS Code's global state API:

### Stored Data Types
- User name
- Avatar (as data URL)
- Focus statistics (sessions, minutes, breaks)
- Journal entries
- Chat history
- Active sound selection
- Active tab selection

### Cloud Sync
- Manual sync functionality via Settings modal
- Sync to cloud button
- Sync from cloud button
- Last sync time display

Implementation:
- Uses VS Code commands to trigger sync
- `syncDataToCloud` and related functions in extension.ts
- UI indicators for sync status

## ⚙️ Settings and Preferences

A modal-based settings interface with:

- Cloud sync controls
- Data management options
- Clear data functionality with confirmation

Implementation:
- Modal display/hide logic
- Command execution for data operations
- Confirmation dialogs for destructive actions

## 🎨 UI Components and Styling

Zenji uses a consistent design system:

### Color Scheme
- Primary: #6a73c1 (purple)
- Secondary: #5cb3a7 (teal)
- Accent: #a17ef6 (lavender)
- Text: Uses VS Code theme variables
- Background: Uses VS Code theme variables

### Animation System
- fadeIn: For smooth element appearance
- gradientShift: For background color transitions
- breathe: For the breathing circle expansion/contraction
- typingAnimation: For chat typing indicators

### Card Components
- Consistent styling for all feature sections
- Hover effects for interactive elements
- Header with icon and title
- Content area with feature-specific UI

### Button Styles
- Primary: Gradient background with white text
- Secondary: Outline style with primary color
- Danger: Red gradient for destructive actions

## 🔌 Extension Commands

VS Code commands registered by Zenji:

- `zenjispace.open` - Open the Zenji dashboard
- `zenjispace.onboarding` - Start the onboarding process
- `zenjispace.clearData` - Clear all user data
- `zenjispace.syncToCloud` - Sync data to cloud storage
- `zenjispace.forceCompleteOnboarding` - Debug command to skip onboarding

## 🔒 Privacy and Data Handling

All user data is stored locally by default:

- Avatar images stored as data URLs
- Journal entries stored in VS Code global state
- No data sent to external servers without explicit user action
- Clear data option for removing all personal information

## 📱 Responsive Design

The UI adapts to different VS Code window sizes:

- Flexible layouts using CSS Grid and Flexbox
- Scrollable containers for overflow content
- Tab-based navigation to maximize space usage

## 🚧 Future Development Areas

Based on the current implementation, these areas are prepared for future development:

1. **Actual AI Integration** - Currently using simulated responses
2. **Mood Tracking** - UI elements exist but functionality is limited
3. **Insights Generation** - Tab exists but needs implementation
4. **Enhanced Sound Library** - Expandable architecture for more sounds
5. **Custom Timer Settings** - Current timers use fixed durations

## 📂 File Structure

Key files and their purposes:

- `src/extension.ts` - Main extension code
- `resources/webviews/dashboard/dashboard.html` - Dashboard UI
- `resources/webviews/onboarding/onboarding.html` - Onboarding UI
- `resources/scripts/zenji-core.js` - Core UI functionality
- `resources/styles/main.css` - Base styles
- `resources/styles/components.css` - Component-specific styles
- `resources/assets/` - Images and media files

## 🧪 State Management

The extension uses a combination of:

1. VS Code's global state API for persistent storage
2. WebView state for temporary UI state
3. Message passing between extension and WebView

Key state objects:
- `userName` - User's name
- `avatar` - User's profile picture
- `focusStats` - Focus session statistics
- `journalEntries` - Array of journal entries
- `chatHistory` - Array of chat messages
- `sound` - Currently selected sound
- `activeTab` - Current dashboard tab
- `activeJournalTab` - Current journal sub-tab
- `onboardingComplete` - Onboarding status flag