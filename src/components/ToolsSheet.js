import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import jsPDF from "jspdf";

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
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>{tool?TOOLS.find(t=>t.key===tool)?.label:"Outils"}</div>
            <button onClick={tool?()=>setTool(null):onClose} style={{padding:"6px 16px",border:`1.5px solid ${C.border}`,borderRadius:20,background:"none",color:C.text,fontSize:13,fontWeight:600,cursor:"pointer"}}>{tool?"‹ Retour":"Fermer"}</button>
          </div>
        </div>
        <div style={{padding:"0 20px 32px"}}>
          {!tool&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {TOOLS.map(t=>(
              <div key={t.key} onClick={()=>setTool(t.key)} style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center",cursor:"pointer"}}>
                <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
                <div style={{fontSize:13,color:C.text,fontWeight:600}}>{t.label}</div>
                <div style={{fontSize:11,color:C.text2,marginTop:2}}>{t.sub}</div>
              </div>
            ))}
          </div>}
          {tool==="converter"&&<Converter C={C}/>}
          {tool==="checklist"&&<Checklist C={C} tripId={tripId}/>}
          {tool==="worldclock"&&<WorldClock C={C} tripId={tripId}/>}
          {tool==="export"&&<ExportPDF C={C} trip={trip} reservations={reservations}/>}
        </div>
      </div>
    </div>
  );
}

function Converter({C}) {
  const CACHE_KEY="pp_rates_cache", PREFS_KEY="pp_conv_prefs";
  const loadPrefs=()=>{try{return JSON.parse(localStorage.getItem(PREFS_KEY)||"{}");}catch{return{};}};
  const prefs=loadPrefs();
  const [from,setFrom]=useState(prefs.from||"EUR");
  const [to,setTo]=useState(prefs.to||"USD");
  const [rates,setRates]=useState(null);
  const [updatedAt,setUpdatedAt]=useState(null);
  const [val,setVal]=useState("100");
  const [loading,setLoading]=useState(false);
  const [searchFrom,setSearchFrom]=useState("");
  const [searchTo,setSearchTo]=useState("");
  const [showFrom,setShowFrom]=useState(false);
  const [showTo,setShowTo]=useState(false);

  useEffect(()=>{fetchRates(from);},[from]);
  useEffect(()=>{try{localStorage.setItem(PREFS_KEY,JSON.stringify({from,to}));}catch{}},[from,to]);

  async function fetchRates(base) {
    try {
      const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");
      if(cached[base]&&(Date.now()-cached[base].ts)<24*3600*1000){setRates(cached[base].rates);setUpdatedAt(cached[base].updatedAt);return;}
    } catch{}
    setLoading(true);
    try {
      const res=await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_KEY}/latest/${base}`);
      const data=await res.json();
      if(data.result==="success"){
        setRates(data.conversion_rates);setUpdatedAt(data.time_last_update_utc);
        try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");c[base]={rates:data.conversion_rates,updatedAt:data.time_last_update_utc,ts:Date.now()};localStorage.setItem(CACHE_KEY,JSON.stringify(c));}catch{}
      }
    } catch{}
    setLoading(false);
  }

  const currencies=rates?Object.keys(rates).sort():["EUR","USD","GBP","JPY","CHF","CAD","AUD","MYR","DZD","MAD","TND"];
  const rate=rates?.[to]||1;
  const result=((parseFloat(val)||0)*rate).toFixed(2);
  const filtFrom=currencies.filter(c=>c.toLowerCase().includes(searchFrom.toLowerCase()));
  const filtTo=currencies.filter(c=>c.toLowerCase().includes(searchTo.toLowerCase()));

  function press(k){
    setVal(v=>{
      if(k==="C")return"0";
      if(k==="⌫")return v.length>1?v.slice(0,-1):"0";
      if(k===".")return v.includes(".")?v:v+".";
      if(k==="00")return v==="0"?"0":v+"00";
      return v==="0"?k:v+k;
    });
  }

  return(
    <div>
      <div style={{background:C.bg2,borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:12}}>
          <CurrencyPicker value={from} onChange={v=>{setFrom(v);setShowFrom(false);setSearchFrom("");}} search={searchFrom} onSearch={setSearchFrom} show={showFrom} onToggle={()=>{setShowFrom(!showFrom);setShowTo(false);}} currencies={filtFrom} C={C}/>
          <button onClick={()=>{const t=from;setFrom(to);setTo(t);}} style={{border:"none",background:"none",fontSize:20,cursor:"pointer",color:C.text2}}>⇄</button>
          <CurrencyPicker value={to} onChange={v=>{setTo(v);setShowTo(false);setSearchTo("");}} search={searchTo} onSearch={setSearchTo} show={showTo} onToggle={()=>{setShowTo(!showTo);setShowFrom(false);}} currencies={filtTo} C={C}/>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:32,fontWeight:700,color:C.text}}>{val}</div>
          <div style={{fontSize:20,color:"#1a6bb5",marginTop:4}}>{loading?"Chargement…":`= ${result} ${to}`}</div>
          {rates&&<div style={{fontSize:11,color:C.text2,marginTop:2}}>1 {from} = {rate.toFixed(4)} {to}</div>}
          {updatedAt&&<div style={{fontSize:10,color:C.text2,marginTop:2}}>Taux du {new Date(updatedAt).toLocaleDateString("fr-FR")} · ExchangeRate-API · Cache 24h</div>}
        </div>
      </div>
      {/* Pavé numérique type téléphone */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
        {["7","8","9","4","5","6","1","2","3",".","0","00"].map(k=>(
          <button key={k} onClick={()=>press(k)} style={{padding:"16px 8px",borderRadius:12,border:`0.5px solid ${C.border}`,background:C.bg2,color:C.text,fontSize:20,cursor:"pointer",textAlign:"center"}}>
            {k}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <button onClick={()=>press("C")} style={{padding:"13px",borderRadius:12,border:`0.5px solid ${C.border}`,background:"#fee",color:"#e24b4a",fontSize:16,cursor:"pointer"}}>C</button>
        <button onClick={()=>press("⌫")} style={{padding:"13px",borderRadius:12,border:`0.5px solid ${C.border}`,background:C.bg2,color:"#1a6bb5",fontSize:18,cursor:"pointer"}}>⌫</button>
        <button style={{padding:"13px",borderRadius:12,border:"none",background:"#1a6bb5",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓</button>
      </div>
    </div>
  );
}

function CurrencyPicker({value,onChange,search,onSearch,show,onToggle,currencies,C}){
  return(
    <div style={{position:"relative"}}>
      <div onClick={onToggle} style={{padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,background:C.bg,cursor:"pointer",fontWeight:700,color:C.text,fontSize:16,textAlign:"center"}}>{value}</div>
      {show&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,zIndex:20,maxHeight:220,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
          <input autoFocus value={search} onChange={e=>onSearch(e.target.value)} placeholder="Rechercher…" style={{width:"100%",padding:"8px 10px",border:"none",borderBottom:`1px solid ${C.border}`,fontSize:13,background:C.bg,color:C.text,boxSizing:"border-box"}}/>
          {currencies.map(c=><div key={c} onClick={()=>onChange(c)} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:c===value?700:400,color:c===value?"#1a6bb5":C.text}}>{c}</div>)}
        </div>
      )}
    </div>
  );
}

const DEFAULT_ITEMS=[
  {cat:"Documents",items:["Passeport / Carte d'identité","Billets imprimés ou téléchargés","Assurance voyage","Carte européenne de santé"]},
  {cat:"Logistique",items:["Prévenir la banque","Forfait data international","Télécharger carte hors-ligne","Réserver activités clés"]},
  {cat:"Bagages",items:["Adaptateur de prise","Chargeurs","Médicaments essentiels","Photocopies documents"]},
];

function Checklist({C,tripId}){
  const [checked,setChecked]=useState({});
  const [items,setItems]=useState(DEFAULT_ITEMS);
  const [adding,setAdding]=useState(null);
  const [newItem,setNewItem]=useState("");
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    if(!tripId)return;
    getDoc(doc(db,"trips",tripId)).then(snap=>{
      if(snap.exists()){const d=snap.data();if(d.checklist)setItems(d.checklist);if(d.checklistChecked)setChecked(d.checklistChecked);}
      setLoaded(true);
    });
  },[tripId]);

  async function save(ni,nc){if(tripId)await setDoc(doc(db,"trips",tripId),{checklist:ni,checklistChecked:nc},{merge:true});}
  function toggle(k){const nc={...checked,[k]:!checked[k]};setChecked(nc);save(items,nc);}
  function addItem(ci){if(!newItem.trim())return;const ni=items.map((g,i)=>i===ci?{...g,items:[...g.items,newItem.trim()]}:g);setItems(ni);setNewItem("");setAdding(null);save(ni,checked);}
  function remove(ci,ii){const ni=items.map((g,i)=>i===ci?{...g,items:g.items.filter((_,j)=>j!==ii)}:g);setItems(ni);save(ni,checked);}

  if(!loaded)return<div style={{textAlign:"center",padding:"24px 0",color:C.text2}}>Chargement…</div>;

  return(
    <div>
      {items.map((group,ci)=>(
        <div key={group.cat} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:6}}>{group.cat}</div>
          {group.items.map((item,ii)=>{
            const k=`${ci}-${ii}`;
            return(
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <div onClick={()=>toggle(k)} style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${checked[k]?"#1a6bb5":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:checked[k]?"#1a6bb5":"transparent",cursor:"pointer"}}>
                  {checked[k]&&<svg width="11" height="9" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <span style={{flex:1,fontSize:14,color:checked[k]?C.text2:C.text,textDecoration:checked[k]?"line-through":"none"}}>{item}</span>
                <button onClick={()=>remove(ci,ii)} style={{border:"none",background:"none",color:"#e24b4a",fontSize:14,cursor:"pointer",opacity:0.5,padding:"0 4px"}}>✕</button>
              </div>
            );
          })}
          {adding===ci?(
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <input autoFocus value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem(ci)} style={{flex:1,padding:"8px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.bg,color:C.text}} placeholder="Nouvel élément…"/>
              <button onClick={()=>addItem(ci)} style={{padding:"8px 12px",background:"#1a6bb5",border:"none",borderRadius:8,color:"white",fontSize:13,cursor:"pointer",fontWeight:700}}>+</button>
              <button onClick={()=>setAdding(null)} style={{padding:"8px 10px",border:`1px solid ${C.border}`,background:"none",color:C.text2,borderRadius:8,cursor:"pointer"}}>✕</button>
            </div>
          ):<button onClick={()=>setAdding(ci)} style={{fontSize:12,color:"#1a6bb5",border:"none",background:"none",cursor:"pointer",marginTop:6,padding:"2px 0"}}>+ Ajouter</button>}
        </div>
      ))}
    </div>
  );
}

const ALL_CITIES=[
  {city:"Paris",tz:"Europe/Paris"},{city:"Londres",tz:"Europe/London"},{city:"Madrid",tz:"Europe/Madrid"},
  {city:"New York",tz:"America/New_York"},{city:"Los Angeles",tz:"America/Los_Angeles"},{city:"Montréal",tz:"America/Toronto"},
  {city:"São Paulo",tz:"America/Sao_Paulo"},{city:"Dubai",tz:"Asia/Dubai"},{city:"Riyad",tz:"Asia/Riyadh"},
  {city:"Alger",tz:"Africa/Algiers"},{city:"Casablanca",tz:"Africa/Casablanca"},{city:"Tunis",tz:"Africa/Tunis"},
  {city:"Bangkok",tz:"Asia/Bangkok"},{city:"Singapour",tz:"Asia/Singapore"},{city:"Kuala Lumpur",tz:"Asia/Kuala_Lumpur"},
  {city:"Hong Kong",tz:"Asia/Hong_Kong"},{city:"Tokyo",tz:"Asia/Tokyo"},{city:"Séoul",tz:"Asia/Seoul"},
  {city:"Sydney",tz:"Australia/Sydney"},{city:"Mumbai",tz:"Asia/Kolkata"},{city:"Istanbul",tz:"Europe/Istanbul"},
  {city:"Moscou",tz:"Europe/Moscow"},{city:"Le Caire",tz:"Africa/Cairo"},{city:"Lagos",tz:"Africa/Lagos"},
  {city:"Pékin",tz:"Asia/Shanghai"},{city:"Jakarta",tz:"Asia/Jakarta"},{city:"Toronto",tz:"America/Toronto"},
  {city:"Chicago",tz:"America/Chicago"},{city:"Amsterdam",tz:"Europe/Amsterdam"},{city:"Berlin",tz:"Europe/Berlin"},
];
const DEFAULT_FAVS=["Europe/Paris","America/New_York","Asia/Dubai","Asia/Tokyo"];

function WorldClock({C,tripId}){
  const [now,setNow]=useState(new Date());
  const [favs,setFavs]=useState(DEFAULT_FAVS);
  const [search,setSearch]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{
    if(!tripId){setLoaded(true);return;}
    getDoc(doc(db,"trips",tripId)).then(snap=>{if(snap.exists()&&snap.data().worldClockCities)setFavs(snap.data().worldClockCities);setLoaded(true);});
  },[tripId]);

  async function saveFavs(nf){setFavs(nf);if(tripId)await setDoc(doc(db,"trips",tripId),{worldClockCities:nf},{merge:true});}

  const displayed=ALL_CITIES.filter(z=>favs.includes(z.tz));
  const available=ALL_CITIES.filter(z=>!favs.includes(z.tz)&&z.city.toLowerCase().includes(search.toLowerCase()));

  if(!loaded)return<div style={{textAlign:"center",padding:"24px 0",color:C.text2}}>Chargement…</div>;

  return(
    <div>
      {displayed.map(z=>{
        const timeStr=now.toLocaleTimeString("fr-FR",{timeZone:z.tz,hour:"2-digit",minute:"2-digit",second:"2-digit"});
        const dateStr=now.toLocaleDateString("fr-FR",{timeZone:z.tz,weekday:"short",day:"numeric",month:"short"});
        const hour=parseInt(now.toLocaleTimeString("en-US",{timeZone:z.tz,hour:"2-digit",hour12:false}));
        return(
          <div key={z.tz} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:C.bg2,borderRadius:12,marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{hour<7||hour>=22?"🌙":"☀️"} {z.city}</div>
              <div style={{fontSize:11,color:C.text2,marginTop:2,textTransform:"capitalize"}}>{dateStr}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20,fontWeight:700,color:"#1a6bb5",fontVariantNumeric:"tabular-nums"}}>{timeStr}</div>
              <button onClick={()=>saveFavs(favs.filter(t=>t!==z.tz))} style={{border:"none",background:"none",color:"#e24b4a",fontSize:16,cursor:"pointer",opacity:0.5}}>✕</button>
            </div>
          </div>
        );
      })}
      {showSearch?(
        <div style={{background:C.bg2,borderRadius:12,padding:12,marginTop:4}}>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une ville…" style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box",marginBottom:8}}/>
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {available.length===0?<div style={{textAlign:"center",padding:"12px 0",color:C.text2,fontSize:13}}>Aucune ville</div>:
              available.map(z=><div key={z.tz} onClick={()=>{saveFavs([...favs,z.tz]);setSearch("");setShowSearch(false);}} style={{padding:"10px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`,fontSize:14,color:C.text}}>{z.city}</div>)
            }
          </div>
          <button onClick={()=>setShowSearch(false)} style={{width:"100%",padding:9,border:`1px solid ${C.border}`,borderRadius:10,background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:8}}>Annuler</button>
        </div>
      ):<button onClick={()=>setShowSearch(true)} style={{width:"100%",padding:11,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:4}}>+ Ajouter une ville</button>}
    </div>
  );
}

const CAT_OPTIONS=[
  {key:"vol",label:"Vols",icon:"✈️"},{key:"transport",label:"Transports",icon:"🚌"},
  {key:"hotel",label:"Hôtels",icon:"🏨"},{key:"activite",label:"Activités",icon:"🎭"},
  {key:"restaurant",label:"Restaurants",icon:"🍽️"},{key:"autre",label:"Autres",icon:"📌"},
];
const COLORS_PDF={vol:"#378add",transport:"#ef9f27",hotel:"#1d9e75",activite:"#d4537e",restaurant:"#9b59b6",autre:"#888"};

function ExportPDF({C,trip,reservations}){
  const [selected,setSelected]=useState(new Set(CAT_OPTIONS.map(c=>c.key)));
  const [inclPrix,setInclPrix]=useState(true);
  const [inclConfirm,setInclConfirm]=useState(true);
  const [inclNotes,setInclNotes]=useState(true);
  const [generating,setGenerating]=useState(false);

  function toggleCat(k){const ns=new Set(selected);ns.has(k)?ns.delete(k):ns.add(k);setSelected(ns);}
  function toggleAll(){setSelected(selected.size===CAT_OPTIONS.length?new Set():new Set(CAT_OPTIONS.map(c=>c.key)));}

  async function generate(){
    setGenerating(true);
    const filtered=reservations.filter(r=>selected.has(r.type)).sort((a,b)=>(a.dateStart||"").localeCompare(b.dateStart||""));

    const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const pageW=210, margin=15, contentW=pageW-margin*2;
    let y=margin;

    // Header
    pdf.setFillColor(26,107,181);
    pdf.rect(0,0,pageW,35,"F");
    pdf.setTextColor(255,255,255);
    pdf.setFontSize(18);pdf.setFont("helvetica","bold");
    pdf.text(trip?.destination||trip?.name||"Mon voyage",margin,15);
    pdf.setFontSize(10);pdf.setFont("helvetica","normal");
    pdf.text(`${trip?.dateStart||""} → ${trip?.dateEnd||""}  ·  Export du ${new Date().toLocaleDateString("fr-FR")}`,margin,24);
    y=45;

    // Grouper par date
    const byDate={};
    filtered.forEach(r=>{const d=r.dateStart||"Sans date";if(!byDate[d])byDate[d]=[];byDate[d].push(r);});

    Object.entries(byDate).forEach(([date,items])=>{
      if(y>260){pdf.addPage();y=margin;}
      // Date label
      const label=date==="Sans date"?"Sans date":new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
      pdf.setFillColor(240,244,248);
      pdf.rect(margin,y,contentW,8,"F");
      pdf.setTextColor(80,80,80);pdf.setFontSize(9);pdf.setFont("helvetica","bold");
      pdf.text(label.charAt(0).toUpperCase()+label.slice(1),margin+3,y+5.5);
      y+=11;

      items.forEach(r=>{
        if(y>255){pdf.addPage();y=margin;}
        const d=r.details||{};
        const lines=[];
        if(r.timeStart)lines.push(`🕐 ${r.timeStart}${r.timeEnd?" → "+r.timeEnd:""}`);
        if(r.type==="vol"){if(d.numVol)lines.push(`Vol : ${d.numVol}`);if(d.aeroportDep)lines.push(`Départ : ${d.aeroportDep}${d.terminalDep?" "+d.terminalDep:""}`);if(d.aeroportArr)lines.push(`Arrivée : ${d.aeroportArr}${d.terminalArr?" "+d.terminalArr:""}`);}
        if(r.type==="hotel"){if(d.adresse)lines.push(`📍 ${d.adresse}`);if(d.checkIn)lines.push(`Check-in : ${d.checkIn}  Check-out : ${d.checkOut||""}`); }
        if(r.type==="transport"){if(d.gareDep)lines.push(`De : ${d.gareDep}`);if(d.gareArr)lines.push(`À : ${d.gareArr}`);if(d.numLigne)lines.push(`N° : ${d.numLigne}`);}
        if(r.type==="activite"){if(d.lieu)lines.push(`📍 ${d.lieu}`);if(d.duree)lines.push(`Durée : ${d.duree}`);}
        if(r.type==="restaurant"){if(d.adresse)lines.push(`📍 ${d.adresse}`);}
        if(inclConfirm&&d.numResa)lines.push(`Réservation : ${d.numResa}`);
        if(inclNotes&&d.notes)lines.push(`Notes : ${d.notes}`);

        const cardH=Math.max(14,8+lines.length*5);
        if(y+cardH>265){pdf.addPage();y=margin;}

        // Couleur de la carte
        const hex=COLORS_PDF[r.type]||"#888";
        const bigInt=parseInt(hex.slice(1),16);
        const rc=(bigInt>>16)&255,gc=(bigInt>>8)&255,bc=bigInt&255;
        pdf.setFillColor(rc,gc,bc);
        pdf.rect(margin,y,3,cardH,"F");
        pdf.setFillColor(rc+(255-rc)*0.9,gc+(255-gc)*0.9,bc+(255-bc)*0.9);
        pdf.rect(margin+3,y,contentW-3,cardH,"F");

        pdf.setTextColor(30,30,30);pdf.setFontSize(11);pdf.setFont("helvetica","bold");
        pdf.text(r.name,margin+6,y+6);

        if(inclPrix&&r.price){
          pdf.setTextColor(26,107,181);pdf.setFontSize(10);pdf.setFont("helvetica","bold");
          pdf.text(`${r.price} €`,pageW-margin,y+6,{align:"right"});
        }

        pdf.setTextColor(80,80,80);pdf.setFontSize(8);pdf.setFont("helvetica","normal");
        lines.forEach((line,li)=>pdf.text(line,margin+6,y+11+li*5));

        y+=cardH+3;
      });
      y+=4;
    });

    if(inclPrix){
      const total=filtered.reduce((s,r)=>s+(parseFloat(r.price)||0),0);
      if(y>260){pdf.addPage();y=margin;}
      pdf.setFillColor(230,241,251);pdf.rect(margin,y,contentW,12,"F");
      pdf.setTextColor(26,107,181);pdf.setFontSize(12);pdf.setFont("helvetica","bold");
      pdf.text("Total",margin+4,y+8);
      pdf.text(`${total.toFixed(0)} €`,pageW-margin,y+8,{align:"right"});
      y+=16;
    }

    pdf.setTextColor(160,160,160);pdf.setFontSize(8);pdf.setFont("helvetica","normal");
    pdf.text(`Pommepoire · ${filtered.length} réservation${filtered.length!==1?"s":""}`,margin,y);

    pdf.save(`${trip?.destination||"voyage"}_pommepoire.pdf`);
    setGenerating(false);
  }

  const count=reservations.filter(r=>selected.has(r.type)).length;

  return(
    <div>
      <div style={{fontSize:13,color:C.text2,marginBottom:16,lineHeight:1.6}}>Sélectionnez les catégories à inclure dans le PDF.</div>
      <div style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Catégories</div>
      <div style={{background:C.bg2,borderRadius:12,overflow:"hidden",marginBottom:12}}>
        <div onClick={toggleAll} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`}}>
          <Check checked={selected.size===CAT_OPTIONS.length}/><span style={{fontSize:14,fontWeight:600,color:C.text}}>Tout sélectionner</span>
        </div>
        {CAT_OPTIONS.map(c=>(
          <div key={c.key} onClick={()=>toggleCat(c.key)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`}}>
            <Check checked={selected.has(c.key)}/><span style={{fontSize:14,color:C.text}}>{c.icon} {c.label}</span>
            <span style={{marginLeft:"auto",fontSize:12,color:C.text2}}>{reservations.filter(r=>r.type===c.key).length}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Options</div>
      <div style={{background:C.bg2,borderRadius:12,overflow:"hidden",marginBottom:20}}>
        {[["inclPrix","Inclure les prix",inclPrix,setInclPrix],["c","Inclure les confirmations",inclConfirm,setInclConfirm],["n","Inclure les notes",inclNotes,setInclNotes]].map(([k,label,val,setter])=>(
          <div key={k} onClick={()=>setter(!val)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.text}}>{label}</span>
            <div style={{width:44,height:26,borderRadius:99,background:val?"#1a6bb5":C.border,position:"relative",transition:"background 0.2s"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:2,left:val?20:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}></div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={generate} disabled={generating||count===0}
        style={{width:"100%",padding:14,background:count===0?"#ccc":"#1a6bb5",border:"none",borderRadius:12,color:"white",fontSize:15,fontWeight:700,cursor:count===0?"not-allowed":"pointer"}}>
        {generating?"Génération…":`📄 Exporter ${count} réservation${count!==1?"s":""} en PDF`}
      </button>
    </div>
  );
}

function Check({checked}){
  return(
    <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${checked?"#1a6bb5":"#ccc"}`,background:checked?"#1a6bb5":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {checked&&<svg width="11" height="9" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
    </div>
  );
}
