// MongoDB connection test script
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function testMongoDBConnection() {
    try {
        // Get connection string from environment or directly from parameter
        let connectionString = 'mongodb+srv://zendev:Qazxsw321$@cluster0.rv7uusw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        
        console.log('Attempting to connect to MongoDB...');
        
        // Create MongoDB client with connection options
        const client = new MongoClient(connectionString, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000
        });
        
        // Connect to MongoDB
        await client.connect();
        
        // Test the connection by accessing the database and running a ping command
        const db = client.db();
        const pingResult = await db.command({ ping: 1 });
        
        console.log('Successfully connected to MongoDB!');
        console.log('Ping result:', pingResult);
        
        // List available databases as an additional test
        const dbList = await client.db().admin().listDatabases();
        console.log('Available databases:');
        dbList.databases.forEach(db => {
            console.log(`- ${db.name}`);
        });
        
        // Close the connection
        await client.close();
        console.log('Connection closed successfully');
        
        return true;
    } catch (error) {
        console.error('Failed to connect to MongoDB:');
        console.error(error);
        return false;
    }
}

// Run the test
testMongoDBConnection()
    .then(success => {
        if (success) {
            console.log('Connection test completed successfully!');
        } else {
            console.log('Connection test failed.');
        }
    });