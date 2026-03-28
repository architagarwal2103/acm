import numpy as np
from backend.core.conjunction import find_tca  # Adjust import based on your actual file name

def test_head_on_collision():
    # 1. Setup states [x, y, z, vx, vy, vz]
    # Satellite at (6928, 0, 0) moving at 7.6 km/s along Y
    sat_state = np.array([6928.0, 0.0, 0.0, 0.0, 7.6, 0.0])
    
    # Debris at (6928.05, 50.0, 0) moving at -7.6 km/s along Y (Head-on)
    # They are 50km apart, closing at 15.2 km/s total relative velocity
    deb_state = np.array([6928.05, 50.0, 0.0, 0.0, -7.6, 0.0])

    print("\n" + "="*40)
    print("RUNNING COLLISION CALCULATION TEST")
    print("="*40)

    # 2. Run the TCA function
    # We expect them to meet in ~3.28 seconds (50km / 15.2km/s)
    tca_time, min_dist, sat_pos, deb_pos = find_tca(
        sat_state, 
        deb_state, 
        horizon_s=60.0, # Look 1 minute ahead
        dt=0.1          # 100ms steps
    )

    # 3. Output results
    print(f"RESULT:")
    print(f"  - Time of Closest Approach: {tca_time:.4f} seconds")
    print(f"  - Minimum Distance:         {min_dist * 1000:.2f} meters")
    print(f"  - Sat Position at TCA:      {sat_pos}")
    print(f"  - Deb Position at TCA:      {deb_pos}")
    
    # 4. Assertions (for pytest)
    assert tca_time > 0, "TCA should be in the future"
    assert min_dist < 0.1, "Objects should pass within 100m"
    print("="*40)
    print("TEST PASSED")

if __name__ == "__main__":
    test_head_on_collision()