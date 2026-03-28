# backend/core/conjunction.py
"""
Conjunction Assessment (CA) engine.
Uses KD-Tree spatial indexing to avoid O(N^2) brute-force checks.
"""

import numpy as np
from scipy.spatial import KDTree
from dataclasses import dataclass, field
from typing import Optional
# backend/core/conjunction.py
from .physics import rk4_step, propagate_to_time  # <--- Add propagate_to_time here
from .constants import (
    CONJUNCTION_THRESHOLD_KM,
    CONJUNCTION_WARNING_KM,
    KDTREE_COARSE_RADIUS_KM,
    PROPAGATION_HORIZON_S,
    DEFAULT_DT_S,
)


@dataclass
class ConjunctionEvent:
    satellite_id: str
    debris_id: str
    tca_seconds_from_now: float       # Time of Closest Approach (s)
    miss_distance_km: float
    risk_level: str                    # "CRITICAL", "WARNING", "SAFE"
    sat_pos_at_tca: np.ndarray = field(default_factory=lambda: np.zeros(3))
    deb_pos_at_tca: np.ndarray = field(default_factory=lambda: np.zeros(3))


def _classify_risk(miss_km: float) -> str:
    if miss_km < CONJUNCTION_THRESHOLD_KM:
        return "CRITICAL"
    elif miss_km < 1.0:
        return "CRITICAL"
    elif miss_km < CONJUNCTION_WARNING_KM:
        return "WARNING"
    return "SAFE"


def find_tca(
    sat_state: np.ndarray,
    deb_state: np.ndarray,
    horizon_s: float = PROPAGATION_HORIZON_S,
    dt: float = DEFAULT_DT_S,
) -> tuple[float, float, np.ndarray, np.ndarray]:
    """
    Three-phase TCA search:
      Phase 1 — Coarse scan at 30s steps to find the approximate minimum bracket.
      Phase 2 — Fine scan at 0.5s steps within ±30s of the Phase 1 minimum.
      Phase 3 — Ultra-fine scan at 0.05s steps within ±0.5s of the Phase 2 minimum.

    This handles head-on conjunctions (closing velocity ~15 km/s) where a 10s
    coarse step skips over a sub-km miss distance entirely.
    """
    # ── Phase 1: Coarse scan (30s steps over full horizon) ──────────────────
    COARSE_DT = 30.0

    sat = sat_state.copy()
    deb = deb_state.copy()
    min_dist = np.inf
    min_t = 0.0
    prev_sat = sat.copy()
    prev_deb = deb.copy()
    bracket_t = 0.0

    t = 0.0
    while t <= horizon_s:
        dist = np.linalg.norm(sat[:3] - deb[:3])
        if dist < min_dist:
            min_dist = dist
            min_t = t
            bracket_t = max(0.0, t - COARSE_DT)  # one step back = bracket start
            prev_sat = sat.copy()
            prev_deb = deb.copy()
        sat = rk4_step(sat, COARSE_DT)
        deb = rk4_step(deb, COARSE_DT)
        t += COARSE_DT

    # ── Phase 2: Fine scan (0.5s steps over ±30s bracket) ───────────────────
    FINE_DT = 0.5

    s2 = propagate_to_time(sat_state, bracket_t)
    d2 = propagate_to_time(deb_state, bracket_t)
    fine_end = min(horizon_s, min_t + COARSE_DT)
    curr_t = bracket_t
    fine_min_t = min_t
    final_sat_pos = s2[:3].copy()
    final_deb_pos = d2[:3].copy()

    while curr_t <= fine_end:
        dist = np.linalg.norm(s2[:3] - d2[:3])
        if dist < min_dist:
            min_dist = dist
            fine_min_t = curr_t
            final_sat_pos = s2[:3].copy()
            final_deb_pos = d2[:3].copy()
        s2 = rk4_step(s2, FINE_DT)
        d2 = rk4_step(d2, FINE_DT)
        curr_t += FINE_DT

    min_t = fine_min_t

    # ── Phase 3: Ultra-fine scan (0.05s steps over ±0.5s bracket) ───────────
    ULTRA_DT = 0.05

    ultra_start = max(0.0, min_t - FINE_DT)
    ultra_end = min(horizon_s, min_t + FINE_DT)
    s3 = propagate_to_time(sat_state, ultra_start)
    d3 = propagate_to_time(deb_state, ultra_start)
    curr_t = ultra_start

    while curr_t <= ultra_end:
        dist = np.linalg.norm(s3[:3] - d3[:3])
        if dist < min_dist:
            min_dist = dist
            min_t = curr_t
            final_sat_pos = s3[:3].copy()
            final_deb_pos = d3[:3].copy()
        s3 = rk4_step(s3, ULTRA_DT)
        d3 = rk4_step(d3, ULTRA_DT)
        curr_t += ULTRA_DT

    return min_t, min_dist, final_sat_pos, final_deb_pos


class ConjunctionAssessor:
    """
    High-performance conjunction assessor using KD-Tree for spatial pre-filtering.
    
    Algorithm:
      1. Build KD-Tree over all debris positions.
      2. For each satellite, query debris within KDTREE_COARSE_RADIUS_KM.
      3. Run precise TCA analysis only on candidate pairs (~O(N log N) total).
    """

    def __init__(self):
        self._debris_states: dict[str, np.ndarray] = {}   # id → [r, v]
        self._satellite_states: dict[str, np.ndarray] = {}
        self._kdtree: Optional[KDTree] = None
        self._debris_ids: list[str] = []

    def update_debris(self, debris_states: dict[str, np.ndarray]) -> None:
        """Ingest updated debris state vectors and rebuild KD-Tree."""
        self._debris_states = debris_states
        self._debris_ids    = list(debris_states.keys())

        if self._debris_ids:
            positions = np.array([debris_states[d][:3] for d in self._debris_ids])
            self._kdtree = KDTree(positions)

    def update_satellites(self, satellite_states: dict[str, np.ndarray]) -> None:
        self._satellite_states = satellite_states

    def assess_all(
        self,
        horizon_s: float = PROPAGATION_HORIZON_S,
        dt: float = DEFAULT_DT_S,
    ) -> list[ConjunctionEvent]:
        """
        Run full conjunction assessment for all satellites vs all debris.
        Returns list of ConjunctionEvents sorted by risk (critical first).
        """
        if self._kdtree is None or not self._satellite_states:
            return []

        events: list[ConjunctionEvent] = []

        for sat_id, sat_state in self._satellite_states.items():
            sat_pos = sat_state[:3]

            # --- Step 1: KD-Tree coarse filter ---
            candidate_indices = self._kdtree.query_ball_point(
                sat_pos, KDTREE_COARSE_RADIUS_KM
            )

            # --- Step 2: Precise TCA for each candidate ---
            for idx in candidate_indices:
                deb_id    = self._debris_ids[idx]
                deb_state = self._debris_states[deb_id]

                tca_s, miss_km, sat_pos_tca, deb_pos_tca = find_tca(
                    sat_state, deb_state, horizon_s, dt
                )

                risk = _classify_risk(miss_km)
                if risk in ("CRITICAL", "WARNING"):
                    events.append(ConjunctionEvent(
                        satellite_id=sat_id,
                        debris_id=deb_id,
                        tca_seconds_from_now=tca_s,
                        miss_distance_km=miss_km,
                        risk_level=risk,
                        sat_pos_at_tca=sat_pos_tca,
                        deb_pos_at_tca=deb_pos_tca,
                    ))

        # Sort: CRITICAL first, then by TCA time
        events.sort(key=lambda e: (0 if e.risk_level == "CRITICAL" else 1, e.tca_seconds_from_now))
        return events

    def quick_count(self) -> int:
        """Return number of currently tracked active warnings."""
        events = self.assess_all(horizon_s=86400.0, dt=30.0)
        return len([e for e in events if e.risk_level == "CRITICAL"])