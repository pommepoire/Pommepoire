import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function TripSelector({ user, currentTripId, onSwitch, onClose, C }) {
  const [trips, setTrips] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState({ destination:"", dateStart:"", dateEnd:"" });
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sheetRef = useRef();
  const startY = useRef(null);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    async function load() {
      const q = query(collection(db,"trips"), where("members","array-contains",user.uid));
      const snap = await getDocs(q);
      setTrips(snap.docs.map(d => ({id:d.id,...d.data()})));
    }
    load();
  }, [user.uid]);

  function onTouchStart(e) { startY.current = e.touches[0].clientY; }
  function onTouchMove(e) { const dy = e.touches[0].clientY - startY.current; if (dy>0) setTranslateY(dy); }
  function onTouchEnd() { if (translateY > 80) onClose(); else setTranslateY(0); startY.current = null; }

  async function createTrip() {
    if (!form.destination) { setError("Entrez une destination."); return; }
    if (form.dateStart && form.dateEnd && form.dateEnd < form.dateStart) { setError("La date de retour précède le départ."); return; }
    setLoading(true);
    const code = Math.random().toString(36).substring(2,8).toUpperCase();
    const newRef = doc(collection(db,"trips"));
    await setDoc(newRef, {
      name: form.destination,
      destination: form.destination,
      dateStart: form.dateStart || "",
      dateEnd: form.dateEnd || "",
      code, members:[user.uid],
      memberNames:{ [user.uid]: user.displayName || "Moi" },
      createdBy: user.uid, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db,"users",user.uid), { tripId: newRef.id });
    onSwitch(newRef.id);
    setLoading(false);
  }

  async function saveEditTrip() {
    if (editForm.dateStart && editForm.dateEnd && editForm.dateEnd < editForm.dateStart) { setError("La date de retour précède le départ."); return; }
    setLoading(true);
    await updateDoc(doc(db,"trips",editingTrip.id), {
      destination: editForm.destination,
      name: editForm.destination,
      dateStart: editForm.dateStart,
      dateEnd: editForm.dateEnd,
    });
    setTrips(ts => ts.map(t => t.id===editingTrip.id ? {...t,...editForm,name:editForm.destination} : t));
    setEditingTrip(null);
    setLoading(false);
  }

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:30,display:"flex",alignItems:"flex-end"}} onClick={e => e.target===e.currentTarget && onClose()}>
      <div ref={sheetRef} style={{background:C.bg,borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"85%",overflowY:"auto",transform:`translateY(${translateY}px)`,transition:translateY===0?"transform 0.3s":"none"}}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        <div style={{padding:"14px 18px 0",position:"sticky",top:0,background:C.bg,zIndex:1}}>
          <div style={{width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 10px"}}></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:700,color:C.text}}>Mes voyages</div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:C.bg2,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:16,color:C.text2}}>✕</button>
          </div>
        </div>

        <div style={{padding:"0 18px 32px"}}>
          {error && <div style={{background:"#fee",border:"1px solid #fcc",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#c00",marginBottom:10}}>{error}</div>}

          {trips.map(t => (
            <div key={t.id} style={{borderRadius:12,marginBottom:8,border:`1px solid ${t.id===currentTripId?"#1a6bb5":C.border}`,overflow:"hidden"}}>
              {editingTrip?.id===t.id ? (
                <div style={{padding:14,background:C.bg2}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Modifier le voyage</div>
                  <input style={inp(C)} placeholder="Destination" value={editForm.destination} onChange={e => setEditForm(f=>({...f,destination:e.target.value}))} />
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div>
                      <div style={{fontSize:11,color:C.text2,marginBottom:3}}>Départ</div>
                      <input style={inp(C)} type="date" value={editForm.dateStart} onChange={e => setEditForm(f=>({...f,dateStart:e.target.value}))} />
                    </div>
                    <div>
                      <div style={{fontSize:11,color:C.text2,marginBottom:3}}>Retour</div>
                      <input style={inp(C)} type="date" value={editForm.dateEnd} min={editForm.dateStart} onChange={e => setEditForm(f=>({...f,dateEnd:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                    <button onClick={saveEditTrip} disabled={loading} style={{padding:10,background:"#1a6bb5",border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>{loading?"…":"Enregistrer"}</button>
                    <button onClick={() => setEditingTrip(null)} style={{padding:10,border:`1px solid ${C.border}`,borderRadius:10,background:"none",color:C.text,fontSize:14,cursor:"pointer"}}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",background:t.id===currentTripId?"#f0f7ff":C.bg}} onClick={() => onSwitch(t.id)}>
                  <div style={{fontSize:22}}>✈️</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:t.id===currentTripId?"#1a6bb5":C.text}}>{t.destination||t.name}</div>
                    {t.dateStart && <div style={{fontSize:12,color:C.text2,marginTop:2}}>{t.dateStart}{t.dateEnd?` → ${t.dateEnd}`:""}</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {t.id===currentTripId && <div style={{fontSize:11,background:"#1a6bb5",color:"white",padding:"2px 8px",borderRadius:99}}>Actif</div>}
                    <button onClick={e => { e.stopPropagation(); setEditingTrip(t); setEditForm({destination:t.destination||t.name||"",dateStart:t.dateStart||"",dateEnd:t.dateEnd||""}); setError(""); }}
                      style={{fontSize:12,color:"#1a6bb5",border:`1px solid #1a6bb5`,borderRadius:8,background:"none",padding:"4px 8px",cursor:"pointer"}}>
                      Modifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!creating ? (
            <button onClick={() => setCreating(true)} style={{width:"100%",padding:12,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:4}}>
              + Créer un nouveau voyage
            </button>
          ) : (
            <div style={{background:C.bg2,borderRadius:12,padding:14,marginTop:8}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Nouveau voyage</div>
              <input style={inp(C)} placeholder="Destination" value={form.destination} onChange={e => set("destination",e.target.value)} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><div style={{fontSize:11,color:C.text2,marginBottom:3}}>Départ</div><input style={inp(C)} type="date" value={form.dateStart} onChange={e => set("dateStart",e.target.value)} /></div>
                <div><div style={{fontSize:11,color:C.text2,marginBottom:3}}>Retour</div><input style={inp(C)} type="date" value={form.dateEnd} min={form.dateStart} onChange={e => set("dateEnd",e.target.value)} /></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                <button onClick={createTrip} disabled={loading} style={{padding:12,background:"#1a6bb5",border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:700,cursor:"pointer"}}>{loading?"Création...":"Créer"}</button>
                <button onClick={() => setCreating(false)} style={{padding:12,border:`1px solid ${C.border}`,borderRadius:10,background:"none",color:C.text,fontSize:14,cursor:"pointer"}}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = C => ({ width:"100%",padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,background:C.bg,color:C.text,boxSizing:"border-box",marginBottom:8 });
