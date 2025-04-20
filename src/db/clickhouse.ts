import { createClient } from '@clickhouse/client';
import { ClickHouseClient } from '@clickhouse/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// Type definition for scan data
export interface ScanData {
  id: string;
  timestamp: Date;
  source: string;
  payload: Record<string, unknown>;
}

// Parse environment variables with default values
const host = process.env.CLICKHOUSE_HOST || 'localhost';
const port = parseInt(process.env.CLICKHOUSE_PORT || '8123', 10);
const database = process.env.CLICKHOUSE_DATABASE || 'ims_db';
const username = process.env.CLICKHOUSE_USERNAME || 'default';
const password = process.env.CLICKHOUSE_PASSWORD || '';
const useSSL = process.env.CLICKHOUSE_USE_SSL === 'true';

// Create ClickHouse client
let clickhouseClient: ClickHouseClient | null = null;

export const getClickHouseClient = (): ClickHouseClient => {
  if (!clickhouseClient) {
    clickhouseClient = createClient({
      host: `${useSSL ? 'https' : 'http'}://${host}:${port}`,
      username,
      password,
      database,
    });
  }
  return clickhouseClient;
};

// Initialize the database (create tables if they don't exist)
export const initDatabase = async (): Promise<void> => {
  const client = getClickHouseClient();
  
  try {
    console.log(`Attempting to connect to ClickHouse at ${host}:${port}`);
    
    // Create the database if it doesn't exist
    await client.exec({
      query: `CREATE DATABASE IF NOT EXISTS ${database}`,
    });
    
    // Create the scans table if it doesn't exist
    await client.exec({
      query: `
        CREATE TABLE IF NOT EXISTS ${database}.scans (
          id String,
          timestamp DateTime,
          source String,
          payload String,  -- JSON stored as string
          
          -- Set primary key for efficient querying
          PRIMARY KEY (id)
        )
        ENGINE = MergeTree()
        ORDER BY (id, timestamp)
      `,
    });
    
    console.log('ClickHouse database initialized successfully');
  } catch (error) {
    console.error('Error initializing ClickHouse database:', error);
    console.error('Make sure ClickHouse is running and the connection details in .env.local are correct.');
    console.error(`Current connection: ${host}:${port}, database: ${database}, username: ${username}`);
    // Throw error to stop the application
    throw error;
  }
};

// Insert scan data into the database
export const insertScanData = async (scanData: ScanData): Promise<void> => {
  const client = getClickHouseClient();
  
  try {
    await client.insert({
      table: 'scans',
      values: [{
        id: scanData.id,
        timestamp: scanData.timestamp,
        source: scanData.source,
        payload: JSON.stringify(scanData.payload),
      }],
      format: 'JSONEachRow',
    });
  } catch (error) {
    console.error('Error inserting scan data:', error);
    throw error;
  }
};

// Query scan data
export const queryScanData = async (limit = 100): Promise<ScanData[]> => {
  const client = getClickHouseClient();
  
  try {
    const resultSet = await client.query({
      query: `
        SELECT 
          id,
          timestamp,
          source,
          payload
        FROM ${database}.scans
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `,
      format: 'JSONEachRow',
    });
    
    const result = await resultSet.json<Array<{
      id: string;
      timestamp: string;
      source: string;
      payload: string;
    }>>();
    
    // Transform the results to match the ScanData interface
    return result.map((row) => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      source: row.source,
      payload: JSON.parse(row.payload),
    }));
  } catch (error) {
    console.error('Error querying scan data:', error);
    throw error;
  }
};

// Get scan by ID
export const getScanById = async (id: string): Promise<ScanData | null> => {
  const client = getClickHouseClient();
  
  try {
    const resultSet = await client.query({
      query: `
        SELECT 
          id,
          timestamp,
          source,
          payload
        FROM ${database}.scans
        WHERE id = {id:String}
        LIMIT 1
      `,
      format: 'JSONEachRow',
      query_params: {
        id,
      },
    });
    
    const result = await resultSet.json<Array<{
      id: string;
      timestamp: string;
      source: string;
      payload: string;
    }>>();
    
    if (result.length === 0) {
      return null;
    }
    
    const row = result[0];
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      source: row.source,
      payload: JSON.parse(row.payload),
    };
  } catch (error) {
    console.error('Error getting scan by ID:', error);
    throw error;
  }
};
