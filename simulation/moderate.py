import json
import os
import random
import sys

state_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join("..", "backend", "network_state.json")

payload = {
    "mode": "moderate",
    "latency": random.randint(60, 120),
    "bandwidth": round(random.uniform(5, 15), 2),
    "packet_loss": round(random.uniform(1, 3), 2)
}

with open(state_path, "w", encoding="utf-8") as file:
    json.dump(payload, file, indent=2)

print(json.dumps(payload))
