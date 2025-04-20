# Client API

A Fastify application with TypeScript that exposes an endpoint for scanning operations.

## Setup

1. Install the latest version of Fastify and other dependencies:
   ```
   npm install fastify
   npm install
   ```
   
   Or simply run the initialization script:
   ```
   bash init.sh
   ```

2. Build the TypeScript code:
   ```
   npm run build
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### POST /api/scan

Accepts scan requests.

#### Authentication

Requires an API key in the header:
```
API-Key: testkey
```

#### Request Body

Expects a JSON payload which will be logged to the console.

#### Example

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "API-Key: testkey" \
  -d '{"document": "example.pdf", "options": {"quality": "high"}}'
```

#### Response

```json
{
  "success": true,
  "message": "Scan request received"
}
```

## Project Structure

```
client-api/
├── dist/                  # Compiled JavaScript files
├── src/                   # TypeScript source files
│   └── index.ts           # Main application file
├── package.json           # Dependencies and scripts
├── init.sh                # Initialization script
├── tsconfig.json          # TypeScript configuration
└── README.md              # This documentation
```
