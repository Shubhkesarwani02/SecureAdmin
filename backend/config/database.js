require('dotenv').config();

const databaseConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'framtt_superadmin',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { 
      rejectUnauthorized: false,
      sslmode: 'require'
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increased timeout for Supabase
    statement_timeout: 30000,
    query_timeout: 30000,
  },
  
  production: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { 
      rejectUnauthorized: false,
      sslmode: 'require'
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Increased timeout for Supabase
    statement_timeout: 30000,
    query_timeout: 30000,
  }
};

const config = databaseConfig[process.env.NODE_ENV || 'development'];

module.exports = config;
