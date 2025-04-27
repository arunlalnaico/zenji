import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export Spotify token keys
export const TOKEN_KEY = process.env.SPOTIFY_TOKEN_KEY?.replace(/['"]/g, '') || 'spotify-token';
export const REFRESH_TOKEN_KEY = process.env.SPOTIFY_REFRESH_TOKEN_KEY?.replace(/['"]/g, '') || 'spotify-refresh-token';
export const AUTH_STATE_KEY = process.env.SPOTIFY_AUTH_STATE_KEY?.replace(/['"]/g, '') || 'spotify-auth-state';