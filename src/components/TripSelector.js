import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function TripSelector({ user, currentTripId, onSwitch, onClose, C }) {
  const [trips, setTrips] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:"", destination:"", dateStart:"", dateEnd:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrips() {
      const q = query(collection(db, "trips"), where("members", "array-contains", user.uid));
      const snap = await getDocs(q);
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    loadTrips();
  }, [user.uid]);

  async function createTrip() {
    if (!form.destination && !form.name) { setError("Donnez un nom au voyage."); return; }
    if (form.dateStart && form.dateEnd && form.dateEnd < form.dateStart) { setError("La date de retour ne peut pas précéder le départ."); return; }
    setLoading(true);
    const code = Math.random().toString(36).substring(2,8).toUpperCase();
    const tripId = `trip_${Date.now()}`;
    await addDoc(collection(db, "trips"), {
      name: form.name || form.destination,
      destination: form.destination,
      dateStart: form.dateStart,
      dateEnd: form.dateEnd,
      code,
      members: [user.uid],
      memberNames: { [user.uid]: user.displayName || "Moi" },
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    const q = query(collection(db, "trips"), where("code", "==", code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, "users", user.uid), { tripId: snap.docs[0].id });
      onSwitch(snap.docs[0].id);
    }
    setLoading(false);
  }

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:30,display:"flex",alignItems:"flex-end",borderRadius:0}} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{background:C.bg,borderRadius:"20px 20px 0 0",padding:"18px 18px 32px",width:"100%",maxHeight:"85%",overflowY:"auto"}}>
        <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 16px"}}></div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>Mes voyages</div>

        {trips.map(t => (
          <div key={t.id} onClick={() => onSwitch(t.id)}
            style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,marginBottom:8,cursor:"pointer",background:t.id===currentTripId?"#e6f1fb":C.bg2,border:`1px solid ${t.id===currentTripId?"#1a6bb5":C.border}`}}>
            <div style={{fontSize:22}}>✈️</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:t.id===currentTripId?"#1a6bb5":C.text}}>{t.destination || t.name}</div>
              {t.dateStart && <div style={{fontSize:12,color:C.text2,marginTop:2}}>{t.dateStart}{t.dateEnd ? ` → ${t.dateEnd}` : ""}</div>}
            </div>
            {t.id===currentTripId && <div style={{fontSize:11,background:"#1a6bb5",color:"white",padding:"2px 8px",borderRadius:99}}>Actif</div>}
          </div>
        ))}

        {!creating ? (
          <button onClick={() => setCreating(true)} style={{width:"100%",padding:12,border:"1.5px dashed #ccc",borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:4}}>
            + Créer un nouveau voyage
          </button>
        ) : (
          <div style={{background:C.bg2,borderRadius:12,padding:14,marginTop:8}}>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>Nouveau voyage</div>
            {error && <div style={{background:"#fee",border:"1px solid #fcc",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#c00",marginBottom:10}}>{error}</div>}
            <input style={inp(C)} placeholder="Destination" value={form.destination} onChange={e => set("destination",e.target.value)} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div>
                <div style={{fontSize:11,color:C.text2,marginBottom:3}}>Départ</div>
                <input style={inp(C)} type="date" value={form.dateStart} onChange={e => set("dateStart",e.target.value)} />
              </div>
              <div>
                <div style={{fontSize:11,color:C.text2,marginBottom:3}}>Retour</div>
                <input style={inp(C)} type="date" value={form.dateEnd} min={form.dateStart} onChange={e => set("dateEnd",e.target.value)} />
              </div>
            </div>
            <button onClick={createTrip} disabled={loading} style={{width:"100%",padding:12,background:"#1a6bb5",border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:600,cursor:"pointer"}}>
              {loading ? "Création..." : "Créer"}
            </button>
            <button onClick={() => setCreating(false)} style={{width:"100%",padding:8,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:4}}>Annuler</button>
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",padding:10,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:8}}>Fermer</button>
      </div>
    </div>
  );
}

const inp = C => ({ width:"100%",padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box",marginBottom:10 });
