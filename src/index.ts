import fastify, { FastifyInstance } from 'fastify';
import { registerScanRoutes } from './routes/scan';
import { initDatabase } from './db/clickhouse';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// Load environment variables
const PORT = parseInt(process.env.PORT || '3010', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create the Fastify instance
const server: FastifyInstance = fastify({ 
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: false, // Don't remove additional properties, we need them for the payload
      useDefaults: true,
      coerceTypes: true,
      allErrors: true,
    }
  }
});

// Register routes
registerScanRoutes(server);

// Start the server
const start = async (): Promise<void> => {
  try {
    // Initialize the database
    await initDatabase();
    
    // Start the server
    await server.listen({ port: PORT, host: HOST });
    const address = server.server.address();
    const port = typeof address === 'object' ? address?.port : address;
    console.log(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await server.close();
  process.exit(0);
});

// Start the server
start();
