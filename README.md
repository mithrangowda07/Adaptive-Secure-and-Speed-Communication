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
- SHA-256 integrity verification and tamper detection
- Dynamic key rotation (every 5 messages)
- Intelligent algorithm decision and security score tracking

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
- message_hash, integrity_status, key_id
- security_score, risk_level, cpu_usage, attack_risk, algorithm_reason
- timestamp, date

`encryption_keys` table stores key-rotation events.

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
- `POST /simulate/security/low`
- `POST /simulate/security/medium`
- `POST /simulate/security/high`
- `POST /simulate/tamper`
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
3. Switch network quality from terminal (3 commands):
   ```bash
   curl -X POST http://localhost:5000/simulate/normal
   curl -X POST http://localhost:5000/simulate/moderate
   curl -X POST http://localhost:5000/simulate/slow
   ```
   Optional custom range payload example:
   ```bash
   curl -X POST http://localhost:5000/simulate/normal \
     -H "Content-Type: application/json" \
     -d '{
       "ranges": {
         "latency": [12, 35],
         "bandwidth": [22, 48],
         "packet_loss": [0, 0.8],
         "jitter": [2, 7],
         "throughput": [20, 40],
         "connection_stability": [90, 99],
         "response_time": [30, 70],
         "error_rate": [0, 1.5]
       }
     }'
   ```
4. Switch security risk profile from terminal (3 commands):
   ```bash
   curl -X POST http://localhost:5000/simulate/security/low
   curl -X POST http://localhost:5000/simulate/security/medium
   curl -X POST http://localhost:5000/simulate/security/high
   ```
   Optional custom security range payload example:
   ```bash
   curl -X POST http://localhost:5000/simulate/security/medium \
     -H "Content-Type: application/json" \
     -d '{
       "ranges": {
         "cpu_usage": [40, 68],
         "attack_risk": [0.8, 1.5],
         "integrity_penalty": [0.5, 1.8],
         "anomaly_score": [20, 55],
         "auth_fail_rate": [1, 4],
         "threat_signal": [20, 60]
       }
     }'
   ```
5. Trigger packet tampering simulation:
   ```bash
   curl -X POST http://localhost:5000/simulate/tamper
   ```
6. Observe algorithm switching, key rotation, integrity failures, and security score updates
7. Confirm every transfer appears in analytics table and graphs

## Risk Level Curl Commands

Use these command groups separately:

- **Network quality controls (3 curls):**
  ```bash
  curl -X POST http://localhost:5000/simulate/normal
  curl -X POST http://localhost:5000/simulate/moderate
  curl -X POST http://localhost:5000/simulate/slow
  ```

- **Security risk controls (3 curls):**
  ```bash
  curl -X POST http://localhost:5000/simulate/security/low
  curl -X POST http://localhost:5000/simulate/security/medium
  curl -X POST http://localhost:5000/simulate/security/high
  ```

- **Tamper simulation (optional):**
  ```bash
  curl -X POST http://localhost:5000/simulate/tamper
  ```

After each command, send a message to see new algorithm and score.  
Each simulation command also starts short live variation (about 8 seconds) so values change in real time.

## Security Features Added

- **SHA-256 Integrity Verification**
  - `message_hash` generated before transfer
  - `integrity_status` set as `VERIFIED` / `FAILED` on receive side
  - Red alert banner shown for compromised packets

- **Dynamic Key Rotation**
  - Automatic rotation after every 5 messages/files
  - `key_id` stored on each communication row
  - Rotation events emitted via Socket.IO (`key_rotation`)

- **Security Score Engine**
  - Score range: `0-100`
  - Live risk classification: `LOW RISK`, `MEDIUM RISK`, `HIGH RISK`
  - Includes algorithm strength, key size, integrity, packet loss, CPU, latency

- **Intelligent Algorithm Selector**
  - Weighted decision based on network, risk, CPU, complexity, retry, integrity
  - Emits human-readable `algorithm_reason`
  - Drives live cards on chat page and analytics dashboard

## How Algorithm Selection Works

Algorithm selection policy is driven by **network mode + security risk level**:

- **If network = normal**
  - risk = HIGH or MEDIUM -> `ECC`
  - risk = LOW -> `AES + RSA`

- **If network = moderate**
  - risk = HIGH -> `ECC`
  - risk = MEDIUM -> `AES + RSA`
  - risk = LOW -> `AES`

- **If network = slow**
  - risk = HIGH -> `AES + RSA`
  - risk = MEDIUM -> `AES`
  - risk = LOW -> `AES`

Reason text shown on chat page is generated from this policy for each message.

The security score is recalculated per message from:

- algorithm strength + key contribution
- integrity status
- packet loss, latency, transfer time penalties
- CPU usage and risk adjustments

The resulting score maps to:

- `61-100`: LOW RISK
- `31-60`: MEDIUM RISK
- `0-30`: HIGH RISK

## Socket.IO Live Events

- `receive_message`
- `analytics_update`
- `network_update`
- `algorithm_update`
- `security_update`
- `integrity_alert`
- `key_rotation`
