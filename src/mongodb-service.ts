import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

// Handle different paths for dev vs production
let envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    // Try alternative paths
    const altPath = path.join(__dirname, '../..', '.env');
    if (fs.existsSync(altPath)) {
        envPath = altPath;
    }
}

// Initialize environment variables with explicit path to ensure it loads
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// MongoDB connection variables
let client: MongoClient | null = null;
const collectionName = process.env.MONGODB_COLLECTION || 'userdata';

// Get connection string with fallback to hardcoded value for development/testing
const connectionString = process.env.ZENJI_MONGODB_CONNECTION_STRING || 
    'mongodb+srv://zendev:Qazxsw321$@cluster0.rv7uusw.mongodb.net/zenji?retryWrites=true&w=majority&appName=Cluster0';

console.log('MongoDB module loaded, connection string available:', !!connectionString);

// Store the extension context
let extensionContext: vscode.ExtensionContext | null = null;

/**
 * Initialize MongoDB connection with minimal complexity
 */
export async function initMongoDB(context: vscode.ExtensionContext | null): Promise<boolean> {
    // Store the context for later use
    if (context) {
        extensionContext = context;
    }

    // If already initialized, return immediately
    if (client) {
        console.log('MongoDB client already initialized');
        return true;
    }

    // Try to get connection string from environment or from context secrets
    let mongoConnectionString = connectionString;
    if (!mongoConnectionString && extensionContext) {
        try {
            // Try to get from secrets storage if available
            const secretValue = await extensionContext.secrets.get('ZENJI_MONGODB_CONNECTION_STRING');
            if (secretValue) {
                mongoConnectionString = secretValue;
            }
        } catch (error) {
            console.error('Error accessing extension secrets:', error);
        }
    }

    if (!mongoConnectionString) {
        console.error('MongoDB connection string is missing. Check your .env file or extension secrets.');
        return false;
    }

    try {
        console.log('Creating new MongoDB client...');
        client = new MongoClient(mongoConnectionString);
        
        console.log('Connecting to MongoDB...');
        await client.connect();
        
        // Verify connection works
        const db = client.db();
        await db.command({ ping: 1 });
        
        console.log('Successfully connected to MongoDB');
        return true;
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        client = null;
        return false;
    }
}

/**
 * Check if MongoDB client is connected
 */
export function isMongoDBConnected(): boolean {
    return client !== null;
}

/**
 * Save user data to MongoDB
 */
export async function saveUserDataToMongoDB(userId: string, userData: any): Promise<boolean> {
    // Try to initialize MongoDB if not already initialized
    if (!client) {
        console.log('MongoDB client not initialized, attempting to connect...');
        try {
            const connected = await initMongoDB(extensionContext);
            if (!connected || !client) {
                console.error('Failed to initialize MongoDB connection');
                throw new Error('MongoDB client not initialized. Please check your connection settings.');
            }
        } catch (error) {
            console.error('Error during MongoDB initialization:', error);
            throw new Error('MongoDB client not initialized. Please check your connection settings.');
        }
    }
    
    try {
        const db = client.db();
        const collection = db.collection(collectionName);
        
        const dataToSave = {
            ...userData,
            userId,
            updatedAt: new Date(),
            version: '1.0'
        };
        
        const result = await collection.updateOne(
            { userId },
            { $set: dataToSave },
            { upsert: true }
        );
        
        console.log('Data successfully saved to MongoDB');
        return result.acknowledged;
    } catch (error) {
        console.error('Failed to save data to MongoDB:', error);
        // Reset client on error to force reconnection on next attempt
        client = null;
        throw error;
    }
}

/**
 * Retrieve user data from MongoDB
 */
export async function getUserDataFromMongoDB(userId: string): Promise<any> {
    // Try to initialize MongoDB if not already initialized
    if (!client) {
        console.log('MongoDB client not initialized, attempting to connect...');
        try {
            const connected = await initMongoDB(extensionContext);
            if (!connected || !client) {
                console.error('Failed to initialize MongoDB connection');
                throw new Error('MongoDB client not initialized. Please check your connection settings.');
            }
        } catch (error) {
            console.error('Error during MongoDB initialization:', error);
            throw new Error('MongoDB client not initialized. Please check your connection settings.');
        }
    }
    
    try {
        const db = client.db();
        const collection = db.collection(collectionName);
        
        const userData = await collection.findOne({ userId });
        console.log('Data successfully retrieved from MongoDB');
        return userData;
    } catch (error) {
        console.error('Failed to retrieve data from MongoDB:', error);
        // Reset client on error to force reconnection on next attempt
        client = null;
        throw error;
    }
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDB(): Promise<void> {
    if (client) {
        try {
            await client.close();
            client = null;
            console.log('MongoDB connection closed');
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
        }
    }
}