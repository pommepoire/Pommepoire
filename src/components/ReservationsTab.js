import { useState } from "react";

const COLORS = { vol:"#378add",hotel:"#1d9e75",transport:"#ef9f27",activite:"#d4537e",restaurant:"#9b59b6",autre:"#888" };
const BG = { vol:"#e6f1fb",hotel:"#e1f5ee",transport:"#faeeda",activite:"#fbeaf0",restaurant:"#f5eafb",autre:"#f0f0f0" };
const ICONS = { vol:"✈️",hotel:"🏨",transport:"🚌",activite:"🎭",restaurant:"🍽️",autre:"📌" };

export default function ReservationsTab({ reservations, onAdd, onEdit, onDelete, currentUser, C, tripId }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>
        Toutes les réservations ({reservations.length})
      </div>
      {reservations.length===0 && <div style={{textAlign:"center",padding:"24px 0",color:C.text2,fontSize:13}}>Aucune réservation pour le moment</div>}
      {reservations.map(r => (
        <div key={r.id} style={{border:`0.5px solid ${C.border}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:13,cursor:"pointer",background:C.bg}} onClick={() => setExpanded(expanded===r.id?null:r.id)}>
            <div style={{width:38,height:38,borderRadius:10,background:BG[r.type]||"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
              {ICONS[r.type]||"📌"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{r.name}</div>
              <div style={{fontSize:12,color:C.text2,marginTop:2}}>
                {r.dateStart}{r.dateEnd&&r.dateEnd!==r.dateStart?` → ${r.dateEnd}`:""}{r.time?` · ${r.time}`:""}
              </div>
              {r.website && <div style={{fontSize:11,color:"#1a6bb5",marginTop:2}}>{r.website}</div>}
            </div>
            {r.price && <div style={{fontSize:13,fontWeight:600,color:COLORS[r.type]||"#888",whiteSpace:"nowrap"}}>{r.price} €</div>}
          </div>

          {expanded===r.id && (
            <div style={{borderTop:`0.5px solid ${C.border}`,padding:"12px 13px",background:C.bg2}}>
              {r.confirmation && <Row label="Confirmation" val={r.confirmation} C={C} />}
              {r.location && <Row label="Lieu" val={r.location} C={C} />}
              {r.notes && <Row label="Notes" val={r.notes} C={C} />}
              <Row label="Ajouté par" val={r.createdByName} C={C} />

              {r.attachments?.length > 0 && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:11,color:C.text2,marginBottom:6,fontWeight:600}}>PIÈCES JOINTES</div>
                  {r.attachments.map((a,i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer"
                      style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.bg,borderRadius:8,marginBottom:4,textDecoration:"none"}}>
                      <span>{a.type?.includes("pdf")?"📄":"🖼️"}</span>
                      <span style={{fontSize:12,color:"#1a6bb5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>
                    </a>
                  ))}
                </div>
              )}

              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button onClick={() => onEdit(r)} style={{flex:1,padding:"8px",border:`1px solid #1a6bb5`,borderRadius:8,background:"none",color:"#1a6bb5",fontSize:13,cursor:"pointer",fontWeight:600}}>
                  ✏️ Modifier
                </button>
                {r.createdBy===currentUser?.uid && (
                  <button onClick={() => onDelete(r.id)} style={{flex:1,padding:"8px",border:`1px solid #e24b4a`,borderRadius:8,background:"none",color:"#e24b4a",fontSize:13,cursor:"pointer"}}>
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={onAdd} style={{width:"100%",padding:11,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:8}}>
        + Nouvelle réservation
      </button>
    </div>
  );
}

function Row({ label, val, C }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <span style={{fontSize:12,color:C.text2}}>{label}</span>
      <span style={{fontSize:12,color:C.text,textAlign:"right",maxWidth:"60%"}}>{val}</span>
    </div>
  );
}
