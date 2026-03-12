'use client'
import { useEffect, useState } from 'react'
import { supabase, Trip, EarningsWeek } from '@/lib/supabase'

const PERIODS = [
  { label: 'Morning',    emoji: '🌅', range: ' 5 AM – 11 AM', hours: [5,6,7,8,9,10]         },
  { label: 'Afternoon',  emoji: '☀️',  range: '11 AM – 4 PM',  hours: [11,12,13,14,15]       },
  { label: 'Evening',    emoji: '🌆', range: ' 4 PM – 9 PM',  hours: [16,17,18,19,20]       },
  { label: 'Late Night', emoji: '🌙', range: ' 9 PM – 5 AM',  hours: [21,22,23,0,1,2,3,4]  },
]

export default function InsightsTab() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [weeks, setWeeks] = useState<EarningsWeek[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: w }] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('earnings_weeks').select('*').order('week_start'),
      ])
      if (t) setTrips(t)
      if (w) setWeeks(w)
      setLoading(false)
    }
    load()
  }, [])

  const fmt12 = (h: number) => `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? 'AM' : 'PM'}`

  // Hour data
  const hourData = Array(24).fill(0).map((_, h) => {
    const ht = trips.filter(t => new Date(t.created_at).getHours() === h)
    return { hour: h, count: ht.length, avg: ht.length > 0 ? ht.reduce((s, t) => s + t.total, 0) / ht.length : 0, total: ht.reduce((s,t)=>s+t.total,0) }
  })

  // Period data
  const periodData = PERIODS.map(p => {
    const pt = trips.filter(t => p.hours.includes(new Date(t.created_at).getHours()))
    return { ...p, count: pt.length, avg: pt.length > 0 ? pt.reduce((s,t)=>s+t.total,0)/pt.length : 0, total: pt.reduce((s,t)=>s+t.total,0) }
  }).sort((a, b) => b.avg - a.avg)

  // Ranked hours (only with trips), best first
  const rankedHours = hourData.filter(h => h.count > 0).sort((a, b) => b.avg - a.avg)
  const bestAvg  = rankedHours[0]?.avg  ?? 1
  const worstAvg = rankedHours[rankedHours.length - 1]?.avg ?? 0

  const totalEarnings   = weeks.reduce((s, w) => s + w.total, 0)
  const totalDeliveries = weeks.reduce((s, w) => s + w.deliveries, 0)
  const maxCount        = Math.max(...hourData.map(h => h.count), 1)

  if (loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontFamily:'Space Mono,monospace',fontSize:'0.7rem'}}>
      Loading insights...
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',background:'var(--bg)',padding:'0 0 100px'}}>
      <div style={{maxWidth:600,margin:'0 auto'}}>

        {/* Header */}
        <div style={{padding:'20px 20px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:'1.4rem',fontWeight:800}}>Insights</div>
          <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:2}}>Based on your real trip data</div>
        </div>

        {/* Time-of-day periods — ranked best → worst */}
        <div style={{margin:'16px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:'0.7rem',fontWeight:700,fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',color:'var(--muted)',textTransform:'uppercase'}}>Best Time of Day to Work</div>
            <div style={{fontSize:'0.6rem',color:'var(--muted)',marginTop:2}}>ranked by avg $ per trip</div>
          </div>
          {periodData.map((p, i) => {
            const rankColor = i === 0 ? 'var(--green)' : i === 1 ? 'var(--yellow)' : i === 2 ? 'rgba(255,160,64,1)' : 'var(--red)'
            const rankLabel = i === 0 ? 'BEST' : i === 1 ? 'GOOD' : i === 2 ? 'SLOW' : 'WORST'
            const barPct = periodData[0].avg > 0 ? Math.round((p.avg / periodData[0].avg) * 100) : 0
            return (
              <div key={p.label} style={{padding:'12px 16px',borderBottom: i < periodData.length-1 ? '1px solid var(--border)' : 'none'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:'1.3rem'}}>{p.emoji}</span>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:'0.82rem',fontWeight:700}}>{p.label}</span>
                        <span style={{fontSize:'0.48rem',fontFamily:'Space Mono,monospace',background: i===0?'rgba(0,229,160,0.15)':i===1?'rgba(255,192,64,0.15)':i===2?'rgba(255,160,64,0.15)':'rgba(255,80,80,0.15)',color:rankColor,padding:'2px 6px',borderRadius:4,fontWeight:700,letterSpacing:'0.08em'}}>{rankLabel}</span>
                      </div>
                      <div style={{fontSize:'0.57rem',color:'var(--muted)',marginTop:1,fontFamily:'Space Mono,monospace'}}>{p.range}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'1rem',fontWeight:800,color:rankColor}}>{p.count > 0 ? `$${p.avg.toFixed(2)}` : '—'}</div>
                    <div style={{fontSize:'0.52rem',color:'var(--muted)',marginTop:1}}>{p.count} trips · ${p.total.toFixed(0)} total</div>
                  </div>
                </div>
                <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${barPct}%`,background:rankColor,borderRadius:2,transition:'width 0.4s'}}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* Full hourly ranking best → worst */}
        <div style={{margin:'12px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:'0.7rem',fontWeight:700,fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',color:'var(--muted)',textTransform:'uppercase'}}>Every Hour Ranked</div>
            <div style={{fontSize:'0.6rem',color:'var(--muted)',marginTop:2}}>best → worst · only hours you've worked</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'6px 16px',borderBottom:'1px solid var(--border)',background:'rgba(255,255,255,0.02)'}}>
            {['Hour','Trips','Avg/trip','Total'].map(h => (
              <div key={h} style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',textAlign:h==='Hour'?'left':'right'}}>{h}</div>
            ))}
          </div>
          {rankedHours.map((h, i) => {
            const pct = bestAvg > worstAvg ? (h.avg - worstAvg) / (bestAvg - worstAvg) : 1
            const color = pct > 0.66 ? 'var(--green)' : pct > 0.33 ? 'var(--yellow)' : 'var(--red)'
            const isTop3  = i < 3
            const isBot3  = i >= rankedHours.length - 3
            const tag = isTop3 ? { label: i===0?'#1 BEST':'TOP', bg:'rgba(0,229,160,0.12)', c:'var(--green)' }
                       : isBot3 ? { label: i===rankedHours.length-1?'WORST':'LOW', bg:'rgba(255,80,80,0.12)', c:'var(--red)' }
                       : null
            return (
              <div key={h.hour} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'9px 16px',borderBottom: i < rankedHours.length-1 ? '1px solid var(--border)' : 'none',alignItems:'center',background: isTop3 ? 'rgba(0,229,160,0.03)' : isBot3 ? 'rgba(255,80,80,0.03)' : 'transparent'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:'0.65rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',minWidth:14,textAlign:'right'}}>{i+1}</span>
                  <span style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text)'}}>{fmt12(h.hour)}</span>
                  {tag && <span style={{fontSize:'0.42rem',fontFamily:'Space Mono,monospace',background:tag.bg,color:tag.c,padding:'2px 5px',borderRadius:3,fontWeight:700,letterSpacing:'0.06em'}}>{tag.label}</span>}
                </div>
                <div style={{fontSize:'0.68rem',color:'var(--muted)',textAlign:'right'}}>{h.count}</div>
                <div style={{fontSize:'0.78rem',fontWeight:800,color,textAlign:'right'}}>${h.avg.toFixed(2)}</div>
                <div style={{fontSize:'0.65rem',color:'var(--muted)',textAlign:'right'}}>${h.total.toFixed(0)}</div>
              </div>
            )
          })}
        </div>

        {/* Hour heatmap */}
        <div style={{margin:'12px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:12,fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',color:'var(--muted)',textTransform:'uppercase'}}>Activity Heatmap</div>
          <div style={{display:'flex',gap:3,alignItems:'flex-end',height:60}}>
            {hourData.map(({hour,count}) => {
              const pct = Math.round((count/maxCount)*100)
              const bg = count > maxCount*0.6 ? 'var(--green)' : count > maxCount*0.3 ? 'var(--yellow)' : 'var(--border)'
              return <div key={hour} style={{flex:1,borderRadius:'2px 2px 0 0',height:`${Math.max(4,pct)}%`,background:bg,opacity:count===0?0.15:1,transition:'height 0.3s'}}/>
            })}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            {[0,6,12,18,23].map(h=>(
              <span key={h} style={{fontFamily:'Space Mono,monospace',fontSize:'0.45rem',color:'var(--muted)'}}>{fmt12(h)}</span>
            ))}
          </div>
        </div>

        {/* Weekly trend */}
        <div style={{margin:'12px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:12,fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',color:'var(--muted)',textTransform:'uppercase'}}>Weekly Trend</div>
          <div style={{display:'flex',gap:8,alignItems:'flex-end',height:70}}>
            {weeks.map((w,i) => {
              const max = Math.max(...weeks.map(x=>x.total))
              const pct = Math.round((w.total/max)*100)
              return (
                <div key={w.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <span style={{fontSize:'0.58rem',color:'var(--green)',fontWeight:700}}>${Math.round(w.total)}</span>
                  <div style={{width:'100%',background:'linear-gradient(180deg,var(--green),#00b87a)',borderRadius:'4px 4px 0 0',height:`${Math.max(10,pct)}%`,opacity:0.6+i*0.1}}/>
                  <span style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:'var(--muted)'}}>W{i+1}</span>
                </div>
              )
            })}
          </div>
          <div style={{marginTop:10,display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:10}}>
            <div style={{fontSize:'0.65rem',color:'var(--muted)'}}>Total <strong style={{color:'var(--green)'}}>${totalEarnings.toFixed(2)}</strong></div>
            <div style={{fontSize:'0.65rem',color:'var(--muted)'}}>Deliveries <strong style={{color:'var(--yellow)'}}>{totalDeliveries}</strong></div>
            <div style={{fontSize:'0.65rem',color:'var(--muted)'}}>Avg/trip <strong style={{color:'var(--blue)'}}>${totalDeliveries>0?(totalEarnings/totalDeliveries).toFixed(2):'—'}</strong></div>
          </div>
        </div>

      </div>
    </div>
  )
}
