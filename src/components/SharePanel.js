import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";

export function SharePanel({ trip, tripId, onClose, onSignOut, currentUser }) {
  const members = Object.entries(trip?.memberNames || {});
  const code = trip?.code || "---";

  async function copyCode() {
    try { await navigator.clipboard.writeText(code); alert("Code copié !"); }
    catch { alert(`Code : ${code}`); }
  }

  return (
    <div style={s.overlay} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={s.sheet}>
        <div style={s.handle}></div>
        <div style={s.title}>Voyageurs</div>

        {members.map(([uid, name], i) => (
          <div key={uid} style={s.memberRow}>
            <div style={{...s.avatar, background: i===0?"#e6f1fb":"#e1f5ee", color: i===0?"#185fa5":"#0f6e56"}}>
              {name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{flex:1}}>
              <div style={s.memberName}>{name}{uid===currentUser?.uid ? " (vous)" : ""}</div>
              <div style={s.memberRole}>{uid===trip?.createdBy ? "Organisateur" : "Voyageur"}</div>
            </div>
            <div style={s.onlineBadge}>Actif</div>
          </div>
        ))}

        <div style={s.codeSection}>
          <div style={s.codeLabel}>Code d'invitation</div>
          <div style={s.codeRow}>
            <div style={s.codeBox}>{code}</div>
            <button style={s.copyBtn} onClick={copyCode}>Copier</button>
          </div>
          <div style={s.codeHint}>Partagez ce code pour inviter quelqu'un à rejoindre le voyage</div>
        </div>

        <button style={s.closeBtn} onClick={onClose}>Fermer</button>
        <button style={s.signOutBtn} onClick={onSignOut}>Se déconnecter</button>
      </div>
    </div>
  );
}

export function NotificationsPanel({ tripId, onClose }) {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!tripId) return;
    const q = query(collection(db, "trips", tripId, "activity"), orderBy("createdAt","desc"), limit(20));
    const unsub = onSnapshot(q, snap => {
      setActivity(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    });
    return unsub;
  }, [tripId]);

  return (
    <div style={s.overlay} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={s.sheet}>
        <div style={s.handle}></div>
        <div style={s.title}>Activité récente</div>
        {activity.length === 0 && <div style={s.empty}>Aucune activité pour le moment</div>}
        {activity.map(a => (
          <div key={a.id} style={s.notifItem}>
            <div style={s.notifIcon}>{a.icon || "📋"}</div>
            <div style={{flex:1}}>
              <div style={s.notifText}>{a.text}</div>
              {a.createdAt && (
                <div style={s.notifTime}>
                  {new Date(a.createdAt.toDate?.() || a.createdAt).toLocaleString("fr-FR", {day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"})}
                </div>
              )}
            </div>
          </div>
        ))}
        <button style={s.closeBtn} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

export default SharePanel;

const s = {
  overlay: { position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"flex-end", zIndex:25, borderRadius:20 },
  sheet: { background:"#fff", borderRadius:"20px 20px 0 0", padding:"18px 18px 28px", width:"100%", maxHeight:"85%", overflowY:"auto" },
  handle: { width:36, height:4, background:"#ddd", borderRadius:99, margin:"0 auto 16px" },
  title: { fontSize:16, fontWeight:700, color:"#111", marginBottom:14 },
  memberRow: { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"0.5px solid #f0f0f0" },
  avatar: { width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0 },
  memberName: { fontSize:14, fontWeight:600, color:"#111" },
  memberRole: { fontSize:11, color:"#888", marginTop:1 },
  onlineBadge: { fontSize:11, padding:"3px 8px", borderRadius:99, background:"#eaf3de", color:"#3b6d11" },
  codeSection: { background:"#f8f9fa", borderRadius:12, padding:14, margin:"16px 0" },
  codeLabel: { fontSize:12, color:"#888", marginBottom:8, fontWeight:600 },
  codeRow: { display:"flex", gap:10, alignItems:"center" },
  codeBox: { flex:1, padding:"10px 14px", background:"#fff", border:"1px solid #ddd", borderRadius:10, fontSize:18, fontWeight:700, color:"#1a6bb5", textAlign:"center", letterSpacing:2 },
  copyBtn: { padding:"10px 16px", background:"#1a6bb5", color:"white", border:"none", borderRadius:10, fontSize:14, cursor:"pointer", fontWeight:600 },
  codeHint: { fontSize:11, color:"#999", marginTop:8, lineHeight:1.5 },
  closeBtn: { width:"100%", padding:11, border:"none", background:"none", color:"#999", fontSize:13, cursor:"pointer", marginTop:4 },
  signOutBtn: { width:"100%", padding:10, border:"none", background:"none", color:"#e24b4a", fontSize:13, cursor:"pointer" },
  empty: { textAlign:"center", padding:"24px 0", color:"#aaa", fontSize:13 },
  notifItem: { display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderBottom:"0.5px solid #f0f0f0" },
  notifIcon: { width:32, height:32, background:"#e6f1fb", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 },
  notifText: { fontSize:13, fontWeight:500, color:"#111" },
  notifTime: { fontSize:11, color:"#999", marginTop:2 },
};
