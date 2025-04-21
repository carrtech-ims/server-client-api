import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryScanData, getScanById } from '../db/clickhouse';
import { scanQueue } from '../queue/scanQueue';
import { getTenantIdFromApiKey } from '../utils/tenant';

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

    // Enqueue the scan request with the full JSON payload
    try {
      // Log the incoming request for debugging
      request.log.info('Received scan request with payload');
      
      // Get tenant ID from API key (currently hardcoded to 'test_tenant')
      const tenantId = getTenantIdFromApiKey(apiKey);
      
      // Log tenant ID for debugging
      request.log.info(`Processing request for tenant: ${tenantId}`);
      
      // Create the job payload with metadata and the original request
      // Determine host ID from client IP or source
      const hostId = request.ip || request.body.source || 'unknown-host';
      
      const jobPayload = {
        timestamp: new Date(),
        source: request.body.source || 'unknown',
        payload: request.body,  // Include the complete JSON payload
        // Add tenant_id and host_id at the top level as required by clickhouse-service
        tenantId: tenantId,
        hostId: hostId,  // Add host_id for proper data attribution
        metadata: {
          receivedAt: new Date().toISOString(),
          clientIp: request.ip,
          userAgent: request.headers['user-agent'] || 'unknown',
          // Also include tenant_id in metadata for consistency
          tenantId: tenantId
        }
      };
      
      // Log for debugging
      request.log.info(`Job payload prepared with tenantId: ${tenantId}, hostId: ${hostId}`);
      
      // Add job to the queue
      // Using a generic job name to match what the worker expects
      const job = await scanQueue.add('client-stats-job', jobPayload, {
        removeOnComplete: false, // Keep completed jobs in the queue for visibility
        attempts: 3,              // Retry up to 3 times if processing fails
        backoff: {                // Exponential backoff for retries
          type: 'exponential',
          delay: 5000            // Start with 5 seconds delay
        }
      });
      
      // Return success with job ID for tracking
      reply.code(202).send({ 
        success: true, 
        message: 'Scan request queued successfully',
        jobId: job.id,
        queuedAt: new Date().toISOString()
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ 
        success: false, 
        error: 'Failed to enqueue scan request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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
