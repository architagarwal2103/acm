// src/App.jsx
import { useState, useCallback } from 'react'
import Header from './components/Header.jsx'
import GroundTrackMap from './components/GroundTrackMap.jsx'
import BullseyePlot from './components/BullseyePlot.jsx'
import FleetHealth from './components/FleetHealth.jsx'
import ConjunctionList from './components/ConjunctionList.jsx'
import SatDetail from './components/SatDetail.jsx'
import { useSnapshot, useFleet, useConjunctions, useSimControl } from './hooks/useACM.js'

export default function App() {
  const [selectedSat, setSelectedSat] = useState(null)
  const { snapshot, connected } = useSnapshot(2000)
  const fleet     = useFleet(3000)
  const conjunctions = useConjunctions(3000)
  const { step, stepping, lastResult } = useSimControl()

  const handleSelectSat = useCallback((id) => setSelectedSat(id), [])

  const selectedSatData = fleet?.fleet?.find(s => s.id === selectedSat)

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-void)',
      overflow: 'hidden',
    }}>
      <Header
        connected={connected}
        simTime={snapshot?.timestamp}
        onStep={step}
        stepping={stepping}
      />

      {/* Main grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 220px',
        gridTemplateRows: '1fr 200px',
        gap: 1,
        background: 'var(--border)',
        overflow: 'hidden',
        minHeight: 0,
      }}>

        {/* LEFT: Fleet Health */}
        <div className="panel" style={{ gridRow: '1 / 3', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">
            <span className="dot" />
            FLEET STATUS
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FleetHealth fleet={fleet} selectedSat={selectedSat} onSelectSat={handleSelectSat} />
          </div>
        </div>

        {/* CENTER TOP: Ground Track */}
        <div className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">
            <span className="dot" />
            GROUND TRACK — MERCATOR PROJECTION
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
              {snapshot?.satellites?.length || 0} SAT · {snapshot?.debris_cloud?.length || 0} DEBRIS
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <GroundTrackMap
              snapshot={snapshot}
              selectedSat={selectedSat}
              onSelectSat={handleSelectSat}
            />
          </div>
        </div>

        {/* RIGHT: Conjunction list */}
        <div className="panel" style={{ gridRow: '1 / 2', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">
            <span className="dot" style={{ background: conjunctions?.events?.some(e => e.risk_level === 'CRITICAL') ? 'var(--accent-red)' : 'var(--accent-cyan)' }} />
            CONJUNCTION ALERTS
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ConjunctionList conjunctions={conjunctions} onSelectSat={handleSelectSat} />
          </div>
        </div>

        {/* CENTER BOTTOM: Bullseye + Last tick result */}
        <div className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
          {/* Bullseye */}
          <div style={{ width: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-title" style={{ borderTop: 'none' }}>
              <span className="dot" />
              BULLSEYE — {selectedSat || 'SELECT SAT'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BullseyePlot conjunctions={conjunctions} selectedSat={selectedSat} />
            </div>
          </div>

          {/* Telemetry / last step result */}
          <div style={{ flex: 1, padding: '10px 14px', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 10 }}>
              LAST SIMULATION TICK
            </div>
            {lastResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['STATUS',      lastResult.status,                  '#00ff88'],
                  ['TIMESTAMP',   lastResult.new_timestamp?.slice(0,19), '#00d4ff'],
                  ['COLLISIONS',  lastResult.collisions_detected,     lastResult.collisions_detected > 0 ? '#ff3355' : '#00ff88'],
                  ['MANEUVERS',   lastResult.maneuvers_executed,      '#ffb300'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 0', borderBottom: '1px solid rgba(0,212,255,0.05)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color }}>{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textAlign: 'center', marginTop: 20 }}>
                Press ▶ STEP to advance simulation
              </div>
            )}

            {/* Collision total */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: 8 }}>
                MISSION STATS
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '1px solid rgba(0,212,255,0.05)'
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>TOTAL COLLISIONS</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: fleet?.total_collisions > 0 ? '#ff3355' : '#00ff88' }}>
                  {fleet?.total_collisions ?? '—'}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '1px solid rgba(0,212,255,0.05)'
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>DEBRIS TRACKED</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00d4ff' }}>
                  {snapshot?.debris_cloud?.length ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOTTOM: Sat detail */}
        <div className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">
            <span className="dot" />
            SAT TELEMETRY
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <SatDetail satellite={selectedSatData} snapshot={snapshot} />
          </div>
        </div>
      </div>
    </div>
  )
}
