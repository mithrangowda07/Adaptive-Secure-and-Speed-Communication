const db = require("../database/db");

const insertRecordStmt = db.prepare(`
  INSERT INTO messages (
    sender, receiver, message, file_name, file_size, encryption_algorithm,
    encryption_time_ms, transfer_time_ms, decryption_time_ms, total_processing_time_ms,
    latency_ms, bandwidth_mbps, packet_loss_percent, network_mode, message_hash,
    integrity_status, key_id, security_score, risk_level, cpu_usage, attack_risk,
    algorithm_reason, timestamp, date,
    sent_message, encrypted_message_sent, encrypted_message_received, decrypted_message
  ) VALUES (
    @sender, @receiver, @message, @file_name, @file_size, @encryption_algorithm,
    @encryption_time_ms, @transfer_time_ms, @decryption_time_ms, @total_processing_time_ms,
    @latency_ms, @bandwidth_mbps, @packet_loss_percent, @network_mode, @message_hash,
    @integrity_status, @key_id, @security_score, @risk_level, @cpu_usage, @attack_risk,
    @algorithm_reason, @timestamp, @date,
    @sent_message, @encrypted_message_sent, @encrypted_message_received, @decrypted_message
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
