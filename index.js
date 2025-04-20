const fastify = require('fastify')({ logger: true })

// Register route for POST /api/scan
fastify.post('/api/scan', async (request, reply) => {
  // Check if the API key is present and valid
  const apiKey = request.headers['api-key']
  
  if (!apiKey || apiKey !== 'testkey') {
    reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' })
    return
  }
  
  try {
    // Log the request body
    console.log('Received scan request with body:', request.body)
    
    // Send a success response
    return { success: true, message: 'Scan request received' }
  } catch (error) {
    request.log.error(error)
    reply.code(500).send({ error: 'Internal Server Error' })
  }
})

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log(`Server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
