import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

// Handle different paths for dev vs production similar to MongoDB service
let envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    // Try alternative paths
    const altPath = path.join(__dirname, '../..', '.env');
    if (fs.existsSync(altPath)) {
        envPath = altPath;
        console.log('Found .env file at alternate path:', altPath);
    } else {
        console.warn('No .env file found at expected paths. API key may need to be set manually.');
    }
}

// Initialize environment variables with explicit path to ensure it loads
console.log('Loading .env for OpenAI from:', envPath);
dotenv.config({ path: envPath });

// Log status of OpenAI configuration (without exposing the key)
if (process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key found in environment variables');
} else {
    console.warn('OpenAI API key not found in environment variables');
}

// OpenAI variables
let openai: OpenAI | null = null;
let extensionContext: vscode.ExtensionContext | null = null;

/**
 * Initialize OpenAI client
 */
export async function initOpenAI(context: vscode.ExtensionContext | null): Promise<boolean> {
    // Store the context for later use
    if (context) {
        extensionContext = context;
    }

    // If already initialized, return immediately
    if (openai) {
        console.log('OpenAI client already initialized');
        return true;
    }

    // Try to get API key from environment or from context secrets
    let apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey && extensionContext) {
        try {
            // Try to get from secrets storage if available
            const secretValue = await extensionContext.secrets.get('OPENAI_API_KEY');
            if (secretValue) {
                apiKey = secretValue;
                console.log('OpenAI API key retrieved from secrets storage');
            }
        } catch (error) {
            console.error('Error accessing extension secrets for OpenAI:', error);
        }
    }

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.error('OpenAI API key is missing or using default placeholder value. Check your .env file or extension secrets.');
        return false;
    }

    try {
        console.log('Creating new OpenAI client...');
        openai = new OpenAI({ apiKey });
        console.log('Successfully initialized OpenAI client');
        return true;
    } catch (error) {
        console.error('OpenAI initialization failed:', error);
        openai = null;
        return false;
    }
}

/**
 * Check if OpenAI client is initialized
 */
export function isOpenAIInitialized(): boolean {
    return openai !== null;
}

/**
 * Send a message to OpenAI and get a response
 * @param messages Chat history in OpenAI format
 * @param userName User's name for personalized responses
 */
export async function getChatCompletionFromOpenAI(messages: any[], userName?: string): Promise<string> {
    // Try to initialize OpenAI if not already initialized
    if (!openai) {
        console.log('OpenAI client not initialized, attempting to initialize...');
        try {
            const initialized = await initOpenAI(extensionContext);
            if (!initialized || !openai) {
                console.error('Failed to initialize OpenAI client');
                throw new Error('OpenAI client not initialized. Please check your API key.');
            }
        } catch (error) {
            console.error('Error during OpenAI initialization:', error);
            throw new Error('OpenAI client not initialized. Please check your API key.');
        }
    }
    
    try {
        // Prepare system message with context about Zenji and the user
        const systemMessage = {
            role: 'system',
            content: `You are Zenji, a mindful AI coding companion built into VS Code. 
Your purpose is to help developers maintain mental wellness, focus, and balance while coding.
${userName ? `The user's name is ${userName}.` : ''}
Keep your responses supportive, mindful, and concise. Focus on mental wellness, productivity tips, 
and encouraging healthy coding habits. You can suggest short breaks, breathing exercises, 
or offer kind affirmations when the user seems stressed.`
        };
        
        // Add system message to the beginning of the conversation
        const conversationWithSystem = [
            systemMessage,
            ...messages
        ];
        
        // Get response from OpenAI
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Use model from env or default to gpt-3.5-turbo
            messages: conversationWithSystem,
            max_tokens: 500, // Limit response length
            temperature: 0.7, // Slightly creative but still focused
        });
        
        // Return the AI's response text
        return completion.choices[0].message.content || 'I apologize, but I seem to be having trouble responding right now.';
    } catch (error) {
        console.error('Failed to get response from OpenAI:', error);
        throw error;
    }
}

/**
 * Close and cleanup OpenAI resources if needed
 */
export function closeOpenAI(): void {
    openai = null;
    console.log('OpenAI client resources released');
}