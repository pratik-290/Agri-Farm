// "Fake ESP32": generates sensor data and applies the SAME irrigation rules as the firmware.
import { useState, useEffect, useRef, useMemo } from 'react'
import { CFG } from './config'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const now = () => new Date().toLocaleTimeString()

export const RULES = [
  ['dry',   'critical', 'Critically low soil moisture',               s => s.moisture < 15],
  ['solar', 'warning',  'Low solar voltage',                          s => s.solar < s.cfg.solarWarn],
  ['tank',  'critical', 'Water tank empty – pump locked out',         s => !s.tank],
  ['over',  'critical', 'Pump ran too long – maintenance check',      s => s.overrun],
  ['fault', 'critical', 'Invalid sensor reading – pump stopped',      s => !s.valid],
  ['rain',  'info',     'Rain detected – irrigation blocked',         s => s.rain && s.moisture < s.cfg.start],
]

const mk = () => ({
  t: 0, moisture: 55, temp: 29, hum: 60, solar: 16,
  rain: false, tank: true, pump: false, mode: 'auto', manual: false,
  runSec: 0, evStart: null, evFrom: 0,
  overrun: false, noRise: false, solarLow: false, faultTicks: 0, valid: true,
  cfg: { start: CFG.start, stop: CFG.stop, solarWarn: CFG.solarWarn, maxRun: CFG.maxRun },
  hist: [], alerts: [], events: [], active: {}, health: 'Healthy', updated: now(),
})

// Demo scenarios = the 6 Wokwi test cases (+ reset)
const SCN = {
  dry:   { moisture: 20, rain: false, tank: true, mode: 'auto' },
  wet:   { moisture: 70 },
  rain:  { moisture: 20, rain: true, tank: true, mode: 'auto' },
  tank:  { moisture: 20, rain: false, tank: false, mode: 'auto' },
  solar: { solarLow: true },
  fault: { faultTicks: 5 },
  over:  { moisture: 20, rain: false, tank: true, noRise: true, mode: 'auto' },
  reset: { moisture: 50, rain: false, tank: true, solarLow: false, noRise: false,
           overrun: false, faultTicks: 0, pump: false, manual: false, mode: 'auto' },
}

function step(s) {
  s.t++
  const dt = CFG.tick / 1000, n = () => Math.random() - 0.5

  // 1) sensors
  s.moisture = clamp(s.moisture + (s.pump && !s.noRise ? 1.2 : -0.25) + n() * 0.2, 0, 100)
  s.temp = clamp(29 + 4 * Math.sin(s.t / 30) + n() * 0.6, 0, 60)
  s.hum = clamp(60 - 8 * Math.sin(s.t / 30) + n(), 0, 100)
  s.solar = s.solarLow ? 5 + n() : clamp(16 + 3 * Math.sin(s.t / 25) + n() * 0.5, 0, 25)
  if (s.faultTicks > 0) { s.faultTicks--; s.temp = NaN }
  s.valid = [s.moisture, s.temp, s.hum, s.solar].every(Number.isFinite)

  // 2) irrigation logic (same as ESP32)
  let want = s.pump
  if (!s.valid || s.overrun || s.rain || !s.tank) want = false
  else if (s.mode === 'manual') want = s.manual
  else if (!s.pump && s.moisture < s.cfg.start) want = true
  else if (s.pump && s.moisture >= s.cfg.stop) want = false

  if (s.pump) {
    s.runSec += dt
    if (s.runSec > s.cfg.maxRun) { s.overrun = true; want = false }
  }
  if (want && !s.pump) { s.runSec = 0; s.evStart = now(); s.evFrom = s.moisture }
  if (!want && s.pump) {
    s.events = [{ start: s.evStart, dur: Math.round(s.runSec), from: s.evFrom, to: s.moisture }, ...s.events].slice(0, 20)
  }
  s.pump = want

  // 3) alerts (raised once when a rule becomes true)
  RULES.forEach(([k, level, msg, cond]) => {
    const c = cond(s)
    if (c && !s.active[k]) s.alerts = [{ id: `${s.t}-${k}`, time: now(), level, msg }, ...s.alerts].slice(0, 50)
    s.active[k] = c
  })
  const act = RULES.filter(r => s.active[r[0]])
  s.health = act.some(r => r[1] === 'critical') ? 'Fault' : act.some(r => r[1] === 'warning') ? 'Warning' : 'Healthy'

  // 4) history for charts
  s.updated = now()
  s.hist = [...s.hist, { t: s.updated, moisture: s.moisture, temp: s.temp, hum: s.hum, solar: s.solar }].slice(-CFG.hist)
}

const snap = s => ({ ...s, cfg: { ...s.cfg }, hist: [...s.hist], alerts: [...s.alerts], events: [...s.events], active: { ...s.active } })

export function useSim() {
  const ref = useRef(null)
  if (!ref.current) { ref.current = mk(); step(ref.current) }
  const [s, setS] = useState(() => snap(ref.current))

  useEffect(() => {
    const id = setInterval(() => { step(ref.current); setS(snap(ref.current)) }, CFG.tick)
    return () => clearInterval(id)
  }, [])

  const a = useMemo(() => {
    const apply = fn => { fn(ref.current); step(ref.current); setS(snap(ref.current)) }
    return {
      scenario: k => apply(r => Object.assign(r, SCN[k])),
      setMode: m => apply(r => { r.mode = m; r.manual = false }),
      togglePump: () => apply(r => { r.manual = !r.manual }),
    }
  }, [])

  return { s, a }
}
