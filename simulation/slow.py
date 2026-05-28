import json
import os
import random
import sys

state_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join("..", "backend", "network_state.json")

payload = {
    "mode": "slow",
    "latency": random.randint(200, 350),
    "bandwidth": round(random.uniform(0.5, 3), 2),
    "packet_loss": round(random.uniform(3, 8), 2)
}

with open(state_path, "w", encoding="utf-8") as file:
    json.dump(payload, file, indent=2)

print(json.dumps(payload))
