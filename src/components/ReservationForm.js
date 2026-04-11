import { useState } from "react";

const TYPES = [
  { key:"vol", label:"Vol", icon:"✈️" },
  { key:"hotel", label:"Hôtel", icon:"🏨" },
  { key:"transport", label:"Transport", icon:"🚌" },
  { key:"activite", label:"Activité", icon:"🎭" },
  { key:"restaurant", label:"Restaurant", icon:"🍽️" },
  { key:"autre", label:"Autre", icon:"📌" },
];

export default function ReservationForm({ onClose, onSave, trip }) {
  const [form, setForm] = useState({
    type:"vol", name:"", dateStart: trip?.dateStart || "", dateEnd: trip?.dateStart || "",
    time:"", price:"", confirmation:"", location:"", website:"", notes:""
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  }

  return (
    <div style={s.overlay}>
      <div style={s.sheet}>
        <div style={s.handle}></div>
        <div style={s.title}>Nouvelle réservation</div>

        <div style={s.typeGrid}>
          {TYPES.map(t => (
            <div key={t.key} style={{...s.typeChip, ...(form.type===t.key ? s.typeChipActive : {})}}
              onClick={() => set("type", t.key)}>
              <span style={{fontSize:18, display:"block", marginBottom:3}}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        <Field label="Nom / Description" required>
          <input style={s.input} placeholder="Ex : Vol Paris → Barcelone" value={form.name} onChange={e => set("name", e.target.value)} />
        </Field>
        <div style={s.row}>
          <Field label="Date de début"><input style={s.input} type="date" value={form.dateStart} onChange={e => set("dateStart", e.target.value)} /></Field>
          <Field label="Date de fin"><input style={s.input} type="date" value={form.dateEnd} onChange={e => set("dateEnd", e.target.value)} /></Field>
        </div>
        <div style={s.row}>
          <Field label="Heure"><input style={s.input} type="time" value={form.time} onChange={e => set("time", e.target.value)} /></Field>
          <Field label="Prix (€)"><input style={s.input} type="number" placeholder="0" value={form.price} onChange={e => set("price", e.target.value)} /></Field>
        </div>
        <Field label="N° de confirmation">
          <input style={s.input} placeholder="Ex : XK4892" value={form.confirmation} onChange={e => set("confirmation", e.target.value)} />
        </Field>
        <Field label="Lieu / Adresse">
          <input style={s.input} placeholder="Ex : Terminal 2E, CDG" value={form.location} onChange={e => set("location", e.target.value)} />
        </Field>
        <Field label="Site de réservation">
          <input style={s.input} type="url" placeholder="Ex : booking.com, airfrance.fr…" value={form.website} onChange={e => set("website", e.target.value)} />
        </Field>
        <Field label="Notes">
          <input style={s.input} placeholder="Bagages inclus, early check-in…" value={form.notes} onChange={e => set("notes", e.target.value)} />
        </Field>

        <button style={s.btnSave} onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button style={s.btnCancel} onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12, color:"#888", marginBottom:4, fontWeight:600}}>
        {label}{required && <span style={{color:"#e24b4a"}}> *</span>}
      </div>
      {children}
    </div>
  );
}

const s = {
  overlay: { position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", zIndex:30, borderRadius:20 },
  sheet: { background:"#fff", borderRadius:"20px 20px 0 0", padding:"18px 18px 32px", width:"100%", maxHeight:"90%", overflowY:"auto" },
  handle: { width:36, height:4, background:"#ddd", borderRadius:99, margin:"0 auto 16px" },
  title: { fontSize:17, fontWeight:700, marginBottom:14, color:"#111" },
  typeGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginBottom:14 },
  typeChip: { padding:"9px 6px", border:"0.5px solid #e0e0e0", borderRadius:10, textAlign:"center", cursor:"pointer", fontSize:11, color:"#666" },
  typeChipActive: { borderColor:"#1a6bb5", background:"#e6f1fb", color:"#1a6bb5", fontWeight:600 },
  row: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  input: { width:"100%", padding:"10px 12px", border:"1px solid #ddd", borderRadius:10, fontSize:14, background:"#fff", boxSizing:"border-box" },
  btnSave: { width:"100%", padding:13, background:"#1a6bb5", border:"none", borderRadius:12, color:"white", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:14 },
  btnCancel: { width:"100%", marginTop:8, padding:10, border:"none", background:"none", color:"#999", fontSize:13, cursor:"pointer" },
};
