import numpy as np
from datetime import datetime, timedelta, timezone
from backend.core.maneuver_planner import plan_cola_maneuvers
from backend.core.conjunction import ConjunctionEvent

def test_maneuver_calculation():
    print("=== STARTING PLANNER LOGIC TEST ===\n")

    # 1. Setup Mock Data
    sat_id = "SAT-TEST-01"
    # Orbital state: [rx, ry, rz, vx, vy, vz] in km and km/s
    sat_state = np.array([6928.0, 0.0, 0.0, 0.0, 7.6, 0.0])
    
    current_time = datetime.now(timezone.utc)
    
    # Create a "Critical" event exactly 600 seconds (10 mins) away
    event = ConjunctionEvent(
        satellite_id=sat_id,
        debris_id="DEB-99",
        tca_seconds_from_now=600.0,
        miss_distance_km=0.05, # 50 meters
        risk_level="CRITICAL",
        deb_pos_at_tca=np.array([6928.05, 0.0, 0.0])
    )

    # 2. Test Scenario A: Fresh Start (No previous burns)
    print("Scenario A: Fresh satellite (last_burn_time = None)")
    plan = plan_cola_maneuvers(
        sat_id=sat_id,
        sat_state=sat_state,
        event=event,
        current_time=current_time,
        last_burn_time=None,
        mass_fuel_kg=50.0
    )

    if plan:
        print(f"✅ SUCCESS: Planned {len(plan)} burns.")
        for b in plan:
            print(f"   - {b['burn_id']} at {b['burnTime']}")
    else:
        print("❌ FAILED: Planner returned None (Check the 'no time window' logic)")

    print("\n" + "-"*30 + "\n")

    # 3. Test Scenario B: Recently Fired (Cooldown check)
    print("Scenario B: Satellite just fired 2 mins ago (Should Fail Cooldown)")
    just_now = current_time - timedelta(minutes=2)
    plan_b = plan_cola_maneuvers(
        sat_id=sat_id,
        sat_state=sat_state,
        event=event,
        current_time=current_time,
        last_burn_time=just_now,
        mass_fuel_kg=50.0
    )

    if not plan_b:
        print("✅ SUCCESS: Properly rejected due to cooldown.")
    else:
        print("❌ FAILED: Planner ignored cooldown!")

if __name__ == "__main__":
    test_maneuver_calculation()