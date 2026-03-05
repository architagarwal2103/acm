// src/components/ConjunctionList.jsx

function formatTCA(seconds) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export default function ConjunctionList({ conjunctions, onSelectSat }) {
  const events = conjunctions?.events || []
  const critical = events.filter(e => e.risk_level === 'CRITICAL')
  const warnings = events.filter(e => e.risk_level === 'WARNING')

  const RiskRow = ({ e }) => {
    const isCrit = e.risk_level === 'CRITICAL'
    const color = isCrit ? '#ff3355' : '#ffb300'
    return (
      <div
        onClick={() => onSelectSat?.(e.satellite_id)}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 60px 50px',
          gap: 6,
          padding: '5px 10px',
          borderLeft: `2px solid ${color}`,
          marginBottom: 2,
          background: isCrit ? 'rgba(255,51,85,0.05)' : 'rgba(255,179,0,0.04)',
          cursor: 'pointer',
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#00d4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.satellite_id}
        </span>
        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {e.debris_id}
        </span>
        <span style={{ color: '#ffb300' }}>
          TCA {formatTCA(e.tca_seconds_from_now)}
        </span>
        <span style={{ color, textAlign: 'right' }}>
          {(e.miss_distance_km * 1000).toFixed(0)}m
        </span>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ flex: 1, padding: '8px 10px', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#ff3355',
            textShadow: '0 0 20px rgba(255,51,85,0.5)' }}>
            {critical.length}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>
            CRITICAL (&lt;100m)
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#ffb300' }}>
            {warnings.length}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>
            WARNINGS (&lt;5km)
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#00d4ff' }}>
            {conjunctions?.total || 0}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>
            TOTAL CDMs
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 60px 50px',
        gap: 6, padding: '4px 10px',
        borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 8,
        color: 'var(--text-dim)', letterSpacing: '0.1em'
      }}>
        <span>SAT ID</span><span>DEBRIS</span><span>TCA</span><span style={{ textAlign: 'right' }}>DIST</span>
      </div>

      {/* Events */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {events.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            <div style={{ color: '#00ff88', fontSize: 14, marginBottom: 6 }}>✓</div>
            ALL CLEAR
            <div style={{ fontSize: 8, marginTop: 4 }}>No active conjunction warnings</div>
          </div>
        ) : (
          <>
            {critical.map((e, i) => <RiskRow key={i} e={e} />)}
            {warnings.map((e, i) => <RiskRow key={i} e={e} />)}
          </>
        )}
      </div>
    </div>
  )
}
