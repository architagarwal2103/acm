// src/hooks/useACM.js
import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = '/api'

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, opts)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`API ${path} failed:`, e.message)
    return null
  }
}

export function useSnapshot(intervalMs = 2000) {
  const [snapshot, setSnapshot] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let active = true
    const poll = async () => {
      const data = await apiFetch('/visualization/snapshot')
      if (!active) return
      if (data) { setSnapshot(data); setConnected(true) }
      else setConnected(false)
    }
    poll()
    const id = setInterval(poll, intervalMs)
    return () => { active = false; clearInterval(id) }
  }, [intervalMs])

  return { snapshot, connected }
}

export function useFleet(intervalMs = 3000) {
  const [fleet, setFleet] = useState(null)

  useEffect(() => {
    let active = true
    const poll = async () => {
      const data = await apiFetch('/status/fleet')
      if (active && data) setFleet(data)
    }
    poll()
    const id = setInterval(poll, intervalMs)
    return () => { active = false; clearInterval(id) }
  }, [intervalMs])

  return fleet
}

export function useConjunctions(intervalMs = 3000) {
  const [conjunctions, setConjunctions] = useState(null)

  useEffect(() => {
    let active = true
    const poll = async () => {
      const data = await apiFetch('/conjunctions')
      if (active && data) setConjunctions(data)
    }
    poll()
    const id = setInterval(poll, intervalMs)
    return () => { active = false; clearInterval(id) }
  }, [intervalMs])

  return conjunctions
}

export function useSimControl() {
  const [stepping, setStepping] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const step = useCallback(async (seconds) => {
    setStepping(true)
    const data = await apiFetch('/simulate/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_seconds: seconds }),
    })
    if (data) setLastResult(data)
    setStepping(false)
    return data
  }, [])

  return { step, stepping, lastResult }
}
