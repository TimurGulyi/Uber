'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase, EarningsWeek, Goal, Trip } from '@/lib/supabase'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const

type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'
const PERIOD_LABELS: Record<GoalPeriod, string> = { daily:'Day', weekly:'Week', monthly:'Month', yearly:'Year' }

export default function EarningsTab() {
  const [weeks, setWeeks] = useState<EarningsWeek[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [period, setPeriod] = useState<'week'|'month'|'all'>('month')
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number|null>(null)
  const [selectedDay, setSelectedDay] = useState<number|null>(null)
  const [goalModal, setGoalModal] = useState<{ slot: 'weekly'|'monthly' } | null>(null)
  const [goalAmount, setGoalAmount] = useState('')
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('monthly')
  const [goalSaving, setGoalSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: g }, { data: t }] = await Promise.all([
        supabase.from('earnings_weeks').select('*').order('week_start', { ascending: true }),
        supabase.from('goals').select('*'),
        supabase.from('trips').select('*'),
      ])
      if (w) { setWeeks(w); setSelectedWeek(w.length - 1) }
      if (g) setGoals(g)
      if (t) setTrips(t)
      setLoading(false)
    }
    load()
  }, [])

  const openGoalModal = (slot: 'weekly'|'monthly') => {
    const existing = goals.find(g => g.type === slot)
    setGoalAmount(existing ? String(existing.target) : '')
    setGoalPeriod((existing?.type as GoalPeriod) || slot)
    setGoalModal({ slot })
  }

  const saveGoal = async () => {
    const amount = parseFloat(goalAmount)
    if (!amount || amount <= 0) return
    setGoalSaving(true)
    const existing = goals.find(g => g.type === goalPeriod)
    if (existing) {
      await supabase.from('goals').update({ target: amount }).eq('id', existing.id)
    } else {
      await supabase.from('goals').insert({ type: goalPeriod, target: amount })
    }
    const { data } = await supabase.from('goals').select('*')
    if (data) setGoals(data)
    setGoalSaving(false)
    setGoalModal(null)
  }

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

  // Daily breakdown for selected week
  const dayEarnings: number[] = DAYS.map((_, di) => {
    if (!activeWeek) return 0
    const weekStart = new Date(activeWeek.week_start)
    // week_start is Monday; di 0=Mon … 6=Sun
    const target = new Date(weekStart)
    target.setDate(weekStart.getDate() + di)
    const dateStr = target.toISOString().slice(0, 10)
    return trips
      .filter(t => t.date === dateStr)
      .reduce((s, t) => s + (t.total ?? 0), 0)
  })

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
              {label:'Weekly',  slot:'weekly'  as const, current:weekEarnings,  target:weeklyGoal,  pct:weekPct,  color:'var(--yellow)'},
              {label:'Monthly', slot:'monthly' as const, current:totalEarnings, target:monthlyGoal, pct:monthPct, color:'var(--green)'},
            ].map(g => (
              <div key={g.label} onClick={() => openGoalModal(g.slot)} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px',cursor:'pointer',position:'relative'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div style={{fontSize:'0.55rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{g.label} Goal</div>
                  <span style={{fontSize:'0.65rem',color:'var(--muted)'}}>✏️</span>
                </div>
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
          {/* Week navigator */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <button
              onClick={() => { if (selectedWeek !== null && selectedWeek > 0) { setSelectedWeek(selectedWeek - 1); setSelectedDay(null) } }}
              disabled={selectedWeek === null || selectedWeek === 0}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 10px',cursor:selectedWeek===0?'default':'pointer',color:selectedWeek===0?'var(--muted)':'var(--text)',fontSize:'0.75rem',opacity:selectedWeek===0?0.3:1}}
            >←</button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.12em'}}>
                {selectedWeek !== null && weeks.length > 0 ? (
                  selectedWeek === weeks.length - 1 ? 'This Week' :
                  selectedWeek === weeks.length - 2 ? 'Last Week' :
                  `${weeks.length - 1 - selectedWeek} Weeks Ago`
                ) : 'Weekly Chart'}
              </div>
              {activeWeek && (
                <div style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text)',marginTop:2}}>
                  {new Date(activeWeek.week_start).toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {new Date(activeWeek.week_end).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </div>
              )}
            </div>
            <button
              onClick={() => { if (selectedWeek !== null && selectedWeek < weeks.length - 1) { setSelectedWeek(selectedWeek + 1); setSelectedDay(null) } }}
              disabled={selectedWeek === null || selectedWeek === weeks.length - 1}
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 10px',cursor:selectedWeek===weeks.length-1?'default':'pointer',color:selectedWeek===weeks.length-1?'var(--muted)':'var(--text)',fontSize:'0.75rem',opacity:selectedWeek===weeks.length-1?0.3:1}}
            >→</button>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'flex-end',height:90}}>
            {weeks.map((w, i) => {
              const pct = Math.max(8, Math.round((w.total / maxBar) * 100))
              const isSelected = selectedWeek === i
              const weekLabel = new Date(w.week_start).toLocaleDateString('en-US',{month:'short',day:'numeric'})
              return (
                <div key={w.id} onClick={() => { setSelectedWeek(isSelected ? null : i); setSelectedDay(null) }}
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

          {/* Daily breakdown */}
          {activeWeek && (
            <div style={{marginTop:14,borderTop:'1px solid var(--border)',paddingTop:12}}>
              <div style={{fontSize:'0.55rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Daily Breakdown</div>
              <div style={{display:'flex',gap:5}}>
                {DAYS.map((day, di) => {
                  const earned = dayEarnings[di]
                  const isActive = selectedDay === di
                  const hasData = earned > 0
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isActive ? null : di)}
                      style={{
                        flex:1, padding:'8px 2px', borderRadius:8, border:'1px solid',
                        cursor:'pointer', textAlign:'center',
                        background: isActive ? 'rgba(0,229,160,0.12)' : 'rgba(255,255,255,0.03)',
                        borderColor: isActive ? 'var(--green)' : hasData ? 'rgba(0,229,160,0.25)' : 'var(--border)',
                      }}
                    >
                      <div style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:isActive?'var(--green)':hasData?'var(--text)':'var(--muted)',fontWeight:700}}>{day}</div>
                      <div style={{fontSize:'0.58rem',fontWeight:800,color:isActive?'var(--green)':hasData?'var(--text)':'var(--muted)',marginTop:3}}>{hasData ? `$${earned.toFixed(0)}` : '—'}</div>
                    </button>
                  )
                })}
              </div>

              {selectedDay !== null && (() => {
                const d = new Date(activeWeek.week_start)
                d.setDate(d.getDate() + selectedDay)
                const dateStr = d.toISOString().slice(0, 10)
                const dayTrips = trips.filter(t => t.date === dateStr)
                const dayBase  = dayTrips.reduce((s, t) => s + (t.earnings ?? 0), 0)
                const dayTips  = dayTrips.reduce((s, t) => s + (t.tip ?? 0), 0)
                const dayTotal = dayTrips.reduce((s, t) => s + (t.total ?? 0), 0)
                const dateLabel = d.toLocaleDateString('en-US', {month:'short', day:'numeric'})
                return (
                  <div style={{marginTop:10,background:'rgba(0,229,160,0.05)',border:'1px solid rgba(0,229,160,0.2)',borderRadius:10,padding:'12px 14px'}}>
                    {/* Header */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                      <div>
                        <div style={{fontSize:'0.6rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',marginBottom:3}}>{DAYS[selectedDay]} · {dateLabel}</div>
                        <div style={{fontSize:'1.8rem',fontWeight:800,color:'var(--green)',letterSpacing:'-0.03em',lineHeight:1}}>{fmt(dayTotal)}</div>
                        <div style={{fontSize:'0.55rem',color:'var(--muted)',marginTop:2}}>total earned</div>
                      </div>
                      <div style={{background:'rgba(255,255,255,0.06)',borderRadius:8,padding:'8px 12px',textAlign:'center'}}>
                        <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--text)',lineHeight:1}}>{dayTrips.length}</div>
                        <div style={{fontSize:'0.5rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',marginTop:2}}>trips</div>
                      </div>
                    </div>

                    {/* Stat row */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom: dayTrips.length > 0 ? 12 : 0}}>
                      {[
                        {l:'Base Pay', v:fmt(dayBase),  c:'var(--green)'},
                        {l:'Tips',     v:fmt(dayTips),  c:'var(--yellow)'},
                      ].map(r => (
                        <div key={r.l} style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:'0.6rem',color:'var(--muted)'}}>{r.l}</span>
                          <span style={{fontSize:'0.8rem',fontWeight:700,color:r.c}}>{r.v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Trip list */}
                    {dayTrips.length > 0 ? (
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        {dayTrips.map(t => (
                          <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'7px 10px'}}>
                            <div>
                              <div style={{fontSize:'0.7rem',fontWeight:600}}>{t.restaurant_name || 'Trip'}</div>
                              {t.zone && <div style={{fontSize:'0.55rem',color:'var(--muted)',marginTop:1}}>{t.zone}</div>}
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:'0.78rem',fontWeight:800,color:'var(--green)'}}>{fmt(t.total)}</div>
                              {t.tip > 0 && <div style={{fontSize:'0.55rem',color:'var(--yellow)',marginTop:1}}>tip {fmt(t.tip)}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{textAlign:'center',fontSize:'0.62rem',color:'var(--muted)',fontFamily:'Space Mono,monospace',paddingTop:4}}>no trips logged</div>
                    )}
                  </div>
                )
              })()}
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

      {goalModal && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) setGoalModal(null) }}
          style={{
            position:'fixed',inset:0,background:'rgba(7,8,15,0.85)',
            display:'flex',alignItems:'flex-end',justifyContent:'center',
            zIndex:9999,backdropFilter:'blur(4px)',
          }}
        >
          <div style={{
            background:'var(--surface)',borderRadius:'20px 20px 0 0',
            border:'1px solid var(--border)',width:'100%',maxWidth:500,
            padding:'24px 20px 40px',
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:'1.1rem',fontWeight:800}}>Set Goal</div>
              <button onClick={() => setGoalModal(null)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
            </div>

            <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Period</div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              {(['daily','weekly','monthly','yearly'] as GoalPeriod[]).map(p => (
                <button key={p} onClick={() => setGoalPeriod(p)} style={{
                  flex:1,padding:'9px 0',borderRadius:8,border:'1px solid',
                  fontSize:'0.65rem',fontFamily:'Space Mono,monospace',cursor:'pointer',fontWeight:700,
                  background:goalPeriod===p?'rgba(0,229,160,0.12)':'transparent',
                  borderColor:goalPeriod===p?'var(--green)':'var(--border)',
                  color:goalPeriod===p?'var(--green)':'var(--muted)',
                }}>{PERIOD_LABELS[p]}</button>
              ))}
            </div>

            <div style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Target ($)</div>
            <input
              type="number"
              step="1"
              value={goalAmount}
              onChange={e => setGoalAmount(e.target.value)}
              placeholder={goalPeriod==='daily'?'e.g. 150':goalPeriod==='weekly'?'e.g. 500':goalPeriod==='monthly'?'e.g. 2000':'e.g. 24000'}
              autoFocus
              style={{
                width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',
                borderRadius:8,padding:'12px 14px',color:'var(--text)',
                fontSize:'1.5rem',fontWeight:800,outline:'none',marginBottom:20,
                fontFamily:'Syne,sans-serif',boxSizing:'border-box',
              }}
            />

            <button
              onClick={saveGoal}
              disabled={goalSaving || !goalAmount}
              style={{
                width:'100%',padding:'14px 0',borderRadius:10,border:'none',
                background:'linear-gradient(135deg,#00e5a0,#00b87a)',
                color:'#07080f',fontSize:'0.95rem',fontWeight:800,cursor:'pointer',
                fontFamily:'Syne,sans-serif',opacity:goalSaving||!goalAmount?0.5:1,
              }}
            >{goalSaving ? 'Saving…' : `Save ${PERIOD_LABELS[goalPeriod]} Goal`}</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
