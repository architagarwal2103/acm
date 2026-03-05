// src/components/Header.jsx
import { useState } from 'react'

export default function Header({ connected, simTime, onStep, stepping }) {
  const [stepSize, setStepSize] = useState(3600)

  const steps = [
    { label: '1 MIN',  val: 60 },
    { label: '10 MIN', val: 600 },
    { label: '1 HR',   val: 3600 },
    { label: '6 HR',   val: 21600 },
    { label: '24 HR',  val: 86400 },
  ]

  const fmtTime = (ts) => {
    if (!ts) return '----'
    try {
      return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    } catch { return ts }
  }

  return (
    <header style={{
      height: 48,
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 20,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14, fontWeight: 900,
          color: 'var(--accent-cyan)',
          letterSpacing: '0.15em',
          textShadow: 'var(--glow-cyan)',
        }}>
          ORBITAL INSIGHT
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9, color: 'var(--text-dim)',
          letterSpacing: '0.2em'
        }}>
          ACM v1.0
        </span>
      </div>

      {/* Connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'var(--accent-green)' : '#ff3355',
          boxShadow: connected ? 'var(--glow-green)' : 'var(--glow-red)',
          animation: connected ? 'pulse 2s infinite' : 'blink 0.5s infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>
          {connected ? 'CONNECTED' : 'NO SIGNAL'}
        </span>
      </div>

      {/* Sim time */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
        {fmtTime(simTime)}
      </div>

      <div style={{ flex: 1 }} />

      {/* Step controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          TICK:
        </span>
        {steps.map(s => (
          <button
            key={s.val}
            onClick={() => setStepSize(s.val)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              padding: '3px 8px',
              background: stepSize === s.val ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: `1px solid ${stepSize === s.val ? 'var(--accent-cyan)' : 'var(--border)'}`,
              color: stepSize === s.val ? 'var(--accent-cyan)' : 'var(--text-dim)',
              cursor: 'pointer', borderRadius: 2,
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => onStep(stepSize)}
          disabled={stepping}
          style={{
            fontFamily: 'var(--font-display)', fontSize: 10,
            padding: '4px 16px',
            background: stepping ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.15)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            cursor: stepping ? 'wait' : 'pointer',
            borderRadius: 2,
            letterSpacing: '0.1em',
            opacity: stepping ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          {stepping ? 'COMPUTING...' : '▶ STEP'}
        </button>
      </div>
    </header>
  )
}
