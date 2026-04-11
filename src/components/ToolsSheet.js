import { useState } from "react";

const RATES = {
  EUR:{USD:1.085,GBP:0.855,JPY:163.2,CHF:0.962,CAD:1.47,AUD:1.64,EUR:1},
  USD:{EUR:0.922,GBP:0.788,JPY:150.4,CHF:0.887,CAD:1.355,AUD:1.512,USD:1},
  GBP:{EUR:1.17,USD:1.269,JPY:190.8,CHF:1.125,CAD:1.867,AUD:2.08,GBP:1},
  JPY:{EUR:0.00613,USD:0.00665,GBP:0.00524,CHF:0.0059,CAD:0.009,AUD:0.01,JPY:1},
  CHF:{EUR:1.039,USD:1.127,GBP:0.889,JPY:169.6,CAD:1.527,AUD:1.703,CHF:1},
  CAD:{EUR:0.68,USD:0.738,GBP:0.535,JPY:111,CHF:0.655,AUD:1.115,CAD:1},
  AUD:{EUR:0.61,USD:0.661,GBP:0.48,JPY:99.5,CHF:0.587,CAD:0.897,AUD:1},
};

const TOOLS = [
  { key:"converter", label:"Convertisseur", icon:"💱", sub:"Devises" },
  { key:"checklist", label:"Checklist", icon:"✅", sub:"Pré-départ" },
  { key:"destination", label:"Destination", icon:"🗺️", sub:"Infos utiles" },
  { key:"weather", label:"Météo", icon:"🌤️", sub:"Prévisions" },
  { key:"scanner", label:"Scanner", icon:"📷", sub:"Documents" },
  { key:"emergency", label:"Urgences", icon:"🆘", sub:"Contacts" },
];

export default function ToolsSheet({ onClose }) {
  const [tool, setTool] = useState(null);

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.sheet}>
        <div style={s.handle}></div>
        {!tool ? (
          <>
            <div style={s.title}>Outils</div>
            <div style={s.grid}>
              {TOOLS.map(t => (
                <div key={t.key} style={s.toolBtn} onClick={() => setTool(t.key)}>
                  <div style={s.toolIcon}>{t.icon}</div>
                  <div style={s.toolLabel}>{t.label}</div>
                  <div style={s.toolSub}>{t.sub}</div>
                </div>
              ))}
            </div>
            <button style={s.closeBtn} onClick={onClose}>Fermer</button>
          </>
        ) : tool === "converter" ? (
          <Converter onBack={() => setTool(null)} />
        ) : tool === "checklist" ? (
          <Checklist onBack={() => setTool(null)} />
        ) : tool === "emergency" ? (
          <Emergency onBack={() => setTool(null)} />
        ) : (
          <div>
            <BackBtn onClick={() => setTool(null)} />
            <div style={{textAlign:"center", padding:"40px 0", color:"#aaa", fontSize:14}}>
              Fonctionnalité à venir 🚧
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{border:"none", background:"none", cursor:"pointer", fontSize:20, color:"#888", marginBottom:14}}>‹ Retour</button>;
}

function Converter({ onBack }) {
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [val, setVal] = useState("100");

  const rate = (RATES[from]||{})[to] || 1;
  const result = (parseFloat(val)||0) * rate;

  function press(k) {
    setVal(v => {
      if (k === "C") return "0";
      if (k === "⌫") return v.length > 1 ? v.slice(0,-1) : "0";
      if (k === ".") return v.includes(".") ? v : v+".";
      if (k === "00") return v === "0" ? "0" : v+"00";
      return v === "0" ? k : v+k;
    });
  }

  return (
    <div>
      <BackBtn onClick={onBack} />
      <div style={s.convScreen}>
        <div style={s.convCurrencies}>
          <CurrencySelect value={from} onChange={setFrom} />
          <span style={{color:"#999", fontSize:18}}>→</span>
          <CurrencySelect value={to} onChange={setTo} />
        </div>
        <div style={{textAlign:"right", padding:"4px 0 8px"}}>
          <div style={s.convAmount}>{val}</div>
          <div style={s.convResult}>= {result.toFixed(2)} {to}</div>
          <div style={s.convRate}>1 {from} = {rate.toFixed(4)} {to} · taux indicatif</div>
        </div>
      </div>
      <div style={s.calcGrid}>
        {[["C","00",".","⌫"],["7","8","9",""],["4","5","6",""],["1","2","3",""],["0","","",""]].map((row,i) =>
          row.map((k,j) => k ? (
            <button key={`${i}${j}`} style={{...s.calcBtn, ...(["C"].includes(k)?{color:"#e24b4a"}:{}), ...(k==="⌫"||k==="."||k==="00"?{background:"#f4f4f4",color:"#1a6bb5"}:{})}}
              onClick={() => press(k)}>{k}</button>
          ) : null)
        )}
        <button style={{...s.calcBtn, background:"#1a6bb5", color:"white", gridRow:"span 3", fontSize:13, fontWeight:700}}>
          Convertir
        </button>
      </div>
    </div>
  );
}

function CurrencySelect({ value, onChange }) {
  const currencies = ["EUR","USD","GBP","JPY","CHF","CAD","AUD"];
  const flags = {EUR:"🇪🇺",USD:"🇺🇸",GBP:"🇬🇧",JPY:"🇯🇵",CHF:"🇨🇭",CAD:"🇨🇦",AUD:"🇦🇺"};
  return (
    <select style={s.convSelect} value={value} onChange={e => onChange(e.target.value)}>
      {currencies.map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
    </select>
  );
}

const CHECKLIST_ITEMS = [
  { cat:"Documents", items:["Passeport / Carte d'identité","Billets imprimés ou téléchargés","Assurance voyage","EHIC / Carte européenne"] },
  { cat:"Logistique", items:["Prévenir la banque","Forfait data international","Télécharger carte hors-ligne","Réserver activités clés"] },
  { cat:"Bagages", items:["Adaptateur de prise","Chargeurs","Médicaments essentiels","Photocopies documents"] },
];

function Checklist({ onBack }) {
  const [checked, setChecked] = useState({});
  const toggle = (k) => setChecked(c => ({...c, [k]: !c[k]}));
  return (
    <div>
      <BackBtn onClick={onBack} />
      {CHECKLIST_ITEMS.map(group => (
        <div key={group.cat} style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:6}}>{group.cat}</div>
          {group.items.map(item => (
            <div key={item} style={s.checkItem} onClick={() => toggle(item)}>
              <div style={{...s.checkBox, ...(checked[item]?{background:"#1a6bb5",borderColor:"#1a6bb5"}:{})}}>
                {checked[item] && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <span style={{fontSize:14, color: checked[item]?"#aaa":"#111", textDecoration: checked[item]?"line-through":"none"}}>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Emergency({ onBack }) {
  return (
    <div>
      <BackBtn onClick={onBack} />
      {[
        {label:"Urgences générales", val:"112", color:"#e24b4a"},
        {label:"Police", val:"091 (ES) / 17 (FR)", color:"#378add"},
        {label:"SAMU", val:"061 (ES) / 15 (FR)", color:"#1d9e75"},
        {label:"Ambassade France (Barcelone)", val:"+34 93 270 30 00", color:"#888"},
      ].map(e => (
        <div key={e.label} style={s.emergencyCard}>
          <div style={{fontSize:12, color:"#888"}}>{e.label}</div>
          <div style={{fontSize:18, fontWeight:700, color:e.color, marginTop:2}}>{e.val}</div>
        </div>
      ))}
    </div>
  );
}

const s = {
  overlay: { position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"flex-end", zIndex:20, borderRadius:20 },
  sheet: { background:"#fff", borderRadius:"20px 20px 0 0", padding:"16px 20px 28px", width:"100%", maxHeight:"85%", overflowY:"auto" },
  handle: { width:36, height:4, background:"#ddd", borderRadius:99, margin:"0 auto 16px" },
  title: { fontSize:15, fontWeight:700, color:"#111", marginBottom:14 },
  grid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 },
  toolBtn: { background:"#f8f9fa", border:"0.5px solid #e8e8e8", borderRadius:12, padding:"14px 8px", textAlign:"center", cursor:"pointer" },
  toolIcon: { fontSize:24, marginBottom:6 },
  toolLabel: { fontSize:12, color:"#111", fontWeight:600 },
  toolSub: { fontSize:10, color:"#888", marginTop:2 },
  closeBtn: { width:"100%", marginTop:14, padding:11, border:"none", background:"none", color:"#999", fontSize:13, cursor:"pointer" },
  convScreen: { background:"#f8f9fa", borderRadius:12, padding:14, marginBottom:12 },
  convCurrencies: { display:"flex", gap:8, alignItems:"center", marginBottom:10 },
  convSelect: { flex:1, padding:8, border:"1px solid #ddd", borderRadius:8, background:"#fff", fontSize:14 },
  convAmount: { fontSize:30, fontWeight:700, color:"#111" },
  convResult: { fontSize:18, color:"#1a6bb5", marginTop:4 },
  convRate: { fontSize:11, color:"#999", marginTop:2 },
  calcGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 },
  calcBtn: { padding:"14px 8px", borderRadius:10, border:"0.5px solid #e8e8e8", background:"#fff", fontSize:16, cursor:"pointer", textAlign:"center" },
  checkItem: { display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"0.5px solid #f0f0f0", cursor:"pointer" },
  checkBox: { width:18, height:18, borderRadius:5, border:"1.5px solid #ccc", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  emergencyCard: { background:"#f8f9fa", borderRadius:10, padding:"12px 14px", marginBottom:8 },
};
