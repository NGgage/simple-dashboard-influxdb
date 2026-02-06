const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const INFLUX_BASE_URL = process.env.INFLUX_BASE_URL;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET;
const INFLUX_ORGANIZATION = process.env.INFLUX_ORGANIZATION;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize settings file if it doesn't exist
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
    measurements: {},
    dashboard: {
      refreshInterval: 30000,
      theme: 'dark'
    }
  }, null, 2));
}

// Get InfluxDB config (without token for security)
app.get('/api/config', (req, res) => {
  res.json({
    bucket: INFLUX_BUCKET,
    organization: INFLUX_ORGANIZATION
  });
});

// Proxy to InfluxDB - Query
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;

    const response = await fetch(`${INFLUX_BASE_URL}/query?org=${INFLUX_ORGANIZATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv'
      },
      body: query
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all buckets
app.get('/api/buckets', async (req, res) => {
  try {
    const response = await fetch(`${INFLUX_BASE_URL}/buckets?org=${INFLUX_ORGANIZATION}`, {
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Buckets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all unique device_names
app.get('/api/devices', async (req, res) => {
  try {
    const query = `
import "influxdata/influxdb/schema"
schema.tagValues(bucket: "${INFLUX_BUCKET}", tag: "device_name")
`;

    const response = await fetch(`${INFLUX_BASE_URL}/query?org=${INFLUX_ORGANIZATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv'
      },
      body: query
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Devices error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get measurements for a specific device
app.get('/api/measurements', async (req, res) => {
  try {
    const { device } = req.query;

    let query;
    if (device) {
      // Get measurements that have data for this device
      query = `
from(bucket: "${INFLUX_BUCKET}")
  |> range(start: -30d)
  |> filter(fn: (r) => r.device_name == "${device}")
  |> keep(columns: ["_measurement"])
  |> distinct(column: "_measurement")
`;
    } else {
      query = `
import "influxdata/influxdb/schema"
schema.measurements(bucket: "${INFLUX_BUCKET}")
`;
    }

    const response = await fetch(`${INFLUX_BASE_URL}/query?org=${INFLUX_ORGANIZATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv'
      },
      body: query
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Measurements error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get fields for a measurement
app.get('/api/fields/:measurement', async (req, res) => {
  try {
    const { measurement } = req.params;
    const query = `
import "influxdata/influxdb/schema"
schema.measurementFieldKeys(bucket: "${INFLUX_BUCKET}", measurement: "${measurement}")
`;

    const response = await fetch(`${INFLUX_BASE_URL}/query?org=${INFLUX_ORGANIZATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv'
      },
      body: query
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Fields error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tag keys for a measurement
app.get('/api/tags/:measurement', async (req, res) => {
  try {
    const { measurement } = req.params;
    const query = `
import "influxdata/influxdb/schema"
schema.measurementTagKeys(bucket: "${INFLUX_BUCKET}", measurement: "${measurement}")
`;

    const response = await fetch(`${INFLUX_BASE_URL}/query?org=${INFLUX_ORGANIZATION}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INFLUX_TOKEN}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv'
      },
      body: query
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Tags error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/settings/measurement/:measurement', (req, res) => {
  try {
    const { measurement } = req.params;
    const measurementSettings = req.body;

    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    settings.measurements = settings.measurements || {};
    settings.measurements[measurement] = {
      ...settings.measurements[measurement],
      ...measurementSettings
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.json({ success: true, settings: settings.measurements[measurement] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`InfluxDB Dashboard running at http://localhost:${PORT}`);
  console.log(`Connected to InfluxDB: ${INFLUX_BASE_URL}`);
  console.log(`Bucket: ${INFLUX_BUCKET}`);
});
