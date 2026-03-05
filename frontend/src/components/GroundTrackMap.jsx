// src/components/GroundTrackMap.jsx
import { useEffect, useRef, useCallback } from 'react'

const W = 900, H = 450

function latLonToXY(lat, lon) {
  const x = ((lon + 180) / 360) * W
  const y = ((90 - lat) / 180) * H
  return [x, y]
}

function drawGrid(ctx) {
  ctx.strokeStyle = 'rgba(0,212,255,0.06)'
  ctx.lineWidth = 0.5
  // Longitude lines
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * W
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  // Latitude lines
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = ((90 - lat) / 180) * H
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Equator highlight
  ctx.strokeStyle = 'rgba(0,212,255,0.15)'
  ctx.lineWidth = 1
  const eq = H / 2
  ctx.beginPath(); ctx.moveTo(0, eq); ctx.lineTo(W, eq); ctx.stroke()
}

function drawTerminator(ctx, timestamp) {
  // Simplified terminator — vertical line based on time of day
  const date = timestamp ? new Date(timestamp) : new Date()
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60
  const sunLon = (hours / 24) * 360 - 180
  const terminatorX = ((sunLon + 180) / 360) * W

  // Night side gradient
  const nightX = (terminatorX + W / 2) % W
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,20,0.35)'
  if (nightX < W / 2) {
    ctx.fillRect(0, 0, nightX, H)
    ctx.fillRect(W - (W/2 - nightX), 0, W, H)
  } else {
    ctx.fillRect(nightX - W/2, 0, W/2, H)
  }
  // Terminator line
  ctx.strokeStyle = 'rgba(255,179,0,0.3)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(terminatorX, 0); ctx.lineTo(terminatorX, H)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawGroundStations(ctx) {
  const stations = [
    { name: 'ISTRAC', lat: 13.03, lon: 77.52 },
    { name: 'Svalbard', lat: 78.23, lon: 15.41 },
    { name: 'Goldstone', lat: 35.43, lon: -116.89 },
    { name: 'Punta Arenas', lat: -53.15, lon: -70.92 },
    { name: 'IIT Delhi', lat: 28.55, lon: 77.19 },
    { name: 'McMurdo', lat: -77.85, lon: 166.67 },
  ]
  stations.forEach(gs => {
    const [x, y] = latLonToXY(gs.lat, gs.lon)
    ctx.strokeStyle = 'rgba(255,179,0,0.8)'
    ctx.lineWidth = 1
    const s = 5
    ctx.beginPath()
    ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s)
    ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,179,0,0.6)'
    ctx.font = '8px Share Tech Mono'
    ctx.fillText(gs.name, x + 7, y + 3)
  })
}

export default function GroundTrackMap({ snapshot, selectedSat, onSelectSat }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#020810'
    ctx.fillRect(0, 0, W, H)

    // Continent outlines (simplified dots)
    ctx.fillStyle = 'rgba(0,212,255,0.06)'
    // Just a subtle grid pattern for now — replace with GeoJSON in production
    drawGrid(ctx)
    drawTerminator(ctx, snapshot?.timestamp)
    drawGroundStations(ctx)

    if (!snapshot) return

    // Draw debris cloud (tiny dots, batched)
    ctx.fillStyle = 'rgba(255,100,50,0.35)'
    snapshot.debris_cloud?.forEach(([id, lat, lon]) => {
      const [x, y] = latLonToXY(lat, lon)
      ctx.fillRect(x - 0.5, y - 0.5, 1.5, 1.5)
    })

    // Draw satellites
    snapshot.satellites?.forEach(sat => {
      const [x, y] = latLonToXY(sat.lat, sat.lon)
      const isSelected = sat.id === selectedSat
      const color = sat.status === 'NOMINAL' ? '#00ff88'
                  : sat.status === 'EVADING' || sat.status === 'RECOVERING' ? '#ffb300'
                  : sat.status === 'EOL' ? '#8855ff'
                  : '#ff3355'

      // Glow
      if (isSelected) {
        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = 16
      }

      // Satellite dot
      ctx.beginPath()
      ctx.arc(x, y, isSelected ? 5 : 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Ring for selected
      if (isSelected) {
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x, y, 9, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        // Label
        ctx.fillStyle = color
        ctx.font = '9px Share Tech Mono'
        ctx.fillText(sat.id, x + 12, y + 3)
      }
    })
  }, [snapshot, selectedSat])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = useCallback((e) => {
    if (!snapshot?.satellites) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    let closest = null, minDist = 12
    snapshot.satellites.forEach(sat => {
      const [x, y] = latLonToXY(sat.lat, sat.lon)
      const d = Math.hypot(x - mx, y - my)
      if (d < minDist) { minDist = d; closest = sat.id }
    })
    if (closest) onSelectSat?.(closest)
  }, [snapshot, onSelectSat])

  return (
    <canvas
      ref={canvasRef}
      width={W} height={H}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
    />
  )
}
