import { useState, useEffect, useRef } from "react";

const EXCHANGE_KEY = "1326ace77505b747eb3ee7b5";

const TOOLS = [
  { key:"converter", label:"Convertisseur", icon:"💱", sub:"Devises" },
  { key:"checklist", label:"Checklist", icon:"✅", sub:"Pré-départ" },
  { key:"worldclock", label:"Horloge mondiale", icon:"🌍", sub:"Fuseaux horaires" },
];

function SwipeSheet({ onClose, C, children }) {
  const startY = useRef(null);
  const [translateY, setTranslateY] = useState(0);
  function onTouchStart(e) { startY.current = e.touches[0].clientY; }
  function onTouchMove(e) { const dy = e.touches[0].clientY - startY.current; if (dy>0) setTranslateY(dy); }
  function onTouchEnd() { if (translateY>80) onClose(); else setTranslateY(0); startY.current=null; }
  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg,borderRadius:"20px 20px 0 0",borderTop:`0.5px solid ${C.border}`,maxHeight:"88%",overflowY:"auto",transform:`translateY(${translateY}px)`,transition:translateY===0?"transform 0.3s":"none"}}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}

export default function ToolsSheet({ onClose, C }) {
  const [tool, setTool] = useState(null);
  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",zIndex:20}} onClick={e => e.target===e.currentTarget && onClose()}>
      <SwipeSheet onClose={onClose} C={C}>
        <div style={{padding:"14px 20px 0",position:"sticky",top:0,background:C.bg,zIndex:1}}>
          <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 10px"}}></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>{tool ? TOOLS.find(t=>t.key===tool)?.label : "Outils"}</div>
            <button onClick={tool ? () => setTool(null) : onClose}
              style={{padding:"6px 14px",border:`1.5px solid ${C.border}`,borderRadius:20,background:"none",color:C.text,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              {tool ? "‹ Retour" : "Fermer"}
            </button>
          </div>
        </div>
        <div style={{padding:"0 20px 32px"}}>
          {!tool && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {TOOLS.map(t => (
                <div key={t.key} onClick={() => setTool(t.key)}
                  style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"14px 8px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
                  <div style={{fontSize:12,color:C.text,fontWeight:600}}>{t.label}</div>
                  <div style={{fontSize:10,color:C.text2,marginTop:2}}>{t.sub}</div>
                </div>
              ))}
            </div>
          )}
          {tool==="converter" && <Converter C={C} />}
          {tool==="checklist" && <Checklist C={C} />}
          {tool==="worldclock" && <WorldClock C={C} />}
        </div>
      </SwipeSheet>
    </div>
  );
}

// ─── CONVERTISSEUR ───────────────────────────────────────
function Converter({ C }) {
  const [allRates, setAllRates] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [val, setVal] = useState("100");
  const [loading, setLoading] = useState(false);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);

  useEffect(() => { fetchRates(from); }, [from]);

  async function fetchRates(base) {
    setLoading(true);
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/${base}`);
      const data = await res.json();
      if (data.result==="success") { setAllRates(data.conversion_rates); setUpdatedAt(data.time_last_update_utc); }
    } catch(e) {}
    setLoading(false);
  }

  const currencies = allRates ? Object.keys(allRates).sort() : ["EUR","USD","GBP","JPY","CHF","CAD","AUD","MYR","DZD","MAD","TND","TRY","SGD"];
  const filteredFrom = currencies.filter(c => c.toLowerCase().includes(searchFrom.toLowerCase()));
  const filteredTo = currencies.filter(c => c.toLowerCase().includes(searchTo.toLowerCase()));
  const rate = allRates?.[to] || 1;
  const result = ((parseFloat(val)||0) * rate).toFixed(2);

  function press(k) {
    setVal(v => {
      if (k==="C") return "0";
      if (k==="⌫") return v.length>1?v.slice(0,-1):"0";
      if (k===".") return v.includes(".")?v:v+".";
      if (k==="00") return v==="0"?"0":v+"00";
      return v==="0"?k:v+k;
    });
  }

  return (
    <div>
      <div style={{background:C.bg2,borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:12}}>
          {/* FROM */}
          <div style={{position:"relative"}}>
            <div onClick={() => { setShowFromList(!showFromList); setShowToList(false); }}
              style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,cursor:"pointer",fontWeight:700,color:C.text,fontSize:16,textAlign:"center"}}>
              {from}
            </div>
            {showFromList && (
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,zIndex:10,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
                <input autoFocus value={searchFrom} onChange={e => setSearchFrom(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"8px 10px",border:"none",borderBottom:`1px solid ${C.border}`,fontSize:13,background:C.bg,color:C.text,boxSizing:"border-box"}} />
                {filteredFrom.map(c => <div key={c} onClick={() => { setFrom(c); setShowFromList(false); setSearchFrom(""); }} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:from===c?700:400,color:from===c?"#1a6bb5":C.text}}>{c}</div>)}
              </div>
            )}
          </div>
          <button onClick={() => { const t=from; setFrom(to); setTo(t); }} style={{border:"none",background:"none",fontSize:20,cursor:"pointer",color:C.text2}}>⇄</button>
          {/* TO */}
          <div style={{position:"relative"}}>
            <div onClick={() => { setShowToList(!showToList); setShowFromList(false); }}
              style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,cursor:"pointer",fontWeight:700,color:C.text,fontSize:16,textAlign:"center"}}>
              {to}
            </div>
            {showToList && (
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,zIndex:10,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
                <input autoFocus value={searchTo} onChange={e => setSearchTo(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"8px 10px",border:"none",borderBottom:`1px solid ${C.border}`,fontSize:13,background:C.bg,color:C.text,boxSizing:"border-box"}} />
                {filteredTo.map(c => <div key={c} onClick={() => { setTo(c); setShowToList(false); setSearchTo(""); }} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:to===c?700:400,color:to===c?"#1a6bb5":C.text}}>{c}</div>)}
              </div>
            )}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:30,fontWeight:700,color:C.text}}>{val}</div>
          <div style={{fontSize:18,color:"#1a6bb5",marginTop:4}}>{loading?"Chargement…":`= ${result} ${to}`}</div>
          {allRates && <div style={{fontSize:11,color:C.text2,marginTop:2}}>1 {from} = {rate.toFixed(4)} {to}</div>}
          {updatedAt && <div style={{fontSize:10,color:C.text2,marginTop:2}}>Taux du {new Date(updatedAt).toLocaleDateString("fr-FR")} · ExchangeRate-API</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {[["C","⌫",".","00"],["7","8","9",""],["4","5","6",""],["1","2","3",""],["0","","",""]].map((row,i) =>
          row.map((k,j) => k ? (
            <button key={`${i}${j}`} onClick={() => press(k)}
              style={{padding:"14px 8px",borderRadius:10,border:`0.5px solid ${C.border}`,
                background:k==="C"?"#fee":["⌫",".","00"].includes(k)?C.bg2:C.bg,
                color:k==="C"?"#e24b4a":["⌫",".","00"].includes(k)?"#1a6bb5":C.text,
                fontSize:16,cursor:"pointer",textAlign:"center"}}>
              {k}
            </button>
          ) : null
        ))}
        <button style={{padding:"14px 8px",borderRadius:10,border:"none",background:"#1a6bb5",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",gridRow:"span 3"}}>
          Convertir
        </button>
      </div>
    </div>
  );
}

// ─── CHECKLIST ───────────────────────────────────────────
const DEFAULT_ITEMS = [
  { cat:"Documents", items:["Passeport / Carte d'identité","Billets imprimés ou téléchargés","Assurance voyage","Carte européenne de santé"] },
  { cat:"Logistique", items:["Prévenir la banque","Forfait data international","Télécharger carte hors-ligne","Réserver activités clés"] },
  { cat:"Bagages", items:["Adaptateur de prise","Chargeurs","Médicaments essentiels","Photocopies documents"] },
];

function Checklist({ C }) {
  const [checked, setChecked] = useState({});
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [adding, setAdding] = useState(null);
  const [newItem, setNewItem] = useState("");
  const toggle = k => setChecked(c=>({...c,[k]:!c[k]}));
  const addItem = ci => { if(!newItem.trim()) return; setItems(its=>its.map((g,i)=>i===ci?{...g,items:[...g.items,newItem.trim()]}:g)); setNewItem(""); setAdding(null); };
  const remove = (ci,ii) => setItems(its=>its.map((g,i)=>i===ci?{...g,items:g.items.filter((_,j)=>j!==ii)}:g));
  return (
    <div>
      {items.map((group,ci) => (
        <div key={group.cat} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:6}}>{group.cat}</div>
          {group.items.map((item,ii) => {
            const k=`${ci}-${ii}`;
            return (
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <div onClick={()=>toggle(k)} style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${checked[k]?"#1a6bb5":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:checked[k]?"#1a6bb5":"transparent",cursor:"pointer"}}>
                  {checked[k]&&<svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <span style={{flex:1,fontSize:14,color:checked[k]?C.text2:C.text,textDecoration:checked[k]?"line-through":"none"}}>{item}</span>
                <button onClick={()=>remove(ci,ii)} style={{border:"none",background:"none",color:"#e24b4a",fontSize:14,cursor:"pointer",opacity:0.6,padding:"0 4px"}}>✕</button>
              </div>
            );
          })}
          {adding===ci ? (
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <input autoFocus value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem(ci)}
                style={{flex:1,padding:"7px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.bg,color:C.text}} placeholder="Nouvel élément…" />
              <button onClick={()=>addItem(ci)} style={{padding:"7px 12px",background:"#1a6bb5",border:"none",borderRadius:8,color:"white",fontSize:13,cursor:"pointer",fontWeight:700}}>+</button>
              <button onClick={()=>setAdding(null)} style={{padding:"7px 10px",border:`1px solid ${C.border}`,background:"none",color:C.text2,borderRadius:8,cursor:"pointer"}}>✕</button>
            </div>
          ) : (
            <button onClick={()=>setAdding(ci)} style={{fontSize:12,color:"#1a6bb5",border:"none",background:"none",cursor:"pointer",marginTop:6,padding:"2px 0"}}>+ Ajouter</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── HORLOGE MONDIALE ────────────────────────────────────
const CITY_TZ = [
  {city:"Paris",tz:"Europe/Paris"},{city:"Londres",tz:"Europe/London"},{city:"Madrid",tz:"Europe/Madrid"},
  {city:"New York",tz:"America/New_York"},{city:"Los Angeles",tz:"America/Los_Angeles"},{city:"Montréal",tz:"America/Toronto"},
  {city:"São Paulo",tz:"America/Sao_Paulo"},{city:"Dubai",tz:"Asia/Dubai"},{city:"Riyad",tz:"Asia/Riyadh"},
  {city:"Alger",tz:"Africa/Algiers"},{city:"Casablanca",tz:"Africa/Casablanca"},{city:"Tunis",tz:"Africa/Tunis"},
  {city:"Bangkok",tz:"Asia/Bangkok"},{city:"Singapour",tz:"Asia/Singapore"},{city:"Kuala Lumpur",tz:"Asia/Kuala_Lumpur"},
  {city:"Hong Kong",tz:"Asia/Hong_Kong"},{city:"Tokyo",tz:"Asia/Tokyo"},{city:"Séoul",tz:"Asia/Seoul"},
  {city:"Sydney",tz:"Australia/Sydney"},{city:"Mumbai",tz:"Asia/Kolkata"},{city:"Istanbul",tz:"Europe/Istanbul"},
  {city:"Moscou",tz:"Europe/Moscow"},{city:"Le Caire",tz:"Africa/Cairo"},{city:"Nairobi",tz:"Africa/Nairobi"},
  {city:"Lagos",tz:"Africa/Lagos"},{city:"Pékin",tz:"Asia/Shanghai"},{city:"Jakarta",tz:"Asia/Jakarta"},
];

function WorldClock({ C }) {
  const [now, setNow] = useState(new Date());
  const [favorites, setFavorites] = useState(["Europe/Paris","America/New_York","Asia/Dubai","Asia/Tokyo"]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { const t = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); }, []);

  const filtered = CITY_TZ.filter(z => !favorites.includes(z.tz) && z.city.toLowerCase().includes(search.toLowerCase()));
  const displayed = CITY_TZ.filter(z => favorites.includes(z.tz));

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
              <button onClick={()=>setFavorites(f=>f.filter(t=>t!==z.tz))} style={{border:"none",background:"none",color:"#e24b4a",fontSize:16,cursor:"pointer",opacity:0.6,padding:"0 2px"}}>✕</button>
            </div>
          </div>
        );
      })}

      {showSearch ? (
        <div style={{background:C.bg2,borderRadius:12,padding:12,marginTop:4}}>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une ville…"
            style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box",marginBottom:8}} />
          <div style={{maxHeight:160,overflowY:"auto"}}>
            {filtered.length===0 ? <div style={{textAlign:"center",padding:"12px 0",color:C.text2,fontSize:13}}>Aucune ville trouvée</div> :
              filtered.map(z => (
                <div key={z.tz} onClick={() => { setFavorites(f=>[...f,z.tz]); setSearch(""); setShowSearch(false); }}
                  style={{padding:"9px 10px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`,fontSize:14,color:C.text}}>
                  {z.city}
                </div>
              ))
            }
          </div>
          <button onClick={()=>setShowSearch(false)} style={{width:"100%",padding:8,border:`1px solid ${C.border}`,borderRadius:10,background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:8}}>Annuler</button>
        </div>
      ) : (
        <button onClick={()=>setShowSearch(true)} style={{width:"100%",padding:11,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:4}}>
          + Ajouter une ville
        </button>
      )}
    </div>
  );
}
