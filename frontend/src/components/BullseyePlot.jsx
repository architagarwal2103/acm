// src/components/BullseyePlot.jsx
import { useEffect, useRef } from 'react'

const SIZE = 260
const CX = SIZE / 2, CY = SIZE / 2
const MAX_R = CX - 20

export default function BullseyePlot({ conjunctions, selectedSat }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)

    // Background
    ctx.fillStyle = '#020810'
    ctx.fillRect(0, 0, SIZE, SIZE)

    const events = conjunctions?.events?.filter(e =>
      !selectedSat || e.satellite_id === selectedSat
    ) || []

    // Rings (distance markers)
    const rings = [
      { r: MAX_R * 0.25, label: '6h', color: 'rgba(0,212,255,0.12)' },
      { r: MAX_R * 0.5,  label: '12h', color: 'rgba(0,212,255,0.10)' },
      { r: MAX_R * 0.75, label: '18h', color: 'rgba(0,212,255,0.08)' },
      { r: MAX_R,        label: '24h', color: 'rgba(0,212,255,0.06)' },
    ]

    rings.forEach(({ r, label, color }) => {
      ctx.beginPath()
      ctx.arc(CX, CY, r, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = 'rgba(0,212,255,0.25)'
      ctx.font = '8px Share Tech Mono'
      ctx.fillText(label, CX + r + 2, CY - 3)
    })

    // Crosshairs
    ctx.strokeStyle = 'rgba(0,212,255,0.15)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(CX, CY - MAX_R - 10); ctx.lineTo(CX, CY + MAX_R + 10)
    ctx.moveTo(CX - MAX_R - 10, CY); ctx.lineTo(CX + MAX_R + 10, CY)
    ctx.stroke()

    // Center satellite
    ctx.beginPath()
    ctx.arc(CX, CY, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#00ff88'
    ctx.fill()
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0

    // Plot debris events
    const maxTCA = 86400
    events.forEach((e, i) => {
      const tcaFrac = Math.min(e.tca_seconds_from_now / maxTCA, 1)
      const r = tcaFrac * MAX_R

      // Angle based on index (spread them out)
      const angle = (i / Math.max(events.length, 1)) * Math.PI * 2 - Math.PI / 2

      const x = CX + r * Math.cos(angle)
      const y = CY + r * Math.sin(angle)

      const color = e.risk_level === 'CRITICAL' ? '#ff3355'
                  : e.risk_level === 'WARNING'  ? '#ffb300'
                  : '#00ff88'

      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = e.risk_level === 'CRITICAL' ? 10 : 4
      ctx.beginPath()
      ctx.arc(x, y, e.risk_level === 'CRITICAL' ? 4 : 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()

      // Label for critical
      if (e.risk_level === 'CRITICAL') {
        ctx.fillStyle = color
        ctx.font = '7px Share Tech Mono'
        ctx.fillText(e.debris_id?.replace('DEB-', '#'), x + 5, y - 3)
      }
    })

    // No data message
    if (events.length === 0) {
      ctx.fillStyle = 'rgba(0,212,255,0.2)'
      ctx.font = '10px Share Tech Mono'
      ctx.textAlign = 'center'
      ctx.fillText('NO ACTIVE CONJUNCTIONS', CX, CY + 30)
      ctx.textAlign = 'left'
    }
  }, [conjunctions, selectedSat])

  return (
    <canvas
      ref={canvasRef}
      width={SIZE} height={SIZE}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
