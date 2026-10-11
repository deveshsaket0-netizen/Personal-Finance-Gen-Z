import { useState } from 'react'
import Home from './views/Home'
import Simulate from './views/Simulate'
import Spend from './views/Spend'
import Plan from './views/Plan'
import Goals from './views/Goals'
import Forecast from './views/Forecast'
import { ToastProvider } from './components/Toast'

const TABS = [
  { id: 'Home', label: 'Home', icon: '🧾' },
  { id: 'Simulate', label: 'Simulate', icon: '⚡' },
  { id: 'Spend', label: 'Spend', icon: '💸' },
  { id: 'Plan', label: 'Plan', icon: '📅' },
  { id: 'Goals', label: 'Goals', icon: '🎯' },
  { id: 'Forecast', label: 'Forecast', icon: '📈' }
] as const

const VIEW_MAP: Record<string, React.ComponentType> = {
  Home,
  Simulate,
  Spend,
  Plan,
  Goals,
  Forecast
}

export default function App() {
  const [tab, setTab] = useState<string>(() => {
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    return TABS.some(t => t.id === q) ? q! : 'Home'
  })

  const View = VIEW_MAP[tab] || Home

  const handleTab = (id: string) => {
    setTab(id)
    try {
      const u = new URL(window.location.href)
      u.searchParams.set('tab', id)
      window.history.replaceState({}, '', u)
    } catch {}
  }

  return (
    <ToastProvider>
      <div className="shell">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        {/* Navigation (Sticky Sidebar on Desktop, Fixed Bar on Mobile) */}
        <nav className="app-nav" aria-label="Main Navigation">
          <div className="nav-brand" style={{ display: 'none' }}>
            <div className="nav-brand-title">
              <span aria-hidden="true">🧾</span> RUNWAY
            </div>
            <div className="nav-brand-sub">Till #01 · Daily Runway</div>
          </div>

          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => handleTab(id)}
            >
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main id="main-content" tabIndex={-1}>
          <View />
        </main>
      </div>
    </ToastProvider>
  )
}
