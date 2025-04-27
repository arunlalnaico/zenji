"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const mongodb_service_1 = require("./mongodb-service");
const openai_service_1 = require("./openai-service");
let zenjiPanel;
let statusBarItem;
let authStatusBarItem;
// Define session token to check if the user is authenticated
let session;
function activate(context) {
    var _a;
    // Initialize MongoDB connection
    (0, mongodb_service_1.initMongoDB)(context).catch(error => {
        console.error('Failed to initialize MongoDB:', error);
    });
    // Initialize OpenAI connection
    (0, openai_service_1.initOpenAI)(context).catch(error => {
        console.error('Failed to initialize OpenAI:', error);
    });
    // Initialize main Zenji status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(zen) Zenji AI";
    statusBarItem.tooltip = "Open Zenjispace - Your mindful AI coding companion";
    statusBarItem.command = 'zenjispace.open';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Initialize auth status bar item
    authStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    updateAuthStatusBarItem();
    authStatusBarItem.show();
    context.subscriptions.push(authStatusBarItem);
    // Check for existing auth session
    checkForExistingSession(context);
    // Check if this is a fresh installation or an update
    const currentVersion = (_a = vscode.extensions.getExtension('arunlals89@gmail.com.zenjispace')) === null || _a === void 0 ? void 0 : _a.packageJSON.version;
    const previousVersion = context.globalState.get('extensionVersion');
    // If there's no previous version stored, or the version has changed, it's a new install or update
    if (!previousVersion || previousVersion !== currentVersion) {
        // Store the current version
        context.globalState.update('extensionVersion', currentVersion);
        // Automatically open Zenjispace after installation or update
        setTimeout(() => {
            vscode.commands.executeCommand('zenjispace.open');
        }, 1500); // Short delay to ensure VS Code UI is ready
    }
    const isFirstRun = context.globalState.get('zenjiFirstRun', true);
    const onboardingComplete = context.globalState.get('onboardingComplete', false);
    if (isFirstRun) {
        context.globalState.update('zenjiFirstRun', false);
        if (onboardingComplete) {
            openZenjiDashboard(context);
        }
        else {
            openZenjiOnboarding(context);
        }
    }
    // Register all commands
    context.subscriptions.push(vscode.commands.registerCommand('zenjispace.open', () => {
        if (context.globalState.get('onboardingComplete', false)) {
            openZenjiDashboard(context);
        }
        else {
            openZenjiOnboarding(context);
        }
    }), vscode.commands.registerCommand('zenjispace.onboarding', () => openZenjiOnboarding(context)), vscode.commands.registerCommand('zenjispace.clearData', () => __awaiter(this, void 0, void 0, function* () {
        const confirm = yield vscode.window.showWarningMessage('This will clear all Zenjispace user data. This action cannot be undone.', { modal: true }, 'Clear Data', 'Cancel');
        if (confirm === 'Clear Data') {
            yield clearAllData(context);
            vscode.window.showInformationMessage('Zenjispace data has been cleared successfully.');
        }
    })), vscode.commands.registerCommand('zenjispace.forceCompleteOnboarding', () => __awaiter(this, void 0, void 0, function* () {
        yield context.globalState.update('onboardingComplete', true);
        openZenjiDashboard(context);
    })), vscode.commands.registerCommand('zenjispace.syncToCloud', () => __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if user is authenticated before syncing
            if (!session) {
                const shouldLogin = yield vscode.window.showInformationMessage('You need to sign in with GitHub to sync your data across devices.', 'Sign in with GitHub', 'Cancel');
                if (shouldLogin === 'Sign in with GitHub') {
                    yield vscode.commands.executeCommand('zenjispace.login');
                    return;
                }
                else {
                    return;
                }
            }
            vscode.window.showInformationMessage('Syncing Zenjispace data to the cloud...');
            yield syncDataToCloud(context);
            vscode.window.showInformationMessage('Zenjispace data synced successfully!');
        }
        catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Failed to sync data: ${error.message}`);
            }
            else {
                vscode.window.showErrorMessage('Failed to sync data: Unknown error occurred.');
            }
        }
    })), 
    // New command to handle GitHub authentication
    vscode.commands.registerCommand('zenjispace.login', () => __awaiter(this, void 0, void 0, function* () {
        yield loginWithGitHub(context);
    })), vscode.commands.registerCommand('zenjispace.logout', () => __awaiter(this, void 0, void 0, function* () {
        yield logoutFromGitHub(context);
    })), vscode.commands.registerCommand('zenjispace.syncFromCloud', () => __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if user is authenticated before retrieving data
            if (!session) {
                const shouldLogin = yield vscode.window.showInformationMessage('You need to sign in with GitHub to retrieve your data from the cloud.', 'Sign in with GitHub', 'Cancel');
                if (shouldLogin === 'Sign in with GitHub') {
                    yield vscode.commands.executeCommand('zenjispace.login');
                    return;
                }
                else {
                    return;
                }
            }
            vscode.window.showInformationMessage('Retrieving Zenjispace data from the cloud...');
            yield retrieveDataFromCloud(context);
            vscode.window.showInformationMessage('Zenjispace data retrieved successfully!');
            // Refresh the dashboard if it's open
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'syncComplete',
                    success: true
                });
            }
        }
        catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Failed to retrieve data: ${error.message}`);
            }
            else {
                vscode.window.showErrorMessage('Failed to retrieve data: Unknown error occurred.');
            }
            // Notify the dashboard of the error
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'syncComplete',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
        }
    })));
    // Listen for authentication provider changes
    context.subscriptions.push(vscode.authentication.onDidChangeSessions((e) => __awaiter(this, void 0, void 0, function* () {
        if (e.provider.id === 'github') {
            // Check if the session is still valid
            yield checkForExistingSession(context);
        }
    })));
}
exports.activate = activate;
function clearAllData(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const keysToRemove = [
            'avatar', 'userName', 'focusStats', 'journalEntries',
            'chatHistory', 'sound', 'activeTab', 'activeJournalTab',
            'githubUserId', 'lastSyncedTimestamp'
        ];
        // Clear all keys from global state
        for (const key of keysToRemove) {
            yield context.globalState.update(key, undefined);
        }
        // Make sure to set onboardingComplete to false explicitly
        yield context.globalState.update('onboardingComplete', false);
        zenjiPanel === null || zenjiPanel === void 0 ? void 0 : zenjiPanel.dispose();
        openZenjiOnboarding(context);
    });
}
function openZenjiOnboarding(context) {
    zenjiPanel === null || zenjiPanel === void 0 ? void 0 : zenjiPanel.dispose();
    return createWebviewPanel(context, 'zenjiOnboarding', 'Welcome to Zenjispace', 'resources/webviews/onboarding/onboarding.html');
}
function openZenjiDashboard(context) {
    zenjiPanel === null || zenjiPanel === void 0 ? void 0 : zenjiPanel.dispose();
    return createWebviewPanel(context, 'zenjispace', 'Zenjispace', 'resources/webviews/dashboard/dashboard.html');
}
function createWebviewPanel(context, viewType, title, templatePath) {
    // Only check if we're trying to open the dashboard
    if (viewType === 'zenjispace') {
        const isOnboardingComplete = context.globalState.get('onboardingComplete', false);
        // If onboarding is not complete, redirect to onboarding page
        if (!isOnboardingComplete) {
            return createWebviewPanel(context, 'zenjiOnboarding', 'Welcome to Zenjispace', 'resources/webviews/onboarding/onboarding.html');
        }
    }
    const panel = vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)]
    });
    const resourcesUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('resources')));
    const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('resources/styles')));
    const scriptsUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('resources/scripts')));
    const assetsUri = panel.webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('resources/assets')));
    const template = fs.readFileSync(context.asAbsolutePath(templatePath), 'utf8')
        .replace(/\{\{mediaUri\}\}/g, resourcesUri.toString())
        .replace(/\{\{stylesUri\}\}/g, stylesUri.toString())
        .replace(/\{\{scriptsUri\}\}/g, scriptsUri.toString())
        .replace(/\{\{assetsUri\}\}/g, assetsUri.toString());
    panel.webview.html = template;
    // Store the panel reference
    zenjiPanel = panel;
    // Always send authentication status immediately after panel creation
    // for both dashboard and onboarding
    getGitHubUserInfo().then(githubUser => {
        if (panel && panel.visible) {
            panel.webview.postMessage({
                command: 'authStatus',
                isAuthenticated: !!session,
                githubUser: githubUser
            });
        }
    }).catch(error => {
        console.error('Failed to get GitHub user info:', error);
        // Even if we fail to get user info, still notify about auth status
        if (panel && panel.visible) {
            panel.webview.postMessage({
                command: 'authStatus',
                isAuthenticated: false,
                githubUser: null
            });
        }
    });
    // Listen for messages from the webview
    panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
        switch (message.command) {
            case 'onboardingComplete':
                context.globalState.update('onboardingComplete', true);
                // If GitHub authentication was used during onboarding, use the GitHub data
                if (message.userData && message.userData.githubAuthenticated && message.userData.githubUser) {
                    // Use the GitHub profile data for the user's Zenji profile
                    context.globalState.update('userName', message.userData.githubUser.name);
                    context.globalState.update('avatar', message.userData.githubUser.avatarUrl);
                    vscode.window.showInformationMessage(`Welcome, ${message.userData.githubUser.name}! Your Zenji profile has been created Successfully!.`);
                }
                else if (message.userData && message.userData.userName) {
                    // Fallback to manually entered data if somehow GitHub auth wasn't used
                    context.globalState.update('userName', message.userData.userName);
                    if (message.userData.avatar) {
                        context.globalState.update('avatar', message.userData.avatar);
                    }
                    vscode.window.showInformationMessage(`Welcome to Zenji, ${message.userData.userName}!`);
                }
                // Auto-sync after onboarding completes
                autoSyncData(context);
                openZenjiDashboard(context);
                return;
            case 'githubLogin':
                // Handle GitHub login request from onboarding
                vscode.commands.executeCommand('zenjispace.login');
                return;
            case 'checkGitHubAuth':
                // Check if the user is already authenticated with GitHub
                getGitHubUserInfo().then(githubUser => {
                    if (panel && panel.visible) {
                        panel.webview.postMessage({
                            command: 'authStatus',
                            isAuthenticated: !!session,
                            githubUser: githubUser
                        });
                    }
                }).catch(error => {
                    console.error('Failed to get GitHub user info during onboarding:', error);
                    // Even if we fail to get user info, still notify about auth status
                    if (panel) {
                        panel.webview.postMessage({
                            command: 'authStatus',
                            isAuthenticated: false,
                            githubUser: null
                        });
                    }
                });
                return;
            case 'updateProfile':
                if (message.avatar) {
                    context.globalState.update('avatar', message.avatar);
                }
                if (message.userName) {
                    context.globalState.update('userName', message.userName);
                }
                // Auto-sync after profile update
                autoSyncData(context);
                return;
            case 'executeCommand':
                if (message.commandId) {
                    vscode.commands.executeCommand(message.commandId);
                }
                return;
            case 'saveJournalEntries':
                if (message.entries) {
                    context.globalState.update('journalEntries', message.entries);
                    // Auto-sync journal entries
                    autoSyncData(context);
                }
                return;
            case 'getUserData':
                // Send stored user data to the webview without additional checks
                const userName = context.globalState.get('userName');
                const avatar = context.globalState.get('avatar');
                const journalEntries = context.globalState.get('journalEntries') || [];
                panel.webview.postMessage({
                    command: 'userData',
                    userName: userName,
                    avatar: avatar,
                    journalEntries: journalEntries
                });
                return;
            case 'updateActiveTab':
                if (message.activeTab) {
                    context.globalState.update('activeTab', message.activeTab);
                    // Auto-sync when tab changes
                    autoSyncData(context);
                }
                return;
            case 'updateActiveJournalTab':
                if (message.activeJournalTab) {
                    context.globalState.update('activeJournalTab', message.activeJournalTab);
                    // Auto-sync when journal tab changes
                    autoSyncData(context);
                }
                return;
            case 'updateSound':
                if (message.sound !== undefined) {
                    // Save the full sound object (including ID, URL and name)
                    context.globalState.update('sound', message.sound);
                    // Log the saved sound data for debugging
                    console.log('Saving sound data:', message.sound);
                    // Auto-sync when sound preference changes
                    autoSyncData(context);
                }
                return;
            case 'startFocus':
            case 'startBreak':
                const focusStats = context.globalState.get('focusStats') || {
                    focusCount: 0,
                    focusMinutes: 0,
                    breakCount: 0,
                    moodAvg: '-'
                };
                if (message.command === 'startFocus') {
                    focusStats.focusCount = (focusStats.focusCount || 0) + 1;
                    focusStats.focusMinutes = (focusStats.focusMinutes || 0) + (message.duration || 25);
                }
                else {
                    focusStats.breakCount = (focusStats.breakCount || 0) + 1;
                }
                context.globalState.update('focusStats', focusStats);
                // Auto-sync when focus stats update
                autoSyncData(context);
                return;
            case 'saveChatMessage':
                if (message.chatHistory) {
                    context.globalState.update('chatHistory', message.chatHistory);
                    // Auto-sync when chat messages are added
                    autoSyncData(context);
                }
                return;
            case 'getAIChatResponse':
                if (message.chatHistory) {
                    try {
                        // Get user name for personalized responses
                        const userName = context.globalState.get('userName');
                        // Ensure OpenAI is initialized
                        if (!(0, openai_service_1.isOpenAIInitialized)()) {
                            yield (0, openai_service_1.initOpenAI)(context);
                        }
                        // If still not initialized, it means there's an API key issue
                        if (!(0, openai_service_1.isOpenAIInitialized)()) {
                            panel.webview.postMessage({
                                command: 'aiChatResponse',
                                content: "I need an OpenAI API key to work properly. Please update the '.env' file with your API key or set it in the VS Code secrets storage.",
                                success: false,
                                error: 'API key missing or invalid'
                            });
                            return;
                        }
                        // Get AI response 
                        const aiResponse = yield (0, openai_service_1.getChatCompletionFromOpenAI)(message.chatHistory, userName);
                        // Send response back to webview
                        panel.webview.postMessage({
                            command: 'aiChatResponse',
                            content: aiResponse,
                            success: true
                        });
                    }
                    catch (error) {
                        console.error('Error getting AI response:', error);
                        // More specific error message based on the error type
                        let errorMessage = 'I apologize, but I seem to be having trouble connecting to my AI systems right now. Please try again later.';
                        if (error instanceof Error) {
                            if (error.message.includes('API key')) {
                                errorMessage = "I need a valid OpenAI API key to work properly. Please update the '.env' file with your API key.";
                            }
                            else if (error.message.includes('rate limit')) {
                                errorMessage = "I've reached my API rate limit. Please try again in a moment.";
                            }
                            else if (error.message.includes('network')) {
                                errorMessage = "I'm having trouble connecting to the OpenAI servers. Please check your internet connection.";
                            }
                        }
                        // Send error back to webview
                        panel.webview.postMessage({
                            command: 'aiChatResponse',
                            content: errorMessage,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        });
                    }
                }
                return;
            case 'getAllIntegrations':
                try {
                    // Get all integrations data
                    const integrations = yield getAllIntegrationsData(context);
                    // Send integrations data back to webview
                    panel.webview.postMessage({
                        command: 'integrationsData',
                        integrations: integrations
                    });
                }
                catch (error) {
                    console.error('Error getting integrations data:', error);
                    panel.webview.postMessage({
                        command: 'integrationsData',
                        integrations: [],
                        error: error instanceof Error ? error.message : 'Unknown error occurred'
                    });
                }
                return;
        }
    }), undefined, context.subscriptions);
    panel.onDidDispose(() => zenjiPanel = undefined, null, context.subscriptions);
    return panel;
}
// Sync data to cloud with proper MongoDB initialization handling
function syncDataToCloud(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // First check if user is authenticated
        if (!session) {
            throw new Error('User is not authenticated with GitHub');
        }
        try {
            // Get GitHub user ID for unique identification
            const githubUserId = context.globalState.get('githubUserId');
            if (!githubUserId) {
                // If no GitHub user ID is stored, try to fetch it
                const userId = yield fetchAndStoreGitHubUserId(context);
                if (!userId) {
                    throw new Error('Failed to obtain GitHub user ID');
                }
            }
            // Use the MongoDB service to sync data
            yield (0, mongodb_service_1.syncDataToCloud)(context, githubUserId);
            // Notify the webview that sync is complete
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'syncComplete',
                    success: true
                });
            }
            return true;
        }
        catch (error) {
            console.error('Failed to sync data:', error);
            // Notify the webview that sync failed
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'syncComplete',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
            throw error;
        }
    });
}
// Retrieve user data from cloud
function retrieveDataFromCloud(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // First check if user is authenticated
        if (!session) {
            throw new Error('User is not authenticated with GitHub');
        }
        try {
            // Get GitHub user ID for unique identification
            const githubUserId = context.globalState.get('githubUserId');
            if (!githubUserId) {
                // If no GitHub user ID is stored, try to fetch it
                const userId = yield fetchAndStoreGitHubUserId(context);
                if (!userId) {
                    throw new Error('Failed to obtain GitHub user ID');
                }
            }
            // Use the MongoDB service to retrieve data
            yield (0, mongodb_service_1.retrieveDataFromCloud)(context, githubUserId);
            // Notify webview about the sync completion
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'syncComplete',
                    success: true
                });
            }
            return true;
        }
        catch (error) {
            console.error('Failed to retrieve data:', error);
            // Notify the webview about the error
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'syncComplete',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
            throw error;
        }
    });
}
// Check for existing GitHub authentication session
function checkForExistingSession(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sessions = yield vscode.authentication.getSession('github', ['user:email', 'read:user'], { createIfNone: false });
            session = sessions;
            if (session) {
                // Store the GitHub user ID for identification
                yield fetchAndStoreGitHubUserId(context);
            }
            // Update status bar item to reflect authentication status
            updateAuthStatusBarItem();
            // Notify any open webviews about the authentication status
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'authStatus',
                    isAuthenticated: !!session,
                    githubUser: session ? yield getGitHubUserInfo() : null
                });
            }
        }
        catch (error) {
            console.error('Failed to check for existing GitHub session:', error);
        }
    });
}
// Update the authentication status bar item
function updateAuthStatusBarItem() {
    if (session) {
        // authStatusBarItem.text = '$(github) GitHub Connected';
        authStatusBarItem.tooltip = 'Zenji - Click to log out from GitHub';
        authStatusBarItem.command = 'zenjispace.logout';
    }
    else {
        // authStatusBarItem.text = '$(github) GitHub Sign In';
        authStatusBarItem.tooltip = 'Zenji - Sign in with GitHub to sync across devices';
        authStatusBarItem.command = 'zenjispace.login';
    }
}
// Login with GitHub
function loginWithGitHub(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Request access to user:email and read:user scopes for basic user identification
            session = yield vscode.authentication.getSession('github', ['user:email', 'read:user'], { createIfNone: true });
            if (session) {
                vscode.window.showInformationMessage('Successfully signed in to GitHub!');
                // Store the GitHub user ID for identification
                yield fetchAndStoreGitHubUserId(context);
                // Update status bar item
                updateAuthStatusBarItem();
                // Notify any open webviews about the authentication status
                if (zenjiPanel) {
                    zenjiPanel.webview.postMessage({
                        command: 'authStatus',
                        isAuthenticated: true,
                        githubUser: yield getGitHubUserInfo()
                    });
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to sign in to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}
// Logout from GitHub
function logoutFromGitHub(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Clear the session
            session = undefined;
            // Remove GitHub user ID from state
            yield context.globalState.update('githubUserId', undefined);
            // Show confirmation message
            vscode.window.showInformationMessage('Signed out from GitHub successfully');
            // Update status bar item
            updateAuthStatusBarItem();
            // Notify any open webviews about the authentication status
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'authStatus',
                    isAuthenticated: false,
                    githubUser: null
                });
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to sign out from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}
// Get GitHub user information
function getGitHubUserInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!session) {
            return null;
        }
        try {
            // Make a request to the GitHub API to get user information
            const response = yield fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'User-Agent': 'Zenjispace-VSCode-Extension'
                }
            });
            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }
            const userData = yield response.json();
            return {
                id: userData.id,
                login: userData.login,
                name: userData.name || userData.login,
                avatarUrl: userData.avatar_url
            };
        }
        catch (error) {
            console.error('Failed to fetch GitHub user info:', error);
            return null;
        }
    });
}
// Fetch and store GitHub user ID
function fetchAndStoreGitHubUserId(context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userInfo = yield getGitHubUserInfo();
            if (userInfo && userInfo.id) {
                yield context.globalState.update('githubUserId', userInfo.id.toString());
                return userInfo.id.toString();
            }
            return null;
        }
        catch (error) {
            console.error('Failed to fetch and store GitHub user ID:', error);
            return null;
        }
    });
}
// Helper function to automatically sync data after it changes
function autoSyncData(context, silentMode = true) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only sync if the user is authenticated
        if (!session) {
            console.log('Auto-sync skipped: User not authenticated with GitHub');
            return;
        }
        try {
            // Sync data to the cloud
            yield syncDataToCloud(context);
            if (!silentMode) {
                vscode.window.showInformationMessage('Zenjispace data synced successfully!');
            }
            return true;
        }
        catch (error) {
            console.error('Auto-sync failed:', error);
            if (!silentMode) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(`Auto-sync failed: ${error.message}`);
                }
                else {
                    vscode.window.showErrorMessage('Auto-sync failed: Unknown error occurred.');
                }
            }
            return false;
        }
    });
}
// Get all integrations data
function getAllIntegrationsData(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const integrations = [
            {
                id: 'github',
                name: 'GitHub',
                description: 'Access your GitHub repositories and issues.',
                icon: '📂',
                isConnected: !!session,
                category: 'development'
            },
            {
                id: 'jira',
                name: 'Jira',
                description: 'Track your Jira issues and projects.',
                icon: '📋',
                isConnected: false,
                category: 'development'
            },
            {
                id: 'bitbucket',
                name: 'Bitbucket',
                description: 'Access your Bitbucket repositories and pull requests.',
                icon: '📊',
                isConnected: false,
                category: 'development'
            },
            {
                id: 'slack',
                name: 'Slack',
                description: 'Integrate with your Slack workspace.',
                icon: '💬',
                isConnected: false,
                category: 'communication'
            },
            {
                id: 'trello',
                name: 'Trello',
                description: 'Manage your Trello boards and cards.',
                icon: '📌',
                isConnected: false,
                category: 'productivity'
            }
        ];
        return integrations;
    });
}
function deactivate() {
    statusBarItem === null || statusBarItem === void 0 ? void 0 : statusBarItem.dispose();
    authStatusBarItem === null || authStatusBarItem === void 0 ? void 0 : authStatusBarItem.dispose();
    // Close MongoDB connection
    (0, mongodb_service_1.closeMongoDB)().catch(error => {
        console.error('Failed to close MongoDB connection:', error);
    });
    // Close OpenAI client
    (0, openai_service_1.closeOpenAI)();
}
exports.deactivate = deactivate;
