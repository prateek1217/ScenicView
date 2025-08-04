# Flight Seat Recommender Backend

A Node.js/Express TypeScript API for flight seat recommendations based on sunrise/sunset views.

## Features

- Flight path calculation
- Sun position analysis
- Seat recommendations for optimal sunrise/sunset views
- Enhanced sun analysis with timeline

## API Endpoints

- `GET /health` - Health check
- `GET /api/route` - Main flight analysis endpoint

### Route Parameters

- `from` (required): Departure airport code
- `to` (required): Arrival airport code  
- `depart` (required): Departure time (ISO 8601 format)
- `duration` (optional): Flight duration in hours

### Example Request

```
GET /api/route?from=JFK&to=LAX&depart=2025-08-01T18:00&duration=6
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This backend is configured for deployment on Vercel. See `DEPLOYMENT.md` for detailed instructions. 