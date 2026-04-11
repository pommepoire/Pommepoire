// ReservationsTab.js
import { useState } from "react";

const COLORS = { vol:"#378add", hotel:"#1d9e75", transport:"#ef9f27", activite:"#d4537e", restaurant:"#9b59b6", autre:"#888" };
const BG = { vol:"#e6f1fb", hotel:"#e1f5ee", transport:"#faeeda", activite:"#fbeaf0", restaurant:"#f5eafb", autre:"#f0f0f0" };
const ICONS = { vol:"✈️", hotel:"🏨", transport:"🚌", activite:"🎭", restaurant:"🍽️", autre:"📌" };

export default function ReservationsTab({ reservations, onAdd, onDelete, currentUser }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={s.sectionTitle}>Toutes les réservations</div>
      {reservations.length === 0 && <div style={s.empty}>Aucune réservation pour le moment</div>}
      {reservations.map(r => (
        <div key={r.id} style={s.card}>
          <div style={s.cardTop} onClick={() => setExpanded(expanded===r.id ? null : r.id)}>
            <div style={{...s.icon, background: BG[r.type] || "#f0f0f0"}}>{ICONS[r.type] || "📌"}</div>
            <div style={{flex:1}}>
              <div style={s.name}>{r.name}</div>
              <div style={s.detail}>{r.dateStart}{r.dateEnd && r.dateEnd !== r.dateStart ? ` → ${r.dateEnd}` : ""}{r.time ? ` · ${r.time}` : ""}</div>
              {r.website && <div style={{...s.detail, color:"#1a6bb5"}}>{r.website}</div>}
            </div>
            {r.price && <div style={{...s.price, color: COLORS[r.type] || "#888"}}>{r.price} €</div>}
          </div>
          {expanded === r.id && (
            <div style={s.expanded}>
              {r.confirmation && <div style={s.expandRow}><span style={s.expandLabel}>Confirmation</span><span style={s.expandVal}>{r.confirmation}</span></div>}
              {r.location && <div style={s.expandRow}><span style={s.expandLabel}>Lieu</span><span style={s.expandVal}>{r.location}</span></div>}
              {r.notes && <div style={s.expandRow}><span style={s.expandLabel}>Notes</span><span style={s.expandVal}>{r.notes}</span></div>}
              <div style={s.expandRow}><span style={s.expandLabel}>Ajouté par</span><span style={s.expandVal}>{r.createdByName}</span></div>
              {r.createdBy === currentUser?.uid && (
                <button onClick={() => onDelete(r.id)} style={s.deleteBtn}>Supprimer</button>
              )}
            </div>
          )}
        </div>
      ))}
      <button style={s.addBtn} onClick={onAdd}>+ Nouvelle réservation</button>
    </div>
  );
}

const s = {
  sectionTitle: { fontSize:11, fontWeight:600, color:"#999", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.6px" },
  empty: { textAlign:"center", padding:"24px 0", color:"#aaa", fontSize:13 },
  card: { border:"0.5px solid #e8e8e8", borderRadius:12, padding:13, marginBottom:10 },
  cardTop: { display:"flex", alignItems:"center", gap:10, cursor:"pointer" },
  icon: { width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 },
  name: { fontSize:14, fontWeight:600, color:"#111" },
  detail: { fontSize:12, color:"#666", marginTop:2 },
  price: { fontSize:13, fontWeight:600, whiteSpace:"nowrap" },
  expanded: { marginTop:10, paddingTop:10, borderTop:"0.5px solid #eee" },
  expandRow: { display:"flex", justifyContent:"space-between", marginBottom:6 },
  expandLabel: { fontSize:12, color:"#999" },
  expandVal: { fontSize:12, color:"#111", textAlign:"right", maxWidth:"60%" },
  deleteBtn: { width:"100%", padding:8, marginTop:8, border:"1px solid #fcc", borderRadius:8, background:"#fff5f5", color:"#c00", fontSize:13, cursor:"pointer" },
  addBtn: { width:"100%", padding:11, border:"1.5px dashed #ccc", borderRadius:12, background:"none", color:"#888", fontSize:14, cursor:"pointer", marginTop:8 },
};
