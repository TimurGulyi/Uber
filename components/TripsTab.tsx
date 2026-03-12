'use client'
import { useEffect, useState } from 'react'
import { supabase, Trip } from '@/lib/supabase'

const ICONS: Record<string,string> = {
  'Uber Eats':'🟢', 'DoorDash':'🔴', 'Grubhub':'🟠',
}

const ZONE_COLORS: Record<string,string> = {
  'Hollywood':'#ff4060', 'DTLA':'#00e5a0', 'West Hollywood':'#ffc040',
  'Silver Lake':'#40b0ff', 'Culver City':'#a78bfa', 'default':'#44465a',
}

export default function TripsTab() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState<'all'|'best'|'tips'|'late'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setTrips(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = trips.filter(t => {
    if (filter === 'best') return t.total >= 20
    if (filter === 'tips') return t.tip >= 5
    if (filter === 'late') {
      const hour = new Date(t.created_at).getHours()
      return hour >= 22 || hour <= 3
    }
    return true
  })

  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>

      {/* Header */}
      <div style={{padding:'20px 20px 12px',borderBottom:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>
        <div style={{fontSize:'1.4rem',fontWeight:800}}>Trips</div>
        <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:2}}>{trips.length} total deliveries logged</div>
        <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap'}}>
          {([['all','All'],['best','💰 Best'],['tips','🤑 Tips'],['late','🌙 Late']] as const).map(([f,l])=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'5px 12px',borderRadius:20,border:'1px solid',fontSize:'0.6rem',
              fontFamily:'Space Mono,monospace',cursor:'pointer',
              background:filter===f?'rgba(0,229,160,0.12)':'transparent',
              borderColor:filter===f?'var(--green)':'var(--border)',
              color:filter===f?'var(--green)':'var(--muted)',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 16px 100px'}}>
        {loading && (
          <div style={{textAlign:'center',color:'var(--muted)',fontFamily:'Space Mono,monospace',fontSize:'0.7rem',padding:'40px 0'}}>
            Loading trips...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{textAlign:'center',color:'var(--muted)',fontFamily:'Space Mono,monospace',fontSize:'0.7rem',padding:'40px 0'}}>
            No trips yet — tap ＋ to log one
          </div>
        )}
        {filtered.map(trip => {
          const zoneColor = ZONE_COLORS[trip.zone||''] || ZONE_COLORS.default
          const date = new Date(trip.created_at)
          const dateStr = date.toLocaleDateString('en-US',{month:'short',day:'numeric'})
          const timeStr = date.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
          return (
            <div key={trip.id} style={{
              background:'var(--surface)',border:'1px solid var(--border)',
              borderRadius:12,padding:'14px',marginBottom:10,
              borderLeft:`3px solid ${zoneColor}`,
              display:'flex',justifyContent:'space-between',alignItems:'center',
            }}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:'1rem'}}>{ICONS[trip.platform]||'🟢'}</span>
                  <span style={{fontWeight:700,fontSize:'0.9rem'}}>{trip.restaurant_name}</span>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <span style={{fontSize:'0.65rem',color:'var(--muted)'}}>{dateStr} · {timeStr}</span>
                  {trip.zone && <span style={{fontSize:'0.65rem',color:zoneColor}}>📍 {trip.zone}</span>}
                </div>
                {trip.tip > 0 && (
                  <div style={{marginTop:4,fontSize:'0.62rem',color:'var(--yellow)'}}>🤑 ${trip.tip.toFixed(2)} tip</div>
                )}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'1.2rem',fontWeight:800,color:'var(--green)'}}>{fmt(trip.total)}</div>
                <div style={{fontSize:'0.6rem',color:'var(--muted)'}}>base {fmt(trip.earnings)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
