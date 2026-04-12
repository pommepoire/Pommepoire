import { useState, useRef } from "react";
import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

const TYPES = [
  { key:"vol",label:"Vol",icon:"✈️" },
  { key:"hotel",label:"Hôtel",icon:"🏨" },
  { key:"transport",label:"Transport",icon:"🚌" },
  { key:"activite",label:"Activité",icon:"🎭" },
  { key:"restaurant",label:"Restaurant",icon:"🍽️" },
  { key:"autre",label:"Autre",icon:"📌" },
];

export default function ReservationForm({ onClose, onSave, onUpdate, trip, editing, C, tripId }) {
  const isEdit = !!editing;
  const [form, setForm] = useState(isEdit ? { ...editing } : {
    type:"vol",name:"",dateStart:trip?.dateStart||"",dateEnd:trip?.dateStart||"",
    time:"",price:"",confirmation:"",location:"",website:"",notes:""
  });
  const [attachments, setAttachments] = useState(editing?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  function validateDates() {
    if (form.dateStart && form.dateEnd && form.dateEnd < form.dateStart) {
      setError("La date de retour ne peut pas précéder la date de départ.");
      return false;
    }
    return true;
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const storageRef = ref(storage, `trips/${tripId}/attachments/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploaded.push({ name: file.name, url, type: file.type });
      }
      setAttachments(a => [...a, ...uploaded]);
    } catch(e) { setError("Erreur lors de l'upload : " + e.message); }
    setUploading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Le nom est obligatoire."); return; }
    if (!validateDates()) return;
    setSaving(true);
    const data = { ...form, attachments };
    if (isEdit) {
      await onUpdate(editing.id, data);
    } else {
      await onSave(data);
    }
    setSaving(false);
    onClose();
  }

  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",zIndex:30}}>
      <div style={{background:C.bg,borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"92%",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 16px"}}></div>
        <div style={{fontSize:17,fontWeight:700,marginBottom:14,color:C.text}}>{isEdit ? "Modifier la réservation" : "Nouvelle réservation"}</div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:14}}>
          {TYPES.map(t => (
            <div key={t.key} onClick={() => set("type",t.key)}
              style={{padding:"9px 6px",border:`0.5px solid ${form.type===t.key?"#1a6bb5":C.border}`,borderRadius:10,textAlign:"center",cursor:"pointer",fontSize:11,color:form.type===t.key?"#1a6bb5":C.text2,background:form.type===t.key?"#e6f1fb":"transparent",fontWeight:form.type===t.key?700:400}}>
              <span style={{fontSize:18,display:"block",marginBottom:3}}>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>

        {error && <div style={{background:"#fee",border:"1px solid #fcc",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#c00",marginBottom:12}}>{error}</div>}

        <F label="Nom / Description *" C={C}><input style={inp(C)} placeholder="Ex : Vol Paris → Barcelone" value={form.name} onChange={e => set("name",e.target.value)} /></F>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <F label="Date de début" C={C}><input style={inp(C)} type="date" value={form.dateStart} onChange={e => { set("dateStart",e.target.value); setError(""); }} /></F>
          <F label="Date de fin" C={C}><input style={inp(C)} type="date" value={form.dateEnd} min={form.dateStart} onChange={e => { set("dateEnd",e.target.value); setError(""); }} /></F>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <F label="Heure" C={C}><input style={inp(C)} type="time" value={form.time} onChange={e => set("time",e.target.value)} /></F>
          <F label="Prix (€)" C={C}><input style={inp(C)} type="number" placeholder="0" value={form.price} onChange={e => set("price",e.target.value)} /></F>
        </div>
        <F label="N° de confirmation" C={C}><input style={inp(C)} placeholder="Ex : XK4892" value={form.confirmation} onChange={e => set("confirmation",e.target.value)} /></F>
        <F label="Lieu / Adresse" C={C}><input style={inp(C)} placeholder="Ex : Terminal 2E, CDG" value={form.location} onChange={e => set("location",e.target.value)} /></F>
        <F label="Site de réservation" C={C}><input style={inp(C)} placeholder="Ex : booking.com" value={form.website} onChange={e => set("website",e.target.value)} /></F>
        <F label="Notes" C={C}><input style={inp(C)} placeholder="Bagages inclus, early check-in…" value={form.notes} onChange={e => set("notes",e.target.value)} /></F>

        <F label="Pièces jointes" C={C}>
          <div onClick={() => fileRef.current.click()}
            style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:12,textAlign:"center",color:C.text2,fontSize:13,cursor:"pointer"}}>
            {uploading ? "Upload en cours…" : "📎 Ajouter un fichier (PDF, photo…)"}
          </div>
          <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic" style={{display:"none"}} onChange={handleFileUpload} />
          {attachments.map((a,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginTop:6,padding:"6px 10px",background:C.bg2,borderRadius:8}}>
              <span style={{fontSize:14}}>{a.type?.includes("pdf")?"📄":"🖼️"}</span>
              <a href={a.url} target="_blank" rel="noreferrer" style={{flex:1,fontSize:12,color:"#1a6bb5",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</a>
              <button onClick={() => setAttachments(att => att.filter((_,j)=>j!==i))} style={{border:"none",background:"none",color:"#e24b4a",cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          ))}
        </F>

        <button onClick={handleSave} disabled={saving||uploading}
          style={{width:"100%",padding:13,background:"#1a6bb5",border:"none",borderRadius:12,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:14,opacity:(saving||uploading)?0.7:1}}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Enregistrer"}
        </button>
        <button onClick={onClose} style={{width:"100%",marginTop:8,padding:10,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer"}}>Annuler</button>
      </div>
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

const inp = C => ({ width:"100%",padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box" });
