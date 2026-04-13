import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const EXCHANGE_KEY = "1326ace77505b747eb3ee7b5";
const TOOLS = [
  { key:"converter", label:"Convertisseur", icon:"💱", sub:"Devises" },
  { key:"checklist", label:"Checklist", icon:"✅", sub:"Pré-départ" },
  { key:"worldclock", label:"Horloge mondiale", icon:"🌍", sub:"Fuseaux horaires" },
  { key:"export", label:"Export PDF", icon:"📄", sub:"Voyage" },
];

export default function ToolsSheet({ onClose, C, tripId, trip, reservations }) {
  const [tool, setTool] = useState(null);
  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",zIndex:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg,borderRadius:"20px 20px 0 0",borderTop:`0.5px solid ${C.border}`,maxHeight:"88%",overflowY:"auto"}}>
        <div style={{padding:"14px 20px 0",position:"sticky",top:0,background:C.bg,zIndex:1}}>
          <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 10px"}}></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>{tool ? TOOLS.find(t=>t.key===tool)?.label : "Outils"}</div>
            <button onClick={tool?()=>setTool(null):onClose}
              style={{padding:"6px 16px",border:`1.5px solid ${C.border}`,borderRadius:20,background:"none",color:C.text,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              {tool?"‹ Retour":"Fermer"}
            </button>
          </div>
        </div>
        <div style={{padding:"0 20px 32px"}}>
          {!tool && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {TOOLS.map(t => (
                <div key={t.key} onClick={()=>setTool(t.key)}
                  style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
                  <div style={{fontSize:13,color:C.text,fontWeight:600}}>{t.label}</div>
                  <div style={{fontSize:11,color:C.text2,marginTop:2}}>{t.sub}</div>
                </div>
              ))}
            </div>
          )}
          {tool==="converter" && <Converter C={C} />}
          {tool==="checklist" && <Checklist C={C} tripId={tripId} />}
          {tool==="worldclock" && <WorldClock C={C} tripId={tripId} />}
          {tool==="export" && <ExportPDF C={C} trip={trip} reservations={reservations} />}
        </div>
      </div>
    </div>
  );
}

// ─── CONVERTISSEUR avec cache 24h et mémorisation devises ────────────
function Converter({ C }) {
  const CACHE_KEY = "pp_rates_cache";
  const PREFS_KEY = "pp_conv_prefs";

  const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)||"{}"); } catch { return {}; } };
  const prefs = loadPrefs();

  const [from, setFrom] = useState(prefs.from||"EUR");
  const [to, setTo] = useState(prefs.to||"USD");
  const [rates, setRates] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [val, setVal] = useState("100");
  const [loading, setLoading] = useState(false);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  useEffect(() => { fetchRates(from); }, [from]);
  useEffect(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify({from,to})); } catch{} }, [from, to]);

  async function fetchRates(base) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");
      const now = Date.now();
      if (cached[base] && (now - cached[base].ts) < 24*3600*1000) {
        setRates(cached[base].rates); setUpdatedAt(cached[base].updatedAt); return;
      }
    } catch{}
    setLoading(true);
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/${base}`);
      const data = await res.json();
      if (data.result==="success") {
        setRates(data.conversion_rates); setUpdatedAt(data.time_last_update_utc);
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");
          cached[base] = { rates:data.conversion_rates, updatedAt:data.time_last_update_utc, ts:Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        } catch{}
      }
    } catch(e){}
    setLoading(false);
  }

  const currencies = rates ? Object.keys(rates).sort() : ["EUR","USD","GBP","JPY","CHF","CAD","AUD","MYR","DZD","MAD","TND","TRY","SGD"];
  const rate = rates?.[to]||1;
  const result = ((parseFloat(val)||0)*rate).toFixed(2);

  function press(k) {
    setVal(v => {
      if (k==="C") return "0";
      if (k==="⌫") return v.length>1?v.slice(0,-1):"0";
      if (k===".") return v.includes(".")?v:v+".";
      if (k==="00") return v==="0"?"0":v+"00";
      return v==="0"?k:v+k;
    });
  }

  const filtFrom = currencies.filter(c=>c.toLowerCase().includes(searchFrom.toLowerCase()));
  const filtTo = currencies.filter(c=>c.toLowerCase().includes(searchTo.toLowerCase()));

  return (
    <div>
      <div style={{background:C.bg2,borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:12}}>
          <CurrencyPicker value={from} onChange={v=>{setFrom(v);setShowFrom(false);setSearchFrom("");}} search={searchFrom} onSearch={setSearchFrom} show={showFrom} onToggle={()=>{setShowFrom(!showFrom);setShowTo(false);}} currencies={filtFrom} C={C} />
          <button onClick={()=>{const t=from;setFrom(to);setTo(t);}} style={{border:"none",background:"none",fontSize:20,cursor:"pointer",color:C.text2}}>⇄</button>
          <CurrencyPicker value={to} onChange={v=>{setTo(v);setShowTo(false);setSearchTo("");}} search={searchTo} onSearch={setSearchTo} show={showTo} onToggle={()=>{setShowTo(!showTo);setShowFrom(false);}} currencies={filtTo} C={C} />
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:32,fontWeight:700,color:C.text,fontVariantNumeric:"tabular-nums"}}>{val}</div>
          <div style={{fontSize:20,color:"#1a6bb5",marginTop:4}}>{loading?"Chargement…":`= ${result} ${to}`}</div>
          {rates&&<div style={{fontSize:11,color:C.text2,marginTop:2}}>1 {from} = {rate.toFixed(4)} {to}</div>}
          {updatedAt&&<div style={{fontSize:10,color:C.text2,marginTop:2}}>Taux du {new Date(updatedAt).toLocaleDateString("fr-FR")} · ExchangeRate-API · Cache 24h</div>}
        </div>
      </div>

      {/* Pavé numérique type téléphone */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[["7","8","9"],["4","5","6"],["1","2","3"],[".",  "0","00"]].map((row,i) =>
          row.map((k,j) => (
            <button key={`${i}${j}`} onClick={()=>press(k)}
              style={{padding:"16px 8px",borderRadius:12,border:`0.5px solid ${C.border}`,background:C.bg2,color:C.text,fontSize:20,cursor:"pointer",textAlign:"center",fontWeight:[".",  "00"].includes(k)?500:400}}>
              {k}
            </button>
          ))
        )}
        <button style={{padding:"16px 8px",borderRadius:12,border:"none",background:"#1a6bb5",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",gridColumn:"span 3"}} onClick={()=>{}}>
          Convertir ✓
        </button>
        <button onClick={()=>press("C")} style={{padding:"12px 8px",borderRadius:12,border:`0.5px solid ${C.border}`,background:"#fee",color:"#e24b4a",fontSize:16,cursor:"pointer"}}>C</button>
        <button onClick={()=>press("⌫")} style={{padding:"12px 8px",borderRadius:12,border:`0.5px solid ${C.border}`,background:C.bg2,color:"#1a6bb5",fontSize:18,cursor:"pointer",gridColumn:"span 2"}}>⌫</button>
      </div>
    </div>
  );
}

function CurrencyPicker({ value, onChange, search, onSearch, show, onToggle, currencies, C }) {
  return (
    <div style={{position:"relative"}}>
      <div onClick={onToggle} style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,cursor:"pointer",fontWeight:700,color:C.text,fontSize:16,textAlign:"center"}}>
        {value}
      </div>
      {show && (
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,zIndex:20,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
          <input autoFocus value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher…"
            style={{width:"100%",padding:"8px 10px",border:"none",borderBottom:`1px solid ${C.border}`,fontSize:13,background:C.bg,color:C.text,boxSizing:"border-box"}} />
          {currencies.map(c=>(
            <div key={c} onClick={()=>onChange(c)} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:c===value?700:400,color:c===value?"#1a6bb5":C.text,background:c===value?C.bg2:"none"}}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CHECKLIST sauvegardée Firebase ─────────────────────────────────
const DEFAULT_ITEMS = [
  { cat:"Documents", items:["Passeport / Carte d'identité","Billets imprimés ou téléchargés","Assurance voyage","Carte européenne de santé"] },
  { cat:"Logistique", items:["Prévenir la banque","Forfait data international","Télécharger carte hors-ligne","Réserver activités clés"] },
  { cat:"Bagages", items:["Adaptateur de prise","Chargeurs","Médicaments essentiels","Photocopies documents"] },
];

function Checklist({ C, tripId }) {
  const [checked, setChecked] = useState({});
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [adding, setAdding] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    getDoc(doc(db,"trips",tripId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.checklist) setItems(d.checklist);
        if (d.checklistChecked) setChecked(d.checklistChecked);
      }
      setLoaded(true);
    });
  }, [tripId]);

  async function save(newItems, newChecked) {
    if (!tripId) return;
    await setDoc(doc(db,"trips",tripId), { checklist:newItems, checklistChecked:newChecked }, { merge:true });
  }

  function toggle(k) {
    const nc = {...checked,[k]:!checked[k]};
    setChecked(nc); save(items, nc);
  }
  function addItem(ci) {
    if(!newItem.trim()) return;
    const ni = items.map((g,i)=>i===ci?{...g,items:[...g.items,newItem.trim()]}:g);
    setItems(ni); setNewItem(""); setAdding(null); save(ni, checked);
  }
  function remove(ci,ii) {
    const ni = items.map((g,i)=>i===ci?{...g,items:g.items.filter((_,j)=>j!==ii)}:g);
    setItems(ni); save(ni, checked);
  }

  if (!loaded) return <div style={{textAlign:"center",padding:"24px 0",color:C.text2}}>Chargement…</div>;

  return (
    <div>
      {items.map((group,ci) => (
        <div key={group.cat} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:6}}>{group.cat}</div>
          {group.items.map((item,ii) => {
            const k=`${ci}-${ii}`;
            return (
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <div onClick={()=>toggle(k)} style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${checked[k]?"#1a6bb5":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:checked[k]?"#1a6bb5":"transparent",cursor:"pointer"}}>
                  {checked[k]&&<svg width="11" height="9" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <span style={{flex:1,fontSize:14,color:checked[k]?C.text2:C.text,textDecoration:checked[k]?"line-through":"none"}}>{item}</span>
                <button onClick={()=>remove(ci,ii)} style={{border:"none",background:"none",color:"#e24b4a",fontSize:14,cursor:"pointer",opacity:0.5,padding:"0 4px"}}>✕</button>
              </div>
            );
          })}
          {adding===ci ? (
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <input autoFocus value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem(ci)}
                style={{flex:1,padding:"8px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.bg,color:C.text}} placeholder="Nouvel élément…" />
              <button onClick={()=>addItem(ci)} style={{padding:"8px 12px",background:"#1a6bb5",border:"none",borderRadius:8,color:"white",fontSize:13,cursor:"pointer",fontWeight:700}}>+</button>
              <button onClick={()=>setAdding(null)} style={{padding:"8px 10px",border:`1px solid ${C.border}`,background:"none",color:C.text2,borderRadius:8,cursor:"pointer"}}>✕</button>
            </div>
          ) : (
            <button onClick={()=>setAdding(ci)} style={{fontSize:12,color:"#1a6bb5",border:"none",background:"none",cursor:"pointer",marginTop:6,padding:"2px 0"}}>+ Ajouter</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── HORLOGE MONDIALE sauvegardée Firebase ──────────────────────────
const ALL_CITIES = [
  {city:"Paris",tz:"Europe/Paris"},{city:"Londres",tz:"Europe/London"},{city:"Madrid",tz:"Europe/Madrid"},
  {city:"New York",tz:"America/New_York"},{city:"Los Angeles",tz:"America/Los_Angeles"},{city:"Montréal",tz:"America/Toronto"},
  {city:"São Paulo",tz:"America/Sao_Paulo"},{city:"Dubai",tz:"Asia/Dubai"},{city:"Riyad",tz:"Asia/Riyadh"},
  {city:"Alger",tz:"Africa/Algiers"},{city:"Casablanca",tz:"Africa/Casablanca"},{city:"Tunis",tz:"Africa/Tunis"},
  {city:"Bangkok",tz:"Asia/Bangkok"},{city:"Singapour",tz:"Asia/Singapore"},{city:"Kuala Lumpur",tz:"Asia/Kuala_Lumpur"},
  {city:"Hong Kong",tz:"Asia/Hong_Kong"},{city:"Tokyo",tz:"Asia/Tokyo"},{city:"Séoul",tz:"Asia/Seoul"},
  {city:"Sydney",tz:"Australia/Sydney"},{city:"Mumbai",tz:"Asia/Kolkata"},{city:"Istanbul",tz:"Europe/Istanbul"},
  {city:"Moscou",tz:"Europe/Moscow"},{city:"Le Caire",tz:"Africa/Cairo"},{city:"Nairobi",tz:"Africa/Nairobi"},
  {city:"Lagos",tz:"Africa/Lagos"},{city:"Pékin",tz:"Asia/Shanghai"},{city:"Jakarta",tz:"Asia/Jakarta"},
  {city:"Toronto",tz:"America/Toronto"},{city:"Chicago",tz:"America/Chicago"},{city:"Mexico",tz:"America/Mexico_City"},
  {city:"Buenos Aires",tz:"America/Argentina/Buenos_Aires"},{city:"Amsterdam",tz:"Europe/Amsterdam"},
  {city:"Berlin",tz:"Europe/Berlin"},{city:"Rome",tz:"Europe/Rome"},{city:"Lisbonne",tz:"Europe/Lisbon"},
];
const DEFAULT_FAVS = ["Europe/Paris","America/New_York","Asia/Dubai","Asia/Tokyo"];

function WorldClock({ C, tripId }) {
  const [now, setNow] = useState(new Date());
  const [favs, setFavs] = useState(DEFAULT_FAVS);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); }, []);

  useEffect(() => {
    if (!tripId) { setLoaded(true); return; }
    getDoc(doc(db,"trips",tripId)).then(snap => {
      if (snap.exists() && snap.data().worldClockCities) setFavs(snap.data().worldClockCities);
      setLoaded(true);
    });
  }, [tripId]);

  async function saveFavs(newFavs) {
    setFavs(newFavs);
    if (tripId) await setDoc(doc(db,"trips",tripId), { worldClockCities:newFavs }, { merge:true });
  }

  const displayed = ALL_CITIES.filter(z=>favs.includes(z.tz));
  const available = ALL_CITIES.filter(z=>!favs.includes(z.tz)&&z.city.toLowerCase().includes(search.toLowerCase()));

  if (!loaded) return <div style={{textAlign:"center",padding:"24px 0",color:C.text2}}>Chargement…</div>;

  return (
    <div>
      {displayed.map(z => {
        const timeStr = now.toLocaleTimeString("fr-FR",{timeZone:z.tz,hour:"2-digit",minute:"2-digit",second:"2-digit"});
        const dateStr = now.toLocaleDateString("fr-FR",{timeZone:z.tz,weekday:"short",day:"numeric",month:"short"});
        const hour = parseInt(now.toLocaleTimeString("en-US",{timeZone:z.tz,hour:"2-digit",hour12:false}));
        const isNight = hour<7||hour>=22;
        return (
          <div key={z.tz} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:C.bg2,borderRadius:12,marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{isNight?"🌙":"☀️"} {z.city}</div>
              <div style={{fontSize:11,color:C.text2,marginTop:2,textTransform:"capitalize"}}>{dateStr}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20,fontWeight:700,color:"#1a6bb5",fontVariantNumeric:"tabular-nums"}}>{timeStr}</div>
              <button onClick={()=>saveFavs(favs.filter(t=>t!==z.tz))} style={{border:"none",background:"none",color:"#e24b4a",fontSize:16,cursor:"pointer",opacity:0.5}}>✕</button>
            </div>
          </div>
        );
      })}
      {showSearch ? (
        <div style={{background:C.bg2,borderRadius:12,padding:12,marginTop:4}}>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une ville…"
            style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box",marginBottom:8}} />
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {available.length===0
              ? <div style={{textAlign:"center",padding:"12px 0",color:C.text2,fontSize:13}}>Aucune ville trouvée</div>
              : available.map(z=>(
                <div key={z.tz} onClick={()=>{saveFavs([...favs,z.tz]);setSearch("");setShowSearch(false);}}
                  style={{padding:"10px 10px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`,fontSize:14,color:C.text}}>
                  {z.city}
                </div>
              ))
            }
          </div>
          <button onClick={()=>setShowSearch(false)} style={{width:"100%",padding:9,border:`1px solid ${C.border}`,borderRadius:10,background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:8}}>Annuler</button>
        </div>
      ) : (
        <button onClick={()=>setShowSearch(true)} style={{width:"100%",padding:11,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:4}}>
          + Ajouter une ville
        </button>
      )}
    </div>
  );
}

// ─── EXPORT PDF ──────────────────────────────────────────────────────
const CAT_OPTIONS = [
  { key:"vol", label:"Vols", icon:"✈️" },
  { key:"transport", label:"Transports", icon:"🚌" },
  { key:"hotel", label:"Hôtels", icon:"🏨" },
  { key:"activite", label:"Activités", icon:"🎭" },
  { key:"restaurant", label:"Restaurants", icon:"🍽️" },
  { key:"autre", label:"Autres", icon:"📌" },
];

function ExportPDF({ C, trip, reservations }) {
  const [selected, setSelected] = useState(new Set(CAT_OPTIONS.map(c=>c.key)));
  const [inclPrix, setInclPrix] = useState(true);
  const [inclConfirm, setInclConfirm] = useState(true);
  const [inclNotes, setInclNotes] = useState(true);
  const [generating, setGenerating] = useState(false);

  function toggleCat(k) {
    const ns = new Set(selected);
    ns.has(k) ? ns.delete(k) : ns.add(k);
    setSelected(ns);
  }
  function toggleAll() {
    setSelected(selected.size===CAT_OPTIONS.length ? new Set() : new Set(CAT_OPTIONS.map(c=>c.key)));
  }

  async function generate() {
    setGenerating(true);
    const filtered = reservations.filter(r => selected.has(r.type));
    filtered.sort((a,b) => (a.dateStart||"").localeCompare(b.dateStart||""));

    const groupByDate = {};
    filtered.forEach(r => {
      const d = r.dateStart || "Sans date";
      if (!groupByDate[d]) groupByDate[d] = [];
      groupByDate[d].push(r);
    });

    const ICONS_MAP = {vol:"✈",transport:"🚌",hotel:"🏨",activite:"🎭",restaurant:"🍽",autre:"📌"};
    const COLORS_MAP = {vol:"#378add",hotel:"#1d9e75",transport:"#ef9f27",activite:"#d4537e",restaurant:"#9b59b6",autre:"#888"};

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:-apple-system,Arial,sans-serif;color:#111;padding:32px;max-width:700px;margin:0 auto;}
      h1{font-size:24px;font-weight:700;color:#1a6bb5;margin:0 0 4px;}
      .subtitle{font-size:14px;color:#666;margin-bottom:32px;}
      .date-group{margin-bottom:24px;}
      .date-label{font-size:13px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #eee;}
      .card{padding:12px 16px;margin-bottom:8px;border-radius:10px;border-left:4px solid #1a6bb5;}
      .card-name{font-size:15px;font-weight:700;margin-bottom:4px;}
      .card-detail{font-size:12px;color:#555;margin-bottom:2px;}
      .footer{margin-top:40px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px;}
    </style></head><body>
    <h1>${trip?.destination || trip?.name || "Mon voyage"}</h1>
    <div class="subtitle">${trip?.dateStart||""} → ${trip?.dateEnd||""} · Export du ${new Date().toLocaleDateString("fr-FR")}</div>`;

    Object.entries(groupByDate).forEach(([date, items]) => {
      const dateLabel = date==="Sans date" ? "Sans date" : new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
      html += `<div class="date-group"><div class="date-label">${dateLabel}</div>`;
      items.forEach(r => {
        const color = COLORS_MAP[r.type]||"#888";
        html += `<div class="card" style="border-left-color:${color};background:${color}15;">
          <div class="card-name">${ICONS_MAP[r.type]||"📌"} ${r.name}</div>`;
        if (r.timeStart) html += `<div class="card-detail">🕐 ${r.timeStart}${r.timeEnd?` → ${r.timeEnd}`:""}</div>`;
        if (r.dateEnd && r.dateEnd!==r.dateStart) html += `<div class="card-detail">📅 Jusqu'au ${r.dateEnd}</div>`;
        if (r.location) html += `<div class="card-detail">📍 ${r.location}</div>`;
        if (inclConfirm && r.confirmation) html += `<div class="card-detail">🔖 Confirmation : ${r.confirmation}</div>`;
        if (r.website) html += `<div class="card-detail">🌐 ${r.website}</div>`;
        if (inclPrix && r.price) html += `<div class="card-detail">💶 ${r.price} €</div>`;
        if (inclNotes && r.notes) html += `<div class="card-detail">📝 ${r.notes}</div>`;
        html += `</div>`;
      });
      html += `</div>`;
    });

    if (inclPrix) {
      const total = filtered.reduce((s,r)=>s+(parseFloat(r.price)||0),0);
      html += `<div style="background:#e6f1fb;padding:14px 16px;border-radius:10px;margin-top:8px;display:flex;justify-content:space-between;">
        <span style="font-weight:700;font-size:14px;">Total sélectionné</span>
        <span style="font-weight:700;color:#1a6bb5;font-size:16px;">${total.toFixed(0)} €</span>
      </div>`;
    }

    html += `<div class="footer">Généré par Pommepoire · ${filtered.length} réservation${filtered.length!==1?"s":""}</div></body></html>`;

    const blob = new Blob([html], {type:"text/html"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${trip?.destination||"voyage"}_export.html`; a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
  }

  const count = reservations.filter(r=>selected.has(r.type)).length;

  return (
    <div>
      <div style={{fontSize:13,color:C.text2,marginBottom:16,lineHeight:1.6}}>
        Sélectionnez les catégories à inclure dans le document.
      </div>

      <div style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Catégories</div>
      <div style={{background:C.bg2,borderRadius:12,overflow:"hidden",marginBottom:12}}>
        <div onClick={toggleAll} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`}}>
          <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${selected.size===CAT_OPTIONS.length?"#1a6bb5":C.border}`,background:selected.size===CAT_OPTIONS.length?"#1a6bb5":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {selected.size===CAT_OPTIONS.length&&<svg width="11" height="9" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
          </div>
          <span style={{fontSize:14,fontWeight:600,color:C.text}}>Tout sélectionner</span>
        </div>
        {CAT_OPTIONS.map(c => (
          <div key={c.key} onClick={()=>toggleCat(c.key)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`}}>
            <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${selected.has(c.key)?"#1a6bb5":C.border}`,background:selected.has(c.key)?"#1a6bb5":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {selected.has(c.key)&&<svg width="11" height="9" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
            </div>
            <span style={{fontSize:14,color:C.text}}>{c.icon} {c.label}</span>
            <span style={{marginLeft:"auto",fontSize:12,color:C.text2}}>{reservations.filter(r=>r.type===c.key).length}</span>
          </div>
        ))}
      </div>

      <div style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Options</div>
      <div style={{background:C.bg2,borderRadius:12,overflow:"hidden",marginBottom:20}}>
        {[["inclPrix","Inclure les prix",inclPrix,setInclPrix],["inclConfirm","Inclure les confirmations",inclConfirm,setInclConfirm],["inclNotes","Inclure les notes",inclNotes,setInclNotes]].map(([k,label,val,setter])=>(
          <div key={k} onClick={()=>setter(!val)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.text}}>{label}</span>
            <div style={{width:44,height:26,borderRadius:99,background:val?"#1a6bb5":C.border,position:"relative",transition:"background 0.2s"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:2,left:val?20:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}></div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={generate} disabled={generating||selected.size===0||count===0}
        style={{width:"100%",padding:14,background:selected.size===0||count===0?"#ccc":"#1a6bb5",border:"none",borderRadius:12,color:"white",fontSize:15,fontWeight:700,cursor:selected.size===0||count===0?"not-allowed":"pointer"}}>
        {generating?"Génération…":`📄 Exporter ${count} réservation${count!==1?"s":""}`}
      </button>
      {count===0&&selected.size>0&&<div style={{textAlign:"center",fontSize:12,color:C.text2,marginTop:8}}>Aucune réservation dans les catégories sélectionnées</div>}
    </div>
  );
}
