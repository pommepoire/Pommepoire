import { useState } from "react";

const COLORS = {
  vol: "#378add", hotel: "#1d9e75", transport: "#ef9f27",
  activite: "#d4537e", restaurant: "#9b59b6", autre: "#888"
};
const BG = {
  vol: "#e6f1fb", hotel: "#e1f5ee", transport: "#faeeda",
  activite: "#fbeaf0", restaurant: "#f5eafb", autre: "#f0f0f0"
};

export default function AgendaTab({ reservations, trip, onAdd, currentUser }) {
  const [view, setView] = useState("semaine");
  const [selectedDay, setSelectedDay] = useState(null);

  const tripDays = getTripDays(trip);
  const activeDay = selectedDay || (tripDays[0]?.iso) || null;
  const dayReservations = activeDay
    ? reservations.filter(r => r.dateStart <= activeDay && r.dateEnd >= activeDay)
    : [];

  return (
    <div>
      <div style={s.viewToggle}>
        {["semaine","mois","voyage"].map(v => (
          <button key={v} style={{...s.viewBtn, ...(view===v ? s.viewBtnActive : {})}}
            onClick={() => setView(v)}>
            {v === "semaine" ? "Semaine" : v === "mois" ? "Mois" : "Voyage complet"}
          </button>
        ))}
      </div>

      {view === "semaine" && (
        <>
          <div style={s.dayStrip}>
            {tripDays.slice(0,14).map(d => (
              <div key={d.iso} style={{...s.dayChip, ...(activeDay===d.iso ? s.dayChipActive : {})}}
                onClick={() => setSelectedDay(d.iso)}>
                <div style={{...s.dayNum, ...(activeDay===d.iso ? {color:"white"} : {})}}>{d.num}</div>
                <div style={{...s.dayName, ...(activeDay===d.iso ? {color:"rgba(255,255,255,0.8)"} : {})}}>{d.name}</div>
                {reservations.some(r => r.dateStart <= d.iso && r.dateEnd >= d.iso) && (
                  <div style={{...s.dayDot, background: activeDay===d.iso ? "white" : "#1a6bb5"}}></div>
                )}
              </div>
            ))}
          </div>
          {dayReservations.length === 0
            ? <div style={s.empty}>Journée libre — ajoutez une activité</div>
            : dayReservations.map((r, i) => (
              <div key={r.id} style={s.tlItem}>
                <div style={s.tlTime}>{r.time || "--"}</div>
                <div style={s.tlDotCol}>
                  <div style={{...s.tlDot, background: COLORS[r.type] || "#888"}}></div>
                  {i < dayReservations.length-1 && <div style={s.tlLine}></div>}
                </div>
                <div style={{...s.tlCard, borderLeftColor: COLORS[r.type] || "#888"}}>
                  <div style={s.tlTitle}>{r.name}</div>
                  {r.details && <div style={s.tlSub}>{r.details}</div>}
                  {r.price && <div style={s.tlSub}>💶 {r.price} €</div>}
                  <div style={{...s.tlAuthor, color: COLORS[r.type] || "#888"}}>{r.createdByName}</div>
                </div>
              </div>
            ))
          }
        </>
      )}

      {view === "mois" && <MonthView reservations={reservations} trip={trip} />}

      {view === "voyage" && (
        <div>
          <div style={s.tripMeta}>{tripDays.length} jours · {trip?.dateStart} → {trip?.dateEnd}</div>
          {tripDays.map(d => {
            const dayRes = reservations.filter(r => r.dateStart <= d.iso && r.dateEnd >= d.iso);
            if (dayRes.length === 0) return null;
            return (
              <div key={d.iso} style={s.tripRow}>
                <div style={s.tripDate}>{d.num} {d.monthShort}</div>
                <div style={{flex:1}}>
                  {dayRes.map(r => (
                    <div key={r.id} style={{...s.tripEvent, background: BG[r.type] || "#f0f0f0"}}>
                      <div style={{...s.tripEventTitle, color: COLORS[r.type] || "#888"}}>
                        {typeIcon(r.type)} {r.name}
                      </div>
                      {r.time && <div style={{...s.tripEventSub, color: COLORS[r.type]}}>{r.time}{r.price ? ` · ${r.price}€` : ""}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {reservations.length === 0 && <div style={s.empty}>Aucune réservation pour ce voyage</div>}
        </div>
      )}

      <button style={s.addBtn} onClick={onAdd}>+ Ajouter une réservation ou activité</button>
    </div>
  );
}

function MonthView({ reservations, trip }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const base = trip?.dateStart ? new Date(trip.dateStart) : new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = month.getFullYear();
  const mo = month.getMonth();
  const daysInMonth = new Date(year, mo+1, 0).getDate();
  const firstDay = (new Date(year, mo, 1).getDay() + 6) % 7; // Monday first

  const monthName = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <span style={{fontSize:15, fontWeight:600, color:"#111", textTransform:"capitalize"}}>{monthName}</span>
        <div style={{display:"flex", gap:4}}>
          <button onClick={() => setMonthOffset(o=>o-1)} style={s.monthNav}>‹</button>
          <button onClick={() => setMonthOffset(o=>o+1)} style={s.monthNav}>›</button>
        </div>
      </div>
      <div style={s.monthHeader}>
        {["L","M","M","J","V","S","D"].map((d,i) => <span key={i} style={s.monthHeaderDay}>{d}</span>)}
      </div>
      <div style={s.monthGrid}>
        {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} style={s.monthDay}></div>)}
        {Array.from({length: daysInMonth}).map((_,i) => {
          const dayNum = i+1;
          const iso = `${year}-${String(mo+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
          const dayRes = reservations.filter(r => r.dateStart <= iso && r.dateEnd >= iso);
          const inTrip = trip?.dateStart && trip?.dateEnd && iso >= trip.dateStart && iso <= trip.dateEnd;
          return (
            <div key={dayNum} style={{...s.monthDay, ...(inTrip ? s.monthDayInTrip : {})}}>
              <div style={s.monthDayNum}>{dayNum}</div>
              {dayRes.slice(0,2).map((r,j) => (
                <div key={j} style={{...s.monthDot, background: COLORS[r.type] || "#888"}}></div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{marginTop:10, display:"flex", gap:10, flexWrap:"wrap"}}>
        {Object.entries(COLORS).map(([type, color]) => (
          <div key={type} style={{display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#666"}}>
            <div style={{width:7, height:7, borderRadius:"50%", background:color}}></div>
            {type.charAt(0).toUpperCase()+type.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTripDays(trip) {
  if (!trip?.dateStart || !trip?.dateEnd) return [];
  const days = [];
  const cur = new Date(trip.dateStart);
  const end = new Date(trip.dateEnd);
  const months = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
  const dayNames = ["dim","lun","mar","mer","jeu","ven","sam"];
  while (cur <= end) {
    days.push({
      iso: cur.toISOString().split("T")[0],
      num: cur.getDate(),
      name: dayNames[cur.getDay()],
      monthShort: months[cur.getMonth()]
    });
    cur.setDate(cur.getDate()+1);
  }
  return days;
}

function typeIcon(type) {
  return {vol:"✈️", hotel:"🏨", transport:"🚌", activite:"🎭", restaurant:"🍽️", autre:"📌"}[type] || "📌";
}

const s = {
  viewToggle: { display:"flex", background:"#f4f4f4", borderRadius:10, padding:3, marginBottom:14 },
  viewBtn: { flex:1, padding:"7px", textAlign:"center", fontSize:11, borderRadius:8, border:"none", background:"none", color:"#888", cursor:"pointer" },
  viewBtnActive: { background:"#fff", color:"#1a6bb5", fontWeight:600, border:"0.5px solid #ddd" },
  dayStrip: { display:"flex", gap:6, overflowX:"auto", paddingBottom:10, marginBottom:12 },
  dayChip: { flexShrink:0, width:44, textAlign:"center", padding:"8px 0", borderRadius:10, cursor:"pointer", border:"0.5px solid #e0e0e0" },
  dayChipActive: { background:"#1a6bb5", borderColor:"#1a6bb5" },
  dayNum: { fontSize:15, fontWeight:600, color:"#111" },
  dayName: { fontSize:10, color:"#888", marginTop:2 },
  dayDot: { width:4, height:4, borderRadius:"50%", margin:"3px auto 0" },
  tlItem: { display:"flex", gap:10, marginBottom:10 },
  tlTime: { width:38, fontSize:11, color:"#888", textAlign:"right", paddingTop:3, flexShrink:0 },
  tlDotCol: { display:"flex", flexDirection:"column", alignItems:"center" },
  tlDot: { width:9, height:9, borderRadius:"50%", marginTop:4, flexShrink:0 },
  tlLine: { width:1, background:"#eee", flex:1, minHeight:16 },
  tlCard: { flex:1, background:"#f8f9fa", borderRadius:10, padding:"9px 11px", borderLeft:"3px solid transparent" },
  tlTitle: { fontSize:13, fontWeight:600, color:"#111" },
  tlSub: { fontSize:11, color:"#666", marginTop:2 },
  tlAuthor: { fontSize:10, marginTop:4 },
  empty: { textAlign:"center", padding:"24px 0", color:"#aaa", fontSize:13 },
  addBtn: { width:"100%", padding:11, border:"1.5px dashed #ccc", borderRadius:12, background:"none", color:"#888", fontSize:14, cursor:"pointer", marginTop:8 },
  tripMeta: { fontSize:12, color:"#888", marginBottom:12 },
  tripRow: { display:"flex", gap:10, marginBottom:8 },
  tripDate: { width:50, fontSize:11, color:"#888", paddingTop:4, flexShrink:0 },
  tripEvent: { borderRadius:8, padding:"8px 10px", marginBottom:4 },
  tripEventTitle: { fontSize:13, fontWeight:600 },
  tripEventSub: { fontSize:11, marginTop:1, opacity:0.8 },
  monthNav: { border:"none", background:"none", cursor:"pointer", color:"#888", fontSize:20, padding:"0 6px" },
  monthHeader: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 },
  monthHeaderDay: { textAlign:"center", fontSize:10, color:"#888", padding:"4px 0" },
  monthGrid: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 },
  monthDay: { minHeight:46, padding:4, borderRadius:6 },
  monthDayInTrip: { background:"#f0f7ff" },
  monthDayNum: { fontSize:12, fontWeight:500, color:"#111", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center" },
  monthDot: { width:5, height:5, borderRadius:"50%", margin:"1px auto" },
};
