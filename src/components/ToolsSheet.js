import { useState, useEffect } from "react";

const EXCHANGE_KEY = "1326ace77505b747eb3ee7b5";

const TOOLS = [
  { key:"converter", label:"Convertisseur", icon:"💱", sub:"Devises" },
  { key:"checklist", label:"Checklist", icon:"✅", sub:"Pré-départ" },
  { key:"worldclock", label:"Horloge mondiale", icon:"🌍", sub:"Fuseaux horaires" },
];

export default function ToolsSheet({ onClose, C }) {
  const [tool, setTool] = useState(null);
  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg,borderRadius:"20px 20px 0 0",borderTop:`0.5px solid ${C.border}`,padding:"16px 20px 28px",zIndex:20,maxHeight:"88%",overflowY:"auto"}}>
      <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 16px"}}></div>
      {!tool ? (
        <>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:14}}>Outils</div>
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
          <button onClick={onClose} style={{width:"100%",marginTop:14,padding:11,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer"}}>Fermer</button>
        </>
      ) : tool==="converter" ? <Converter onBack={() => setTool(null)} C={C} />
        : tool==="checklist" ? <Checklist onBack={() => setTool(null)} C={C} />
        : tool==="worldclock" ? <WorldClock onBack={() => setTool(null)} C={C} />
        : null}
    </div>
  );
}

function BackBtn({ onClick, C }) {
  return <button onClick={onClick} style={{border:"none",background:"none",cursor:"pointer",fontSize:16,color:C.text2,marginBottom:14,padding:0}}>‹ Retour</button>;
}

function Converter({ onBack, C }) {
  const [rates, setRates] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [val, setVal] = useState("100");
  const [loadingRates, setLoadingRates] = useState(false);

  useEffect(() => {
    async function fetchRates() {
      setLoadingRates(true);
      try {
        const res = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/${from}`);
        const data = await res.json();
        if (data.result === "success") {
          setRates(data.conversion_rates);
          setUpdatedAt(data.time_last_update_utc);
        }
      } catch(e) {}
      setLoadingRates(false);
    }
    fetchRates();
  }, [from]);

  const rate = rates ? (rates[to] || 1) : null;
  const result = rate ? ((parseFloat(val)||0) * rate).toFixed(2) : "…";
  const currencies = ["EUR","USD","GBP","JPY","CHF","CAD","AUD","MAD","TND","DZD","TRY","SGD","HKD","CNY","INR","BRL","MXN","KRW","AED","SAR"];

  function press(k) {
    setVal(v => {
      if (k==="C") return "0";
      if (k==="⌫") return v.length>1 ? v.slice(0,-1) : "0";
      if (k===".") return v.includes(".")?v:v+".";
      if (k==="00") return v==="0"?"0":v+"00";
      return v==="0"?k:v+k;
    });
  }

  return (
    <div>
      <BackBtn onClick={onBack} C={C} />
      <div style={{background:C.bg2,borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <select value={from} onChange={e => setFrom(e.target.value)} style={{flex:1,padding:8,border:`1px solid ${C.border}`,borderRadius:8,background:C.bg,color:C.text,fontSize:14}}>
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => { const tmp=from; setFrom(to); setTo(tmp); }} style={{border:"none",background:"none",fontSize:18,cursor:"pointer",color:C.text2}}>⇄</button>
          <select value={to} onChange={e => setTo(e.target.value)} style={{flex:1,padding:8,border:`1px solid ${C.border}`,borderRadius:8,background:C.bg,color:C.text,fontSize:14}}>
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:30,fontWeight:700,color:C.text}}>{val}</div>
          <div style={{fontSize:18,color:"#1a6bb5",marginTop:4}}>{loadingRates ? "Chargement…" : `= ${result} ${to}`}</div>
          {rate && <div style={{fontSize:11,color:C.text2,marginTop:2}}>1 {from} = {rate.toFixed(4)} {to}</div>}
          {updatedAt && <div style={{fontSize:10,color:C.text2,marginTop:2}}>Taux au {new Date(updatedAt).toLocaleDateString("fr-FR")} · Source : ExchangeRate-API</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {[["C","⇄",".","⌫"],["7","8","9",""],["4","5","6",""],["1","2","3",""],["0","00","",""]].map((row,i) =>
          row.map((k,j) => k&&k!=="⇄" ? (
            <button key={`${i}${j}`} onClick={() => press(k)}
              style={{padding:"14px 8px",borderRadius:10,border:`0.5px solid ${C.border}`,background:k==="C"?"#fee":k==="."||k==="00"||k==="⌫"?C.bg2:C.bg,color:k==="C"?"#e24b4a":k==="⌫"||k==="."||k==="00"?"#1a6bb5":C.text,fontSize:16,cursor:"pointer",textAlign:"center"}}>
              {k}
            </button>
          ) : k==="⇄" ? <div key={`${i}${j}`}></div> : null
        ))}
        <button style={{padding:"14px 8px",borderRadius:10,border:"none",background:"#1a6bb5",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",gridRow:"span 3"}}>
          Convertir
        </button>
      </div>
    </div>
  );
}

const DEFAULT_CHECKLIST = [
  { cat:"Documents", items:["Passeport / Carte d'identité","Billets imprimés ou téléchargés","Assurance voyage","Carte européenne de santé"] },
  { cat:"Logistique", items:["Prévenir la banque","Forfait data international","Télécharger carte hors-ligne","Réserver activités clés"] },
  { cat:"Bagages", items:["Adaptateur de prise","Chargeurs","Médicaments essentiels","Photocopies documents"] },
];

function Checklist({ onBack, C }) {
  const [checked, setChecked] = useState({});
  const [items, setItems] = useState(DEFAULT_CHECKLIST);
  const [adding, setAdding] = useState(null);
  const [newItem, setNewItem] = useState("");

  const toggle = k => setChecked(c => ({...c,[k]:!c[k]}));
  const addItem = (catIdx) => {
    if (!newItem.trim()) return;
    setItems(its => its.map((g,i) => i===catIdx ? {...g, items:[...g.items, newItem.trim()]} : g));
    setNewItem(""); setAdding(null);
  };
  const removeItem = (catIdx, itemIdx) => {
    setItems(its => its.map((g,i) => i===catIdx ? {...g, items:g.items.filter((_,j)=>j!==itemIdx)} : g));
  };

  return (
    <div>
      <BackBtn onClick={onBack} C={C} />
      {items.map((group, catIdx) => (
        <div key={group.cat} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:6}}>{group.cat}</div>
          {group.items.map((item, itemIdx) => {
            const k = `${catIdx}-${itemIdx}`;
            return (
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <div onClick={() => toggle(k)} style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${checked[k]?"#1a6bb5":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:checked[k]?"#1a6bb5":"transparent",cursor:"pointer"}}>
                  {checked[k] && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <span style={{flex:1,fontSize:14,color:checked[k]?C.text2:C.text,textDecoration:checked[k]?"line-through":"none"}}>{item}</span>
                <button onClick={() => removeItem(catIdx,itemIdx)} style={{border:"none",background:"none",color:"#e24b4a",fontSize:14,cursor:"pointer",opacity:0.6}}>✕</button>
              </div>
            );
          })}
          {adding===catIdx ? (
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <input autoFocus value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key==="Enter"&&addItem(catIdx)}
                style={{flex:1,padding:"6px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.bg,color:C.text}} placeholder="Nouvel élément…" />
              <button onClick={() => addItem(catIdx)} style={{padding:"6px 12px",background:"#1a6bb5",border:"none",borderRadius:8,color:"white",fontSize:12,cursor:"pointer"}}>+</button>
              <button onClick={() => setAdding(null)} style={{padding:"6px 8px",border:"none",background:"none",color:C.text2,cursor:"pointer"}}>✕</button>
            </div>
          ) : (
            <button onClick={() => setAdding(catIdx)} style={{fontSize:12,color:"#1a6bb5",border:"none",background:"none",cursor:"pointer",marginTop:4,padding:"4px 0"}}>+ Ajouter</button>
          )}
        </div>
      ))}
    </div>
  );
}

const ZONES = [
  { city:"Paris", tz:"Europe/Paris" },
  { city:"Londres", tz:"Europe/London" },
  { city:"New York", tz:"America/New_York" },
  { city:"Los Angeles", tz:"America/Los_Angeles" },
  { city:"Dubaï", tz:"Asia/Dubai" },
  { city:"Bangkok", tz:"Asia/Bangkok" },
  { city:"Tokyo", tz:"Asia/Tokyo" },
  { city:"Sydney", tz:"Australia/Sydney" },
  { city:"Singapour", tz:"Asia/Singapore" },
  { city:"Montréal", tz:"America/Toronto" },
];

function WorldClock({ onBack, C }) {
  const [now, setNow] = useState(new Date());
  const [favorites, setFavorites] = useState(["Europe/Paris","America/New_York","Asia/Dubai","Asia/Tokyo"]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const displayed = ZONES.filter(z => favorites.includes(z.tz));
  const available = ZONES.filter(z => !favorites.includes(z.tz));

  return (
    <div>
      <BackBtn onClick={onBack} C={C} />
      <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:14}}>Horloge mondiale</div>
      {displayed.map(z => {
        const timeStr = now.toLocaleTimeString("fr-FR", { timeZone:z.tz, hour:"2-digit", minute:"2-digit", second:"2-digit" });
        const dateStr = now.toLocaleDateString("fr-FR", { timeZone:z.tz, weekday:"short", day:"numeric", month:"short" });
        const hour = parseInt(now.toLocaleTimeString("fr-FR", { timeZone:z.tz, hour:"2-digit", hour12:false }));
        const isNight = hour < 7 || hour >= 22;
        return (
          <div key={z.tz} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:C.bg2,borderRadius:12,marginBottom:8}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{isNight?"🌙":"☀️"} {z.city}</div>
              <div style={{fontSize:11,color:C.text2,marginTop:2}}>{dateStr}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:700,color:"#1a6bb5",fontVariantNumeric:"tabular-nums"}}>{timeStr}</div>
            </div>
          </div>
        );
      })}
      {adding ? (
        <div style={{background:C.bg2,borderRadius:12,padding:12}}>
          {available.map(z => (
            <div key={z.tz} onClick={() => { setFavorites(f=>[...f,z.tz]); setAdding(false); }}
              style={{padding:"10px 12px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`,fontSize:14,color:C.text}}>
              {z.city}
            </div>
          ))}
          <button onClick={() => setAdding(false)} style={{width:"100%",padding:8,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:4}}>Annuler</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{width:"100%",padding:10,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:4}}>
          + Ajouter une ville
        </button>
      )}
    </div>
  );
}
