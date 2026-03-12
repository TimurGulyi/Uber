'use client'
import { useEffect, useState } from 'react'
import { supabase, Trip, EarningsWeek } from '@/lib/supabase'

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

  // Hour-by-hour heatmap data from trips
  const hourData = Array(24).fill(0).map((_,h) => {
    const hourTrips = trips.filter(t => new Date(t.created_at).getHours() === h)
    return { hour: h, count: hourTrips.length, avg: hourTrips.length > 0 ? hourTrips.reduce((s,t)=>s+t.total,0)/hourTrips.length : 0 }
  })
  const maxCount = Math.max(...hourData.map(h=>h.count), 1)
  const bestHour = hourData.reduce((best,h) => h.avg > best.avg ? h : best, hourData[0])

  const totalEarnings = weeks.reduce((s,w)=>s+w.total,0)
  const totalDeliveries = weeks.reduce((s,w)=>s+w.deliveries,0)

  const fmt12 = (h: number) => `${h===0?12:h>12?h-12:h}${h<12?'AM':'PM'}`

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
          <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:2}}>Based on your real Jan 2026 data</div>
        </div>

        {/* Insight cards grid */}
        <div style={{padding:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[
            {emoji:'⏰',value:'6 PM',label:'Best Hour',desc:'$20.11 avg/trip — most profitable',color:'var(--green)',bg:'rgba(0,229,160,0.05)'},
            {emoji:'📅',value:'Dec 31',label:'Best Day',desc:'15 trips, $584 — NYE surge',color:'var(--yellow)',bg:'rgba(255,192,64,0.05)'},
            {emoji:'🌙',value:'2 AM',label:'Sleeper Hour',desc:'$21.68/trip — highest $ when you do it',color:'var(--blue)',bg:'rgba(64,176,255,0.05)'},
            {emoji:'💤',value:'3–12 PM',label:'Dead Zone',desc:'Zero orders — never work mornings',color:'var(--muted)',bg:'transparent'},
          ].map(card=>(
            <div key={card.label} style={{
              background:card.bg||'var(--surface)',border:'1px solid var(--border)',
              borderRadius:12,padding:'14px',textAlign:'center',
            }}>
              <div style={{fontSize:'1.5rem',marginBottom:4}}>{card.emoji}</div>
              <div style={{fontSize:'1.2rem',fontWeight:800,color:card.color,lineHeight:1,marginBottom:2}}>{card.value}</div>
              <div style={{fontSize:'0.65rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{card.label}</div>
              <div style={{fontSize:'0.62rem',color:'var(--muted)',lineHeight:1.4}}>{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Best zone */}
        <div style={{margin:'0 16px 12px',background:'rgba(0,229,160,0.05)',border:'1px solid rgba(0,229,160,0.15)',borderRadius:12,padding:'16px',textAlign:'center'}}>
          <div style={{fontSize:'1.5rem',marginBottom:4}}>📍</div>
          <div style={{fontSize:'1.3rem',fontWeight:800,color:'var(--green)',marginBottom:2}}>DTLA / NYE Zone</div>
          <div style={{fontSize:'0.65rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Best Zone</div>
          <div style={{fontSize:'0.7rem',color:'var(--muted)'}}>$22.80 avg · 22 + 15 trips — Downtown LA dominates</div>
        </div>

        {/* Hour heatmap */}
        <div style={{margin:'0 16px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:12,fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',color:'var(--muted)',textTransform:'uppercase'}}>Your Hour-by-Hour Heat</div>
          <div style={{display:'flex',gap:3,alignItems:'flex-end',height:60}}>
            {hourData.map(({hour,count})=>{
              const pct = Math.round((count/maxCount)*100)
              const isHot = count > maxCount*0.6
              const isWarm = count > maxCount*0.3
              const bg = isHot?'var(--green)':isWarm?'var(--yellow)':'var(--border)'
              return (
                <div key={hour} style={{
                  flex:1,borderRadius:'2px 2px 0 0',
                  height:`${Math.max(4,pct)}%`,background:bg,
                  opacity: count===0?0.2:1,
                  transition:'height 0.3s',
                }}/>
              )
            })}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            {[0,6,12,18,23].map(h=>(
              <span key={h} style={{fontFamily:'Space Mono,monospace',fontSize:'0.45rem',color:'var(--muted)'}}>{fmt12(h)}</span>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:'0.65rem',color:'var(--muted)'}}>
            Peak: <strong style={{color:'var(--green)'}}>{fmt12(bestHour.hour)}</strong> · {bestHour.count} trips · ${bestHour.avg.toFixed(2)} avg
          </div>
        </div>

        {/* Weekly earnings trend */}
        <div style={{margin:'0 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:12,fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',color:'var(--muted)',textTransform:'uppercase'}}>Weekly Trend</div>
          <div style={{display:'flex',gap:8,alignItems:'flex-end',height:70}}>
            {weeks.map((w,i)=>{
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
