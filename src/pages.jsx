import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { RULES } from './sim'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const TONE = {
  ok: 'bg-emerald-100 text-emerald-800', warn: 'bg-amber-100 text-amber-800',
  bad: 'bg-red-100 text-red-800', info: 'bg-sky-100 text-sky-800', off: 'bg-slate-200 text-slate-600',
}
const LEVEL = { critical: 'bad', warning: 'warn', info: 'info' }
const f = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '--')

const Badge = ({ tone = 'off', children }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`}>{children}</span>
)
const Card = ({ label, value, unit, badge, tone }) => (
  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-semibold">{value}<span className="text-base font-normal text-slate-500"> {unit}</span></p>
    {badge && <div className="mt-2"><Badge tone={tone}>{badge}</Badge></div>}
  </div>
)
const Title = ({ children, sub }) => (
  <div><h1 className="text-2xl font-semibold">{children}</h1>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>
)

const soilCond = (m, c) => (m < c.start ? ['Dry', 'bad'] : m > 60 ? ['Wet', 'info'] : ['Normal', 'ok'])

export function Scenarios({ a }) {
  const B = [['dry', 'Test 1 · Dry soil'], ['wet', 'Test 2 · Wet soil'], ['rain', 'Test 3 · Rain'], ['tank', 'Test 4 · Tank empty'],
    ['solar', 'Test 5 · Low solar'], ['fault', 'Test 6a · Sensor fault'], ['over', 'Test 6b · Pump overrun'], ['reset', 'Reset to normal']]
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <p className="mb-2 text-sm font-medium">Demo scenarios <span className="font-normal text-slate-500">(simulated – mirror the Wokwi test cases)</span></p>
      <div className="flex flex-wrap gap-2">
        {B.map(([k, l]) => (
          <button key={k} onClick={() => a.scenario(k)}
            className={`rounded-lg px-3 py-1.5 text-sm ${k === 'reset' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-100 hover:bg-slate-200'}`}>{l}</button>
        ))}
      </div>
    </div>
  )
}

export function Overview({ s }) {
  const [cond, ct] = soilCond(s.moisture, s.cfg)
  const act = RULES.filter(r => s.active[r[0]])
  const ht = { Healthy: 'ok', Warning: 'warn', Fault: 'bad' }[s.health]
  return (
    <>
      <Title sub={`Last sensor update: ${s.updated}`}>Overview</Title>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Soil moisture" value={f(s.moisture)} unit="%" badge={cond} tone={ct} />
        <Card label="Temperature" value={f(s.temp)} unit="°C" />
        <Card label="Humidity" value={f(s.hum)} unit="%" />
        <Card label="Solar voltage" value={f(s.solar)} unit="V" badge={s.solar < s.cfg.solarWarn ? 'Low' : 'OK'} tone={s.solar < s.cfg.solarWarn ? 'warn' : 'ok'} />
        <Card label="Pump" value={s.pump ? 'ON' : 'OFF'} badge={s.mode === 'auto' ? 'Automatic' : 'Manual (simulated)'} tone={s.pump ? 'ok' : 'off'} />
        <Card label="Rain" value={s.rain ? 'Detected' : 'None'} badge={s.rain ? 'Irrigation blocked' : 'Clear'} tone={s.rain ? 'info' : 'off'} />
        <Card label="Water tank" value={s.tank ? 'Available' : 'Empty'} badge={s.tank ? 'OK' : 'Refill needed'} tone={s.tank ? 'ok' : 'bad'} />
        <Card label="System health" value={s.health} badge={`${act.length} active alert${act.length === 1 ? '' : 's'}`} tone={ht} />
      </div>
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 font-medium">Active alerts</p>
        {act.length === 0 ? <p className="text-sm text-slate-500">No active alerts. All readings are within limits.</p> :
          <ul className="space-y-2">{act.map(([k, lv, msg]) => (
            <li key={k} className="flex items-center gap-2 text-sm"><Badge tone={LEVEL[lv]}>{lv}</Badge>{msg}</li>))}</ul>}
      </div>
    </>
  )
}

export function Irrigation({ s, a }) {
  const last = s.events[0]
  return (
    <>
      <Title sub="Control logic runs on simulated data – same rules as the ESP32 firmware.">Irrigation control</Title>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Pump" value={s.pump ? 'ON' : 'OFF'} badge={s.pump ? `Running ${Math.round(s.runSec)}s` : 'Idle'} tone={s.pump ? 'ok' : 'off'} />
        <Card label="Start watering below" value={s.cfg.start} unit="%" />
        <Card label="Stop watering at" value={s.cfg.stop} unit="%" />
        <Card label="Max pump runtime" value={s.cfg.maxRun} unit="s" />
      </div>
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-3 font-medium">Mode</p>
        <div className="flex flex-wrap items-center gap-2">
          {['auto', 'manual'].map(m => (
            <button key={m} onClick={() => a.setMode(m)}
              className={`rounded-lg px-4 py-2 text-sm ${s.mode === m ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
              {m === 'auto' ? 'Automatic' : 'Manual'}</button>))}
          <button disabled={s.mode !== 'manual'} onClick={a.togglePump}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-30">
            {s.manual ? 'Stop pump' : 'Start pump'}</button>
          <Badge tone="warn">SIMULATED – not connected to hardware</Badge>
        </div>
        <p className="mt-2 text-xs text-slate-500">Safety rules still apply in manual mode: rain, empty tank, faults and runtime limit stop the pump.</p>
      </div>
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 font-medium">Last irrigation event</p>
        <p className="text-sm text-slate-600">{last ? `Started ${last.start} · ${last.dur}s · moisture ${f(last.from, 0)}% → ${f(last.to, 0)}%` : 'No irrigation yet. Use a demo scenario to trigger one.'}</p>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-2 font-medium">Irrigation history</p>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-1">Started</th><th>Duration</th><th>Moisture before</th><th>Moisture after</th></tr></thead>
          <tbody>{s.events.map((e, i) => (
            <tr key={i} className="border-t border-slate-100"><td className="py-1.5">{e.start}</td><td>{e.dur}s</td><td>{f(e.from, 0)}%</td><td>{f(e.to, 0)}%</td></tr>))}</tbody>
        </table>
        {s.events.length === 0 && <p className="pt-2 text-sm text-slate-500">Empty.</p>}
      </div>
    </>
  )
}

const opts = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 6 } } } }
const ChartBox = ({ title, children }) => (
  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><p className="mb-2 font-medium">{title}</p><div className="h-56">{children}</div></div>
)
const line = (h, key, color) => ({
  labels: h.map(p => p.t),
  datasets: [{ data: h.map(p => p[key]), borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.3, pointRadius: 0 }],
})

export function Analytics({ s }) {
  const ev = [...s.events].reverse()
  return (
    <>
      <Title sub="Live from simulated readings (last 40 samples).">Analytics & reports</Title>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartBox title="Soil moisture (%)"><Line data={line(s.hist, 'moisture', '#059669')} options={{ ...opts, scales: { ...opts.scales, y: { min: 0, max: 100 } } }} /></ChartBox>
        <ChartBox title="Temperature (°C)"><Line data={line(s.hist, 'temp', '#ea580c')} options={opts} /></ChartBox>
        <ChartBox title="Humidity (%)"><Line data={line(s.hist, 'hum', '#0284c7')} options={opts} /></ChartBox>
        <ChartBox title="Irrigation events – pump run time (s)">
          <Bar data={{ labels: ev.map(e => e.start), datasets: [{ data: ev.map(e => e.dur), backgroundColor: '#059669' }] }} options={opts} />
        </ChartBox>
      </div>
    </>
  )
}

export function Alerts({ s }) {
  return (
    <>
      <Title sub="Rule-based fault detection – no trained AI model is used.">Alerts & predictive maintenance</Title>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 xl:col-span-1">
          <p className="mb-2 font-medium">Monitoring rules</p>
          <ul className="space-y-2 text-sm">{RULES.map(([k, lv, msg]) => (
            <li key={k} className="flex items-center justify-between gap-2"><span>{msg}</span>
              <Badge tone={s.active[k] ? LEVEL[lv] : 'ok'}>{s.active[k] ? 'Active' : 'OK'}</Badge></li>))}</ul>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 xl:col-span-2">
          <p className="mb-2 font-medium">Alert log</p>
          {s.alerts.length === 0 ? <p className="text-sm text-slate-500">No alerts yet. Trigger one from the demo scenarios.</p> :
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">{s.alerts.map(al => (
              <li key={al.id} className="flex items-center gap-3 py-2 text-sm">
                <Badge tone={LEVEL[al.level]}>{al.level}</Badge><span className="flex-1">{al.msg}</span><span className="text-slate-400">{al.time}</span></li>))}</ul>}
        </div>
      </div>
    </>
  )
}
