import { useState } from "react";

const COLORS = { vol:"#378add",hotel:"#1d9e75",transport:"#ef9f27",activite:"#d4537e",restaurant:"#9b59b6",autre:"#888" };
const BG = { vol:"#e6f1fb",hotel:"#e1f5ee",transport:"#faeeda",activite:"#fbeaf0",restaurant:"#f5eafb",autre:"#f0f0f0" };

export default function AgendaTab({ reservations, trip, onAdd, onEdit, currentUser, C }) {
  const [view, setView] = useState("semaine");
  const [selectedDay, setSelectedDay] = useState(null);

  const tripDays = getTripDays(trip);
  const activeDay = selectedDay || tripDays[0]?.iso || null;
  const dayRes = activeDay ? reservations.filter(r => r.dateStart && r.dateEnd && r.dateStart <= activeDay && r.dateEnd >= activeDay) : [];

  return (
    <div>
      <div style={{display:"flex",background:C.bg2,borderRadius:10,padding:3,marginBottom:14}}>
        {["semaine","mois","voyage"].map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{flex:1,padding:7,textAlign:"center",fontSize:11,borderRadius:8,border:"none",background:view===v?C.bg:"none",color:view===v?"#1a6bb5":C.text2,cursor:"pointer",fontWeight:view===v?700:400,boxShadow:view===v?`0 0 0 0.5px ${C.border}`:"none"}}>
            {v==="semaine"?"Semaine":v==="mois"?"Mois":"Voyage complet"}
          </button>
        ))}
      </div>

      {view==="semaine" && (
        <>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:10,marginBottom:12}}>
            {tripDays.slice(0,14).map(d => {
              const hasRes = reservations.some(r => r.dateStart <= d.iso && r.dateEnd >= d.iso);
              const active = activeDay===d.iso;
              return (
                <div key={d.iso} onClick={() => setSelectedDay(d.iso)}
                  style={{flexShrink:0,width:44,textAlign:"center",padding:"8px 0",borderRadius:10,cursor:"pointer",border:`0.5px solid ${active?"#1a6bb5":C.border}`,background:active?"#1a6bb5":"transparent"}}>
                  <div style={{fontSize:15,fontWeight:600,color:active?"white":C.text}}>{d.num}</div>
                  <div style={{fontSize:10,color:active?"rgba(255,255,255,0.8)":C.text2,marginTop:2}}>{d.name}</div>
                  {hasRes && <div style={{width:4,height:4,borderRadius:"50%",background:active?"white":"#1a6bb5",margin:"3px auto 0"}}></div>}
                </div>
              );
            })}
          </div>
          {dayRes.length===0
            ? <div style={{textAlign:"center",padding:"24px 0",color:C.text2,fontSize:13}}>Journée libre — ajoutez une activité</div>
            : dayRes.map((r,i) => (
              <div key={r.id} style={{display:"flex",gap:10,marginBottom:10}}>
                <div style={{width:38,fontSize:11,color:C.text2,textAlign:"right",paddingTop:3,flexShrink:0}}>{r.time||"--"}</div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:COLORS[r.type]||"#888",marginTop:4,flexShrink:0}}></div>
                  {i<dayRes.length-1 && <div style={{width:1,background:C.border,flex:1,minHeight:16}}></div>}
                </div>
                <div style={{flex:1,background:C.bg2,borderRadius:10,padding:"9px 11px",borderLeft:`3px solid ${COLORS[r.type]||"#888"}`,cursor:"pointer"}} onClick={() => onEdit(r)}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{r.name}</div>
                  {r.details && <div style={{fontSize:11,color:C.text2,marginTop:2}}>{r.details}</div>}
                  {r.price && <div style={{fontSize:11,color:C.text2,marginTop:2}}>💶 {r.price} €</div>}
                  <div style={{fontSize:10,color:COLORS[r.type]||"#888",marginTop:4}}>{r.createdByName}</div>
                </div>
              </div>
            ))
          }
        </>
      )}

      {view==="mois" && <MonthView reservations={reservations} trip={trip} C={C} onDayClick={d => { setSelectedDay(d); setView("semaine"); }} />}

      {view==="voyage" && (
        <div>
          <div style={{fontSize:12,color:C.text2,marginBottom:12}}>{tripDays.length} jours · {trip?.dateStart} → {trip?.dateEnd}</div>
          {tripDays.map(d => {
            const dr = reservations.filter(r => r.dateStart <= d.iso && r.dateEnd >= d.iso);
            if (!dr.length) return null;
            return (
              <div key={d.iso} style={{display:"flex",gap:10,marginBottom:8}}>
                <div style={{width:50,fontSize:11,color:C.text2,paddingTop:4,flexShrink:0}}>{d.num} {d.monthShort}</div>
                <div style={{flex:1}}>
                  {dr.map(r => (
                    <div key={r.id} style={{borderRadius:8,padding:"8px 10px",marginBottom:4,background:BG[r.type]||"#f0f0f0",cursor:"pointer"}} onClick={() => onEdit(r)}>
                      <div style={{fontSize:13,fontWeight:600,color:COLORS[r.type]||"#888"}}>{typeIcon(r.type)} {r.name}</div>
                      {r.time && <div style={{fontSize:11,color:COLORS[r.type],opacity:0.8,marginTop:1}}>{r.time}{r.price?` · ${r.price}€`:""}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {reservations.length===0 && <div style={{textAlign:"center",padding:"24px 0",color:C.text2,fontSize:13}}>Aucune réservation</div>}
        </div>
      )}

      <button onClick={onAdd} style={{width:"100%",padding:11,border:`1.5px dashed ${C.border}`,borderRadius:12,background:"none",color:C.text2,fontSize:14,cursor:"pointer",marginTop:8}}>
        + Ajouter une réservation ou activité
      </button>
    </div>
  );
}

function MonthView({ reservations, trip, C, onDayClick }) {
  const [offset, setOffset] = useState(0);
  const base = trip?.dateStart ? new Date(trip.dateStart) : new Date();
  const month = new Date(base.getFullYear(), base.getMonth()+offset, 1);
  const year = month.getFullYear(), mo = month.getMonth();
  const daysInMonth = new Date(year,mo+1,0).getDate();
  const firstDay = (new Date(year,mo,1).getDay()+6)%7;
  const monthName = month.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:15,fontWeight:600,color:C.text,textTransform:"capitalize"}}>{monthName}</span>
        <div style={{display:"flex",gap:4}}>
          <button onClick={() => setOffset(o=>o-1)} style={{border:"none",background:"none",cursor:"pointer",color:C.text2,fontSize:20,padding:"0 6px"}}>‹</button>
          <button onClick={() => setOffset(o=>o+1)} style={{border:"none",background:"none",cursor:"pointer",color:C.text2,fontSize:20,padding:"0 6px"}}>›</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["L","M","M","J","V","S","D"].map((d,i) => <span key={i} style={{textAlign:"center",fontSize:10,color:C.text2,padding:"4px 0"}}>{d}</span>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`}></div>)}
        {Array.from({length:daysInMonth}).map((_,i) => {
          const dayNum = i+1;
          const iso = `${year}-${String(mo+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
          const dayRes = reservations.filter(r => r.dateStart <= iso && r.dateEnd >= iso);
          const inTrip = trip?.dateStart && trip?.dateEnd && iso >= trip.dateStart && iso <= trip.dateEnd;
          return (
            <div key={dayNum} onClick={() => dayRes.length > 0 && onDayClick(iso)}
              style={{minHeight:46,padding:4,borderRadius:6,background:inTrip?C.bg2:"transparent",cursor:dayRes.length>0?"pointer":"default"}}>
              <div style={{fontSize:12,fontWeight:500,color:C.text,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%"}}>{dayNum}</div>
              {dayRes.slice(0,2).map((r,j) => (
                <div key={j} style={{width:5,height:5,borderRadius:"50%",background:COLORS[r.type]||"#888",margin:"1px auto"}}></div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{marginTop:10,display:"flex",gap:10,flexWrap:"wrap"}}>
        {Object.entries(COLORS).map(([type,color]) => (
          <div key={type} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.text2}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:color}}></div>
            {type.charAt(0).toUpperCase()+type.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTripDays(trip) {
  if (!trip?.dateStart || !trip?.dateEnd) return [];
  const days=[], months=["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"], dayNames=["dim","lun","mar","mer","jeu","ven","sam"];
  const cur = new Date(trip.dateStart), end = new Date(trip.dateEnd);
  while (cur <= end) {
    days.push({ iso:cur.toISOString().split("T")[0], num:cur.getDate(), name:dayNames[cur.getDay()], monthShort:months[cur.getMonth()] });
    cur.setDate(cur.getDate()+1);
  }
  return days;
}

function typeIcon(type) {
  return {vol:"✈️",hotel:"🏨",transport:"🚌",activite:"🎭",restaurant:"🍽️",autre:"📌"}[type]||"📌";
}
