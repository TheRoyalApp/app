# Appointment Reminder CRON Service

This is a standalone microservice that handles appointment reminders for The Royal Barber. It runs on a schedule (default: every 15 minutes) and sends Expo push notifications to both clients and barbers 15 minutes before their appointments.

## Features

- **Standalone Service**: Runs independently of the main API.
- **Dual Notification**: Notifies both Client and Barber.
- **Expo Push Notifications**: Uses Expo for reliable push notifications.
- **Health Checks**: HTTP server for health monitoring (useful for Railway).
- **Graceful Shutdown**: Handles SIGTERM/SIGINT correctly.
- **Manual Trigger**: Endpoint to manually trigger the job for testing.

## Prerequisites

- Node.js or Bun
- PostgreSQL database (shared with main API)
- Environment variables configured

## Configuration

Create a `.env` file in the `cron-service` directory (or configure in Railway) with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
CRON_SCHEDULE=*/15 * * * *
NODE_ENV=production
PORT=3001
```

- `DATABASE_URL`: Connection string to the main application database.
- `CRON_SCHEDULE`: Crontab expression for the schedule (default: every 15 mins).
- `PORT`: Port for the health check server (default: 3001).

## Development

1. Install dependencies:
   ```bash
   cd cron-service
   bun install
   ```

2. Run in development mode:
   ```bash
   bun dev
   ```

## Deployment on Railway

This service is optimized for Railway deployment.

1. **Create a New Service** in your Railway project.
2. **Connect Repo**: Select this repository.
3. **Configure Settings**:
   - **Root Directory**: Leave as `/` (Root) so it can access shared files in `src/`.
   - **Build Command**: `cd cron-service && bun install && bun run build`
   - **Start Command**: `cd cron-service && bun dist/index.js`
   - **Watch Paths**: `cron-service/**` (optional)
4. **Environment Variables**: Add `DATABASE_URL`, `CRON_SCHEDULE`, etc.
5. **Health Check Path**: Set to `/health`.

## API Endpoints

The service exposes a lightweight HTTP server:

- `GET /health`: Returns 200 OK if running.
- `GET /status`: Returns details about the last run, next run estimation, and statistics.
- `POST /trigger`: Manually triggers the reminder job immediately.

## Testing

To test the logic without waiting for the schedule:

1. Start the service.
2. Send a POST request to `/trigger`:
   ```bash
   curl -X POST http://localhost:3001/trigger
   ```
3. Check logs for output.

## Logic Details

- The job checks for confirmed appointments scheduled between **14 and 16 minutes** from the current time.
- It sends a reminder only if the user/barber has a valid Expo Push Token and has notifications enabled.

