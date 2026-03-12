'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
  interface Window {
    google: typeof google
    initGigStackMap: () => void
  }
}

const ZONES = [
  { id:'hollywood', name:'Hollywood',     lat:34.0928, lng:-118.3287, radius:1800,
    demand:[3,2,1,0,0,0,1,2,3,4,4,6,8,8,7,6,7,9,10,10,9,8,6,4],
    myOrders:[1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,5,6,7,5,4,4,3] },
  { id:'weho',      name:'West Hollywood',lat:34.0900, lng:-118.3617, radius:1200,
    demand:[3,2,1,0,0,0,1,2,3,4,4,6,8,8,7,6,7,9,10,10,9,8,6,4],
    myOrders:[3,2,1,0,0,0,0,0,0,0,0,0,0,0,1,2,4,6,7,7,5,4,6,5] },
  { id:'culver',    name:'Culver City',   lat:34.0211, lng:-118.3965, radius:1500,
    demand:[0,0,0,0,0,0,1,2,4,5,5,7,8,8,7,6,7,8,9,8,6,4,2,0],
    myOrders:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,5,6,6,5,3,2,1,0] },
  { id:'silver',    name:'Silver Lake',   lat:34.0850, lng:-118.2850, radius:1000,
    demand:[1,0,0,0,0,0,1,3,5,6,6,7,8,8,7,7,8,9,10,9,8,6,3,1],
    myOrders:[2,1,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,6,7,8,5,4,3,2] },
  { id:'fairfax',   name:'Fairfax',       lat:34.0773, lng:-118.3620, radius:900,
    demand:[0,0,0,0,0,0,1,3,5,5,5,7,8,8,7,6,7,9,9,8,6,4,2,1],
    myOrders:[0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,3,5,7,8,8,5,3,4,2] },
]

const HOUR_LABELS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p']
const PERIODS: Record<number,string> = {0:'Late Night 🌙',2:'Dead Hours 💤',6:'Morning',12:'Afternoon',16:'Sweet Spot 💰',17:'Dinner Rush 🍕🔥',18:'6PM — Best $/trip 💸',19:'Prime Time 🔥',21:'Evening',22:'Late run 🌙',23:'Midnight'}

const PIN_STYLE = {
  hot:   { bg:'#e8192c', text:'#fff', border:'#ff5060' },
  new:   { bg:'#c8780a', text:'#fff', border:'#ffc040' },
  yours: { bg:'#1557b0', text:'#fff', border:'#4da3ff' },
  cold:  { bg:'#1e2235', text:'#5a5d75', border:'#2e3148' },
}

type PinType = 'hot'|'new'|'yours'|'cold'

function getZoneDemand(lat: number, lng: number, hour: number) {
  let best: typeof ZONES[0]|null = null, bestDist = Infinity
  ZONES.forEach(z => {
    const d = Math.sqrt((lat-z.lat)**2+(lng-z.lng)**2)*111000
    if (d < z.radius && d < bestDist) { best=z; bestDist=d }
  })
  if (!best) return { type:'cold' as PinType, demand:0, zone: null }
  const demand = best.demand[hour], personal = best.myOrders[hour]
  const hasHistory = best.myOrders.reduce((a,b)=>a+b,0) > 3
  if (demand>=7 && personal>=4) return { type:'hot' as PinType, demand, zone:best }
  if (demand>=5 && personal<3)  return { type:'new' as PinType, demand, zone:best }
  if (demand<5  && hasHistory)  return { type:'yours' as PinType, demand, zone:best }
  return { type:'cold' as PinType, demand, zone:best }
}

function getPeriodName(minutes: number) {
  const h = Math.floor(minutes/60)
  let best = 0
  Object.keys(PERIODS).forEach(k => { if(h>=parseInt(k)) best=parseInt(k) })
  return PERIODS[best]
}
function fmtTime(minutes: number) {
  const h = Math.floor(minutes/60), m = minutes%60
  const disp = h===0?12:h>12?h-12:h
  return `${disp}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`
}

export default function MapTab({ sidebarOpen, onSidebarClose }: { sidebarOpen: boolean; onSidebarClose: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const gmapRef = useRef<google.maps.Map|null>(null)
  const placesRef = useRef<google.maps.places.PlacesService|null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const circlesRef = useRef<google.maps.Circle[]>([])
  const searchedRef = useRef<Set<string>>(new Set())
  const placesDataRef = useRef<google.maps.places.PlaceResult[]>([])
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement|null>(null)

  const [minutes, setMinutes] = useState(() => {
    const now = new Date()
    return now.getHours()*60 + now.getMinutes()
  })
  const [isLive, setIsLive] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all'|'popular'|'hot'|'yours'>('all')
  const [toast, setToast] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<{
    name:string, status:string, cuisine:string, ratingStr:string, address:string,
    demandBars: {pct:number,isNow:boolean}[], borderColor:string
  }|null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  // Draw zone circles
  const drawCircles = useCallback((hour: number) => {
    if (!gmapRef.current) return
    circlesRef.current.forEach(c => c.setMap(null))
    circlesRef.current = []
    ZONES.forEach(z => {
      const dem=z.demand[hour], per=z.myOrders[hour], hasH=z.myOrders.reduce((a,b)=>a+b,0)>3
      let fc='#ffffff',sc='#1c1d2e',fo=0.01
      if (dem>=7&&per>=4){fc='#ff2040';sc='#ff4060';fo=0.08}
      else if (dem>=5&&per<3){fc='#ffa000';sc='#ffc040';fo=0.06}
      else if (dem<5&&hasH){fc='#1557b0';sc='#40b0ff';fo=0.04}
      const c = new window.google.maps.Circle({
        map:gmapRef.current!, center:{lat:z.lat,lng:z.lng}, radius:z.radius,
        fillColor:fc, fillOpacity:fo, strokeColor:sc, strokeOpacity:0.25, strokeWeight:1, clickable:false,
      })
      circlesRef.current.push(c)
    })
  }, [])

  // Render pins
  const renderPins = useCallback((hour: number, filter: string) => {
    if (!gmapRef.current) return
    markersRef.current.forEach(m => m.map = null)
    markersRef.current = []

    const toShow = placesDataRef.current.filter(r => {
      if (filter==='popular') return (r.rating||0) >= 4.4
      const lat = r.geometry!.location!.lat(), lng = r.geometry!.location!.lng()
      const d = getZoneDemand(lat, lng, hour)
      if (filter==='hot') return d.type==='hot'
      if (filter==='yours') return d.type==='hot'||d.type==='yours'
      return true
    })

    toShow.forEach(place => {
      const lat = place.geometry!.location!.lat()
      const lng = place.geometry!.location!.lng()
      const d = getZoneDemand(lat, lng, hour)
      const s = PIN_STYLE[d.type]
      const rating = place.rating ? place.rating.toFixed(1) : '—'
      const name = place.name!.length > 16 ? place.name!.slice(0,14)+'…' : place.name!

      const el = document.createElement('div')
      el.style.cssText = `display:flex;align-items:center;gap:4px;background:${s.bg};border:1.5px solid ${s.border};border-radius:20px;padding:4px 9px 4px 6px;cursor:pointer;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.55);transition:transform 0.12s;font-family:-apple-system,Arial,sans-serif;`
      el.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="${s.text}"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg><span style="font-size:11px;font-weight:600;color:${s.text};max-width:90px;overflow:hidden;text-overflow:ellipsis">${name}</span><svg width="9" height="9" viewBox="0 0 24 24" fill="${s.text}" style="opacity:0.85"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span style="font-size:10px;font-weight:700;color:${s.text}">${rating}</span>`
      el.addEventListener('mouseenter', ()=>el.style.transform='scale(1.08)')
      el.addEventListener('mouseleave', ()=>el.style.transform='scale(1)')

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: gmapRef.current!, position:{lat,lng}, content:el, title:place.name,
      })

      marker.addListener('click', () => {
        const labels = {hot:'🔥 HOTSPOT NOW',new:'✨ TRY THIS',yours:'📍 YOUR ZONE',cold:'❄️ SLOW NOW'}
        const isOpen = place.opening_hours?.isOpen?.()
        const showHours = [6,9,12,15,18,21]
        const bars = d.zone ? showHours.map(h => ({
          pct: Math.round((d.zone!.demand[h]/Math.max(...d.zone!.demand,1))*90),
          isNow: h<=hour && h+3>hour,
        })) : []
        setSelectedPlace({
          name: place.name||'',
          status: labels[d.type],
          cuisine: (place.types||['restaurant'])[0].replace(/_/g,' '),
          ratingStr: `${place.rating||'—'} ★  ·  ${'$'.repeat(place.price_level||2)}  ·  ${isOpen===true?'🟢 Open':isOpen===false?'🔴 Closed':'⚪ N/A'}`,
          address: place.vicinity||'',
          demandBars: bars,
          borderColor: s.border,
        })
        gmapRef.current!.panTo({lat,lng})
      })
      markersRef.current.push(marker)
    })
  }, [])

  // Fetch places from Google Places API
  const fetchPlaces = useCallback((lat: number, lng: number) => {
    if (!placesRef.current) return
    const existing = new Set(placesDataRef.current.map(p=>p.place_id))

    placesRef.current.nearbySearch({
      location: new window.google.maps.LatLng(lat, lng),
      radius: 1500, type: 'restaurant', keyword: 'delivery takeout',
    }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const fresh = results.filter(r=>!existing.has(r.place_id||''))
        placesDataRef.current = [...placesDataRef.current, ...fresh]
        renderPins(Math.floor(minutes/60), activeFilter)
        showToast(`✅ ${placesDataRef.current.length} delivery spots`)
      }
    })
  }, [minutes, activeFilter, renderPins])

  // Init Google Maps
  const initMap = useCallback(() => {
    if (!mapRef.current) return

    mapRef.current.style.filter = 'invert(92%) hue-rotate(180deg) brightness(0.85) saturate(0.7)'

    gmapRef.current = new window.google.maps.Map(mapRef.current, {
      center:{lat:34.0928,lng:-118.3287}, zoom:14,
      mapId:'gigstack_map',
      disableDefaultUI:true,
      zoomControl:true,
      zoomControlOptions:{position:window.google.maps.ControlPosition.RIGHT_CENTER},
      gestureHandling:'greedy',
      clickableIcons:false,
    })

    placesRef.current = new window.google.maps.places.PlacesService(gmapRef.current)

    // Geolocation
    if (navigator.geolocation) {
      showToast('📍 Finding your location...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const {latitude:lat, longitude:lng} = pos.coords
          gmapRef.current!.setCenter({lat,lng})
          gmapRef.current!.setZoom(14)

          const driverEl = document.createElement('div')
          driverEl.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#00e5a0;border:3px solid #07080f;box-shadow:0 0 0 4px rgba(0,229,160,0.3),0 0 16px rgba(0,229,160,0.5);'
          driverMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            map:gmapRef.current!, position:{lat,lng}, content:driverEl, zIndex:999,
          })

          showToast('✅ Location found!')
          drawCircles(Math.floor(minutes/60))
          fetchPlaces(lat, lng)
        },
        () => {
          showToast('⚠️ Location denied — showing Hollywood')
          drawCircles(Math.floor(minutes/60))
          fetchPlaces(34.0928, -118.3287)
        },
        {enableHighAccuracy:true, timeout:8000}
      )
    } else {
      drawCircles(Math.floor(minutes/60))
      fetchPlaces(34.0928, -118.3287)
    }

    // Auto-fetch on pan
    gmapRef.current.addListener('idle', () => {
      const c = gmapRef.current!.getCenter()!
      const key = `${Math.round(c.lat()*20)},${Math.round(c.lng()*20)}`
      if (!searchedRef.current.has(key)) {
        searchedRef.current.add(key)
        fetchPlaces(c.lat(), c.lng())
      }
    })

    gmapRef.current.addListener('click', () => setSelectedPlace(null))
    setMapsLoaded(true)
  }, [minutes, drawCircles, fetchPlaces])

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) { initMap(); return }
    window.initGigStackMap = initMap
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,marker&callback=initGigStackMap&v=beta`
    script.async = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [initMap])

  // Live clock
  useEffect(() => {
    if (!isLive) return
    const tick = () => {
      const now = new Date()
      setMinutes(now.getHours()*60+now.getMinutes())
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [isLive])

  // Update map when time changes
  useEffect(() => {
    if (!mapsLoaded) return
    drawCircles(Math.floor(minutes/60))
    renderPins(Math.floor(minutes/60), activeFilter)
  }, [minutes, mapsLoaded, activeFilter, drawCircles, renderPins])

  const recenter = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      gmapRef.current?.panTo({lat:pos.coords.latitude, lng:pos.coords.longitude})
      gmapRef.current?.setZoom(14)
      fetchPlaces(pos.coords.latitude, pos.coords.longitude)
    })
  }

  const h = Math.floor(minutes/60)
  const displayH = h===0?12:h>12?h-12:h
  const displayM = String(minutes%60).padStart(2,'0')

  const typeInfo = {
    hot:  {badge:'🔥 HOTSPOT', bg:'rgba(255,40,60,0.15)', col:'#ff4060'},
    new:  {badge:'✨ TRY THIS',bg:'rgba(255,192,64,0.12)',col:'#ffc040'},
    yours:{badge:'📍 YOURS',   bg:'rgba(64,176,255,0.1)', col:'#40b0ff'},
    cold: {badge:'❄️ COLD',    bg:'transparent',          col:'#44465a'},
  }

  return (
    <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden'}}>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          onClick={onSidebarClose}
          style={{
            position:'absolute',inset:0,zIndex:19,
            background:'rgba(0,0,0,0.55)',
            backdropFilter:'blur(3px)',
            animation:'fadeIn 0.2s ease both',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position:'absolute',top:0,left:0,bottom:0,
        width:280, zIndex:20,
        background:'var(--surface)',
        borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', overflow:'hidden',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: sidebarOpen ? '4px 0 32px rgba(0,0,0,0.6)' : 'none',
      }}>
        {/* Logo */}
        <div className="anim-slide-down" style={{padding:'16px 20px 12px',borderBottom:'1px solid var(--border)',background:'linear-gradient(180deg,#12131f,var(--surface))'}}>
          <div style={{fontSize:'1.2rem',fontWeight:800,letterSpacing:'-0.03em'}}>
            GIG<span style={{color:'var(--green)'}}>STACK</span>
          </div>
          <div style={{fontFamily:'Space Mono, monospace',fontSize:'0.5rem',letterSpacing:'0.18em',color:'var(--muted)',marginTop:2,textTransform:'uppercase'}}>
            Hollywood · Delivery Only 🍴
          </div>
        </div>

        {/* Stats */}
        <div style={{padding:'10px 16px',background:'rgba(0,229,160,0.04)',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6}}>
          {[{l:'4 weeks',v:'$1,706',c:'var(--green)'},{l:'trips',v:'90',c:'var(--yellow)'},{l:'best hr',v:'6PM',c:'var(--blue)'},{l:'avg/trip',v:'$18.95',c:'var(--text)'}].map(s=>(
            <div key={s.l} style={{textAlign:'center'}}>
              <div style={{fontFamily:'Space Mono,monospace',fontSize:'0.48rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{s.l}</div>
              <div style={{fontSize:'0.95rem',fontWeight:800,color:s.c,lineHeight:1.2}}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Time scrubber */}
        <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:'0.52rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Time of Day</div>
          <div style={{fontSize:'2rem',fontWeight:800,letterSpacing:'-0.05em',color:'var(--green)',lineHeight:1}}>{displayH}:{displayM}</div>
          <div style={{fontSize:'0.72rem',color:'var(--muted)',fontWeight:600,marginBottom:8,minHeight:'1.2em'}}>{getPeriodName(minutes)}</div>
          <input type="range" min={0} max={1439} step={15} value={minutes}
            onChange={e => { setIsLive(false); setMinutes(parseInt(e.target.value)) }}
            style={{width:'100%',height:4,borderRadius:2,background:'var(--border)',outline:'none',WebkitAppearance:'none',cursor:'pointer'}}
          />
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            {['12a','6a','12p','6p','11p'].map(t=>(
              <span key={t} style={{fontFamily:'Space Mono,monospace',fontSize:'0.45rem',color:'var(--muted)'}}>{t}</span>
            ))}
          </div>
          <button onClick={() => setIsLive(v=>!v)} style={{
            marginTop:10,width:'100%',padding:'6px 0',border:'1px solid',borderRadius:6,
            background:isLive?'rgba(0,229,160,0.1)':'transparent',
            borderColor:isLive?'var(--green)':'var(--border)',
            color:isLive?'var(--green)':'var(--muted)',
            fontSize:'0.65rem',fontFamily:'Space Mono,monospace',letterSpacing:'0.15em',
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:isLive?'var(--green)':'var(--muted)'}}/>
            {isLive?'LIVE NOW':'GO LIVE'}
          </button>
        </div>

        {/* Filter chips */}
        <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:'0.52rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Pin colors</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {(['all','popular','hot','yours'] as const).map(f => (
              <button key={f} onClick={()=>setActiveFilter(f)} style={{
                padding:'3px 9px',borderRadius:20,border:'1px solid',fontSize:'0.55rem',
                fontFamily:'Space Mono,monospace',cursor:'pointer',
                background:activeFilter===f?'rgba(0,229,160,0.15)':'transparent',
                borderColor:activeFilter===f?'var(--green)':'var(--border)',
                color:activeFilter===f?'var(--green)':'var(--muted)',
              }}>
                {f==='all'?'All Delivery':f==='popular'?'⭐ Popular':f==='hot'?'🔥 Hot Now':'📍 My Zones'}
              </button>
            ))}
          </div>
        </div>

        {/* Zone list */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>
          <div style={{fontFamily:'Space Mono,monospace',fontSize:'0.52rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--muted)',marginBottom:8,padding:'0 4px'}}>Zones</div>
          {ZONES.map(z => {
            const dem=z.demand[h], per=z.myOrders[h], hasH=z.myOrders.reduce((a,b)=>a+b,0)>3
            let type: keyof typeof typeInfo = 'cold'
            if(dem>=7&&per>=4) type='hot'
            else if(dem>=5&&per<3) type='new'
            else if(dem<5&&hasH) type='yours'
            const ti = typeInfo[type]
            const sc={hot:'#ff4060',new:'#ffc040',yours:'#40b0ff',cold:'#2e3148'}[type]
            return (
              <div key={z.id} onClick={()=>{gmapRef.current?.panTo({lat:z.lat,lng:z.lng});gmapRef.current?.setZoom(14)}}
                className="anim-slide-left"
                style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:'pointer',display:'flex',flexDirection:'column',gap:5,borderLeft:`3px solid ${sc}`,transition:'background 0.18s ease,transform 0.15s ease',animationDelay:`${ZONES.indexOf(z)*0.05}s`}}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--surface)')}
                onMouseLeave={e=>(e.currentTarget.style.background='var(--surface2)')}
              >
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontWeight:700,fontSize:'0.8rem'}}>{z.name}</span>
                  <span style={{fontSize:'0.55rem',fontFamily:'Space Mono,monospace',padding:'2px 7px',borderRadius:20,background:ti.bg,color:ti.col}}>{ti.badge}</span>
                </div>
                <div style={{display:'flex',gap:10}}>
                  {[{l:'demand',v:`${dem}/10`},{l:'your orders',v:per},{l:'spots',v:placesDataRef.current.length||'…'}].map(s=>(
                    <div key={s.l} style={{fontSize:'0.6rem',color:'var(--muted)'}}>
                      <strong style={{color:'var(--text)'}}>{s.v}</strong> {s.l}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* Map — always full width behind sidebar */}
      <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
        <div ref={mapRef} style={{width:'100%',height:'100%'}} />

        {/* Time chip */}
        <div style={{
          position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',
          background:'rgba(7,8,15,0.9)',border:'1px solid var(--border)',
          borderRadius:20,padding:'7px 16px',zIndex:10,
          fontFamily:'Space Mono,monospace',fontSize:'0.65rem',color:'var(--muted)',
          backdropFilter:'blur(8px)',pointerEvents:'none',whiteSpace:'nowrap',
        }}>
          Showing: <strong style={{color:'var(--green)'}}>{fmtTime(minutes)}</strong>
        </div>

        {/* Recenter button */}
        <button onClick={recenter} style={{
          position:'absolute',bottom:60,right:16,
          width:42,height:42,borderRadius:'50%',
          background:'#0f1018',border:'1px solid #1c1d2e',
          color:'var(--green)',fontSize:'1.2rem',cursor:'pointer',
          boxShadow:'0 2px 12px rgba(0,0,0,0.6)',
          display:'flex',alignItems:'center',justifyContent:'center',
          zIndex:10,
        }}>📍</button>

        {/* Place detail panel */}
        {selectedPlace && (
          <div className="anim-scale" style={{
            position:'absolute',top:16,right:16,width:220,
            background:'var(--surface)',border:'1px solid var(--border)',
            borderRadius:12,padding:14,zIndex:20,
            boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:selectedPlace.borderColor,marginBottom:6,lineHeight:1.2}}>{selectedPlace.name}</div>
            <div style={{fontSize:'0.65rem',color:selectedPlace.borderColor,marginBottom:8,fontFamily:'Space Mono,monospace'}}>{selectedPlace.status}</div>
            {[
              {l:'Type',v:selectedPlace.cuisine},
              {l:'Rating · Price · Hours',v:selectedPlace.ratingStr},
              {l:'Address',v:selectedPlace.address},
            ].map(row=>(
              <div key={row.l} style={{display:'flex',justifyContent:'space-between',marginBottom:4,gap:8}}>
                <span style={{fontSize:'0.6rem',color:'var(--muted)',flexShrink:0}}>{row.l}</span>
                <span style={{fontSize:'0.6rem',color:'var(--text)',textAlign:'right'}}>{row.v}</span>
              </div>
            ))}
            <div style={{borderTop:'1px solid var(--border)',marginTop:8,paddingTop:8}}>
              <div style={{fontSize:'0.52rem',fontFamily:'Space Mono,monospace',color:'var(--muted)',marginBottom:6}}>Zone demand by hour</div>
              <div style={{display:'flex',gap:2,height:40,alignItems:'flex-end'}}>
                {selectedPlace.demandBars.map((b,i)=>(
                  <div key={i} style={{flex:1,borderRadius:'2px 2px 0 0',minHeight:2,background:b.isNow?selectedPlace.borderColor:b.pct>50?'#2a3050':'#181928',height:`${Math.max(4,b.pct)}%`}}/>
                ))}
              </div>
              <div style={{display:'flex',gap:2,marginTop:3}}>
                {['6a','9a','12p','3p','6p','9p'].map(l=>(
                  <div key={l} style={{flex:1,fontFamily:'Space Mono,monospace',fontSize:'0.42rem',color:'var(--muted)',textAlign:'center'}}>{l}</div>
                ))}
              </div>
            </div>
            <button onClick={()=>setSelectedPlace(null)} style={{marginTop:8,width:'100%',padding:'5px 0',background:'transparent',border:'1px solid var(--border)',borderRadius:6,color:'var(--muted)',fontSize:'0.6rem',cursor:'pointer'}}>Close</button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="anim-slide-down" style={{
            position:'absolute',top:20,left:'50%',transform:'translateX(-50%)',
            background:'var(--surface)',border:'1px solid var(--border)',
            borderRadius:10,padding:'10px 18px',fontSize:'0.82rem',fontWeight:600,
            zIndex:999,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
          }}>{toast}</div>
        )}
      </div>
    </div>
  )
}
