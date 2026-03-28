import json
import requests
from datetime import datetime, timezone

def generate_1hr_collision():
    ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # We want TCA ≈ 3600s
    # Total closing velocity = 15.2 km/s (7.6 + 7.6)
    # Target distance = 15.2 * 3600 = 54,720 km
    
    objects = [
    {
        "id": "SAT-TARGET-01",
        "type": "SATELLITE",
        "r": {"x": 6928.0, "y": 0.0, "z": 0.0},
        "v": {"x": 0.0, "y": 0.007, "z": 0.0}  # Slowed down significantly
    },
    {
        "id": "DEB-INTERSECT-01",
        "type": "DEBRIS",
        "r": {"x": 6928.05, "y": 10.0, "z": 0.0}, 
        "v": {"x": 0.0, "y": -0.007, "z": 0.0} # Slowed down significantly
    }
]
    
    return {"timestamp": ts, "objects": objects}

if __name__ == "__main__":
    payload = generate_1hr_collision()
    print("Uploading 1-hour test collision...")
    try:
        response = requests.post("http://localhost:8000/api/telemetry", json=payload)
        if response.status_code == 200:
            print(f"Ingested! Now check 'curl http://localhost:8000/api/conjunctions'")
        else:
            print(f"Failed: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")