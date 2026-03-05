// src/components/FleetHealth.jsx
import { useState } from 'react'

function FuelBar({ satId, fuelKg, fuelFraction, status, isSelected, onClick }) {
  const pct = Math.max(0, Math.min(100, fuelFraction * 100))
  const color = pct > 30 ? '#00ff88' : pct > 10 ? '#ffb300' : '#ff3355'
  const statusColor = {
    NOMINAL: '#00ff88', EVADING: '#ffb300', RECOVERING: '#ffb300',
    EOL: '#8855ff', COLLISION: '#ff3355'
  }[status] || '#6a9ab8'

  return (
    <div
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderLeft: `2px solid ${isSelected ? statusColor : 'transparent'}`,
        background: isSelected ? 'rgba(0,212,255,0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isSelected ? '#00d4ff' : '#6a9ab8' }}>
          {satId}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: statusColor }}>
          {status}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          flex: 1, height: 4,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2, overflow: 'hidden'
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, width: 32, textAlign: 'right' }}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export default function FleetHealth({ fleet, selectedSat, onSelectSat }) {
  const [sortBy, setSortBy] = useState('id')

  const sats = fleet?.fleet || []
  const sorted = [...sats].sort((a, b) => {
    if (sortBy === 'fuel') return a.fuel_fraction - b.fuel_fraction
    if (sortBy === 'status') return a.status.localeCompare(b.status)
    return a.id.localeCompare(b.id)
  })

  const nominal   = sats.filter(s => s.status === 'NOMINAL').length
  const degraded  = sats.filter(s => ['EVADING','RECOVERING'].includes(s.status)).length
  const critical  = sats.filter(s => ['EOL','COLLISION'].includes(s.status)).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Summary row */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 10px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#00ff88' }}>{nominal}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>NOMINAL</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#ffb300' }}>{degraded}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>DEGRADED</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#ff3355' }}>{critical}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>CRITICAL</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#00d4ff' }}>{sats.length}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>TOTAL</div>
        </div>
      </div>

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
        {['id','fuel','status'].map(s => (
          <button key={s} onClick={() => setSortBy(s)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px',
            background: sortBy === s ? 'rgba(0,212,255,0.15)' : 'transparent',
            border: `1px solid ${sortBy === s ? 'var(--accent-cyan)' : 'var(--border)'}`,
            color: sortBy === s ? 'var(--accent-cyan)' : 'var(--text-dim)',
            cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>
            {s}
          </button>
        ))}
      </div>

      {/* Satellite list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            NO FLEET DATA<br/>
            <span style={{ fontSize: 8, marginTop: 4, display: 'block' }}>POST /api/telemetry to initialize</span>
          </div>
        ) : sorted.map(sat => (
          <FuelBar
            key={sat.id}
            satId={sat.id}
            fuelKg={sat.fuel_kg}
            fuelFraction={sat.fuel_fraction}
            status={sat.status}
            isSelected={sat.id === selectedSat}
            onClick={() => onSelectSat?.(sat.id === selectedSat ? null : sat.id)}
          />
        ))}
      </div>
    </div>
  )
}
