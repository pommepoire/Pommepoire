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

export default function BudgetTab({ reservations, trip, tripId }) {
  const [editBudgets, setEditBudgets] = useState(false);
  const [budgets, setBudgets] = useState(trip?.budgets || {vol:500, hotel:800, restaurant:400, activite:300, autre:200});

  const spent = {};
  CATEGORIES.forEach(c => {
    spent[c.key] = reservations.filter(r => r.type === c.key).reduce((sum, r) => sum + (parseFloat(r.price)||0), 0);
  });
  const totalBudget = Object.values(budgets).reduce((a,b) => a + parseFloat(b||0), 0);
  const totalSpent = Object.values(spent).reduce((a,b) => a+b, 0);

  async function saveBudgets() {
    await updateDoc(doc(db, "trips", tripId), { budgets });
    setEditBudgets(false);
  }

  return (
    <div>
      <div style={s.totalCard}>
        <div>
          <div style={s.totalLabel}>Total dépensé</div>
          <div style={s.totalSub}>sur {totalBudget} € de budget</div>
        </div>
        <div style={s.totalVal}>{totalSpent.toFixed(0)} €</div>
      </div>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <div style={s.sectionTitle}>Par catégorie</div>
        <button onClick={() => setEditBudgets(!editBudgets)} style={s.editBtn}>
          {editBudgets ? "Annuler" : "Modifier budgets"}
        </button>
      </div>

      {CATEGORIES.map(c => {
        const s2 = spent[c.key] || 0;
        const b = parseFloat(budgets[c.key]) || 0;
        const pct = b > 0 ? Math.min((s2/b)*100, 100) : 0;
        const over = s2 > b && b > 0;
        return (
          <div key={c.key} style={s.cat}>
            <div style={s.catRow}>
              <span style={s.catName}>{c.icon} {c.label}</span>
              {editBudgets
                ? <input style={s.budgetInput} type="number" value={budgets[c.key]} onChange={e => setBudgets(b => ({...b, [c.key]: e.target.value}))} />
                : <span style={{...s.catAmounts, ...(over ? {color:"#e24b4a"} : {})}}>{s2.toFixed(0)} € / {b} €</span>
              }
            </div>
            <div style={s.progressBar}>
              <div style={{...s.progressFill, width:`${pct}%`, background: over ? "#e24b4a" : c.color}}></div>
            </div>
          </div>
        );
      })}

      {editBudgets && (
        <button style={s.saveBtn} onClick={saveBudgets}>Enregistrer les budgets</button>
      )}
    </div>
  );
}

const s = {
  totalCard: { background:"#f8f9fa", borderRadius:12, padding:14, marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" },
  totalLabel: { fontSize:13, color:"#666" },
  totalSub: { fontSize:11, color:"#999" },
  totalVal: { fontSize:22, fontWeight:700, color:"#1a6bb5" },
  sectionTitle: { fontSize:11, fontWeight:600, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px" },
  editBtn: { fontSize:12, color:"#1a6bb5", border:"none", background:"none", cursor:"pointer" },
  cat: { marginBottom:14 },
  catRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 },
  catName: { fontSize:13, fontWeight:600, color:"#111" },
  catAmounts: { fontSize:12, color:"#666" },
  budgetInput: { width:80, padding:"4px 8px", border:"1px solid #ddd", borderRadius:6, fontSize:13, textAlign:"right" },
  progressBar: { height:6, background:"#f0f0f0", borderRadius:99, overflow:"hidden" },
  progressFill: { height:"100%", borderRadius:99, transition:"width 0.3s" },
  saveBtn: { width:"100%", padding:12, background:"#1a6bb5", border:"none", borderRadius:12, color:"white", fontSize:14, fontWeight:600, cursor:"pointer", marginTop:8 },
};
