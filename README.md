# Client API with ClickHouse Integration

This service provides a REST API for storing and retrieving scan data in a ClickHouse database.

## Features

- Store scan data in ClickHouse
- Query scan data by ID
- Get a list of recent scans
- API key authentication for all endpoints

## Environment Variables

The application uses the following environment variables, which should be defined in a `.env.local` file:

```
# API configuration
PORT=3010
HOST=0.0.0.0
API_KEY=testkey

# ClickHouse database configuration
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=ims_db
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_USE_SSL=false
```

## Available Endpoints

- `POST /api/scan` - Store scan data in the database
- `GET /api/scans` - Get a list of recent scans
- `GET /api/scan/:id` - Get a scan by ID

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Start the server:
   ```
   npm start
   ```

For development:
```
npm run dev
```

## ClickHouse Setup

You need a running ClickHouse instance to use this API. The application will automatically create the required database and tables on startup if they don't exist.

### Sample Docker Setup

You can run ClickHouse in Docker with the following command:

```
docker run -d \
  --name clickhouse \
  -p 8123:8123 \
  -p 9000:9000 \
  --ulimit nofile=262144:262144 \
  clickhouse/clickhouse-server
```

## API Usage Examples

### Store Scan Data

```bash
curl -X POST http://localhost:3010/api/scan \
  -H "Content-Type: application/json" \
  -H "x-api-key: testkey" \
  -d '{"source": "scanner1", "data": {"key": "value"}}'
```

### Get Recent Scans

```bash
curl -X GET http://localhost:3010/api/scans \
  -H "x-api-key: testkey"
```

### Get Scan by ID

```bash
curl -X GET http://localhost:3010/api/scan/YOUR_SCAN_ID \
  -H "x-api-key: testkey"
```
