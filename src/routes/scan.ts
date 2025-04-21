import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { scanQueue } from '../queue/scanQueue';
import { getTenantFromApiKey, validateApiKey } from '../utils/tenant';

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
    
    if (!apiKey || !validateApiKey(apiKey)) {
      reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
      return;
    }

    // Process the scan request and queue it
    try {
      // Log the incoming request for debugging
      request.log.info('Received scan request with payload');
      
      // Get tenant and host IDs from API key
      const { tenant_id, host_id } = getTenantFromApiKey(apiKey);
      
      // Log tenant information for debugging
      request.log.info(`Processing request for tenant_id: ${tenant_id}, host_id: ${host_id}`);
      
      // Create the job payload with tenant info and the original request payload
      const jobPayload = {
        tenant: {
          tenant_id,
          host_id
        },
        payload: request.body // Include the complete JSON payload from the client
      };
      
      // Add job to the queue
      const job = await scanQueue.add('client-stats-job', jobPayload, {
        removeOnComplete: true, // Remove completed jobs from the queue
        attempts: 3,             // Retry up to 3 times if processing fails
        backoff: {               // Exponential backoff for retries
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
};
