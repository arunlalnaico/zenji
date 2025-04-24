// Initialize VS Code API
const vscode = acquireVsCodeApi();

// State management
function saveState(state) {
    vscode.setState(state);
}

function loadState() {
    return vscode.getState() || {};
}

// Send message to extension
function sendMessage(command, data = {}) {
    vscode.postMessage({
        command: command,
        ...data
    });
}

// Main tabs functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of user data
    sendMessage('getUserData');
    
    const mainTabs = document.querySelectorAll('.main-tab');
    const tabContents = document.querySelectorAll('main > .tab-content');
    
    // Restore active tab from state
    const state = loadState();
    if (state.activeTab) {
        setActiveTab(state.activeTab);
    }
    
    // Tab click handlers
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-main-tab');
            setActiveTab(tabId);
            
            // Save active tab to state
            const state = loadState();
            state.activeTab = tabId;
            saveState(state);
        });
    });
    
    // Secondary tabs (within Journal)
    const journalTabs = document.querySelectorAll('.tabs .tab');
    const journalContents = document.querySelectorAll('#journal-tab .card .tab-content');
    
    // Restore active journal tab
    if (state.activeJournalTab) {
        setActiveJournalTab(state.activeJournalTab);
    }
    
    journalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            setActiveJournalTab(tabId);
            
            // Save active journal tab to state
            const state = loadState();
            state.activeJournalTab = tabId;
            saveState(state);
        });
    });
    
    // Avatar upload functionality
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatar-preview');
    
    avatarUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarDataUrl = e.target.result;
            avatarPreview.src = avatarDataUrl;
            
            // Save avatar to state
            const state = loadState();
            state.avatar = avatarDataUrl;
            saveState(state);
            
            // Send to extension
            sendMessage('updateProfile', { avatar: avatarDataUrl });
        };
        reader.readAsDataURL(file);
    });
    
    // Load avatar from state
    if (state.avatar) {
        avatarPreview.src = state.avatar;
    }
    
    // Load user name
    if (state.userName) {
        document.getElementById('welcome-message').textContent = `Welcome back, ${state.userName}`;
    }
    
    // Initialize dashboard components
    initializeFocusTools();
    initializeSounds();
    initializeJournal();
    initializeChat();
    
    // Settings modal functionality
    const settingsModal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeBtn = document.querySelector('.close');
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    // Open settings modal
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
    
    // Close settings modal
    closeBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Clear data button
    clearDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all your Zenjispace data? This action cannot be undone.')) {
            // Send message to extension to clear data
            sendMessage('executeCommand', { commandId: 'zenjispace.clearData' });
            settingsModal.style.display = 'none';
        }
    });
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        if (message.command === 'userData') {
            // Update avatar if available
            if (message.avatar) {
                document.getElementById('avatar-preview').src = message.avatar;
                
                // Save to state
                const state = loadState();
                state.avatar = message.avatar;
                saveState(state);
            }
            
            // Update user name if available
            if (message.userName) {
                document.getElementById('welcome-message').textContent = `Welcome back, ${message.userName}`;
                
                // Save to state
                const state = loadState();
                state.userName = message.userName;
                saveState(state);
            }
        }
    });
});

// Functions to set active tabs
function setActiveTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    document.querySelector(`.main-tab[data-main-tab="${tabId}"]`)?.classList.add('active');
    
    // Hide all tab contents
    document.querySelectorAll('main > .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-tab`)?.classList.add('active');
}

function setActiveJournalTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
    
    // Hide all tab contents
    document.querySelectorAll('#journal-tab .card .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-content-tab`)?.classList.add('active');
}

// Initialize Focus Tools
function initializeFocusTools() {
    const breathingCircle = document.querySelector('.breathing-circle');
    const startFocusBtn = document.getElementById('startFocus');
    const startBreakBtn = document.getElementById('startBreak');
    
    // Load stats from state
    const state = loadState();
    const focusStats = state.focusStats || {
        focusCount: 0,
        focusMinutes: 0,
        breakCount: 0,
        moodAvg: '-'
    };
    
    // Update stats display
    document.getElementById('focusCount').textContent = focusStats.focusCount;
    document.getElementById('focusMinutes').textContent = focusStats.focusMinutes;
    document.getElementById('breakCount').textContent = focusStats.breakCount;
    document.getElementById('moodAvg').textContent = focusStats.moodAvg;
    
    // Breathing circle interaction
    breathingCircle.addEventListener('click', () => {
        breathingCircle.classList.toggle('active');
    });
    
    // Focus session button
    startFocusBtn.addEventListener('click', () => {
        // This would typically start a timer and show notifications
        // For now, just update stats
        focusStats.focusCount++;
        focusStats.focusMinutes += 25;
        
        // Update display
        document.getElementById('focusCount').textContent = focusStats.focusCount;
        document.getElementById('focusMinutes').textContent = focusStats.focusMinutes;
        
        // Save to state
        state.focusStats = focusStats;
        saveState(state);
        
        // Notify extension
        sendMessage('startFocus', { duration: 25 });
    });
    
    // Break button
    startBreakBtn.addEventListener('click', () => {
        // Similar to focus, but for breaks
        focusStats.breakCount++;
        
        // Update display
        document.getElementById('breakCount').textContent = focusStats.breakCount;
        
        // Save to state
        state.focusStats = focusStats;
        saveState(state);
        
        // Notify extension
        sendMessage('startBreak', { duration: 5 });
    });
}

// Initialize Sounds
function initializeSounds() {
    const soundsContainer = document.getElementById('soundsContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    
    // Sample sound data - in a real app, this might come from the extension
    const sounds = [
        { id: 'rain', name: 'Rain', description: 'Gentle rainfall', url: 'https://example.com/rain.mp3', icon: '🌧️' },
        { id: 'forest', name: 'Forest', description: 'Birds and trees', url: 'https://example.com/forest.mp3', icon: '🌲' },
        { id: 'waves', name: 'Ocean Waves', description: 'Calming sea sounds', url: 'https://example.com/waves.mp3', icon: '🌊' },
        { id: 'cafe', name: 'Café', description: 'Coffee shop ambience', url: 'https://example.com/cafe.mp3', icon: '☕' },
        { id: 'whitenoise', name: 'White Noise', description: 'Block distractions', url: 'https://example.com/whitenoise.mp3', icon: '🔊' },
        { id: 'lofi', name: 'Lo-Fi', description: 'Relaxing beats', url: 'https://example.com/lofi.mp3', icon: '🎵' }
    ];
    
    // Load active sound from state
    const state = loadState();
    let activeSound = state.sound;
    
    // Create sound cards
    sounds.forEach(sound => {
        const soundCard = document.createElement('div');
        soundCard.classList.add('sound-card');
        soundCard.dataset.sound = sound.id;
        
        if (activeSound === sound.id) {
            soundCard.classList.add('active');
        }
        
        soundCard.innerHTML = `
            <div class="sound-icon">${sound.icon}</div>
            <div class="sound-name">${sound.name}</div>
            <div class="sound-description">${sound.description}</div>
        `;
        
        soundCard.addEventListener('click', () => {
            const allSoundCards = document.querySelectorAll('.sound-card');
            
            if (activeSound === sound.id) {
                // Stop playing if clicking the active sound
                audioPlayer.pause();
                soundCard.classList.remove('active');
                activeSound = null;
            } else {
                // Remove active class from all sound cards
                allSoundCards.forEach(card => card.classList.remove('active'));
                
                // Add active class to clicked sound
                soundCard.classList.add('active');
                
                // Update audio player
                audioPlayer.src = sound.url;
                audioPlayer.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
                
                activeSound = sound.id;
            }
            
            // Save to state
            state.sound = activeSound;
            saveState(state);
        });
        
        soundsContainer.appendChild(soundCard);
    });
}

// Initialize Journal
function initializeJournal() {
    const journalEntry = document.getElementById('journalEntry');
    const saveJournalBtn = document.getElementById('saveJournal');
    const journalEntriesList = document.getElementById('journalEntriesList');
    
    // Load journal entries from state
    const state = loadState();
    const journalEntries = state.journalEntries || [];
    
    // Display existing entries
    renderJournalEntries(journalEntries);
    
    // Save journal entry
    saveJournalBtn.addEventListener('click', () => {
        const entryText = journalEntry.value.trim();
        if (!entryText) return;
        
        // Create new entry
        const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            content: entryText
        };
        
        // Add to entries array
        journalEntries.unshift(newEntry);
        
        // Save to state
        state.journalEntries = journalEntries;
        saveState(state);
        
        // Clear input
        journalEntry.value = '';
        
        // Re-render entries
        renderJournalEntries(journalEntries);
        
        // Notify extension
        sendMessage('saveJournalEntry', { entry: newEntry });
    });
    
    function renderJournalEntries(entries) {
        journalEntriesList.innerHTML = '';
        
        if (entries.length === 0) {
            journalEntriesList.innerHTML = '<p>No journal entries yet. Start writing your thoughts!</p>';
            return;
        }
        
        entries.slice(0, 5).forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.classList.add('journal-entry');
            
            const date = new Date(entry.date);
            const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            entryElement.innerHTML = `
                <div class="journal-date">${formattedDate}</div>
                <div class="journal-content">${entry.content}</div>
            `;
            
            journalEntriesList.appendChild(entryElement);
        });
    }
}

// Initialize Chat
function initializeChat() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChat');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Load chat history from state
    const state = loadState();
    const chatHistory = state.chatHistory || [];
    
    // Display existing messages
    renderChatMessages(chatHistory);
    
    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to history
        chatHistory.push({ role: 'user', content: message });
        
        // Update chat UI
        renderChatMessages(chatHistory);
        
        // Clear input
        chatInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'flex';
        
        // Simulate AI response (in a real app, this would call the extension)
        setTimeout(() => {
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Add AI response
            chatHistory.push({ 
                role: 'assistant', 
                content: "I'm here to help you stay mindful during your coding sessions. Remember to take breaks and stay hydrated. What specific mindfulness assistance do you need today?"
            });
            
            // Update chat UI
            renderChatMessages(chatHistory);
            
            // Save to state
            state.chatHistory = chatHistory;
            saveState(state);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1500);
    }
    
    // Send button click
    sendChatBtn.addEventListener('click', sendMessage);
    
    // Enter key press
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function renderChatMessages(messages) {
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            // Add welcome message
            const welcomeMsg = document.createElement('div');
            welcomeMsg.classList.add('message', 'message-ai');
            welcomeMsg.innerHTML = `
                <div class="message-content">
                    Hello! I'm Zenji, your mindful AI coding companion. How can I help you today?
                </div>
            `;
            chatMessages.appendChild(welcomeMsg);
            return;
        }
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', msg.role === 'user' ? 'message-user' : 'message-ai');
            
            messageElement.innerHTML = `
                <div class="message-content">${msg.content}</div>
            `;
            
            chatMessages.appendChild(messageElement);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
