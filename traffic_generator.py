#!/usr/bin/env python3
"""PAACS (Predictive Adaptive Algorithm Control System) Traffic Generator.

This script simulates two virtual users chatting continuously and exchanging files.
It is designed to populate dashboard analytics, SQLite logs, key rotations, network QoS changes,
and demonstrate SHA-256 integrity tamper alerts for a project presentation.

Dependencies:
    Only Python standard library modules. Executes curl via subprocess.
"""

import os
import sys
import time
import json
import random
import logging
import subprocess
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# =====================================================================
# CONFIGURATION
# =====================================================================
SERVER_URL = "http://localhost:5000"

# Time interval to sleep between transmissions (random uniform range in seconds)
MESSAGE_INTERVAL_MIN = 2.5
MESSAGE_INTERVAL_MAX = 3.5

# Probability of choosing text message vs file transfer (weights)
TEXT_PROBABILITY = 0.70
FILE_PROBABILITY = 0.30

# Time interval to switch network simulation state (seconds)
NETWORK_CHANGE_INTERVAL = 20.0

# Probability of tampering simulation trigger (checked every 15 transmissions)
TAMPER_PROBABILITY = 0.10

# Credentials of virtual users registered in the backend SQLite DB
USER_A_USERNAME = "device1"
USER_A_PASSWORD = "password1"

USER_B_USERNAME = "device2"
USER_B_PASSWORD = "password2"

# Set up logging formatting
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("TrafficGenerator")

# List of realistic chat messages (at least 100 items)
REALISTIC_MESSAGES = [
    "Hello", "Good Morning", "How are you?", "Checking connection", "Transfer completed",
    "Latency looks high", "Sending report", "Encryption successful", "Algorithm switched",
    "QoS updated", "Testing adaptive encryption", "Packet received", "Can you verify?",
    "Received successfully", "Security upgraded", "Hash verified", "Network stable",
    "Performance improved", "Please review", "Demo running", "Initializing secure channel...",
    "Connection stability looks good", "System log entry saved", "Jitter values stabilized",
    "Bandwidth check passed", "Key rotation initialized", "New key pair generated",
    "Switching to ChaCha20 stream cipher", "ECC handshake completed", "Hybrid encryption mode active",
    "Network state: moderate congestion", "Adapting threshold limits", "Hysteresis filter active",
    "Resetting connection state", "Device synchronization active", "Heartbeat signal sent",
    "Heartbeat signal acknowledged", "Channel security verified", "SQLite audit logs written",
    "Database write latency: 5ms", "Packet delivery ratio at 99.8%", "Signal strength degrading",
    "Downshifting cryptographic complexity", "Optimizing throughput", "Average latency under 200ms",
    "Average latency exceeds 300ms", "Stability lock engaged for 5 cycles", "Stability lock released",
    "Rolling window evaluated", "SHA-256 integrity check active", "No tampering detected in current session",
    "Warning: potential high jitter", "Recharts engine rendering metrics", "Live dashboard telemetry updated",
    "Device 1 transmitting telemetry", "Device 2 receiving telemetry", "Public key exchanged successfully",
    "Symmetric cipher configured: AES-128", "Symmetric cipher configured: AES-256",
    "Active algorithm: ECC (Elliptic Curve Cryptography)", "Active algorithm: AES-256 + RSA Hybrid",
    "QoS score calculated: 85", "Throughput telemetry sync completed", "Active connection status: active",
    "CPU usage under load: 45%", "Memory consumption stable", "Secure communication established",
    "Session ticket created", "Verifying file checksum...", "Checksum verification passed",
    "Generating random traffic...", "Presentation demo in progress", "Testing standard deviation calculations",
    "Hysteresis check: step 1", "Hysteresis check: step 2", "Hysteresis check: step 3 (Switching)",
    "Cryptographic suite negotiation complete", "Secure socket layer initialized", "Socket connection online",
    "Syncing historic transmission logs", "Security score: 95/100", "Risk level: low risk",
    "Network mode: Good", "Ready for next transfer", "All operations logged to SQLite",
    "Running test suite", "Verifying packet hash", "Key ID rotation sequence: 1 -> 2",
    "Key ID rotation sequence: 2 -> 3", "Key ID rotation sequence: 3 -> 4", "Key ID rotation sequence: 4 -> 5",
    "Rotating keys now", "Session key validated", "Secure exchange complete", "Device 1 ping",
    "Device 2 pong", "All telemetry systems nominal", "Simulation cycle 100% stable",
    "Adaptive speed mode verified", "Traffic generator operational", "PAACS algorithm selector active"
]


def format_elapsed_time(seconds: float) -> str:
    """Formats seconds into an HH:MM:SS duration string."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def setup_demo_files() -> List[str]:
    """Creates the demo_files directory and populates it with dummy files if they do not exist."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    demo_dir = os.path.join(script_dir, "demo_files")
    if not os.path.exists(demo_dir):
        os.makedirs(demo_dir)
        logger.info(f"Created demo directory at: {demo_dir}")

    dummy_files = {
        "report.pdf": "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n... Dummy PDF Content for PAACS Demo ...",
        "image.png": "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82",
        "notes.txt": "These are some sample notes for the PAACS adaptive security transmission simulation.\nEncryption strength varies based on network QoS.",
        "graph.csv": "timestamp,latency,bandwidth,packet_loss\n1784048903,45,12.5,0.2\n1784048933,90,5.1,1.5",
        "sample.zip": "PK\x03\x04\n\x00\x00\x00\x00\x00Dummy ZIP Archive Content",
        "video.mp4": "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00Dummy MP4 Video Content"
    }

    filepaths = []
    for filename, content in dummy_files.items():
        filepath = os.path.join(demo_dir, filename)
        filepaths.append(filepath)
        if not os.path.exists(filepath):
            is_binary = filename.endswith((".png", ".zip", ".mp4"))
            mode = "wb" if is_binary else "w"
            encoding = None if is_binary else "utf-8"
            
            write_content = content
            if is_binary and isinstance(content, str):
                write_content = content.encode("latin-1")
                
            with open(filepath, mode, encoding=encoding) as f:
                f.write(write_content)
            logger.info(f"Created dummy file: {filename}")
            
    return filepaths


class PAACTrafficGenerator:
    """Simulates active messaging traffic between two users in the PAACS system."""

    def __init__(self, server_url: str):
        self.server_url = server_url
        self.token_a: Optional[str] = None
        self.token_b: Optional[str] = None
        
        # Statistics counters
        self.total_messages = 0
        self.total_files = 0
        self.sent_by_a = 0
        self.sent_by_b = 0
        
        # Track current state for display
        self.current_network = "Unknown"
        self.current_algorithm = "Unknown"
        
        self.start_time = time.time()
        self.last_stats_time = time.time()
        self.last_network_change_time = time.time()
        self.transmission_counter = 0

    def run_curl(self, cmd: List[str]) -> Tuple[str, str]:
        """Executes a curl command via subprocess and returns (stdout, http_status_code)."""
        full_cmd = cmd + ["-w", "\n%{http_code}"]
        try:
            result = subprocess.run(full_cmd, capture_output=True, text=True, timeout=15)
            if result.returncode != 0:
                return "", f"CURL_ERR_{result.returncode}"
            
            output = result.stdout.strip()
            if not output:
                return "", "000"
            
            parts = output.rsplit("\n", 1)
            if len(parts) == 2:
                body, status_code = parts
                return body.strip(), status_code.strip()
            else:
                val = parts[0].strip()
                if val.isdigit() and len(val) == 3:
                    return "", val
                return val, "200"
        except subprocess.TimeoutExpired:
            return "", "TIMEOUT"
        except Exception as e:
            return "", f"ERR_{str(e)}"

    def authenticate_users(self) -> None:
        """Logs in User A and User B to obtain Bearer tokens."""
        while not self.token_a or not self.token_b:
            try:
                if not self.token_a:
                    logger.info(f"Authenticating User A ({USER_A_USERNAME})...")
                    self.token_a = self.login(USER_A_USERNAME, USER_A_PASSWORD)
                if not self.token_b:
                    logger.info(f"Authenticating User B ({USER_B_USERNAME})...")
                    self.token_b = self.login(USER_B_USERNAME, USER_B_PASSWORD)
                logger.info("Authentication successful for both users.")
            except Exception as e:
                logger.error(f"Authentication failed: {e}. Retrying in 5 seconds...")
                time.sleep(5)

    def login(self, username: str, password: str) -> str:
        """Executes login request and returns the token."""
        cmd = [
            "curl", "-s", "-X", "POST",
            f"{self.server_url}/login",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({"username": username, "password": password})
        ]
        body, status = self.run_curl(cmd)
        if status != "200":
            raise Exception(f"HTTP {status} - {body}")
        
        try:
            data = json.loads(body)
            if "token" in data:
                return data["token"]
            raise Exception(f"Token missing in response: {body}")
        except json.JSONDecodeError:
            raise Exception(f"Failed to parse JSON response: {body}")

    def fetch_live_status(self) -> None:
        """Fetches current algorithm and network state from the analytics API."""
        if not self.token_a:
            return
        cmd = [
            "curl", "-s", "-X", "GET",
            f"{self.server_url}/analytics",
            "-H", f"Authorization: Bearer {self.token_a}"
        ]
        body, status = self.run_curl(cmd)
        if status == "200":
            try:
                data = json.loads(body)
                self.current_algorithm = data.get("currentAlgorithm", self.current_algorithm)
                net_mode = data.get("network", {}).get("mode", self.current_network)
                if net_mode:
                    self.current_network = net_mode
            except Exception:
                pass
        elif status == "401":
            # Token expired, clear tokens to trigger re-auth
            self.token_a = None
            self.token_b = None

    def send_text_message(self, sender: str, receiver: str, message: str) -> Tuple[bool, str]:
        """Sends a text message using Socket.IO HTTP long-polling."""
        # 1. Socket.IO Handshake
        handshake_cmd = [
            "curl", "-s",
            f"{self.server_url}/socket.io/?EIO=4&transport=polling"
        ]
        body, status = self.run_curl(handshake_cmd)
        if status != "200" or not body:
            return False, status
            
        if not body.startswith("0"):
            return False, "INVALID_PROTOCOL"
            
        try:
            handshake_data = json.loads(body[1:])
            sid = handshake_data["sid"]
        except Exception:
            return False, "PARSE_ERROR"
            
        # 2. Namespace Connection
        connect_cmd = [
            "curl", "-s", "-X", "POST",
            "-H", "Content-Type: text/plain",
            "-d", "40",
            f"{self.server_url}/socket.io/?EIO=4&transport=polling&sid={sid}"
        ]
        _, connect_status = self.run_curl(connect_cmd)
        if connect_status != "200":
            return False, connect_status
            
        # 3. Emit message event
        payload = {
            "sender": sender,
            "receiver": receiver,
            "message": message
        }
        event_data = f'42["send_message",{json.dumps(payload)}]'
        send_cmd = [
            "curl", "-s", "-X", "POST",
            "-H", "Content-Type: text/plain",
            "-d", event_data,
            f"{self.server_url}/socket.io/?EIO=4&transport=polling&sid={sid}"
        ]
        _, send_status = self.run_curl(send_cmd)
        return send_status == "200", send_status

    def upload_file(self, sender: str, receiver: str, token: str, filepath: str) -> Tuple[bool, str]:
        """Uploads a file via HTTP multipart/form-data."""
        cmd = [
            "curl", "-s", "-X", "POST",
            f"{self.server_url}/messages/upload",
            "-H", f"Authorization: Bearer {token}",
            "-F", f"file=@{filepath}",
            "-F", f"receiver={receiver}"
        ]
        body, status = self.run_curl(cmd)
        if status == "200":
            try:
                data = json.loads(body)
                if "currentAlgorithm" in data:
                    self.current_algorithm = data["currentAlgorithm"]
                net_mode = data.get("network", {}).get("mode")
                if net_mode:
                    self.current_network = net_mode
                return True, status
            except Exception:
                pass
            return True, status
        elif status == "401":
            # Token expired, clear tokens
            self.token_a = None
            self.token_b = None
        return False, status

    def change_network_mode(self, mode: str) -> Tuple[bool, str]:
        """Changes the simulated network state in the backend."""
        cmd = [
            "curl", "-s", "-X", "POST",
            f"{self.server_url}/simulate/{mode}"
        ]
        body, status = self.run_curl(cmd)
        if status == "200":
            self.current_network = mode
            return True, status
        return False, status

    def trigger_tampering(self) -> Tuple[bool, str]:
        """Triggers a tamper simulation on the backend."""
        cmd = [
            "curl", "-s", "-X", "POST",
            f"{self.server_url}/simulate/tamper"
        ]
        _, status = self.run_curl(cmd)
        return status == "200", status

    def log_transmission(self, sender: str, receiver: str, msg_type: str, content: str, response_code: str) -> None:
        """Formats and prints transmission log details to standard output."""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        content_display = f'"{content}"' if msg_type.lower() == "text" else content
        logger.info(
            f"TRANSMISSION: Time={current_time} | Sender={sender} | Receiver={receiver} | "
            f"Type={msg_type.upper()} | Name/Content={content_display} | "
            f"Net={self.current_network} | HTTP={response_code}"
        )

    def print_stats_table(self) -> None:
        """Outputs a cleanly formatted live statistics table."""
        elapsed = time.time() - self.start_time
        elapsed_formatted = format_elapsed_time(elapsed)
        total_transmissions = self.total_messages + self.total_files
        elapsed_minutes = elapsed / 60.0
        avg_msg_min = total_transmissions / elapsed_minutes if elapsed_minutes > 0 else 0.0

        print("\n" + "=" * 55)
        print("                 PAACS LIVE STATISTICS                 ")
        print("=" * 55)
        print(f"  Elapsed Time:             {elapsed_formatted}")
        print(f"  Current Network Profile:  {self.current_network}")
        print(f"  Current Algorithm:        {self.current_algorithm}")
        print("-" * 55)
        print(f"  Total Messages (Text):    {self.total_messages}")
        print(f"  Total Files Transferred:  {self.total_files}")
        print(f"  Sent by User A (device1): {self.sent_by_a}")
        print(f"  Sent by User B (device2): {self.sent_by_b}")
        print(f"  Avg Transmissions / Min:  {avg_msg_min:.2f}")
        print("=" * 55 + "\n")
        self.last_stats_time = time.time()

    def start_simulation(self) -> None:
        """Begins the continuous traffic generation loop."""
        # Initial status check
        self.fetch_live_status()
        
        logger.info("Traffic generator started successfully. Running forever...")
        
        while True:
            try:
                # 1. Ensure authentication is active
                if not self.token_a or not self.token_b:
                    self.authenticate_users()

                # 2. Check if network mode needs switching (every 20 seconds)
                now = time.time()
                if now - self.last_network_change_time >= NETWORK_CHANGE_INTERVAL:
                    mode = random.choice(["excellent", "good", "moderate", "weak", "poor"])
                    success, status = self.change_network_mode(mode)
                    if success:
                        logger.info(f"NETWORK CHANGE: Switched to '{mode}' mode (HTTP {status})")
                    else:
                        logger.error(f"NETWORK CHANGE ERROR: Failed to switch to '{mode}' (HTTP {status})")
                    self.last_network_change_time = time.time()

                # 3. Wait for random interval
                delay = random.uniform(MESSAGE_INTERVAL_MIN, MESSAGE_INTERVAL_MAX)
                time.sleep(delay)

                # 4. Select sender/receiver (50/50 probability)
                sender, receiver = random.choice([
                    (USER_A_USERNAME, USER_B_USERNAME),
                    (USER_B_USERNAME, USER_A_USERNAME)
                ])
                token = self.token_a if sender == USER_A_USERNAME else self.token_b

                # 5. Decide message type (70% text, 30% file)
                msg_type = random.choices(
                    ["text", "file"],
                    weights=[TEXT_PROBABILITY, FILE_PROBABILITY]
                )[0]

                if msg_type == "text":
                    message = random.choice(REALISTIC_MESSAGES)
                    success, status = self.send_text_message(sender, receiver, message)
                    
                    if not success:
                        # Log error and retry in 5s
                        logger.error(f"Transmission failed (HTTP {status}). Retrying in 5 seconds...")
                        time.sleep(5)
                        continue
                        
                    self.total_messages += 1
                    self.log_transmission(sender, receiver, "Text", message, status)
                else:
                    script_dir = os.path.dirname(os.path.abspath(__file__))
                    demo_dir = os.path.join(script_dir, "demo_files")
                    files = ["report.pdf", "image.png", "notes.txt", "graph.csv", "sample.zip", "video.mp4"]
                    filename = random.choice(files)
                    filepath = os.path.join(demo_dir, filename)
                    
                    success, status = self.upload_file(sender, receiver, token, filepath)
                    if not success:
                        logger.error(f"File transmission failed (HTTP {status}). Retrying in 5 seconds...")
                        time.sleep(5)
                        continue
                        
                    self.total_files += 1
                    self.log_transmission(sender, receiver, "File", filename, status)

                # Update sender statistics
                if sender == USER_A_USERNAME:
                    self.sent_by_a += 1
                else:
                    self.sent_by_b += 1

                self.transmission_counter += 1

                # 6. Check for tampering event (every 15 transmissions, 10% chance)
                if self.transmission_counter > 0 and self.transmission_counter % 15 == 0:
                    if random.random() < TAMPER_PROBABILITY:
                        tamper_success, tamper_status = self.trigger_tampering()
                        if tamper_success:
                            logger.warning(f"TAMPER SIMULATION: Armed next packet for integrity failure (HTTP {tamper_status})")
                        else:
                            logger.error(f"TAMPER SIMULATION ERROR: Failed to arm tampering (HTTP {tamper_status})")

                # 7. Print stats table every 30 seconds
                if time.time() - self.last_stats_time >= 30.0:
                    # Sync latest server algorithm/network mode
                    self.fetch_live_status()
                    self.print_stats_table()

            except Exception as e:
                logger.error(f"Unexpected error in simulation loop: {e}. Retrying in 5 seconds...")
                time.sleep(5)


def main() -> None:
    """Main execution entry point."""
    logger.info("Initializing PAACS Traffic Generator...")
    setup_demo_files()
    
    generator = PAACTrafficGenerator(SERVER_URL)
    
    try:
        generator.start_simulation()
    except KeyboardInterrupt:
        logger.info("Traffic generator stopped by keyboard interrupt.")
        sys.exit(0)


if __name__ == "__main__":
    main()
