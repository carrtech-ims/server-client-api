import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { insertScanData, queryScanData, getScanById } from '../db/clickhouse';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for request body and headers
export interface ScanRequest {
  source?: string;
  [key: string]: unknown;
}

export interface RequestHeaders {
  'x-api-key'?: string;
}

export const registerScanRoutes = (server: FastifyInstance): void => {
  // Register route for POST /api/scan
  server.post<{
    Body: ScanRequest;
    Headers: RequestHeaders;
  }>('/api/scan', async (request: FastifyRequest<{
    Body: ScanRequest;
    Headers: RequestHeaders;
  }>, reply: FastifyReply) => {
    // Check if the API key is present and valid
    const apiKey = request.headers['x-api-key'];
    const expectedApiKey = process.env.API_KEY || 'testkey';
    
    if (!apiKey || apiKey !== expectedApiKey) {
      reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
      return;
    }
    
    try {
      // Log the request body
      request.log.info('Received scan request with body:', request.body);
      
      // Extract source from request or use default
      const source = request.body.source || 'unknown';
      
      // Create scan data object with generated ID
      const scanData = {
        id: uuidv4(),
        timestamp: new Date(),
        source,
        payload: request.body,
      };
      
      // Insert data into ClickHouse
      await insertScanData(scanData);
      
      // Send a success response with the generated ID
      return { 
        success: true, 
        message: 'Scan data stored successfully', 
        id: scanData.id 
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Register route for GET /api/scans
  server.get('/api/scans', async (request: FastifyRequest<{
    Headers: RequestHeaders;
    Querystring: { limit?: string };
  }>, reply: FastifyReply) => {
    // Check if the API key is present and valid
    const apiKey = request.headers['x-api-key'];
    const expectedApiKey = process.env.API_KEY || 'testkey';
    
    if (!apiKey || apiKey !== expectedApiKey) {
      reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
      return;
    }
    
    try {
      // Parse limit from query parameters or use default
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;
      
      // Query data from ClickHouse
      const scans = await queryScanData(limit);
      
      // Send response
      return { 
        success: true, 
        count: scans.length,
        scans 
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Register route for GET /api/scan/:id
  server.get<{
    Params: { id: string };
    Headers: RequestHeaders;
  }>('/api/scan/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Headers: RequestHeaders;
  }>, reply: FastifyReply) => {
    // Check if the API key is present and valid
    const apiKey = request.headers['x-api-key'];
    const expectedApiKey = process.env.API_KEY || 'testkey';
    
    if (!apiKey || apiKey !== expectedApiKey) {
      reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
      return;
    }
    
    try {
      // Get the scan ID from the route parameters
      const { id } = request.params;
      
      // Query data from ClickHouse
      const scan = await getScanById(id);
      
      if (!scan) {
        reply.code(404).send({ error: 'Scan not found' });
        return;
      }
      
      // Send response
      return { 
        success: true, 
        scan 
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
};
