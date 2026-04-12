import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const CATEGORIES = [
  { key:"vol", label:"Transport", icon:"✈️", color:"#378add" },
  { key:"hotel", label:"Hébergement", icon:"🏨", color:"#1d9e75" },
  { key:"restaurant", label:"Restauration", icon:"🍽️", color:"#ef9f27" },
  { key:"activite", label:"Activités", icon:"🎭", color:"#d4537e" },
  { key:"autre", label:"Divers", icon:"📌", color:"#888" },
];

export default function BudgetTab({ reservations, trip, tripId, C }) {
  const [expandedCat, setExpandedCat] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editVal, setEditVal] = useState("");

  const budgets = trip?.budgets || { vol:500,hotel:800,restaurant:400,activite:300,autre:200 };

  const spent = {};
  CATEGORIES.forEach(c => {
    spent[c.key] = reservations.filter(r => r.type===c.key).reduce((sum,r) => sum+(parseFloat(r.price)||0), 0);
  });
  const totalBudget = Object.values(budgets).reduce((a,b) => a+parseFloat(b||0), 0);
  const totalSpent = Object.values(spent).reduce((a,b) => a+b, 0);

  async function saveBudget(key, val) {
    const newBudgets = { ...budgets, [key]: parseFloat(val)||0 };
    await updateDoc(doc(db, "trips", tripId), { budgets: newBudgets });
    setEditingBudget(null);
  }

  return (
    <div>
      <div style={{background:C.bg2,borderRadius:12,padding:14,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,color:C.text2}}>Total dépensé</div>
          <div style={{fontSize:11,color:C.text2}}>sur {totalBudget.toFixed(0)} € de budget</div>
        </div>
        <div style={{fontSize:22,fontWeight:700,color:"#1a6bb5"}}>{totalSpent.toFixed(0)} €</div>
      </div>

      <div style={{fontSize:11,fontWeight:600,color:C.text2,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Par catégorie</div>

      {CATEGORIES.map(c => {
        const s = spent[c.key]||0;
        const b = parseFloat(budgets[c.key])||0;
        const pct = b>0 ? Math.min((s/b)*100,100) : 0;
        const over = s>b && b>0;
        const catRes = reservations.filter(r => r.type===c.key);
        const isExpanded = expandedCat===c.key;

        return (
          <div key={c.key} style={{marginBottom:10,borderRadius:12,border:`0.5px solid ${C.border}`,overflow:"hidden"}}>
            <div onClick={() => setExpandedCat(isExpanded ? null : c.key)}
              style={{padding:"12px 14px",cursor:"pointer",background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{c.icon} {c.label}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {editingBudget===c.key ? (
                    <div style={{display:"flex",gap:6,alignItems:"center"}} onClick={e => e.stopPropagation()}>
                      <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                        style={{width:70,padding:"3px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,textAlign:"right",background:C.bg,color:C.text}} />
                      <button onClick={() => saveBudget(c.key,editVal)} style={{padding:"3px 8px",background:"#1a6bb5",border:"none",borderRadius:6,color:"white",fontSize:12,cursor:"pointer"}}>✓</button>
                      <button onClick={() => setEditingBudget(null)} style={{padding:"3px 6px",background:"none",border:"none",color:C.text2,fontSize:12,cursor:"pointer"}}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span style={{fontSize:12,color:over?"#e24b4a":C.text2}}>{s.toFixed(0)} € / {b} €</span>
                      <button onClick={e => { e.stopPropagation(); setEditingBudget(c.key); setEditVal(String(b)); }}
                        style={{fontSize:11,color:"#1a6bb5",border:"none",background:"none",cursor:"pointer",padding:"2px 6px"}}>Modifier</button>
                    </>
                  )}
                </div>
              </div>
              <div style={{height:6,background:C.bg2,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:99,background:over?"#e24b4a":c.color,width:`${pct}%`,transition:"width 0.3s"}}></div>
              </div>
            </div>

            {isExpanded && (
              <div style={{borderTop:`0.5px solid ${C.border}`,background:C.bg2}}>
                {catRes.length===0
                  ? <div style={{padding:"12px 14px",fontSize:13,color:C.text2,textAlign:"center"}}>Aucune dépense dans cette catégorie</div>
                  : catRes.map(r => (
                    <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`0.5px solid ${C.border}`}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:C.text}}>{r.name}</div>
                        <div style={{fontSize:11,color:C.text2,marginTop:2}}>{r.dateStart}{r.time?` · ${r.time}`:""}</div>
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:c.color}}>{r.price ? `${r.price} €` : "—"}</div>
                    </div>
                  ))
                }
                <div style={{padding:"10px 14px",display:"flex",justifyContent:"flex-end"}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.text}}>Total : {s.toFixed(0)} €</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
