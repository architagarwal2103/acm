// src/components/SatDetail.jsx

export default function SatDetail({ satellite, snapshot }) {
  if (!satellite) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8,
        color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10,
      }}>
        <div style={{ fontSize: 24, opacity: 0.3 }}>⊕</div>
        CLICK A SATELLITE
        <div style={{ fontSize: 8 }}>on the ground track map</div>
      </div>
    )
  }

  const snapSat = snapshot?.satellites?.find(s => s.id === satellite.id)
  const fuelPct = (satellite.fuel_fraction * 100).toFixed(1)
  const dvUsed  = (satellite.total_dv_m_s || 0).toFixed(2)

  const statusColor = {
    NOMINAL: '#00ff88', EVADING: '#ffb300', RECOVERING: '#ffb300',
    EOL: '#8855ff', COLLISION: '#ff3355'
  }[satellite.status] || '#6a9ab8'

  const Row = ({ label, value, color }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '4px 0', borderBottom: '1px solid rgba(0,212,255,0.05)'
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: color || 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )

  return (
    <div style={{ padding: '10px 14px', height: '100%', overflowY: 'auto' }}>
      {/* ID + Status */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#00d4ff', letterSpacing: '0.1em' }}>
          {satellite.id}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: statusColor, marginTop: 4 }}>
          ● {satellite.status}
        </div>
      </div>

      {/* Position */}
      {snapSat && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginBottom: 6, letterSpacing: '0.15em' }}>
            POSITION
          </div>
          <Row label="LAT"  value={`${snapSat.lat?.toFixed(3)}°`} />
          <Row label="LON"  value={`${snapSat.lon?.toFixed(3)}°`} />
          <Row label="ALT"  value={`${snapSat.alt_km?.toFixed(1)} km`} />
          <Row label="SLOT" value={snapSat.in_slot ? '✓ IN BOX' : '✗ OUT OF BOX'}
               color={snapSat.in_slot ? '#00ff88' : '#ffb300'} />
        </div>
      )}

      {/* Fuel */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginBottom: 6, letterSpacing: '0.15em' }}>
          PROPELLANT
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{
            width: '100%', height: 6,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 3, overflow: 'hidden', marginBottom: 4
          }}>
            <div style={{
              width: `${fuelPct}%`, height: '100%',
              background: fuelPct > 30 ? '#00ff88' : fuelPct > 10 ? '#ffb300' : '#ff3355',
              boxShadow: `0 0 8px ${fuelPct > 30 ? '#00ff88' : '#ff3355'}`,
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
        <Row label="FUEL REMAINING" value={`${satellite.fuel_kg?.toFixed(2)} kg (${fuelPct}%)`} />
        <Row label="ΔV USED"        value={`${dvUsed} m/s`} color='#ffb300' />
        <Row label="OUTAGE"         value={`${satellite.outage_seconds?.toFixed(0)}s`} />
        <Row label="EOL STATUS"     value={satellite.is_eol ? 'CRITICAL' : 'NOMINAL'}
             color={satellite.is_eol ? '#ff3355' : '#00ff88'} />
      </div>

      {/* Burns */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginBottom: 6, letterSpacing: '0.15em' }}>
          MANEUVER QUEUE
        </div>
        <Row label="QUEUED BURNS" value={satellite.queued_burns || 0} />
      </div>
    </div>
  )
}
