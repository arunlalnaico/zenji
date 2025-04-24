/**
 * Zenjispace Core Functionality
 * Handles common utilities and application state
 */

// Initialize VS Code API
const vscode = acquireVsCodeApi();

// Global application state
let zenjiState = {};

// Load state from storage
function loadState() {
    const state = vscode.getState();
    if (state) {
        zenjiState = state;
        return state;
    }
    return {};
}

// Save state to storage
function saveState() {
    vscode.setState(zenjiState);
}

// Update a specific part of the state
function updateState(key, value) {
    zenjiState[key] = value;
    saveState();
}

// Clear all webview state
function clearState() {
    zenjiState = {};
    saveState();
    console.log('Zenjispace webview state cleared');
}

// Send message to extension host
function sendMessage(command, data = {}) {
    vscode.postMessage({
        command,
        ...data
    });
}

// Show notification
function showNotification(text) {
    sendMessage('alert', { text });
}

// Initialize Zenjispace
document.addEventListener('DOMContentLoaded', () => {
    console.log('Zenjispace loaded');
    
    // Load initial state
    loadState();
    
    // Initialize avatar if present in state
    if (zenjiState.avatar) {
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.src = zenjiState.avatar;
        }
    }
    
    // Set up avatar upload
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (avatarUpload && avatarPreview) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.src = e.target.result;
                    updateState('avatar', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'clearData':
                // Clear all webview state
                clearState();
                
                // Reload the page to reset UI
                window.location.reload();
                break;
        }
    });
});
