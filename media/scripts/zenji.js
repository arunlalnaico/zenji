/**
 * Zenjispace Main Script
 * Entry point for the Zenjispace webview
 */

// Ensure the VS Code API is accessible
const vscode = acquireVsCodeApi();

// Log initialization message
console.log('Zenjispace initialized');

// Import our script modules (these are loaded via script tags in HTML)
// This file serves mainly as a documentation of the script structure
// Core modules:
// - zenji-core.js: Core utilities and state management
// - zenji-tabs.js: Tab navigation system
// - zenji-focus.js: Focus timer and mindfulness tools
// - zenji-sounds.js: Ambient sounds management
// - zenji-journal.js: Journal and insights
// - zenji-chat.js: Chat interface with AI
