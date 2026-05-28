# Adaptive Secure Communication System

Research-oriented full-stack demo for **dynamic cryptographic algorithm switching** based on simulated network quality.

## Objective

The system demonstrates:

> When network quality becomes poor, lighter and faster encryption algorithms improve communication speed and efficiency.

## Core Scope

- Real-time communication (messages + files)
- Dynamic encryption switching (`ECC`, `AES + RSA`, `AES`)
- Network quality simulation (Python scripts only; no real network throttling)
- Detailed per-transfer cryptographic analytics persisted in SQLite

## Tech Stack

- Frontend: React, Tailwind CSS, Socket.IO Client, Axios, Recharts
- Backend: Node.js, Express.js, Socket.IO
- Database: SQLite (`better-sqlite3`)
- Encryption: `crypto-js`, `node-forge`
- Simulation: Python scripts (`normal.py`, `moderate.py`, `slow.py`)
- Authentication: JWT

## Authentication

Pre-seeded users:

- `device1 / password1`
- `device2 / password2`

## Database

SQLite file: `backend/database/communication.db`

`messages` table stores one row for **every** message and file transfer with:

- sender, receiver, message, file_name, file_size
- encryption_algorithm
- encryption_time_ms, transfer_time_ms, decryption_time_ms, total_processing_time_ms
- latency_ms, bandwidth_mbps, packet_loss_percent, network_mode
- timestamp, date

## Runtime Flow

1. User logs in with JWT
2. User sends message/file
3. Backend reads `network_state.json`
4. `selectAlgorithm()` chooses algorithm from QoS state
5. Encrypt + measure time
6. Simulate transfer delay from latency
7. Decrypt + measure time
8. Persist complete analytics row in SQLite
9. Broadcast `receive_message`, `analytics_update`, `network_update`, `algorithm_update` via Socket.IO

## Network Simulation API

- `POST /simulate/normal`
- `POST /simulate/moderate`
- `POST /simulate/slow`
- These simulation routes are public (no JWT token required) for demo/testing.

Each simulation script writes `backend/network_state.json` with random QoS values:

- `normal`: latency 10-40 ms, bandwidth 20-50 Mbps, packet loss 0-1%
- `moderate`: latency 60-120 ms, bandwidth 5-15 Mbps, packet loss 1-3%
- `slow`: latency 200-350 ms, bandwidth 0.5-3 Mbps, packet loss 3-8%

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### System Requirement

- Python 3 available as `python3` (or set `PYTHON_BIN` env variable)

## Run

### Terminal 1

```bash
cd backend
npm run dev
```

### Terminal 2

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Demo Checklist

1. Login as `device1` and `device2`
2. Send real-time messages and files
3. Switch network mode from terminal:
   ```bash
   curl -X POST http://localhost:5000/simulate/normal
   curl -X POST http://localhost:5000/simulate/moderate
   curl -X POST http://localhost:5000/simulate/slow
   ```
4. Observe algorithm switching (`ECC` -> `AES + RSA` -> `AES`)
5. Confirm every transfer appears in analytics table and charts
