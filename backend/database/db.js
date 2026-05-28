const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "communication.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT,
    file_name TEXT,
    file_size REAL,
    encryption_algorithm TEXT NOT NULL,
    encryption_time_ms REAL NOT NULL,
    transfer_time_ms REAL NOT NULL,
    decryption_time_ms REAL NOT NULL,
    total_processing_time_ms REAL NOT NULL,
    latency_ms REAL NOT NULL,
    bandwidth_mbps REAL NOT NULL,
    packet_loss_percent REAL NOT NULL,
    network_mode TEXT NOT NULL,
    message_hash TEXT,
    integrity_status TEXT,
    key_id INTEGER DEFAULT 1,
    security_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'MEDIUM RISK',
    cpu_usage REAL DEFAULT 0,
    attack_risk INTEGER DEFAULT 0,
    algorithm_reason TEXT DEFAULT '',
    timestamp TEXT NOT NULL,
    date TEXT NOT NULL
  );
`);

const messageColumns = db.prepare("PRAGMA table_info(messages)").all().map((column) => column.name);
if (!messageColumns.includes("algorithm_reason")) {
  db.exec("DROP TABLE IF EXISTS messages");
  db.exec(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      message TEXT,
      file_name TEXT,
      file_size REAL,
      encryption_algorithm TEXT NOT NULL,
      encryption_time_ms REAL NOT NULL,
      transfer_time_ms REAL NOT NULL,
      decryption_time_ms REAL NOT NULL,
      total_processing_time_ms REAL NOT NULL,
      latency_ms REAL NOT NULL,
      bandwidth_mbps REAL NOT NULL,
      packet_loss_percent REAL NOT NULL,
      network_mode TEXT NOT NULL,
      message_hash TEXT,
      integrity_status TEXT,
      key_id INTEGER DEFAULT 1,
      security_score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'MEDIUM RISK',
      cpu_usage REAL DEFAULT 0,
      attack_risk INTEGER DEFAULT 0,
      algorithm_reason TEXT DEFAULT '',
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS encryption_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id INTEGER NOT NULL,
    algorithm TEXT NOT NULL,
    created_at TEXT NOT NULL,
    rotation_reason TEXT NOT NULL
  );
`);

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)"
);
insertUser.run("device1", "password1");
insertUser.run("device2", "password2");

module.exports = db;
