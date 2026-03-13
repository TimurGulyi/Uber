'use client'
import { useState } from 'react'
import MapTab from '@/components/MapTab'
import EarningsTab from '@/components/EarningsTab'
import TripsTab from '@/components/TripsTab'
import InsightsTab from '@/components/InsightsTab'
import BottomNav from '@/components/BottomNav'
import LogTripModal from '@/components/LogTripModal'

export type Tab = 'map' | 'earnings' | 'trips' | 'insights'
type Panel = Exclude<Tab, 'map'> | null

export default function Home() {
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [refreshKey, setRefreshKey]   = useState(0)

  const onTripSaved = () => {
    setRefreshKey(k => k + 1)
    setModalOpen(false)
  }

  const closePanel = () => setActivePanel(null)

  const activeTab: Tab = activePanel ?? 'map'

  const onTabChange = (tab: Tab) => {
    if (tab === 'map') closePanel()
    else setActivePanel(tab as Panel)
  }

  return (
    <div className="anim-fade" style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Map always behind everything — burger lives INSIDE MapTab now ── */}
      <div style={{ position: 'absolute', inset: 0, bottom: 64 }}>
        <MapTab />
      </div>

      {/* ── Floating top bar (logo + trip button) — only on map tab ── */}
      {activePanel === null && (
        <div className="anim-slide-down" style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          paddingTop: 'calc(10px + env(safe-area-inset-top))',
          background: 'linear-gradient(180deg,rgba(7,8,15,0.9) 0%,rgba(7,8,15,0) 100%)',
          pointerEvents: 'none',
        }}>
          {/* Spacer matching burger width */}
          <div style={{ width: 40 }} />

          {/* Logo */}
          <div style={{
            fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em',
            background: 'rgba(15,16,24,0.85)',
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            GigStack
          </div>

          {/* + Trip button */}
          <button
            onClick={() => setModalOpen(true)}
            style={{
              pointerEvents: 'auto',
              background: 'linear-gradient(135deg,#00e5a0,#00b87a)',
              border: 'none', borderRadius: 10, padding: '9px 14px',
              cursor: 'pointer', color: '#07080f',
              fontWeight: 800, fontSize: '0.8rem',
              fontFamily: 'Space Mono,monospace',
              boxShadow: '0 2px 12px rgba(0,229,160,0.35)',
            }}
          >
            + Trip
          </button>
        </div>
      )}

      {/* ── Slide-in content panels (over map, under bottom nav) ── */}
      {(['earnings', 'trips', 'insights'] as const).map(panel => (
        <div
          key={panel}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 64,
            zIndex: 100,
            background: 'var(--bg)',
            transform: activePanel === panel ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Panel top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <button
              onClick={closePanel}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 12px',
                cursor: 'pointer', color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Map</span>
            </button>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              {panel === 'earnings' ? '💰 Earnings' : panel === 'trips' ? '📦 Trips' : '📊 Insights'}
            </div>
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {panel === 'earnings' && <EarningsTab key={refreshKey} />}
            {panel === 'trips'    && <TripsTab key={refreshKey} />}
            {panel === 'insights' && <InsightsTab key={refreshKey} />}
          </div>
        </div>
      ))}

      {/* ── Bottom nav ── */}
      <div className="anim-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 110 }}>
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* ── Log trip modal ── */}
      {modalOpen && (
        <LogTripModal onClose={() => setModalOpen(false)} onSaved={onTripSaved} />
      )}
    </div>
  )
}
