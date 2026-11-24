import { useState } from 'react'
import { useSim } from './sim'
import { Overview, Irrigation, Analytics, Alerts, Scenarios } from './pages'

const TABS = { Overview, Irrigation, Analytics, 'Alerts & Maintenance': Alerts }

export default function App() {
  const { s, a } = useSim()
  const [tab, setTab] = useState('Overview')
  const Page = TABS[tab]
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <nav className="flex gap-1 overflow-x-auto bg-emerald-900 p-2 text-white md:min-h-screen md:w-60 md:flex-col md:p-5">
        <div className="hidden pb-6 text-lg font-semibold md:block">AgriSolar Control</div>
        {Object.keys(TABS).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${tab === t ? 'bg-white font-medium text-emerald-900' : 'hover:bg-emerald-800'}`}>
            {t}
          </button>
        ))}
        <div className="mt-auto hidden pt-6 text-xs text-emerald-200 md:block">
          Simulated sensor data.<br />Same rules as the ESP32 firmware.
        </div>
      </nav>
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <Scenarios a={a} />
        <Page s={s} a={a} />
      </main>
    </div>
  )
}
