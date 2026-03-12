'use client'
import { Tab } from '@/app/page'

const TABS = [
  { id: 'map',      icon: '🗺️',  label: 'Map' },
  { id: 'earnings', icon: '💰',  label: 'Earnings' },
  { id: 'trips',    icon: '📦',  label: 'Trips' },
  { id: 'insights', icon: '📊',  label: 'Insights' },
] as const

export default function BottomNav({
  activeTab, onTabChange,
}: {
  activeTab: Tab
  onTabChange: (t: Tab) => void
}) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      height: 64, flexShrink: 0, position: 'relative',
      paddingBottom: 'env(safe-area-inset-bottom)',
      backdropFilter: 'blur(12px)',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <div key={tab.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => onTabChange(tab.id as Tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 0', width: '100%',
                color: isActive ? 'var(--green)' : 'var(--muted)',
              }}
            >
              <span style={{
                fontSize: '1.3rem', lineHeight: 1,
                transform: isActive ? 'scale(1.18)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                display: 'block',
              }}>{tab.icon}</span>
              <span style={{
                fontSize: '0.6rem', fontFamily: 'Space Mono, monospace',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                fontWeight: isActive ? 700 : 400,
                transition: 'color 0.15s ease',
              }}>{tab.label}</span>
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                background: isActive ? 'var(--green)' : 'transparent',
                transition: 'background 0.2s ease',
                marginTop: 1,
              }} />
            </button>
          </div>
        )
      })}
    </nav>
  )
}
