# InfluxDB Dashboard

A beautiful, modern dashboard for visualizing time-series data from InfluxDB 2.x. Built with vanilla JavaScript and Chart.js.

![Dashboard Preview](https://img.shields.io/badge/InfluxDB-2.x-9146FF?style=flat-square&logo=influxdb)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)

## Features

- **Multi-series charts** - Add multiple measurements to a single chart for comparison
- **Hierarchical data selection** - Browse data by Device → Measurement → Field
- **Real-time updates** - Configurable auto-refresh (10s to 5min)
- **Beautiful dark theme** - Modern glassmorphism design with smooth animations
- **Persistent settings** - Chart configurations saved to local JSON
- **Time range selector** - Quick toggle between 5m, 15m, 1h, 6h, 24h, 7d
- **Docker ready** - Easy deployment with Docker Compose

---

## Before You Start

### Prerequisites

- **InfluxDB 2.x** running and accessible
- **Node.js 20+** (for local development) OR **Docker** (for containerized deployment)

### Required Setup Steps

Before starting the dashboard, you must complete these steps:

#### Step 1: Create Environment File

Copy the example environment file and fill in your InfluxDB credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
INFLUX_BASE_URL=http://your-influxdb-host:8086/api/v2
INFLUX_BUCKET=your-bucket-name
INFLUX_ORGANIZATION=your-org
INFLUX_TOKEN=your-api-token
```

#### Step 2: Get Your InfluxDB API Token

1. Open your InfluxDB UI (usually `http://localhost:8086`)
2. Go to **Data** → **API Tokens**
3. Click **Generate API Token** → **Custom API Token**
4. Select **Read** access for your bucket
5. Copy the generated token to your `.env` file

#### Step 3: Create Settings File

Copy the example settings file:

```bash
cp settings.example.json settings.json
```

This file stores your dashboard panel configurations. You can start with an empty config:

```json
{
  "panels": [],
  "dashboard": {
    "refreshInterval": 30000,
    "defaultTimeRange": "6h"
  }
}
```

#### Step 4: Verify Your Data Structure

The dashboard expects your InfluxDB data to have a `device_name` tag. Example:

```
temperature,device_name=bedroom_sensor value=21.5
humidity,device_name=bedroom_sensor percent=45.2
```

If your data uses a different tag name, you'll need to modify `server.js`.

---

## Quick Start

### Option A: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

### Option B: Docker Deployment

```bash
# 1. Build and start container
docker-compose up -d

# 2. Open in browser
# http://localhost:3000

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `INFLUX_BASE_URL` | InfluxDB API endpoint | Yes | - |
| `INFLUX_BUCKET` | Bucket to query data from | Yes | - |
| `INFLUX_ORGANIZATION` | InfluxDB organization | Yes | - |
| `INFLUX_TOKEN` | API token with read access | Yes | - |
| `PORT` | Dashboard server port | No | `3000` |

### In-App Settings

Click on the **connection indicator** (InfluxDB status) in the navigation bar to access:

- **Auto Refresh** - Data refresh interval (10s, 30s, 1min, 5min, or disabled)
- **Default Time Range** - Initial time window for charts

### Chart Panel Settings

Click the **cog icon** on any chart to configure:

| Setting | Description |
|---------|-------------|
| **Data Series** | Add multiple Device → Measurement → Field combinations |
| **Title** | Custom chart title |
| **Unit** | Display unit (°C, %, MB/s, etc.) |
| **Colors** | Choose from 10 predefined colors per series |
| **Y-Axis Min/Max** | Set fixed axis bounds |

---

## Project Structure

```
influxdashboard/
├── server.js              # Express backend with InfluxDB proxy
├── public/
│   └── index.html         # Single-page dashboard application
├── package.json           # Node.js dependencies
├── Dockerfile             # Container build instructions
├── docker-compose.yml     # Docker Compose configuration
├── .env.example           # Example environment variables
├── .env                   # Your environment variables (create this)
├── settings.example.json  # Example panel configuration
├── settings.json          # Your panel configuration (create this)
├── .gitignore             # Git ignore rules
└── .dockerignore          # Docker ignore rules
```

---

## API Endpoints

The backend proxies requests to InfluxDB:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | Get bucket/org info |
| `/api/devices` | GET | List unique `device_name` values |
| `/api/measurements` | GET | List measurements (filter: `?device=name`) |
| `/api/fields/:measurement` | GET | List fields for a measurement |
| `/api/query` | POST | Execute Flux query |
| `/api/settings` | GET/POST | Read/write dashboard settings |

---

## Data Model

### Expected Tag Structure

The dashboard uses `device_name` as the primary grouping tag:

```
measurement,device_name=<device> field=<value> <timestamp>
```

### Example Line Protocol

```
temperature,device_name=living_room value=22.5 1699900000000000000
temperature,device_name=bedroom value=19.8 1699900000000000000
humidity,device_name=living_room percent=45 1699900000000000000
co2,device_name=bedroom ppm=650 1699900000000000000
```

### Selection Hierarchy

```
Device (device_name tag)
  └── Measurement (_measurement)
        └── Field (_field)
```

---

## Troubleshooting

### "Connection Error" / Red Status Dot

1. Check if InfluxDB is running and accessible
2. Verify `INFLUX_BASE_URL` is correct (include `/api/v2`)
3. Test your token:
   ```bash
   curl -H "Authorization: Token YOUR_TOKEN" \
     "http://your-influxdb:8086/api/v2/buckets"
   ```

### "No Devices Found"

1. Ensure your data has a `device_name` tag
2. Check that data exists within the last 30 days
3. Verify the bucket name in `.env`

### Charts Show "No Data"

1. Confirm the device/measurement/field combination has recent data
2. Try expanding the time range (24h or 7d)
3. Check browser console for query errors

### Docker: Container Exits Immediately

1. Check logs: `docker-compose logs`
2. Verify `.env` file exists and has all required variables
3. Ensure InfluxDB is reachable from the container network

---

## Tech Stack

- **Backend**: Node.js 20, Express 4
- **Frontend**: Vanilla JavaScript, Chart.js 4
- **Styling**: Custom CSS with CSS Variables, Glassmorphism
- **Database**: InfluxDB 2.x (Flux query language)
- **Container**: Docker, Alpine Linux

---

## License

MIT License - Feel free to use and modify for your projects.
