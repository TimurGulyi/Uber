'use client'
import { useEffect, useState } from 'react'
import { supabase, EarningsWeek, Goal } from '@/lib/supabase'

export default function EarningsTab() {
  const [weeks, setWeeks] = useState<EarningsWeek[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [period, setPeriod] = useState<'week'|'month'|'all'>('month')
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number|null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: g }] = await Promise.all([
        supabase.from('earnings_weeks').select('*').order('week_start', { ascending: true }),
        supabase.from('goals').select('*'),
      ])
      if (w) { setWeeks(w); setSelectedWeek(w.length - 1) }
      if (g) setGoals(g)
      setLoading(false)
    }
    load()
  }, [])

  const totalEarnings   = weeks.reduce((s, w) => s + w.total, 0)
  const totalTips       = weeks.reduce((s, w) => s + w.tips, 0)
  const totalBase       = weeks.reduce((s, w) => s + w.base_pay, 0)
  const totalProp22     = weeks.reduce((s, w) => s + (w.prop22 || 0), 0)
  const totalQuest      = weeks.reduce((s, w) => s + (w.quest_bonus || 0), 0)
  const totalFees       = weeks.reduce((s, w) => s + (w.instant_pay_fees || 0), 0)
  const avgPerWeek      = weeks.length > 0 ? totalEarnings / weeks.length : 0

  const weeklyGoal  = goals.find(g => g.type === 'weekly')?.target  || 500
  const monthlyGoal = goals.find(g => g.type === 'monthly')?.target || 2000

  const lastWeek     = weeks[weeks.length - 1]
  const weekEarnings = lastWeek?.total || 0
  const weekPct      = Math.min(100, Math.round((weekEarnings / weeklyGoal) * 100))
  const monthPct     = Math.min(100, Math.round((totalEarnings / monthlyGoal) * 100))

  const fmt  = (n: number) => `$${(n||0).toFixed(2)}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${(n||0).toFixed(0)}`

  const displayEarnings = period === 'week' ? weekEarnings : totalEarnings
  const maxBar = weeks.length > 0 ? Math.max(...weeks.map(x => x.total), 1) : 1
  const activeWeek = selectedWeek !== null ? weeks[selectedWeek] : null

  if (loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontFamily:'Space Mono,monospace',fontSize:'0.7rem'}}>
      Loading earnings...
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',background:'var(--bg)'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'0 0 100px'}}>

        {/* Header */}
        <div style={{padding:'20px 20px 14px',background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'1.4rem',fontWeight:800,letterSpacing:'-0.02em'}}>Earnings</div>
            <div style={{fontSize:'0.65rem',color:'var(--muted)',marginTop:2,fontFamily:'Space Mono,monospace'}}>Jan 2026 · Uber Eats</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            {(['week','month','all'] as const).map(p => (
              <button key={p} onClick={()=>setPeriod(p)} style={{
                padding:'5px 10px',borderRadius:20,border:'1px solid',fontSize:'0.58rem',
                fontFamily:'Space Mono,monospace',cursor:'pointer',
                background:period===p?'rgba(0,229,160,0.12)':'transparent',
                borderColor:period===p?'var(--green)':'var(--border)',
                color:period===p?'var(--green)':'var(--muted)',
              }}>{p==='all'?'All':p==='month'?'Month':'Week'}</button>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div style={{
          padding:'28px 20px 24px',
          background:'linear-gradient(180deg,rgba(0,229,160,0.07) 0%,transparent 100%)',
          borderBottom:'1px solid var(--border)',
          textAlign:'center',
        }}>
          <div style={{fontSize:'0.6rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>
            {period==='week'?`Week of ${lastWeek?.week_start||''}`:period==='month'?'January 2026':'All Time'}
          </div>
          <div style={{fontSize:'3.4rem',fontWeight:800,letterSpacing:'-0.04em',color:'var(--green)',lineHeight:1}}>
            {fmtK(displayEarnings)}
          </div>
          <div style={{fontSize:'0.68rem',color:'var(--muted)',marginTop:6}}>net after fees</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,marginTop:20,background:'var(--border)',borderRadius:12,overflow:'hidden'}}>
            {[
              {label:'Avg/Week', value:fmtK(avgPerWeek), color:'var(--text)'},
              {label:'Tips',     value:fmt(totalTips),    color:'var(--yellow)'},
              {label:'Prop 22',  value:fmt(totalProp22),  color:'var(--blue)'},
            ].map(s => (
              <div key={s.label} style={{background:'var(--surface)',padding:'12px 8px',textAlign:'center'}}>
                <div style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:'1rem',fontWeight:800,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div style={{padding:'16px 16px 0'}}>
          <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:10}}>Goals</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              {label:'Weekly',  current:weekEarnings,  target:weeklyGoal,  pct:weekPct,  color:'var(--yellow)'},
              {label:'Monthly', current:totalEarnings, target:monthlyGoal, pct:monthPct, color:'var(--green)'},
            ].map(g => (
              <div key={g.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px'}}>
                <div style={{fontSize:'0.55rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{g.label} Goal</div>
                <div style={{display:'flex',alignItems:'baseline',gap:3,marginBottom:10}}>
                  <span style={{fontSize:'1.25rem',fontWeight:800,color:g.color}}>{fmtK(g.current)}</span>
                  <span style={{fontSize:'0.6rem',color:'var(--muted)'}}>/ {fmtK(g.target)}</span>
                </div>
                <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden',marginBottom:6}}>
                  <div style={{height:'100%',width:`${g.pct}%`,background:g.color,borderRadius:3,boxShadow:`0 0 8px ${g.color}`}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.65rem',fontWeight:700,color:g.color}}>{g.pct}%</span>
                  {g.pct >= 100
                    ? <span style={{fontSize:'0.65rem'}}>✅</span>
                    : <span style={{fontSize:'0.55rem',color:'var(--muted)'}}>{fmtK(g.target - g.current)} to go</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly bar chart */}
        <div style={{margin:'16px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
          <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:14}}>Weekly Chart</div>
          <div style={{display:'flex',gap:6,alignItems:'flex-end',height:90}}>
            {weeks.map((w, i) => {
              const pct = Math.max(8, Math.round((w.total / maxBar) * 100))
              const isSelected = selectedWeek === i
              const weekLabel = new Date(w.week_start).toLocaleDateString('en-US',{month:'short',day:'numeric'})
              return (
                <div key={w.id} onClick={() => setSelectedWeek(isSelected ? null : i)}
                  style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer'}}>
                  <span style={{fontSize:'0.58rem',color:isSelected?'var(--green)':'var(--muted)',fontWeight:700}}>{fmtK(w.total)}</span>
                  <div style={{
                    width:'100%',
                    background:isSelected?'linear-gradient(180deg,#00e5a0,#00b87a)':'rgba(0,229,160,0.2)',
                    borderRadius:'4px 4px 0 0',height:`${pct}%`,
                    boxShadow:isSelected?'0 0 12px rgba(0,229,160,0.4)':'none',
                    transition:'all 0.2s',
                  }}/>
                  <span style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:isSelected?'var(--green)':'var(--muted)',textAlign:'center',lineHeight:1.2}}>{weekLabel}</span>
                </div>
              )
            })}
          </div>

          {activeWeek && (
            <div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {l:'Base Pay', v:fmt(activeWeek.base_pay),                   c:'var(--green)'},
                {l:'Tips',     v:fmt(activeWeek.tips),                        c:'var(--yellow)'},
                {l:'Prop 22',  v:fmt(activeWeek.prop22||0),                   c:'var(--blue)'},
                {l:'IP Fees',  v:`−${fmt(activeWeek.instant_pay_fees||0)}`,   c:'var(--red)'},
              ].map(r => (
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'8px 10px'}}>
                  <span style={{fontSize:'0.62rem',color:'var(--muted)'}}>{r.l}</span>
                  <span style={{fontSize:'0.72rem',fontWeight:700,color:r.c}}>{r.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full breakdown */}
        <div style={{margin:'16px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.12em'}}>Jan Breakdown</div>
          </div>
          {[
            {l:'Base Pay',          sub:'Per-mile + per-minute',     v:fmt(totalBase),        c:'var(--green)',  icon:'🚗'},
            {l:'Tips',              sub:'Customer tips',              v:fmt(totalTips),        c:'var(--yellow)', icon:'🤑'},
            {l:'Prop 22 Guarantee', sub:'CA gig worker protection',  v:fmt(totalProp22),      c:'var(--blue)',   icon:'⚖️'},
            {l:'Quest Bonuses',     sub:'Promotions & bonuses',      v:fmt(totalQuest),       c:'var(--blue)',   icon:'🎯'},
            {l:'Instant Pay Fees',  sub:'$1.25 per cash-out',        v:`−${fmt(totalFees)}`,  c:'var(--red)',    icon:'💸'},
          ].map((row, i, arr) => (
            <div key={row.l} style={{
              display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'13px 16px',
              borderBottom:i < arr.length-1?'1px solid var(--border)':'none',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:'1.1rem'}}>{row.icon}</span>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:600}}>{row.l}</div>
                  <div style={{fontSize:'0.6rem',color:'var(--muted)',marginTop:1}}>{row.sub}</div>
                </div>
              </div>
              <div style={{fontSize:'1rem',fontWeight:800,color:row.c}}>{row.v}</div>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',background:'rgba(0,229,160,0.05)',borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:'0.9rem',fontWeight:800}}>Total Earned</div>
            <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--green)'}}>{fmt(totalEarnings)}</div>
          </div>
        </div>

        {/* Tip rate card */}
        <div style={{margin:'16px 16px 0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px'}}>
          <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12}}>Tip Stats</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            {[
              {l:'Tip Rate',  v:totalBase > 0 ? `${Math.round((totalTips/totalBase)*100)}%` : '—',           c:'var(--yellow)'},
              {l:'Total Tips',v:fmt(totalTips),                                                                 c:'var(--yellow)'},
              {l:'Of Gross',  v:totalEarnings > 0 ? `${Math.round((totalTips/totalEarnings)*100)}%` : '—',    c:'var(--muted)'},
            ].map(s => (
              <div key={s.l} style={{textAlign:'center',background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'10px 6px'}}>
                <div style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:'1.1rem',fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
