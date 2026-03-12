'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LogTripModal({ onClose, onSaved }: { onClose: ()=>void, onSaved: ()=>void }) {
  const [restaurant, setRestaurant] = useState('')
  const [zone, setZone] = useState('')
  const [earnings, setEarnings] = useState('')
  const [tip, setTip] = useState('')
  const [platform, setPlatform] = useState('Uber Eats')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const ZONES = ['Hollywood','West Hollywood','DTLA','Silver Lake','Culver City','Fairfax','Glendale','Koreatown','Burbank']
  const PLATFORMS = ['Uber Eats','DoorDash','Grubhub']

  const save = async () => {
    if (!restaurant.trim()) { setError('Enter a restaurant name'); return }
    const earn = parseFloat(earnings)
    if (!earn || earn <= 0) { setError('Enter earnings amount'); return }

    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('trips').insert({
      restaurant_name: restaurant.trim(),
      zone: zone || null,
      earnings: earn,
      tip: parseFloat(tip) || 0,
      platform,
      date: new Date().toISOString().split('T')[0],
    })

    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div
      onClick={e => { if(e.target===e.currentTarget) onClose() }}
      style={{
        position:'fixed',inset:0,background:'rgba(7,8,15,0.85)',
        display:'flex',alignItems:'flex-end',justifyContent:'center',
        zIndex:1000,backdropFilter:'blur(4px)',
      }}
    >
      <div style={{
        background:'var(--surface)',borderRadius:'20px 20px 0 0',
        border:'1px solid var(--border)',width:'100%',maxWidth:500,
        padding:'24px 20px 40px',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:'1.1rem',fontWeight:800}}>Log a Trip ✍️</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
        </div>

        {/* Restaurant */}
        <label style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:6}}>Restaurant / Place</label>
        <input
          value={restaurant} onChange={e=>setRestaurant(e.target.value)}
          placeholder="e.g. Chick-fil-A Hollywood"
          style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',color:'var(--text)',fontSize:'0.9rem',outline:'none',marginBottom:14,fontFamily:'Syne,sans-serif'}}
        />

        {/* Zone */}
        <label style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:6}}>Zone</label>
        <select
          value={zone} onChange={e=>setZone(e.target.value)}
          style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',color:zone?'var(--text)':'var(--muted)',fontSize:'0.85rem',outline:'none',marginBottom:14,fontFamily:'Syne,sans-serif'}}
        >
          <option value="">Select zone (optional)</option>
          {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
        </select>

        {/* Earnings + Tip */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div>
            <label style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:6}}>Earnings ($)</label>
            <input type="number" step="0.01" value={earnings} onChange={e=>setEarnings(e.target.value)}
              placeholder="0.00"
              style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',color:'var(--text)',fontSize:'0.9rem',outline:'none',fontFamily:'Syne,sans-serif'}}
            />
          </div>
          <div>
            <label style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:6}}>Tip ($)</label>
            <input type="number" step="0.01" value={tip} onChange={e=>setTip(e.target.value)}
              placeholder="0.00"
              style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',color:'var(--text)',fontSize:'0.9rem',outline:'none',fontFamily:'Syne,sans-serif'}}
            />
          </div>
        </div>

        {/* Platform */}
        <label style={{fontSize:'0.62rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:8}}>Platform</label>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {PLATFORMS.map(p=>(
            <button key={p} onClick={()=>setPlatform(p)} style={{
              flex:1,padding:'8px 0',borderRadius:8,border:'1px solid',fontSize:'0.7rem',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,
              background:platform===p?'rgba(0,229,160,0.12)':'transparent',
              borderColor:platform===p?'var(--green)':'var(--border)',
              color:platform===p?'var(--green)':'var(--muted)',
            }}>{p}</button>
          ))}
        </div>

        {error && <div style={{color:'var(--red)',fontSize:'0.7rem',marginBottom:12,fontFamily:'Space Mono,monospace'}}>{error}</div>}

        {/* Actions */}
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'12px 0',borderRadius:10,border:'1px solid var(--border)',background:'transparent',color:'var(--muted)',fontSize:'0.85rem',cursor:'pointer',fontFamily:'Syne,sans-serif'}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{
            flex:2,padding:'12px 0',borderRadius:10,border:'none',
            background:'linear-gradient(135deg,#00e5a0,#00b87a)',
            color:'#07080f',fontSize:'0.9rem',fontWeight:800,cursor:'pointer',
            fontFamily:'Syne,sans-serif',opacity:saving?0.7:1,
          }}>{saving?'Saving…':'Save Trip ✓'}</button>
        </div>
      </div>
    </div>
  )
}
