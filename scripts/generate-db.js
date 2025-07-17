#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse DATABASE_URL to get connection config
function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  } catch (error) {
    console.error('❌ Error parsing DATABASE_URL:', error.message);
    throw new Error('Invalid DATABASE_URL format');
  }
}

// Get database configuration from environment
function getDatabaseConfig() {
  // Load environment variables from .env file
  const envFile = path.join(__dirname, '..', 'apps', 'api', '.env');
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
    console.log('📄 Loaded environment variables from .env file');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return parseDatabaseUrl(databaseUrl);
}

async function createDatabaseIfNotExists() {
  const config = getDatabaseConfig();
  
  // Connect to default postgres database to create our target database
  const postgresConfig = { ...config, database: 'postgres' };
  const postgresClient = new Client(postgresConfig);
  
  try {
    console.log('🔌 Connecting to PostgreSQL (postgres database)...');
    await postgresClient.connect();
    console.log('✅ Connected to PostgreSQL successfully');

    // Check if our target database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const dbExists = await postgresClient.query(checkDbQuery, [config.database]);
    
    if (dbExists.rows.length === 0) {
      console.log(`📝 Creating database: ${config.database}`);
      await postgresClient.query(`CREATE DATABASE "${config.database}"`);
      console.log(`✅ Database '${config.database}' created successfully`);
    } else {
      console.log(`✅ Database '${config.database}' already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await postgresClient.end();
  }
}

async function generateDatabase() {
  // First, ensure the database exists
  await createDatabaseIfNotExists();
  
  // Now connect to our target database
  const config = getDatabaseConfig();
  const client = new Client(config);
  
  try {
    console.log(`🔌 Connecting to database: ${config.database}`);
    await client.connect();
    console.log('✅ Connected to target database successfully');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'db.sql');
    console.log(`📖 Reading SQL file: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 SQL file loaded successfully');

    // Execute the SQL
    console.log('🚀 Executing database schema...');
    await client.query(sqlContent);
    console.log('✅ Database schema created successfully!');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    const tables = result.rows.map(row => row.table_name);
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table}`);
    });

    console.log('\n🎉 Database generation completed successfully!');
    console.log(`📊 Total tables created: ${tables.length}`);

  } catch (error) {
    console.error('❌ Error generating database:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running and accessible.');
      console.error('💡 Check your database connection settings.');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Create it first:');
      console.error(`   createdb ${config.database}`);
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle command line arguments
function showHelp() {
  console.log(`
Usage: node scripts/generate-db.js [options]

Options:
  --help, -h          Show this help message

Environment Variables:
  DATABASE_URL         PostgreSQL connection URL (required)
  DB_SSL              Enable SSL (true/false)

Examples:
  node scripts/generate-db.js
  `);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the script
generateDatabase().catch(console.error); 