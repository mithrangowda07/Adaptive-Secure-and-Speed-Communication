import json
import sys

payload = {
    "mode": "tamper",
    "armed": True,
    "message": "Tamper mode enabled for next packet"
}

print(json.dumps(payload))
sys.exit(0)
