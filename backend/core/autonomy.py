# backend/core/autonomy.py

import logging
from .maneuver_planner import plan_cola_maneuvers, plan_eol_graveyard
from .conjunction import ConjunctionEvent

logger = logging.getLogger("acm.autonomy")


def run_autonomy(sim) -> None:
    events = sim.conjunction_assessor.assess_all()
    sim.active_cdm_warnings = events

    for event in events:
        if event.risk_level not in ("CRITICAL", "WARNING"):
            continue

        if event.satellite_id not in sim.satellites:
            continue

        sat = sim.satellites[event.satellite_id]

        # Dedup: skip if already have an active evasion for this pair
        evasion_key = f"{event.satellite_id}_{event.debris_id}"
        if evasion_key in sim.active_evasions:
            continue

        sequence = plan_cola_maneuvers(
            sat_id=event.satellite_id,
            sat_state=sat.state,
            event=event,
            current_time=sim.current_time,
            last_burn_time=sat.last_burn_time,
            mass_fuel_kg=sat.mass_fuel_kg,
        )

        if not sequence:
            continue

        result = sim.schedule_maneuver(event.satellite_id, sequence)
        if result.get("status") in ("SCHEDULED", "OK", "SUCCESS"):
            sim.active_evasions.add(evasion_key)
            logger.info(f"[AUTONOMY] Evasion scheduled for {evasion_key}")
        else:
            logger.warning(f"[AUTONOMY] schedule_maneuver rejected: {result}")


def reset_autonomy():
    """No-op: evasion state lives on SimulationState, reset via /api/reset."""
    pass