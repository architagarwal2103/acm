import json
import requests
from datetime import datetime, timezone, timedelta

def generate_1hr_collision():
    # Use actual UTC now
    now = datetime.now(timezone.utc)
    ts = now.isoformat().replace("+00:00", "Z")
    
    # Orbital Velocity for ~550km altitude is roughly 7.6 km/s
    v_orb = 7.6 
    
    # To create a collision in ~1450 seconds (24 mins):
    # We place them 11,000 km apart with a closing velocity of 15.2 km/s (7.6 * 2)
    # 11000 / 15.2 ≈ 723 seconds. 
    # Let's go further to be safe: 25,000 km apart ≈ 1644 seconds (27 mins)
    
    objects = [
        {
            "id": "SAT-TARGET-01",
            "type": "SATELLITE",
            "r": {"x": 6928.0, "y": -12500.0, "z": 0.0},
            "v": {"x": 0.0, "y": v_orb, "z": 0.0} 
        },
        {
            "id": "DEB-INTERSECT-01",
            "type": "DEBRIS",
            "r": {"x": 6928.05, "y": 12500.0, "z": 0.0}, # 0.05km (50m) miss distance
            "v": {"x": 0.0, "y": -v_orb, "z": 0.0}
        }
    ]
    
    return {"timestamp": ts, "objects": objects}

if __name__ == "__main__":
    payload = generate_1hr_collision()
    print("Uploading ~25-minute test collision...")
    try:
        # Use your actual local port
        response = requests.post("http://localhost:8000/api/telemetry", json=payload)
        if response.status_code == 200:
            print(f"Ingested! Response: {response.json()}")
            print("Check 'curl http://localhost:8000/api/conjunctions' now.")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")