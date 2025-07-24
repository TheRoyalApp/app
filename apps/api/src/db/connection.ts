import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';

let db: ReturnType<typeof drizzle> | null = null;

export async function initializeDatabase() {
    if (db) {
        return db; // Already initialized
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    try {
        // Create the connection with better timeout handling
        const client = postgres(connectionString, {
            max: 10, // Maximum number of connections
            idle_timeout: 20, // Close idle connections after 20 seconds
            connect_timeout: 10, // Connection timeout
            connection: {
                application_name: 'the_royal_barber_api'
            },
            onnotice: () => {}, // Suppress notice messages
            onparameter: () => {}, // Suppress parameter messages
        });

        // Create the database instance
        db = drizzle(client, { schema });

        // Test the connection
        await client`SELECT 1`;
        console.log('✅ Database connection established successfully');

        return db;
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
}

export async function getDatabase() {
    if (!db) {
        await initializeDatabase();
    }
    return db!;
}

export * from './schema.js'; 