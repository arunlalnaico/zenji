import * as vscode from 'vscode';
import * as fs from 'fs';
import { initMongoDB, saveUserDataToMongoDB, getUserDataFromMongoDB, closeMongoDB, isMongoDBConnected } from './mongodb-service';
import { initOpenAI, getChatCompletionFromOpenAI, closeOpenAI, isOpenAIInitialized } from './openai-service';
import { connectToSpotify, disconnectSpotify, isSpotifyConnected, getSpotifyPlaylists, playSpotifyPlaylist } from './spotify-service';

let zenjiPanel: vscode.WebviewPanel | undefined;
let statusBarItem: vscode.StatusBarItem;
let authStatusBarItem: vscode.StatusBarItem;
// Define session token to check if the user is authenticated
let session: vscode.AuthenticationSession | undefined;

export function activate(context: vscode.ExtensionContext) {
    // Initialize MongoDB connection
    initMongoDB(context).catch(error => {
        console.error('Failed to initialize MongoDB:', error);
    });
    
    // Initialize OpenAI connection
    initOpenAI(context).catch(error => {
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
    const currentVersion = vscode.extensions.getExtension('arunlals89@gmail.com.zenjispace')?.packageJSON.version;
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
        } else {
            openZenjiOnboarding(context);
        }
    }

    // Register all commands
    context.subscriptions.push(
        vscode.commands.registerCommand('zenjispace.open', () => {
            if (context.globalState.get('onboardingComplete', false)) {
                openZenjiDashboard(context);
            } else {
                openZenjiOnboarding(context);
            }
        }),
        vscode.commands.registerCommand('zenjispace.onboarding', () => openZenjiOnboarding(context)),
        vscode.commands.registerCommand('zenjispace.clearData', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'This will clear all Zenjispace user data. This action cannot be undone.',
                { modal: true },
                'Clear Data', 'Cancel'
            );
            if (confirm === 'Clear Data') {
                await clearAllData(context);
                vscode.window.showInformationMessage('Zenjispace data has been cleared successfully.');
            }
        }),
        vscode.commands.registerCommand('zenjispace.forceCompleteOnboarding', async () => {
            await context.globalState.update('onboardingComplete', true);
            openZenjiDashboard(context);
        }),
        vscode.commands.registerCommand('zenjispace.syncToCloud', async () => {
            try {
                // Check if user is authenticated before syncing
                if (!session) {
                    const shouldLogin = await vscode.window.showInformationMessage(
                        'You need to sign in with GitHub to sync your data across devices.',
                        'Sign in with GitHub', 'Cancel'
                    );
                    
                    if (shouldLogin === 'Sign in with GitHub') {
                        await vscode.commands.executeCommand('zenjispace.login');
                        return;
                    } else {
                        return;
                    }
                }
                
                vscode.window.showInformationMessage('Syncing Zenjispace data to the cloud...');
                await syncDataToCloud(context);
                vscode.window.showInformationMessage('Zenjispace data synced successfully!');
            } catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(`Failed to sync data: ${error.message}`);
                } else {
                    vscode.window.showErrorMessage('Failed to sync data: Unknown error occurred.');
                }
            }
        }),
        // New command to handle GitHub authentication
        vscode.commands.registerCommand('zenjispace.login', async () => {
            await loginWithGitHub(context);
        }),
        vscode.commands.registerCommand('zenjispace.logout', async () => {
            await logoutFromGitHub(context);
        }),
        vscode.commands.registerCommand('zenjispace.syncFromCloud', async () => {
            try {
                // Check if user is authenticated before retrieving data
                if (!session) {
                    const shouldLogin = await vscode.window.showInformationMessage(
                        'You need to sign in with GitHub to retrieve your data from the cloud.',
                        'Sign in with GitHub', 'Cancel'
                    );
                    
                    if (shouldLogin === 'Sign in with GitHub') {
                        await vscode.commands.executeCommand('zenjispace.login');
                        return;
                    } else {
                        return;
                    }
                }
                
                vscode.window.showInformationMessage('Retrieving Zenjispace data from the cloud...');
                await retrieveDataFromCloud(context);
                vscode.window.showInformationMessage('Zenjispace data retrieved successfully!');
                
                // Refresh the dashboard if it's open
                if (zenjiPanel) {
                    zenjiPanel.webview.postMessage({
                        command: 'syncComplete',
                        success: true
                    });
                }
            } catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(`Failed to retrieve data: ${error.message}`);
                } else {
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
        })
    );
    
    // Listen for authentication provider changes
    context.subscriptions.push(
        vscode.authentication.onDidChangeSessions(async e => {
            if (e.provider.id === 'github') {
                // Check if the session is still valid
                await checkForExistingSession(context);
            }
        })
    );
}

async function clearAllData(context: vscode.ExtensionContext) {
    const keysToRemove = [
        'avatar', 'userName', 'focusStats', 'journalEntries',
        'chatHistory', 'sound', 'activeTab', 'activeJournalTab',
        'githubUserId', 'lastSyncedTimestamp' 
    ];
    for (const key of keysToRemove) {
        await context.globalState.update(key, undefined);
    }
    // Make sure to set onboardingComplete to false explicitly
    await context.globalState.update('onboardingComplete', false);
    
    zenjiPanel?.dispose();
    openZenjiOnboarding(context);
}

function openZenjiOnboarding(context: vscode.ExtensionContext): vscode.WebviewPanel {
    zenjiPanel?.dispose();
    return createWebviewPanel(context, 'zenjiOnboarding', 'Welcome to Zenjispace', 'resources/webviews/onboarding/onboarding.html');
}

function openZenjiDashboard(context: vscode.ExtensionContext): vscode.WebviewPanel {
    zenjiPanel?.dispose();
    return createWebviewPanel(context, 'zenjispace', 'Zenjispace', 'resources/webviews/dashboard/dashboard.html');
}

function createWebviewPanel(context: vscode.ExtensionContext, viewType: string, title: string, templatePath: string): vscode.WebviewPanel {
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
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) { 
                case 'onboardingComplete':
                    context.globalState.update('onboardingComplete', true);
                    
                    // If GitHub authentication was used during onboarding, use the GitHub data
                    if (message.userData && message.userData.githubAuthenticated && message.userData.githubUser) {
                        // Use the GitHub profile data for the user's Zenji profile
                        context.globalState.update('userName', message.userData.githubUser.name);
                        context.globalState.update('avatar', message.userData.githubUser.avatarUrl);
                        vscode.window.showInformationMessage(`Welcome, ${message.userData.githubUser.name}! Your Zenji profile has been created Successfully!.`);
                    } else if (message.userData && message.userData.userName) {
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
                    // Update focus stats
                    interface FocusStats {
                        focusCount: number;
                        focusMinutes: number;
                        breakCount: number;
                        moodAvg: string;
                    }

                    const focusStats: FocusStats = context.globalState.get('focusStats') as FocusStats || {
                        focusCount: 0,
                        focusMinutes: 0,
                        breakCount: 0,
                        moodAvg: '-'
                    };
                    
                    if (message.command === 'startFocus') {
                        focusStats.focusCount = (focusStats.focusCount || 0) + 1;
                        focusStats.focusMinutes = (focusStats.focusMinutes || 0) + (message.duration || 25);
                    } else {
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
                            const userName = context.globalState.get('userName') as string;
                            
                            // Ensure OpenAI is initialized
                            if (!isOpenAIInitialized()) {
                                await initOpenAI(context);
                            }
                            
                            // If still not initialized, it means there's an API key issue
                            if (!isOpenAIInitialized()) {
                                panel.webview.postMessage({
                                    command: 'aiChatResponse',
                                    content: "I need an OpenAI API key to work properly. Please update the '.env' file with your API key or set it in the VS Code secrets storage.",
                                    success: false,
                                    error: 'API key missing or invalid'
                                });
                                return;
                            }
                            
                            // Get AI response 
                            const aiResponse = await getChatCompletionFromOpenAI(message.chatHistory, userName);
                            
                            // Send response back to webview
                            panel.webview.postMessage({
                                command: 'aiChatResponse',
                                content: aiResponse,
                                success: true
                            });
                        } catch (error) {
                            console.error('Error getting AI response:', error);
                            
                            // More specific error message based on the error type
                            let errorMessage = 'I apologize, but I seem to be having trouble connecting to my AI systems right now. Please try again later.';
                            
                            if (error instanceof Error) {
                                if (error.message.includes('API key')) {
                                    errorMessage = "I need a valid OpenAI API key to work properly. Please update the '.env' file with your API key.";
                                } else if (error.message.includes('rate limit')) {
                                    errorMessage = "I've reached my API rate limit. Please try again in a moment.";
                                } else if (error.message.includes('network')) {
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
                    
                case 'connectSpotify':
                    vscode.window.showInformationMessage('Received Spotify connect request');
                    try {
                        // Call the Spotify service to connect
                        const success = await connectToSpotify(context);
                        
                        if (success) {
                            // Store connection state
                            await context.globalState.update('spotifyConnected', true);
                            
                            // Send success message back to webview
                            panel.webview.postMessage({
                                command: 'spotifyConnectionStatus',
                                isConnected: true
                            });
                            vscode.window.showInformationMessage('Sent Spotify success status to webview');
                        } else {
                            panel.webview.postMessage({
                                command: 'spotifyConnectionStatus',
                                isConnected: false,
                                error: 'Failed to connect to Spotify'
                            });
                            vscode.window.showInformationMessage('Sent Spotify failure status to webview');
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Spotify connect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        // Send error response back to webview
                        panel.webview.postMessage({
                            command: 'spotifyConnectionStatus',
                            isConnected: false,
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        });
                    }
                    return;
                    
                case 'disconnectSpotify':
                    vscode.window.showInformationMessage('Received Spotify disconnect request');
                    try {
                        const success = await disconnectSpotify();
                        
                        if (success) {
                            // Update state
                            await context.globalState.update('spotifyConnected', false);
                            
                            // Send success message back to webview
                            panel.webview.postMessage({
                                command: 'spotifyConnectionStatus',
                                isConnected: false
                            });
                            vscode.window.showInformationMessage('Sent Spotify disconnect success to webview');
                        } else {
                            panel.webview.postMessage({
                                command: 'spotifyConnectionStatus',
                                isConnected: true,
                                error: 'Failed to disconnect from Spotify'
                            });
                            vscode.window.showInformationMessage('Sent Spotify disconnect failure to webview');
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Spotify disconnect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        // Send error response back to webview
                        panel.webview.postMessage({
                            command: 'spotifyConnectionStatus',
                            isConnected: true,
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        });
                    }
                    return;
                    
                case 'getSpotifyPlaylists':
                    vscode.window.showInformationMessage('Received request for Spotify playlists');
                    try {
                        // Call the Spotify service to get playlists
                        const playlists = await getSpotifyPlaylists();
                        
                        if (playlists) {
                            // Send playlists back to webview
                            panel.webview.postMessage({
                                command: 'spotifyPlaylists',
                                playlists: playlists
                            });
                            vscode.window.showInformationMessage('Sent Spotify playlists to webview');
                        } else {
                            panel.webview.postMessage({
                                command: 'spotifyPlaylists',
                                playlists: [],
                                error: 'Failed to fetch Spotify playlists'
                            });
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error fetching Spotify playlists: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        panel.webview.postMessage({
                            command: 'spotifyPlaylists',
                            playlists: [],
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        });
                    }
                    return;
                    
                case 'playSpotifyPlaylist':
                    if (message.playlistId) {
                        vscode.window.showInformationMessage(`Received request to play Spotify playlist: ${message.playlistId}`);
                        try {
                            // Call the Spotify service to play the playlist
                            const success = await playSpotifyPlaylist(message.playlistId);
                            
                            if (success) {
                                // Send success message back to webview
                                panel.webview.postMessage({
                                    command: 'spotifyPlaybackStatus',
                                    success: true,
                                    playlistId: message.playlistId
                                });
                            } else {
                                panel.webview.postMessage({
                                    command: 'spotifyPlaybackStatus',
                                    success: false,
                                    error: 'Failed to play Spotify playlist'
                                });
                            }
                        } catch (error) {
                            vscode.window.showErrorMessage(`Error playing Spotify playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            panel.webview.postMessage({
                                command: 'spotifyPlaybackStatus',
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error occurred'
                            });
                        }
                    }
                    return;
            }
        },
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(() => zenjiPanel = undefined, null, context.subscriptions);
    return panel;
}

// Sync data to cloud with proper MongoDB initialization handling
async function syncDataToCloud(context: vscode.ExtensionContext) {
    // First check if user is authenticated
    if (!session) {
        throw new Error('User is not authenticated with GitHub');
    }
    
    try {
        // Get GitHub user ID for unique identification
        const githubUserId = context.globalState.get('githubUserId');
        if (!githubUserId) {
            // If no GitHub user ID is stored, try to fetch it
            const userId = await fetchAndStoreGitHubUserId(context);
            if (!userId) {
                throw new Error('Failed to obtain GitHub user ID');
            }
        }
        
        // Collect user data for sync
        const userData = {
            timestamp: new Date().toISOString(),
            data: {
            avatar: context.globalState.get('avatar'),
            userName: context.globalState.get('userName'),
            focusStats: context.globalState.get('focusStats'),
            journalEntries: context.globalState.get('journalEntries'),
            chatHistory: context.globalState.get('chatHistory'),
            activeTab: context.globalState.get('activeTab'),
            activeJournalTab: context.globalState.get('activeJournalTab'),
            sound: context.globalState.get('sound'),
            soundUrl: context.globalState.get('soundUrl') // Added sound URL
            }
        };

        // Ensure MongoDB is initialized before attempting to save data
        if (!isMongoDBConnected()) {
            console.log('MongoDB not connected. Initializing connection...');
            await initMongoDB(context);
        }

        // Save user data to MongoDB
        await saveUserDataToMongoDB(githubUserId as string, userData);
        
        // Update last synced timestamp
        await context.globalState.update('lastSyncedTimestamp', new Date().toISOString());
        
        // Notify the webview that sync is complete
        if (zenjiPanel) {
            zenjiPanel.webview.postMessage({
                command: 'syncComplete',
                success: true
            });
        }
        
        return true;
    } catch (error) {
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
}

// Retrieve user data from cloud
async function retrieveDataFromCloud(context: vscode.ExtensionContext) {
    // First check if user is authenticated
    if (!session) {
        throw new Error('User is not authenticated with GitHub');
    }
    
    try {
        // Get GitHub user ID for unique identification
        const githubUserId = context.globalState.get('githubUserId');
        if (!githubUserId) {
            // If no GitHub user ID is stored, try to fetch it
            const userId = await fetchAndStoreGitHubUserId(context);
            if (!userId) {
                throw new Error('Failed to obtain GitHub user ID');
            }
        }
        
        // Ensure MongoDB is initialized before attempting to retrieve data
        if (!isMongoDBConnected()) {
            console.log('MongoDB not connected. Initializing connection...');
            await initMongoDB(context);
        }
        
        // Retrieve data from MongoDB
        const cloudData = await getUserDataFromMongoDB(githubUserId as string);
        
        if (!cloudData) {
            throw new Error('No data found in cloud for this user');
        }
        
        // Update local state with retrieved data
        if (cloudData.data) {
            // Update user data in VS Code global state
            if (cloudData.data.avatar) {
                await context.globalState.update('avatar', cloudData.data.avatar);
            }
            
            if (cloudData.data.userName) {
                await context.globalState.update('userName', cloudData.data.userName);
            }
            
            if (cloudData.data.focusStats) {
                await context.globalState.update('focusStats', cloudData.data.focusStats);
            }
            
            if (cloudData.data.journalEntries) {
                await context.globalState.update('journalEntries', cloudData.data.journalEntries);
            }
            
            if (cloudData.data.chatHistory) {
                await context.globalState.update('chatHistory', cloudData.data.chatHistory);
            }
            
            if (cloudData.data.activeTab) {
                await context.globalState.update('activeTab', cloudData.data.activeTab);
            }
            
            if (cloudData.data.activeJournalTab) {
                await context.globalState.update('activeJournalTab', cloudData.data.activeJournalTab);
            }
            
            if (cloudData.data.sound) {
                await context.globalState.update('sound', cloudData.data.sound);
            }
        }
        
        // Update last synced timestamp
        await context.globalState.update('lastSyncedTimestamp', new Date().toISOString());
        
        return true;
    } catch (error) {
        console.error('Failed to retrieve data:', error);
        throw error;
    }
}

// Check for existing GitHub authentication session
async function checkForExistingSession(context: vscode.ExtensionContext) {
    try {
        const sessions = await vscode.authentication.getSession('github', ['user:email', 'read:user'], { createIfNone: false });
        session = sessions;
        
        if (session) {
            // Store the GitHub user ID for identification
            await fetchAndStoreGitHubUserId(context);
        }
        
        // Update status bar item to reflect authentication status
        updateAuthStatusBarItem();
        
        // Notify any open webviews about the authentication status
        if (zenjiPanel) {
            zenjiPanel.webview.postMessage({
                command: 'authStatus',
                isAuthenticated: !!session,
                githubUser: session ? await getGitHubUserInfo() : null
            });
        }
    } catch (error) {
        console.error('Failed to check for existing GitHub session:', error);
    }
}

// Update the authentication status bar item
function updateAuthStatusBarItem() {
    if (session) {
        // authStatusBarItem.text = '$(github) GitHub Connected';
        authStatusBarItem.tooltip = 'Zenji - Click to log out from GitHub';
        authStatusBarItem.command = 'zenjispace.logout';
    } else {
        // authStatusBarItem.text = '$(github) GitHub Sign In';
        authStatusBarItem.tooltip = 'Zenji - Sign in with GitHub to sync across devices';
        authStatusBarItem.command = 'zenjispace.login';
    }
}

// Login with GitHub
async function loginWithGitHub(context: vscode.ExtensionContext) {
    try {
        // Request access to user:email and read:user scopes for basic user identification
        session = await vscode.authentication.getSession('github', ['user:email', 'read:user'], { createIfNone: true });
        
        if (session) {
            vscode.window.showInformationMessage('Successfully signed in to GitHub!');
            
            // Store the GitHub user ID for identification
            await fetchAndStoreGitHubUserId(context);
            
            // Update status bar item
            updateAuthStatusBarItem();
            
            // Notify any open webviews about the authentication status
            if (zenjiPanel) {
                zenjiPanel.webview.postMessage({
                    command: 'authStatus',
                    isAuthenticated: true,
                    githubUser: await getGitHubUserInfo()
                });
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to sign in to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Logout from GitHub
async function logoutFromGitHub(context: vscode.ExtensionContext) {
    try {
        // Clear the session
        session = undefined;
        
        // Remove GitHub user ID from state
        await context.globalState.update('githubUserId', undefined);
        
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
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to sign out from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Get GitHub user information
async function getGitHubUserInfo() {
    if (!session) {
        return null;
    }
    
    try {
        // Make a request to the GitHub API to get user information
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'User-Agent': 'Zenjispace-VSCode-Extension'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }
        
        const userData = await response.json();
        
        return {
            id: userData.id,
            login: userData.login,
            name: userData.name || userData.login,
            avatarUrl: userData.avatar_url
        };
    } catch (error) {
        console.error('Failed to fetch GitHub user info:', error);
        return null;
    }
}

// Fetch and store GitHub user ID
async function fetchAndStoreGitHubUserId(context: vscode.ExtensionContext) {
    try {
        const userInfo = await getGitHubUserInfo();
        
        if (userInfo && userInfo.id) {
            await context.globalState.update('githubUserId', userInfo.id.toString());
            return userInfo.id.toString();
        }
        
        return null;
    } catch (error) {
        console.error('Failed to fetch and store GitHub user ID:', error);
        return null;
    }
}

// Helper function to automatically sync data after it changes
async function autoSyncData(context: vscode.ExtensionContext, silentMode = true) {
    // Only sync if the user is authenticated
    if (!session) {
        console.log('Auto-sync skipped: User not authenticated with GitHub');
        return;
    }
    
    try {
        // Sync data to the cloud
        await syncDataToCloud(context);
        
        if (!silentMode) {
            vscode.window.showInformationMessage('Zenjispace data synced successfully!');
        }
        
        return true;
    } catch (error) {
        console.error('Auto-sync failed:', error);
        
        if (!silentMode) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Auto-sync failed: ${error.message}`);
            } else {
                vscode.window.showErrorMessage('Auto-sync failed: Unknown error occurred.');
            }
        }
        
        return false;
    }
}

export function deactivate() {
    statusBarItem?.dispose();
    authStatusBarItem?.dispose();
    
    // Close MongoDB connection
    closeMongoDB().catch(error => {
        console.error('Failed to close MongoDB connection:', error);
    });
    
    // Close OpenAI client
    closeOpenAI();
}
