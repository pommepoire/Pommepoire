import { useState, useRef, useEffect } from "react";
import { storage, MAPS_KEY } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const TYPES = [
  { key:"vol", label:"Vol", icon:"✈️" },
  { key:"hotel", label:"Hôtel", icon:"🏨" },
  { key:"transport", label:"Transport", icon:"🚌" },
  { key:"activite", label:"Activité", icon:"🎭" },
  { key:"restaurant", label:"Restaurant", icon:"🍽️" },
  { key:"autre", label:"Autre", icon:"📌" },
];

const PAYMENT_OPTIONS = ["Non payé", "Payé en totalité", "Paiement divisé"];

// Champs Détails par type
const DETAIL_FIELDS = {
  vol: [
    { key:"numVol", label:"Numéro de vol", placeholder:"ex : AF1234" },
    { key:"aeroportDep", label:"Aéroport de départ", placeholder:"ex : CDG", maps:true },
    { key:"terminalDep", label:"Terminal de départ", placeholder:"ex : Terminal 2E" },
    { key:"aeroportArr", label:"Aéroport d'arrivée", placeholder:"ex : KUL", maps:true },
    { key:"terminalArr", label:"Terminal d'arrivée", placeholder:"ex : Terminal A" },
    { key:"numResa", label:"N° de réservation / PNR", placeholder:"ex : XK4892" },
    { key:"site", label:"Site de réservation", placeholder:"ex : airfrance.fr" },
  ],
  hotel: [
    { key:"adresse", label:"Adresse", placeholder:"Rechercher un hôtel…", maps:true, places:true },
    { key:"checkIn", label:"Heure de check-in", placeholder:"ex : 15h00" },
    { key:"checkOut", label:"Heure de check-out", placeholder:"ex : 12h00" },
    { key:"numResa", label:"N° de réservation", placeholder:"ex : HBA-20491" },
    { key:"site", label:"Site de réservation", placeholder:"ex : booking.com" },
  ],
  transport: [
    { key:"typeTransport", label:"Type de transport", placeholder:"Train, Bus, Ferry…" },
    { key:"compagnie", label:"Compagnie / Opérateur", placeholder:"ex : Renfe, Flixbus" },
    { key:"numLigne", label:"Numéro de train/bus", placeholder:"ex : TGV 6201" },
    { key:"gareDep", label:"Gare / Arrêt de départ", placeholder:"ex : Paris Gare de Lyon", maps:true, places:true },
    { key:"gareArr", label:"Gare / Arrêt d'arrivée", placeholder:"ex : Barcelone Sants", maps:true, places:true },
    { key:"quai", label:"Quai / Voie", placeholder:"ex : Voie 3" },
    { key:"numResa", label:"N° de réservation", placeholder:"ex : R994-C2" },
    { key:"site", label:"Site de réservation", placeholder:"ex : renfe.com" },
  ],
  activite: [
    { key:"lieu", label:"Lieu / Adresse", placeholder:"Rechercher un lieu…", maps:true, places:true },
    { key:"duree", label:"Durée", placeholder:"ex : 2h30" },
    { key:"pointRdv", label:"Point de rendez-vous", placeholder:"ex : Entrée principale" },
    { key:"numResa", label:"N° de réservation", placeholder:"ex : ACT-1234" },
    { key:"contact", label:"Contact organisateur", placeholder:"ex : +34 93 123 456" },
    { key:"materiel", label:"Matériel nécessaire", placeholder:"ex : Tenue de sport" },
  ],
  restaurant: [
    { key:"adresse", label:"Adresse", placeholder:"Rechercher un restaurant…", maps:true, places:true },
    { key:"nbCouverts", label:"Nombre de couverts", placeholder:"ex : 2" },
    { key:"numResa", label:"N° de réservation", placeholder:"ex : RES-456" },
    { key:"typeCuisine", label:"Type de cuisine", placeholder:"ex : Japonais, Français…" },
    { key:"budget", label:"Budget estimé / personne", placeholder:"ex : 40€" },
    { key:"dressCode", label:"Dress code", placeholder:"ex : Tenue correcte exigée" },
  ],
  autre: [
    { key:"lieu", label:"Lieu / Adresse", placeholder:"ex : Adresse", maps:true, places:true },
    { key:"numResa", label:"N° de réservation", placeholder:"" },
    { key:"contact", label:"Contact", placeholder:"" },
    { key:"site", label:"Site web", placeholder:"" },
  ],
};

export default function ReservationForm({ onClose, onSave, onUpdate, trip, editing, C, tripId, members }) {
  const isEdit = !!editing;
  const [form, setForm] = useState(isEdit ? { ...editing } : {
    type:"vol", name:"",
    dateStart: trip?.dateStart||"", dateEnd: trip?.dateStart||"",
    timeStart:"", timeEnd:"", price:"",
    paymentStatus:"Non payé", paidBy:"", splitAmounts:{},
    details:{},
  });
  const [showDetails, setShowDetails] = useState(isEdit);
  const [attachments, setAttachments] = useState(editing?.attachments||[]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setDetail = (k,v) => setForm(f=>({...f,details:{...f.details,[k]:v}}));

  function handleDateStart(v) {
    set("dateStart",v);
    if (!form.dateEnd || form.dateEnd < v) set("dateEnd",v);
    setError("");
  }

  // Calcul 50/50 automatique
  function handlePaymentStatus(v) {
    set("paymentStatus",v);
    if (v==="Paiement divisé" && form.price && members?.length===2) {
      const half = (parseFloat(form.price)/2).toFixed(2);
      const names = Object.values(members);
      set("splitAmounts",{ [names[0]]:half, [names[1]]:half });
    }
  }

  function handleSplitAmount(name, val) {
    const total = parseFloat(form.price)||0;
    const other = members ? Object.values(members).find(n=>n!==name) : null;
    const thisAmt = parseFloat(val)||0;
    const otherAmt = Math.max(0, total-thisAmt).toFixed(2);
    set("splitAmounts",{ [name]:val, ...(other?{[other]:otherAmt}:{}) });
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const storageRef = ref(storage,`trips/${tripId}/attachments/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef,file);
        const url = await getDownloadURL(storageRef);
        uploaded.push({name:file.name,url,type:file.type});
      }
      setAttachments(a=>[...a,...uploaded]);
    } catch(e) { setError("Erreur upload : "+e.message); }
    setUploading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Le nom est obligatoire."); return; }
    if (form.dateStart&&form.dateEnd&&form.dateEnd<form.dateStart) { setError("La date de retour ne peut pas précéder le départ."); return; }
    setSaving(true);
    const data = {...form,attachments};
    if (isEdit) await onUpdate(editing.id,data);
    else await onSave(data);
    setSaving(false);
    onClose();
  }

  const detailFields = DETAIL_FIELDS[form.type]||[];
  const memberNames = members ? Object.values(members) : [];

  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",zIndex:30}}>
      <div style={{background:C.bg,borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"93%",overflowY:"auto"}}>
        {/* Header sticky */}
        <div style={{padding:"14px 18px 0",position:"sticky",top:0,background:C.bg,zIndex:1}}>
          <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 10px"}}></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:17,fontWeight:700,color:C.text}}>{isEdit?"Modifier":"Nouvelle réservation"}</div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:C.bg2,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:C.text2}}>✕</button>
          </div>
        </div>

        <div style={{padding:"0 18px 32px"}}>
          {/* Types */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:16}}>
            {TYPES.map(t=>(
              <div key={t.key} onClick={()=>set("type",t.key)}
                style={{padding:"9px 6px",border:`0.5px solid ${form.type===t.key?"#1a6bb5":C.border}`,borderRadius:10,textAlign:"center",cursor:"pointer",fontSize:11,color:form.type===t.key?"#1a6bb5":C.text2,background:form.type===t.key?"#e6f1fb":"transparent",fontWeight:form.type===t.key?700:400}}>
                <span style={{fontSize:18,display:"block",marginBottom:3}}>{t.icon}</span>{t.label}
              </div>
            ))}
          </div>

          {error&&<div style={{background:"#fee",border:"1px solid #fcc",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#c00",marginBottom:12}}>{error}</div>}

          {/* ── SECTION ESSENTIEL ── */}
          <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Essentiel</div>

          <F label="Nom / Description *" C={C}>
            <input style={inp(C)} placeholder="Ex : Vol Paris → Kuala Lumpur" value={form.name} onChange={e=>set("name",e.target.value)} />
          </F>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Date de début" C={C}><input style={inp(C)} type="date" value={form.dateStart} onChange={e=>handleDateStart(e.target.value)} /></F>
            <F label="Date de fin" C={C}><input style={inp(C)} type="date" value={form.dateEnd} min={form.dateStart} onChange={e=>{set("dateEnd",e.target.value);setError("");}} /></F>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Heure de début" C={C}><input style={inp(C)} type="time" value={form.timeStart||""} onChange={e=>set("timeStart",e.target.value)} /></F>
            <F label="Heure de fin" C={C}><input style={inp(C)} type="time" value={form.timeEnd||""} onChange={e=>set("timeEnd",e.target.value)} /></F>
          </div>
          <F label="Prix total (€)" C={C}>
            <input style={inp(C)} type="number" placeholder="0" value={form.price} onChange={e=>set("price",e.target.value)} />
          </F>

          {/* Statut paiement */}
          <F label="Statut du paiement" C={C}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {PAYMENT_OPTIONS.map(opt=>(
                <div key={opt} onClick={()=>handlePaymentStatus(opt)}
                  style={{padding:"8px 6px",border:`0.5px solid ${form.paymentStatus===opt?"#1a6bb5":C.border}`,borderRadius:10,textAlign:"center",cursor:"pointer",fontSize:11,color:form.paymentStatus===opt?"#1a6bb5":C.text2,background:form.paymentStatus===opt?"#e6f1fb":"transparent",fontWeight:form.paymentStatus===opt?700:400,lineHeight:1.3}}>
                  {opt}
                </div>
              ))}
            </div>
          </F>

          {form.paymentStatus==="Payé en totalité" && memberNames.length>0 && (
            <F label="Payé par" C={C}>
              <div style={{display:"flex",gap:8}}>
                {memberNames.map(name=>(
                  <div key={name} onClick={()=>set("paidBy",name)}
                    style={{flex:1,padding:"9px",border:`0.5px solid ${form.paidBy===name?"#1a6bb5":C.border}`,borderRadius:10,textAlign:"center",cursor:"pointer",fontSize:13,color:form.paidBy===name?"#1a6bb5":C.text2,background:form.paidBy===name?"#e6f1fb":"transparent",fontWeight:form.paidBy===name?700:400}}>
                    {name}
                  </div>
                ))}
              </div>
            </F>
          )}

          {form.paymentStatus==="Paiement divisé" && memberNames.length>0 && (
            <F label="Répartition du paiement" C={C}>
              <div style={{background:C.bg2,borderRadius:10,padding:"10px 12px"}}>
                {memberNames.map(name=>(
                  <div key={name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:13,color:C.text,flex:1,fontWeight:500}}>{name}</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" value={form.splitAmounts?.[name]||""} onChange={e=>handleSplitAmount(name,e.target.value)}
                        style={{width:80,padding:"7px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,textAlign:"right",background:C.bg,color:C.text}} />
                      <span style={{fontSize:13,color:C.text2}}>€</span>
                    </div>
                  </div>
                ))}
                {form.price && <div style={{fontSize:11,color:C.text2,marginTop:4,textAlign:"right"}}>Total : {form.price} €</div>}
              </div>
            </F>
          )}

          {/* ── SECTION DÉTAILS ── */}
          <div onClick={()=>setShowDetails(!showDetails)}
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",cursor:"pointer",borderTop:`0.5px solid ${C.border}`,marginTop:8,marginBottom:showDetails?14:0}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px"}}>Détails {TYPES.find(t=>t.key===form.type)?.label}</div>
            <div style={{fontSize:18,color:C.text2,transform:showDetails?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▾</div>
          </div>

          {showDetails && (
            <>
              {detailFields.map(field=>(
                <F key={field.key} label={field.label} C={C}>
                  {field.places ? (
                    <PlacesInput
                      value={form.details?.[field.key]||""}
                      onChange={v=>setDetail(field.key,v)}
                      placeholder={field.placeholder}
                      C={C}
                    />
                  ) : (
                    <input style={inp(C)} placeholder={field.placeholder} value={form.details?.[field.key]||""} onChange={e=>setDetail(field.key,e.target.value)} />
                  )}
                </F>
              ))}

              <F label="Notes" C={C}>
                <input style={inp(C)} placeholder="Informations complémentaires…" value={form.details?.notes||""} onChange={e=>setDetail("notes",e.target.value)} />
              </F>

              <F label="Pièces jointes" C={C}>
                <div onClick={()=>fileRef.current.click()}
                  style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:14,textAlign:"center",color:C.text2,fontSize:13,cursor:"pointer",background:C.bg2}}>
                  {uploading?"⏳ Upload en cours…":"📎 Ajouter un fichier (PDF, photo…)"}
                </div>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic" style={{display:"none"}} onChange={handleFileUpload} />
                {attachments.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginTop:6,padding:"6px 10px",background:C.bg2,borderRadius:8}}>
                    <span>{a.type?.includes("pdf")?"📄":"🖼️"}</span>
                    <a href={a.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:12,color:"#1a6bb5",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</a>
                    <button onClick={()=>setAttachments(att=>att.filter((_,j)=>j!==i))} style={{border:"none",background:"none",color:"#e24b4a",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                ))}
              </F>
            </>
          )}

          <button onClick={handleSave} disabled={saving||uploading}
            style={{width:"100%",padding:14,background:"#1a6bb5",border:"none",borderRadius:12,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16,opacity:(saving||uploading)?0.7:1}}>
            {saving?"Enregistrement…":isEdit?"Enregistrer les modifications":"Enregistrer"}
          </button>
          <button onClick={onClose}
            style={{width:"100%",marginTop:10,padding:13,border:`1.5px solid ${C.border}`,borderRadius:12,background:"none",color:C.text,fontSize:14,fontWeight:600,cursor:"pointer"}}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// Google Places Autocomplete
function PlacesInput({ value, onChange, placeholder, C }) {
  const [query, setQuery] = useState(value||"");
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const timer = useRef(null);

  useEffect(() => { setQuery(value||""); }, [value]);

  function handleChange(v) {
    setQuery(v);
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.length < 3) { setSuggestions([]); return; }
    timer.current = setTimeout(() => fetchPlaces(v), 400);
  }

  async function fetchPlaces(input) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${MAPS_KEY}&language=fr`;
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      const parsed = JSON.parse(data.contents);
      setSuggestions(parsed.predictions||[]);
      setShowList(true);
    } catch(e) { setSuggestions([]); }
  }

  function select(place) {
    setQuery(place.description);
    onChange(place.description);
    setSuggestions([]);
    setShowList(false);
  }

  return (
    <div style={{position:"relative"}}>
      <input style={inp(C)} placeholder={placeholder} value={query} onChange={e=>handleChange(e.target.value)} onBlur={()=>setTimeout(()=>setShowList(false),200)} onFocus={()=>suggestions.length>0&&setShowList(true)} />
      {showList && suggestions.length>0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,zIndex:50,maxHeight:200,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
          {suggestions.map((s,i)=>(
            <div key={i} onMouseDown={()=>select(s)} style={{padding:"10px 12px",cursor:"pointer",borderBottom:`0.5px solid ${C.border}`,fontSize:13,color:C.text}}>
              <div style={{fontWeight:500}}>{s.structured_formatting?.main_text||s.description}</div>
              <div style={{fontSize:11,color:C.text2,marginTop:2}}>{s.structured_formatting?.secondary_text||""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function F({ label, children, C }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:C?.text2||"#888",marginBottom:4,fontWeight:600}}>{label}</div>
      {children}
    </div>
  );
}

const inp = C => ({ width:"100%",padding:"11px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box" });
