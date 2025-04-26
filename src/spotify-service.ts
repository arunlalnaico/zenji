import * as vscode from 'vscode';

// Track Spotify connection state
let isConnected = false;
let spotifyRefreshToken: string | null = null;
let extensionContext: vscode.ExtensionContext | null = null;
let connectionInProgress = false;

// Mock playlists data for demonstration
const mockPlaylists = [
    {
        id: 'playlist1',
        name: 'Focus Flow',
        description: 'Deep focus music for productive coding sessions',
        images: [{ url: 'https://i.scdn.co/image/ab67706c0000da84c0b0a6ba01feaca888ff31fb' }],
        tracks: { total: 25 }
    },
    {
        id: 'playlist2',
        name: 'Coding Beats',
        description: 'Instrumental tracks to keep you in the zone',
        images: [{ url: 'https://i.scdn.co/image/ab67706c0000da8498153c08646739e26bd64175' }],
        tracks: { total: 18 }
    },
    {
        id: 'playlist3',
        name: 'Ambient Work',
        description: 'Ambient soundscapes for better concentration',
        images: [{ url: 'https://i.scdn.co/image/ab67706c0000da84bdcc7129f48c56d22ffa6d30' }],
        tracks: { total: 32 }
    }
];

/**
 * Check if Spotify is connected
 */
export function isSpotifyConnected(): boolean {
    vscode.window.showInformationMessage(`Spotify connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    return isConnected;
}

/**
 * Connect to Spotify using a simplified mock implementation
 */
export async function connectToSpotify(context: vscode.ExtensionContext): Promise<boolean> {
    vscode.window.showInformationMessage('Spotify connect function called');
    
    // If a connection is already in progress, don't start another one
    if (connectionInProgress) {
        vscode.window.showWarningMessage('Spotify connection already in progress');
        return false;
    }
    
    // Store context for later use
    extensionContext = context;
    connectionInProgress = true;
    
    try {
        // Show info message with instructions
        vscode.window.showInformationMessage('Simulating Spotify auth (2 second delay)...');
        
        // Simple promise with timeout for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate successful authentication
        isConnected = true;
        vscode.window.showInformationMessage('Successfully connected to Spotify!');
        
        connectionInProgress = false;
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Spotify connection error: ${errorMessage}`);
        isConnected = false;
        connectionInProgress = false;
        return false;
    }
}

/**
 * Disconnect from Spotify
 */
export async function disconnectSpotify(): Promise<boolean> {
    vscode.window.showInformationMessage('Spotify disconnect function called');
    
    try {
        // Simple success path
        isConnected = false;
        vscode.window.showInformationMessage('Disconnected from Spotify');
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Spotify disconnect error: ${errorMessage}`);
        return false;
    }
}

/**
 * Get user's Spotify playlists
 * For demo purposes, returns mock playlists data
 */
export async function getSpotifyPlaylists(): Promise<any[] | null> {
    vscode.window.showInformationMessage('Fetching Spotify playlists');
    
    if (!isConnected) {
        vscode.window.showErrorMessage('Cannot fetch playlists: Not connected to Spotify');
        return null;
    }
    
    try {
        // In a real implementation, this would call the Spotify API
        // For demonstration, we'll return mock data with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        vscode.window.showInformationMessage('Successfully fetched Spotify playlists');
        return mockPlaylists;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to fetch Spotify playlists: ${errorMessage}`);
        return null;
    }
}

/**
 * Play a Spotify playlist
 */
export async function playSpotifyPlaylist(playlistId: string): Promise<boolean> {
    vscode.window.showInformationMessage(`Playing Spotify playlist: ${playlistId}`);
    
    if (!isConnected) {
        vscode.window.showErrorMessage('Cannot play playlist: Not connected to Spotify');
        return false;
    }
    
    try {
        // In a real implementation, this would call the Spotify API to start playback
        // For demonstration, we'll just simulate success
        await new Promise(resolve => setTimeout(resolve, 500));
        
        vscode.window.showInformationMessage(`Now playing Spotify playlist: ${mockPlaylists.find(p => p.id === playlistId)?.name || playlistId}`);
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to play Spotify playlist: ${errorMessage}`);
        return false;
    }
}