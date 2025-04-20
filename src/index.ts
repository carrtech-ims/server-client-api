import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Define interfaces for request body and headers
interface ScanRequest {
  [key: string]: unknown;
}

interface RequestHeaders {
  'x-api-key'?: string;
}

// Create the Fastify instance
const server: FastifyInstance = fastify({ logger: true });

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
  
  if (!apiKey || apiKey !== 'testkey') {
    reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }
  
  try {
    // Log the request body
    console.log('Received scan request with body:', request.body);
    
    // Send a success response
    return { success: true, message: 'Scan request received' };
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// Start the server
const start = async (): Promise<void> => {
  try {
    await server.listen({ port: 3010, host: '0.0.0.0' });
    const address = server.server.address();
    const port = typeof address === 'object' ? address?.port : address;
    console.log(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();