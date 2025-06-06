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
            
            // Send tab change to extension for syncing
            sendMessage('updateActiveTab', { activeTab: tabId });
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
            
            // Send journal tab change to extension for syncing
            sendMessage('updateActiveJournalTab', { activeJournalTab: tabId });
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
            
            // Update journal entries if available
            if (message.journalEntries) {
                const state = loadState();
                state.journalEntries = message.journalEntries;
                saveState(state);
                
                // Re-render journal entries if the journal tab exists and is active
                const journalTab = document.getElementById('journal-tab');
                const journalEntriesList = document.getElementById('journalEntriesList');
                
                if (journalEntriesList) {
                    renderJournalEntries(message.journalEntries);
                }
            }
        }
    });

    // Add event listener for the sync button
    const syncButton = document.getElementById('syncButton');
    if (syncButton) {
        syncButton.addEventListener('click', () => {
            // Send the sync command to the extension
            sendMessage('executeCommand', { commandId: 'zenjispace.syncToCloud' });
        });
    }
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
    const timerDisplay = document.getElementById('timerDisplay');
    const timerTime = document.querySelector('.timer-time');
    const timerLabel = document.querySelector('.timer-label');
    const cancelTimerBtn = document.getElementById('cancelTimer');
    
    // Variables for timer
    let timerInterval;
    let remainingSeconds = 0;
    let isTimerRunning = false;
    let timerType = ''; // 'focus' or 'break'
    
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
    
    // Format seconds to MM:SS display
    function formatTimeDisplay(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Start timer function
    function startTimer(duration, type) {
        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Set timer variables
        remainingSeconds = duration * 60;
        isTimerRunning = true;
        timerType = type;
        
        // Update display
        timerTime.textContent = formatTimeDisplay(remainingSeconds);
        timerLabel.textContent = type === 'focus' ? 'Focus Session' : 'Break Time';
        timerDisplay.style.display = 'block';
        
        // Hide buttons while timer is running
        startFocusBtn.style.display = 'none';
        startBreakBtn.style.display = 'none';
        
        // Start countdown
        timerInterval = setInterval(() => {
            remainingSeconds--;
            
            // Update timer display
            timerTime.textContent = formatTimeDisplay(remainingSeconds);
            
            // Check if timer is complete
            if (remainingSeconds <= 0) {
                completeTimer();
            }
        }, 1000);
    }
    
    // Complete timer function
    function completeTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        // Show notification
        const message = timerType === 'focus' 
            ? 'Focus session completed! Take a break.' 
            : 'Break time is over. Ready for another focus session?';
            
        // You can add notification code here
        console.log(message);
        
        // Reset UI
        resetTimerUI();
    }
    
    // Reset timer UI
    function resetTimerUI() {
        timerDisplay.style.display = 'none';
        startFocusBtn.style.display = 'inline-block';
        startBreakBtn.style.display = 'inline-block';
    }
    
    // Cancel timer
    cancelTimerBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            
            // If canceling a focus session, don't count it in stats
            if (timerType === 'focus') {
                // Subtract the session we added at the start
                focusStats.focusCount--;
                // Only subtract minutes that weren't actually focused
                const minutesFocused = Math.ceil((25 * 60 - remainingSeconds) / 60);
                focusStats.focusMinutes -= (25 - minutesFocused);
                
                // Update display
                document.getElementById('focusCount').textContent = focusStats.focusCount;
                document.getElementById('focusMinutes').textContent = focusStats.focusMinutes;
                
                // Save to state
                state.focusStats = focusStats;
                saveState(state);
            }
            
            resetTimerUI();
        }
    });
    
    // Focus session button
    startFocusBtn.addEventListener('click', () => {
        // Update stats
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
        
        // Start the timer for 25 minutes
        startTimer(25, 'focus');
    });
    
    // Break button
    startBreakBtn.addEventListener('click', () => {
        // Update stats
        focusStats.breakCount++;
        
        // Update display
        document.getElementById('breakCount').textContent = focusStats.breakCount;
        
        // Save to state
        state.focusStats = focusStats;
        saveState(state);
        
        // Notify extension
        sendMessage('startBreak', { duration: 5 });
        
        // Start the timer for 5 minutes
        startTimer(5, 'break');
    });
}

// Initialize Sounds
function initializeSounds() {
    const soundsContainer = document.getElementById('soundsContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    
    // Retrieve the assetsUri from the HTML (injected during webview panel creation)
    const assetsUri = document.querySelector('meta[name="assetsUri"]')?.getAttribute('content');
    
    if (!assetsUri) {
        console.error('Assets URI not found in meta tag');
        return;
    }
    
    // Sound data with public URLs instead of local files
    const sounds = [
        { id: 'rain', name: 'Rain', description: 'Gentle rainfall', url: `https://cdn.pixabay.com/download/audio/2024/10/30/audio_42e6870f29.mp3?filename=calming-rain-257596.mp3`, icon: '🌧️' },
        { id: 'forest', name: 'Forest', description: 'Birds and trees', url: `https://cdn.pixabay.com/download/audio/2025/02/03/audio_7599bcb342.mp3?filename=forest-ambience-296528.mp3`, icon: '🌲' },
        { id: 'waves', name: 'Ocean Waves', description: 'Calming sea sounds', url: `https://cdn.pixabay.com/download/audio/2025/03/14/audio_75bef6c8dd.mp3?filename=sounds-of-waves-313367.mp3`, icon: '🌊' },
        { id: 'cafe', name: 'Café', description: 'Coffee shop ambience', url: `https://cdn.pixabay.com/download/audio/2021/10/10/audio_1009cd220b.mp3?filename=cafe-ambience-9263.mp3`, icon: '☕' },
        { id: 'whitenoise', name: 'White Noise', description: 'Block distractions', url: `https://cdn.pixabay.com/download/audio/2024/10/31/audio_a181bdd17b.mp3?filename=white-noise-257802.mp3`, icon: '🔊' },
        { id: 'lofi', name: 'Lo-Fi', description: 'Relaxing beats', url: `https://cdn.pixabay.com/download/audio/2025/04/22/audio_21619756a2.mp3?filename=lofi-sample-if-i-cant-have-you-330746.mp3`, icon: '🎵' }
    ];
    
    // Create a sound lookup map for easy retrieval
    const soundMap = {};
    sounds.forEach(sound => {
        soundMap[sound.id] = sound;
    });
    
    // Load active sound from state
    const state = loadState();
    let activeSound = state.sound ? state.sound.id || state.sound : null;
    let activeSoundObj = null;
    
    // If the active sound is no longer in our available sounds list, reset it
    if (activeSound && !sounds.some(sound => sound.id === activeSound)) {
        activeSound = null;
        state.sound = null;
        saveState(state);
    } else if (activeSound) {
        // Get the full sound object
        activeSoundObj = soundMap[activeSound];
    }
    
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
                activeSoundObj = null;
            } else {
                // Remove active class from all sound cards
                allSoundCards.forEach(card => card.classList.remove('active'));
                
                // Add active class to clicked sound
                soundCard.classList.add('active');
                
                // Update audio player with proper error handling
                audioPlayer.src = sound.url;
                
                // Play the audio with error handling
                audioPlayer.play().catch(error => {
                    console.error('Error playing audio:', error);
                    
                    // Show error message to user
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'sound-error';
                    errorMsg.textContent = 'Could not play sound. Audio file may be missing.';
                    errorMsg.style.color = 'red';
                    errorMsg.style.fontSize = '0.9em';
                    errorMsg.style.marginTop = '10px';
                    errorMsg.style.padding = '5px';
                    
                    // Remove any existing error messages
                    const existingError = soundsContainer.querySelector('.sound-error');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    // Add the error message
                    soundsContainer.appendChild(errorMsg);
                    
                    // Remove active class since playback failed
                    soundCard.classList.remove('active');
                    activeSound = null;
                    activeSoundObj = null;
                });
                
                activeSound = sound.id;
                activeSoundObj = sound;
            }
            
            // Save the full sound object to state, not just the ID
            state.sound = activeSoundObj ? {
                id: activeSoundObj.id,
                url: activeSoundObj.url,
                name: activeSoundObj.name
            } : null;
            saveState(state);
            
            // Send full sound object to extension for syncing
            sendMessage('updateSound', { sound: state.sound });
        });
        
        soundsContainer.appendChild(soundCard);
    });
    
    // If a sound was previously active, make sure it starts playing
    if (activeSoundObj) {
        audioPlayer.src = activeSoundObj.url;
        // Don't autoplay on load to avoid unexpected sounds
    }
    
    // Add a message if there are no sounds available
    if (sounds.length === 0) {
        const noSoundsMsg = document.createElement('div');
        noSoundsMsg.className = 'no-sounds-message';
        noSoundsMsg.textContent = 'No sound files are currently available.';
        noSoundsMsg.style.textAlign = 'center';
        noSoundsMsg.style.padding = '20px';
        noSoundsMsg.style.opacity = '0.7';
        soundsContainer.appendChild(noSoundsMsg);
    }
}

// Initialize Journal
function initializeJournal() {
    const journalEntry = document.getElementById('journalEntry');
    const saveJournalBtn = document.getElementById('saveJournal');
    const journalEntriesList = document.getElementById('journalEntriesList');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageIndicator = document.getElementById('pageIndicator');
    
    // Pagination variables
    const ENTRIES_PER_PAGE = 5;
    let currentPage = 1;
    
    // Load journal entries from state
    const state = loadState();
    let journalEntries = state.journalEntries || [];
    
    // Initialize pagination state if not exists
    if (!state.journalCurrentPage) {
        state.journalCurrentPage = 1;
        saveState(state);
    } else {
        currentPage = state.journalCurrentPage;
    }
    
    // Display existing entries with pagination
    renderJournalEntries(journalEntries, currentPage);
    updatePaginationControls(journalEntries, currentPage);
    
    // Handle pagination button clicks
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            state.journalCurrentPage = currentPage;
            saveState(state);
            renderJournalEntries(journalEntries, currentPage);
            updatePaginationControls(journalEntries, currentPage);
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(journalEntries.length / ENTRIES_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            state.journalCurrentPage = currentPage;
            saveState(state);
            renderJournalEntries(journalEntries, currentPage);
            updatePaginationControls(journalEntries, currentPage);
        }
    });
    
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
        
        // Get the latest entries from state to ensure we have the most up-to-date list
        const currentState = loadState();
        const currentEntries = currentState.journalEntries || [];
        
        // Add to entries array (ensure we're working with a new array by spreading)
        const updatedEntries = [newEntry, ...currentEntries];
        
        // Save to state
        currentState.journalEntries = updatedEntries;
        
        // Reset to first page when adding a new entry
        currentPage = 1;
        currentState.journalCurrentPage = currentPage;
        saveState(currentState);
        
        // Update our local reference
        journalEntries = updatedEntries;
        
        // Clear input
        journalEntry.value = '';
        
        // Re-render entries with pagination
        renderJournalEntries(updatedEntries, currentPage);
        updatePaginationControls(updatedEntries, currentPage);
        
        // Send to extension for permanent storage - ensure we're sending ALL entries
        sendMessage('saveJournalEntries', { entries: updatedEntries });
    });
    
    // Add a helper function to expose renderJournalEntries globally
    window.renderJournalEntries = function(entries) {
        // Reset to first page when receiving new entries from sync
        if (entries && entries.length > 0) {
            currentPage = 1;
            const currentState = loadState();
            currentState.journalEntries = entries;
            currentState.journalCurrentPage = currentPage;
            saveState(currentState);
            journalEntries = entries;
        }
        
        renderJournalEntries(entries, currentPage);
        updatePaginationControls(entries, currentPage);
    };
    
    // Update pagination controls based on current page and total pages
    function updatePaginationControls(entries, page) {
        const totalEntries = entries?.length || 0;
        const totalPages = Math.ceil(totalEntries / ENTRIES_PER_PAGE);
        
        // Update page indicator text
        pageIndicator.textContent = `Page ${page} of ${totalPages || 1}`;
        
        // Disable/enable previous button
        prevPageBtn.disabled = page <= 1;
        
        // Disable/enable next button
        nextPageBtn.disabled = page >= totalPages || totalPages === 0;
        
        // Hide pagination controls if there's only one page or less
        const paginationControls = document.getElementById('journalPagination');
        if (paginationControls) {
            paginationControls.style.display = totalPages <= 1 ? 'none' : 'flex';
        }
    }
    
    function renderJournalEntries(entries, page) {
        if (!journalEntriesList) return; // Guard against element not existing
        
        journalEntriesList.innerHTML = '';
        
        if (!entries || entries.length === 0) {
            journalEntriesList.innerHTML = '<p>No journal entries yet. Start writing your thoughts!</p>';
            return;
        }
        
        // Calculate start and end indices for the current page
        const startIndex = (page - 1) * ENTRIES_PER_PAGE;
        const endIndex = Math.min(startIndex + ENTRIES_PER_PAGE, entries.length);
        
        // Display only the entries for the current page
        for (let i = startIndex; i < endIndex; i++) {
            const entry = entries[i];
            const entryElement = document.createElement('div');
            entryElement.classList.add('journal-entry');
            
            const date = new Date(entry.date);
            const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            entryElement.innerHTML = `
                <div class="journal-date">${formattedDate}</div>
                <div class="journal-content">${entry.content}</div>
            `;
            
            journalEntriesList.appendChild(entryElement);
        }
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
    function sendChatMessage() {
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
        
        // Send message to extension to get AI response from OpenAI
        sendMessage('getAIChatResponse', { chatHistory: chatHistory });
        
        // Listen for response from OpenAI via the extension
        const responseHandler = function(event) {
            const response = event.data;
            
            if (response.command === 'aiChatResponse') {
                // Remove this event listener once we've processed the response
                window.removeEventListener('message', responseHandler);
                
                // Hide typing indicator
                typingIndicator.style.display = 'none';
                
                if (response.success) {
                    // Add AI response to history
                    chatHistory.push({ 
                        role: 'assistant', 
                        content: response.content
                    });
                } else {
                    // Add error message if something went wrong
                    chatHistory.push({ 
                        role: 'assistant', 
                        content: response.content
                    });
                }
                
                // Update chat UI
                renderChatMessages(chatHistory);
                
                // Save to state
                state.chatHistory = chatHistory;
                saveState(state);
                
                // Send chat history to extension for syncing
                sendMessage('saveChatMessage', { chatHistory: chatHistory });
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        };
        
        // Add event listener for the AI response
        window.addEventListener('message', responseHandler);
    }
    
    // Send button click
    sendChatBtn.addEventListener('click', sendChatMessage);
    
    // Enter key press
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
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

// Initialize modals
function initializeModals() {
    // Settings modal functionality
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsButton');
    const settingsClose = settingsModal.querySelector('.close');
    
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
    
    settingsClose.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    // Integrations modal functionality
    const integrationsModal = document.getElementById('integrationsModal');
    const integrationsBtn = document.getElementById('integrationsButton');
    const integrationsClose = integrationsModal.querySelector('.close');
    
    integrationsBtn.addEventListener('click', () => {
        integrationsModal.style.display = 'block';
    });
    
    integrationsClose.addEventListener('click', () => {
        integrationsModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (event.target === integrationsModal) {
            integrationsModal.style.display = 'none';
        }
    });
    
    // Handle integration connect buttons
    const connectButtons = document.querySelectorAll('.integration-connect-btn');
    connectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const service = button.dataset.service;
            
            // Store the connection attempt in state
            const state = loadState();
            if (!state.integrations) {
                state.integrations = {};
            }
            
            // For demo purposes, just toggle the connection status
            if (state.integrations[service]) {
                // If already connected, disconnect
                delete state.integrations[service];
                button.textContent = 'Connect';
                button.classList.remove('btn-secondary');
                
                // Update UI to show disconnected state
                const card = button.closest('.integration-card');
                card.classList.remove('connected');
            } else {
                // If not connected, connect
                state.integrations[service] = {
                    connected: true,
                    connectedAt: new Date().toISOString()
                };
                button.textContent = 'Disconnect';
                button.classList.add('btn-secondary');
                
                // Update UI to show connected state
                const card = button.closest('.integration-card');
                card.classList.add('connected');
                
                // For Spotify specifically, we'll send a command to the extension
                if (service === 'spotify') {
                    sendMessage('connectSpotify');
                }
            }
            
            saveState(state);
        });
    });
}

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    initializeModals();
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize journal functionality
    initializeJournal();
    
    // Initialize chat functionality
    initializeChat();
    
    // Initialize focus timer
    initializeFocusTimer();
    
    // Initialize breathing circle
    initializeBreathingCircle();
    
    // Initialize sounds
    initializeSounds();
    
    // Update sound integration button states
    updateSoundIntegrationButtons();
});
