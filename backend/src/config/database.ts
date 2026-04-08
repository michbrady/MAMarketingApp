import sql from 'mssql';
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger.js';

dotenv.config();

const logger = createLogger('Database');

// SQL Server configuration using SQL Server Authentication
// Simple username/password authentication for development
const config: sql.config = {
  server: process.env.DB_HOST || 'dbms-dwhs.corp.shop.com\\DWP01',
  database: process.env.DB_NAME || 'UnFranchiseMarketing',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    instanceName: 'DWP01'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 30000,
  connectionTimeout: 30000
}

let pool: sql.ConnectionPool | null = null;

/**
 * Get database connection pool
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      logger.info('Connecting to database...');
      logger.info(`Server: ${config.server}`);
      logger.info(`Database: ${config.database}`);

      pool = await sql.connect(config);

      logger.info('✓ Database connected successfully');

      // Test connection
      const result = await pool.request().query('SELECT DB_NAME() AS CurrentDatabase');
      logger.info(`✓ Connected to database: ${result.recordset[0].CurrentDatabase}`);

      return pool;
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }
  return pool;
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }
}

/**
 * Execute a query
 */
export async function query<T = any>(sql: string, params?: any): Promise<T[]> {
  const db = await getPool();
  const request = db.request();

  // Add parameters if provided
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }

  const result = await request.query(sql);
  return result.recordset as T[];
}

/**
 * Execute a stored procedure
 */
export async function executeProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  const db = await getPool();
  const request = db.request();

  // Add parameters if provided
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }

  const result = await request.execute(procedureName);
  return result.recordset as T[];
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

export default { getPool, closePool, query, executeProcedure };
