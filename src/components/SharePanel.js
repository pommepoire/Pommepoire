import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export function SharePanel({ trip, tripId, onClose, onSignOut, currentUser, C }) {
  const members = Object.entries(trip?.memberNames || {});
  const code = trip?.code || "---";
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || "");
  const [saving, setSaving] = useState(false);

  async function saveName() {
    setSaving(true);
    await updateProfile(auth.currentUser, { displayName: newName });
    const memberNames = { ...trip.memberNames, [currentUser.uid]: newName };
    await updateDoc(doc(db, "trips", tripId), { memberNames });
    setEditName(false);
    setSaving(false);
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(code); alert("Code copié !"); }
    catch { alert(`Code : ${code}`); }
  }

  return (
    <div style={ov} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{...sh, background:C.bg}}>
        <div style={handle}></div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>Voyageurs</div>

        {members.map(([uid, name], i) => (
          <div key={uid} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
            <div style={{width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0,background:i===0?"#e6f1fb":"#e1f5ee",color:i===0?"#185fa5":"#0f6e56"}}>
              {name?.[0]?.toUpperCase()||"?"}
            </div>
            <div style={{flex:1}}>
              {uid===currentUser?.uid && editName ? (
                <div style={{display:"flex",gap:6}}>
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    style={{flex:1,padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,background:C.bg,color:C.text}} />
                  <button onClick={saveName} disabled={saving} style={{padding:"6px 10px",background:"#1a6bb5",border:"none",borderRadius:8,color:"white",fontSize:12,cursor:"pointer"}}>{saving?"…":"✓"}</button>
                  <button onClick={() => setEditName(false)} style={{padding:"6px 8px",border:"none",background:"none",color:C.text2,cursor:"pointer"}}>✕</button>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{name}{uid===currentUser?.uid?" (vous)":""}</div>
                  {uid===currentUser?.uid && <button onClick={() => setEditName(true)} style={{fontSize:11,color:"#1a6bb5",border:"none",background:"none",cursor:"pointer"}}>Modifier</button>}
                </div>
              )}
              <div style={{fontSize:11,color:C.text2,marginTop:2}}>{uid===trip?.createdBy?"Organisateur":"Voyageur"}</div>
            </div>
            <div style={{fontSize:11,padding:"3px 8px",borderRadius:99,background:"#eaf3de",color:"#3b6d11"}}>Actif</div>
          </div>
        ))}

        <div style={{background:C.bg2,borderRadius:12,padding:14,margin:"16px 0"}}>
          <div style={{fontSize:12,color:C.text2,marginBottom:8,fontWeight:600}}>CODE D'INVITATION</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{flex:1,padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,fontSize:18,fontWeight:700,color:"#1a6bb5",textAlign:"center",letterSpacing:2}}>{code}</div>
            <button onClick={copyCode} style={{padding:"10px 16px",background:"#1a6bb5",color:"white",border:"none",borderRadius:10,fontSize:14,cursor:"pointer",fontWeight:600}}>Copier</button>
          </div>
          <div style={{fontSize:11,color:C.text2,marginTop:8,lineHeight:1.5}}>Partagez ce code pour inviter quelqu'un à rejoindre le voyage</div>
        </div>

        <button onClick={onClose} style={{width:"100%",padding:11,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer"}}>Fermer</button>
        <button onClick={onSignOut} style={{width:"100%",padding:10,border:"none",background:"none",color:"#e24b4a",fontSize:13,cursor:"pointer"}}>Se déconnecter</button>
      </div>
    </div>
  );
}

export function NotificationsPanel({ tripId, onClose, C }) {
  const [activity, setActivity] = useState([]);
  useEffect(() => {
    if (!tripId) return;
    const q = query(collection(db,"trips",tripId,"activity"), orderBy("createdAt","desc"), limit(20));
    const unsub = onSnapshot(q, snap => setActivity(snap.docs.map(d => ({id:d.id,...d.data()}))));
    return unsub;
  }, [tripId]);

  return (
    <div style={ov} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{...sh, background:C.bg}}>
        <div style={handle}></div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>Activité récente</div>
        {activity.length===0 && <div style={{textAlign:"center",padding:"24px 0",color:C.text2,fontSize:13}}>Aucune activité pour le moment</div>}
        {activity.map(a => (
          <div key={a.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
            <div style={{width:32,height:32,background:C.bg2,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{a.icon||"📋"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:C.text}}>{a.text}</div>
              {a.createdAt && <div style={{fontSize:11,color:C.text2,marginTop:2}}>{new Date(a.createdAt.toDate?.()|| a.createdAt).toLocaleString("fr-FR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{width:"100%",padding:11,border:"none",background:"none",color:C.text2,fontSize:13,cursor:"pointer",marginTop:8}}>Fermer</button>
      </div>
    </div>
  );
}

export default SharePanel;

const ov = {position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"flex-end",zIndex:25};
const sh = {borderRadius:"20px 20px 0 0",padding:"18px 18px 28px",width:"100%",maxHeight:"85%",overflowY:"auto"};
const handle = {width:36,height:4,background:"#ccc",borderRadius:99,margin:"0 auto 16px"};
