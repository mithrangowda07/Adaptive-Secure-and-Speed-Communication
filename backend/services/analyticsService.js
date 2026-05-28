const db = require("../database/db");

const insertRecordStmt = db.prepare(`
  INSERT INTO messages (
    sender, receiver, message, file_name, file_size, encryption_algorithm,
    encryption_time_ms, transfer_time_ms, decryption_time_ms, total_processing_time_ms,
    latency_ms, bandwidth_mbps, packet_loss_percent, network_mode, timestamp, date
  ) VALUES (
    @sender, @receiver, @message, @file_name, @file_size, @encryption_algorithm,
    @encryption_time_ms, @transfer_time_ms, @decryption_time_ms, @total_processing_time_ms,
    @latency_ms, @bandwidth_mbps, @packet_loss_percent, @network_mode, @timestamp, @date
  )
`);

function saveCommunication(record) {
  insertRecordStmt.run(record);
}

function fetchAnalytics(limit = 200) {
  return db
    .prepare("SELECT * FROM messages ORDER BY id DESC LIMIT ?")
    .all(limit);
}
module.exports = { saveCommunication, fetchAnalytics };
