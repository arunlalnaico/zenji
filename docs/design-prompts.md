# Zenji Design Prompts

This document contains design references for Zenji's UI components that can be used to ensure design consistency when making future changes.

## Dashboard Panel Design

### Header Section
```html
<div class="header">
    <div class="profile">
        <div class="avatar-upload">
            <div class="avatar">
                ${userAvatar 
                    ? `<img src="${userAvatar}" alt="User Avatar" />`
                    : `<img src="${defaultAvatarUri}" alt="Default Avatar" />`
                }
            </div>
            <div class="avatar-edit">
                <input type="file" id="avatarUpload" accept=".jpg, .jpeg, .png" />
                <label for="avatarUpload">📷</label>
            </div>
        </div>
        <div>
            <div class="welcome-message">${welcomeMessage}</div>
            <div class="daily-quote">Remember: small moments of mindfulness create great clarity.</div>
        </div>
    </div>
</div>
```

### AI Assistant Section
```html
<div class="ai-assistant-container">
    <div class="ai-assistant-bg"></div>
    <div class="ai-assistant">
        <div class="ai-icon">
            <img src="${zenjiLogoUri}" alt="Zenji AI" class="zenji-logo" />
        </div>
        <div class="ai-message">
            <div class="ai-greeting">I'm Zenji, your mindful AI companion.</div>
            <div class="ai-suggestion">How can I assist you today? Try the focus timer or a quick breathing session.</div>
        </div>
    </div>
</div>
```

### Main Navigation Tabs
```html
<div class="main-tabs">
    <div class="main-tab active" data-main-tab="mindfulness">
        <span class="main-tab-icon">🧘</span>Mindfulness
    </div>
    <div class="main-tab" data-main-tab="sounds">
        <span class="main-tab-icon">🎵</span>Sounds
    </div>
    <div class="main-tab" data-main-tab="journal">
        <span class="main-tab-icon">📓</span>Journal
    </div>
    <div class="main-tab" data-main-tab="chat">
        <span class="main-tab-icon">💬</span>Ask Zenji
    </div>
</div>
```

### Focus Tools Card
```html
<div class="card">
    <div class="card-header">
        <div class="card-icon">🧘</div>
        <h2>Focus Tools</h2>
    </div>
    <button id="startFocus" class="btn">Start 25min Focus Session</button>
    <button id="startBreak" class="btn btn-secondary">Take a 5min Break</button>
    
    <div class="breathing-circle">
        <span>Breathe</span>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value" id="focusCount">0</div>
            <div class="stat-label">Focus Sessions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="focusMinutes">0</div>
            <div class="stat-label">Minutes Focused</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="breakCount">0</div>
            <div class="stat-label">Breaks Taken</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="moodAvg">-</div>
            <div class="stat-label">Mood Average</div>
        </div>
    </div>
</div>
```

### Ambient Sounds Card
```html
<div class="card">
    <div class="card-header">
        <div class="card-icon">🎵</div>
        <h2>Ambient Sounds</h2>
    </div>
    <p>Play calming background sounds to help you focus and relax while coding.</p>
    
    <div class="sounds-container" id="soundsContainer">
        <!-- Sounds will be dynamically loaded here -->
    </div>
    
    <!-- Hidden audio player element -->
    <audio id="audioPlayer" loop></audio>
</div>
```

### Sound Card Template
```html
<div class="sound-card">
    <div class="sound-icon">
        <i class="codicon codicon-${sound.iconName}"></i>
    </div>
    <div class="sound-name">${sound.name}</div>
    <div class="sound-description">${sound.description}</div>
</div>
```

### Journal Card
```html
<div class="card">
    <div class="card-header">
        <div class="card-icon">📓</div>
        <h2>Journal & Insights</h2>
    </div>
    
    <div class="tabs">
        <div class="tab active" data-tab="journal">Journal</div>
        <div class="tab" data-tab="insights">Weekly Insights</div>
    </div>
    
    <div class="tab-content active" id="journal-content-tab">
        <div class="journal-prompt">
            <p>Today's prompt: What went well in your coding today?</p>
        </div>
        
        <textarea id="journalEntry" placeholder="Write your thoughts here..." rows="4"></textarea>
        <button id="saveJournal" class="btn">Save Entry</button>
        
        <h3>Recent Entries</h3>
        <div class="journal-entries" id="journalEntriesList">
            <!-- Journal entries will be dynamically added here -->
        </div>
    </div>
</div>
```

### Chat Card
```html
<div class="card">
    <div class="card-header">
        <div class="card-icon">💬</div>
        <h2>Ask Zenji</h2>
    </div>
    <div class="ai-chat">
        <div id="chatMessages"></div>
        <div id="typingIndicator" class="typing-indicator" style="display: none;">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
        <div class="chat-input">
            <input type="text" id="chatInput" placeholder="Ask anything about mindfulness or wellness..." />
            <button id="sendChat" class="btn">Send</button>
        </div>
    </div>
</div>
```

## Onboarding Panel Design

### Welcome Header
```html
<div class="welcome-header">
    <h1>Welcome to Zenji AI</h1>
    <div class="tagline">Your mindful AI coding companion</div>
</div>
```

### Onboarding Card with Step Indicators
```html
<div class="onboarding-card">
    <div class="step-indicator">
        <div class="step active" id="step-indicator-1"></div>
        <div class="step" id="step-indicator-2"></div>
        <div class="step" id="step-indicator-3"></div>
    </div>

    <!-- Step 1: Name Input -->
    <div id="step-1" class="step-content active">
        <h2>Let's get started</h2>
        <p>Zenji is your AI coding companion designed to help you maintain mental wellness while coding. Let's set up your profile.</p>
        
        <div class="form-group">
            <label for="userName">What's your name?</label>
            <input type="text" id="userName" placeholder="Enter your name" autofocus />
        </div>
        
        <div class="navigation">
            <div></div> <!-- Empty div for spacing -->
            <button id="next-1" class="btn">Next</button>
        </div>
    </div>

    <!-- Step 2: Profile Picture -->
    <div id="step-2" class="step-content">
        <h2>Choose a profile picture</h2>
        
        <div class="avatar-container">
            <div class="avatar">
                <img src="${defaultAvatarUri}" alt="Default Avatar" id="avatar-preview" />
                <div class="avatar-edit">
                    <input type="file" id="avatarUpload" accept=".jpg, .jpeg, .png" />
                    <label for="avatarUpload">📷</label>
                </div>
            </div>
        </div>
        
        <p class="info-text">Upload a profile picture or use our default avatar</p>
        
        <div class="navigation">
            <button id="back-2" class="btn btn-secondary">Back</button>
            <button id="next-2" class="btn">Next</button>
        </div>
    </div>

    <!-- Step 3: Completion -->
    <div id="step-3" class="step-content">
        <h2>You're all set!</h2>
        
        <div class="profile-preview">
            <div class="avatar-container">
                <div class="avatar">
                    <img src="${defaultAvatarUri}" alt="User Avatar" id="final-avatar-preview" />
                </div>
            </div>
            <div class="welcome-message" id="final-welcome-message">Welcome, Friend</div>
        </div>
        
        <p>Zenji is ready to help you maintain focus, track your mood, and support your mental wellness through your coding journey.</p>
        
        <div class="navigation">
            <button id="back-3" class="btn btn-secondary">Back</button>
            <button id="complete" class="btn">Enter Zenji Space</button>
        </div>
    </div>
</div>
```

## CSS Design Reference

### Color Palette
```css
:root {
    --primary-color: #6a73c1;
    --secondary-color: #5cb3a7;
    --accent-color: #a17ef6;
    --text-color: var(--vscode-foreground);
    --bg-color: var(--vscode-editor-background);
    --card-bg: var(--vscode-editor-background);
    --card-border: rgba(123, 138, 174, 0.2);
    --card-shadow: rgba(0, 0, 0, 0.1);
    --transition-speed: 0.3s;
}
```

### Card Style
```css
.card {
    background-color: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--card-border);
    transition: transform var(--transition-speed), box-shadow var(--transition-speed);
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}
```

### Button Styles
```css
.btn {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all var(--transition-speed);
    box-shadow: 0 4px 8px rgba(106, 115, 193, 0.2);
    margin-right: 8px;
    margin-bottom: 8px;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(106, 115, 193, 0.3);
}

.btn:active {
    transform: translateY(0);
}

.btn-secondary {
    background: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    box-shadow: none;
}

.btn-secondary:hover {
    background: rgba(106, 115, 193, 0.1);
    box-shadow: none;
}
```

### Tab Navigation
```css
.main-tabs {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--card-border);
    overflow-x: auto;
    scrollbar-width: thin;
}

.main-tab {
    padding: 12px 18px;
    cursor: pointer;
    opacity: 0.7;
    transition: all var(--transition-speed);
    position: relative;
    display: flex;
    align-items: center;
    white-space: nowrap;
}

.main-tab.active {
    opacity: 1;
    font-weight: 500;
}

.main-tab.active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
}
```

### Avatar and Profile Styles
```css
.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    margin-right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.8em;
    box-shadow: 0 8px 16px rgba(106, 115, 193, 0.2);
    border: 3px solid rgba(255, 255, 255, 0.2);
    transition: all var(--transition-speed);
    position: relative;
    overflow: hidden;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 20px rgba(106, 115, 193, 0.3);
}
```

### Animations
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes breathe {
    0% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 4px 16px rgba(106, 115, 193, 0.2); }
    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 12px 32px rgba(106, 115, 193, 0.4); }
    100% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 4px 16px rgba(106, 115, 193, 0.2); }
}

@keyframes typingAnimation {
    0% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0); }
}
```

### Sound Card Styles
```css
.sounds-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.sound-card {
    background-color: rgba(106, 115, 193, 0.05);
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    transition: all var(--transition-speed);
    cursor: pointer;
    border: 1px solid transparent;
}

.sound-card:hover {
    background-color: rgba(106, 115, 193, 0.1);
    transform: translateY(-3px);
}

.sound-card.active {
    border-color: var(--primary-color);
    background-color: rgba(106, 115, 193, 0.15);
}
```
