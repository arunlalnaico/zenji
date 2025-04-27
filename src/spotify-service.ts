import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import fetch from 'node-fetch';

// Spotify API configuration
const CLIENT_ID = 'b48de3c555664860953cfe3aef4a3348'; // Your Spotify Client ID
const CLIENT_SECRET = '9f3751a1c2e74389a4b0bf2f831d151e'; // Add your Spotify Client Secret here
const REDIRECT_URI = 'http://127.0.0.1:3000/callback'; // Using http://localhost is allowed by Spotify
const SCOPES = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-read-collaborative'];
const AUTH_STATE_KEY = 'spotify-auth-state';
const TOKEN_KEY = 'spotify-token';
const REFRESH_TOKEN_KEY = 'spotify-refresh-token';

// Track Spotify connection state
let isConnected = false;
let extensionContext: vscode.ExtensionContext | null = null;
let connectionInProgress = false;
let server: http.Server | null = null;

/**
 * Check if Spotify is connected
 */
export function isSpotifyConnected(): boolean {
    return isConnected;
}

/**
 * Connect to Spotify using OAuth 2.0
 */
export async function connectToSpotify(context: vscode.ExtensionContext): Promise<boolean> {
    // Store context for later use
    extensionContext = context;
    
    // If a connection is already in progress, don't start another one
    if (connectionInProgress) {
        vscode.window.showWarningMessage('Spotify connection already in progress');
        return false;
    }
    
    // Check if we already have a valid token
    const token = context.globalState.get<string>(TOKEN_KEY);
    const refreshToken = context.globalState.get<string>(REFRESH_TOKEN_KEY);
    
    if (token) {
        try {
            // Validate the token by making a test request
            const isValid = await validateToken(token);
            if (isValid) {
                isConnected = true;
                return true;
            } else if (refreshToken) {
                // Token is invalid but we have a refresh token, try to refresh
                const refreshed = await refreshAccessToken(refreshToken);
                if (refreshed) {
                    isConnected = true;
                    return true;
                }
            }
        } catch (error) {
            console.error('Error validating token:', error);
        }
    }
    
    connectionInProgress = true;
    
    try {
        // Start OAuth flow
        const authUrl = await startAuthFlow();
        
        // Show info message with instructions
        vscode.window.showInformationMessage(
            'Authorizing Spotify. Please sign in using your browser.',
            'Open Browser'
        ).then(selection => {
            if (selection === 'Open Browser') {
                vscode.env.openExternal(vscode.Uri.parse(authUrl));
            }
        });
        
        // Wait for authentication to complete
        const success = await waitForAuthCompletion();
        
        connectionInProgress = false;
        isConnected = success;
        return success;
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
    try {
        if (extensionContext) {
            // Clear tokens
            await extensionContext.globalState.update(TOKEN_KEY, undefined);
            await extensionContext.globalState.update(REFRESH_TOKEN_KEY, undefined);
        }
        
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
 */
export async function getSpotifyPlaylists(): Promise<any[] | null> {
    if (!isConnected || !extensionContext) {
        vscode.window.showErrorMessage('Cannot fetch playlists: Not connected to Spotify');
        return null;
    }
    
    try {
        const token = extensionContext.globalState.get<string>(TOKEN_KEY);
        if (!token) {
            throw new Error('No access token available');
        }
        
        // Get playlists from Spotify API
        const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // If token is expired, try to refresh it
            if (response.status === 401) {
                const refreshToken = extensionContext.globalState.get<string>(REFRESH_TOKEN_KEY);
                if (refreshToken && await refreshAccessToken(refreshToken)) {
                    // Retry with new token
                    return getSpotifyPlaylists();
                }
            }
            throw new Error(`Failed to fetch playlists: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.items || [];
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
    if (!isConnected || !extensionContext) {
        vscode.window.showErrorMessage('Cannot play playlist: Not connected to Spotify');
        return false;
    }
    
    try {
        const token = extensionContext.globalState.get<string>(TOKEN_KEY);
        if (!token) {
            throw new Error('No access token available');
        }
        
        // Call the Spotify API to get the playlist tracks
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // If token is expired, try to refresh it
            if (response.status === 401) {
                const refreshToken = extensionContext.globalState.get<string>(REFRESH_TOKEN_KEY);
                if (refreshToken && await refreshAccessToken(refreshToken)) {
                    // Retry with new token
                    return playSpotifyPlaylist(playlistId);
                }
            }
            throw new Error(`Failed to play playlist: ${response.statusText}`);
        }
        
        const playlist = await response.json();
        
        // In a real implementation, we would start playback using the Spotify Connect API
        // Since VS Code doesn't have audio playback capabilities, we'll just simulate success
        // and inform the user that they need to use Spotify app to hear the music
        
        vscode.window.showInformationMessage(
            `Playlist "${playlist.name}" is ready to play. Use the Spotify app to hear the music.`,
            'Open in Spotify'
        ).then(selection => {
            if (selection === 'Open in Spotify') {
                vscode.env.openExternal(vscode.Uri.parse(playlist.external_urls.spotify));
            }
        });
        
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to play Spotify playlist: ${errorMessage}`);
        return false;
    }
}

/**
 * Start the OAuth 2.0 authentication flow
 */
async function startAuthFlow(): Promise<string> {
    if (!extensionContext) {
        throw new Error('Extension context not available');
    }
    
    // Generate a random state value for security
    const state = crypto.randomBytes(16).toString('hex');
    await extensionContext.globalState.update(AUTH_STATE_KEY, state);
    
    // Start a local server to handle the callback
    await startLocalServer();
    
    // Build the authorization URL
    const authUrl = 'https://accounts.spotify.com/authorize?' + 
        querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPES.join(' '),
            redirect_uri: REDIRECT_URI,
            state: state
        });
    
    return authUrl;
}

/**
 * Start a local HTTP server to handle the OAuth callback
 */
function startLocalServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Close existing server if it exists
        if (server) {
            server.close();
            server = null;
        }
        
        // Create a new server
        server = http.createServer(async (req, res) => {
            try {
                // Parse the URL and query parameters
                const url = new URL(req.url || '/', `http://${req.headers.host}`);
                const queryParams = Object.fromEntries(url.searchParams.entries());
                
                // Handle the callback route
                if (url.pathname === '/callback') {
                    // Get the authorization code and state from the query parameters
                    const code = queryParams.code;
                    const state = queryParams.state;
                    const error = queryParams.error;
                    
                    // Check if there was an error
                    if (error) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end(`<html><body><h1>Authentication failed</h1><p>${error}</p><p>You can close this window now.</p></body></html>`);
                        reject(new Error(`Spotify authentication error: ${error}`));
                        return;
                    }
                    
                    // Check if code and state are present
                    if (!code || !state) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h1>Invalid callback</h1><p>Missing code or state parameter.</p><p>You can close this window now.</p></body></html>');
                        reject(new Error('Invalid callback: Missing code or state parameter'));
                        return;
                    }
                    
                    // Verify the state to prevent CSRF attacks
                    const storedState = extensionContext?.globalState.get<string>(AUTH_STATE_KEY);
                    if (state !== storedState) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h1>Authentication failed</h1><p>Invalid state parameter.</p><p>You can close this window now.</p></body></html>');
                        reject(new Error('State mismatch. Possible CSRF attack.'));
                        return;
                    }
                    
                    try {
                        // Exchange the code for an access token
                        await exchangeCodeForToken(code);
                        
                        // Return success page
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h1>Authentication successful!</h1><p>You have successfully authenticated with Spotify. You can close this window and return to VS Code.</p></body></html>');
                        
                        // Close the server after handling the callback
                        server?.close();
                        server = null;
                        
                        resolve();
                    } catch (error) {
                        console.error('Error exchanging code for token:', error);
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.end('<html><body><h1>Authentication failed</h1><p>Failed to exchange code for token.</p><p>You can close this window now.</p></body></html>');
                        reject(error);
                    }
                } else {
                    // Handle all other routes
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>404 Not Found</h1></body></html>');
                }
            } catch (error) {
                console.error('Error handling callback:', error);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>Server Error</h1></body></html>');
                reject(error);
            }
        });
        
        // Start the server on port 3000
        server.listen(3000, () => {
            console.log('Local server started on port 3000');
            resolve();
        });
        
        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            reject(error);
        });
    });
}

/**
 * Exchange the authorization code for an access token
 */
async function exchangeCodeForToken(code: string): Promise<void> {
    if (!extensionContext) {
        throw new Error('Extension context not available');
    }
    
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('client_id', CLIENT_ID);
    
    // Include client secret
    if (CLIENT_SECRET) {
        params.append('client_secret', CLIENT_SECRET);
    } else {
        // Log warning if client secret is not provided
        console.warn('Spotify client secret is missing. Authentication may fail.');
    }
    
    // Log the request parameters for debugging (remove in production)
    console.log('Token request parameters:', {
        grant_type: 'authorization_code',
        code: code.substring(0, 5) + '...',  // Only log part of the code for security
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        has_client_secret: !!CLIENT_SECRET
    });
    
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        vscode.window.showErrorMessage(`Spotify authentication failed: ${errorText}`);
        throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText} ${errorText}`);
    }
    
    const data = await response.json();
    
    // Store the access token and refresh token
    await extensionContext.globalState.update(TOKEN_KEY, data.access_token);
    await extensionContext.globalState.update(REFRESH_TOKEN_KEY, data.refresh_token);
    
    // Set the expiration time
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
    const expirationTime = Date.now() + expiresIn * 1000;
    await extensionContext.globalState.update('spotify-token-expiration', expirationTime);
    
    isConnected = true;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<boolean> {
    if (!extensionContext) {
        throw new Error('Extension context not available');
    }
    
    try {
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        params.append('client_id', CLIENT_ID);
        
        // Include client secret
        if (CLIENT_SECRET) {
            params.append('client_secret', CLIENT_SECRET);
        } else {
            // Log warning if client secret is not provided
            console.warn('Spotify client secret is missing. Token refresh may fail.');
        }
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
        
        if (!response.ok) {
            console.error(`Failed to refresh token: ${response.status} ${response.statusText}`);
            return false;
        }
        
        const data = await response.json();
        
        // Store the new access token
        await extensionContext.globalState.update(TOKEN_KEY, data.access_token);
        
        // Store the new refresh token if provided
        if (data.refresh_token) {
            await extensionContext.globalState.update(REFRESH_TOKEN_KEY, data.refresh_token);
        }
        
        // Set the expiration time
        const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
        const expirationTime = Date.now() + expiresIn * 1000;
        await extensionContext.globalState.update('spotify-token-expiration', expirationTime);
        
        return true;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return false;
    }
}

/**
 * Validate the access token by making a test request to the Spotify API
 */
async function validateToken(token: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

/**
 * Wait for the authentication process to complete
 */
async function waitForAuthCompletion(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        // Check every second if the authentication was successful
        const interval = setInterval(() => {
            if (!connectionInProgress) {
                clearInterval(interval);
                resolve(isConnected);
            }
        }, 1000);
        
        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(interval);
            if (connectionInProgress) {
                connectionInProgress = false;
                resolve(false);
            }
        }, 5 * 60 * 1000);
    });
}

/**
 * Get Spotify integration data for cloud sync
 */
export async function getSpotifyIntegrationData(context: vscode.ExtensionContext): Promise<any> {
    try {
        // If not connected, just return basic state
        if (!isConnected) {
            return {
                connected: false
            };
        }
        
        // Get tokens from extension context
        const token = context.globalState.get<string>(TOKEN_KEY);
        const refreshToken = context.globalState.get<string>(REFRESH_TOKEN_KEY);
        
        return {
            connected: true,
            connectedAt: context.globalState.get('spotify-connected-at') || new Date().toISOString(),
            // Don't include actual tokens in the sync data for security reasons
            hasAccessToken: !!token,
            hasRefreshToken: !!refreshToken
        };
    } catch (error) {
        console.error('Error getting Spotify integration data:', error);
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Restore Spotify integration from cloud data
 */
export async function restoreSpotifyIntegration(context: vscode.ExtensionContext, spotifyData: any): Promise<boolean> {
    try {
        if (!spotifyData || !spotifyData.connected) {
            return false;
        }
        
        // Store context for later use
        extensionContext = context;
        
        // Only update connection status
        if (spotifyData.connectedAt) {
            await context.globalState.update('spotify-connected-at', spotifyData.connectedAt);
        }
        
        // Note: we don't restore actual tokens from cloud data for security reasons
        // Just update the connected status if tokens exist locally
        const token = context.globalState.get<string>(TOKEN_KEY);
        const refreshToken = context.globalState.get<string>(REFRESH_TOKEN_KEY);
        
        if (token && refreshToken) {
            // Validate the token by making a test request
            const isValid = await validateToken(token);
            if (isValid) {
                isConnected = true;
                return true;
            } else if (refreshToken) {
                // Token is invalid but we have a refresh token, try to refresh
                const refreshed = await refreshAccessToken(refreshToken);
                if (refreshed) {
                    isConnected = true;
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error restoring Spotify integration:', error);
        return false;
    }
}