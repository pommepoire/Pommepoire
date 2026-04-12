import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import AuthPage from "./pages/AuthPage";
import AgendaTab from "./components/AgendaTab";
import ReservationsTab from "./components/ReservationsTab";
import BudgetTab from "./components/BudgetTab";
import ToolsSheet from "./components/ToolsSheet";
import ReservationForm from "./components/ReservationForm";
import SharePanel from "./components/SharePanel";
import NotificationsPanel from "./components/NotificationsPanel";
import TripSelector from "./components/TripSelector";

export default function App() {
  const [user, setUser] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [trip, setTrip] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [tab, setTab] = useState("agenda");
  const [showTools, setShowTools] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDarkMode(mq.matches);
    const h = e => setDarkMode(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists() && userDoc.data().tripId) setTripId(userDoc.data().tripId);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!tripId) return;
    const unsub = onSnapshot(doc(db, "trips", tripId), snap => {
      if (snap.exists()) setTrip({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    const unsub = onSnapshot(collection(db, "trips", tripId, "reservations"), snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.dateStart || "").localeCompare(b.dateStart || ""));
      setReservations(items);
    });
    return unsub;
  }, [tripId]);

  const dm = darkMode;
  const C = {
    bg: dm ? "#111" : "#fff",
    bg2: dm ? "#1c1c1e" : "#f8f9fa",
    text: dm ? "#fff" : "#111",
    text2: dm ? "#aaa" : "#666",
    border: dm ? "#333" : "#e8e8e8",
  };

  const daysUntil = () => {
    if (!trip?.dateStart) return null;
    const diff = Math.ceil((new Date(trip.dateStart) - new Date()) / 86400000);
    return diff > 0 ? diff : null;
  };

  async function addReservation(data) {
    await addDoc(collection(db, "trips", tripId, "reservations"), {
      ...data, createdBy: user.uid, createdByName: user.displayName || "Moi", createdAt: serverTimestamp()
    });
    await addDoc(collection(db, "trips", tripId, "activity"), {
      text: `${user.displayName || "Un voyageur"} a ajouté : ${data.name}`,
      icon: {vol:"✈️",hotel:"🏨",transport:"🚌",activite:"🎭",restaurant:"🍽️"}[data.type] || "📌",
      createdAt: serverTimestamp(), uid: user.uid
    });
  }

  async function updateReservation(id, data) {
    await updateDoc(doc(db, "trips", tripId, "reservations", id), data);
  }

  async function deleteReservation(id) {
    await deleteDoc(doc(db, "trips", tripId, "reservations", id));
  }

  function handleAuth(u, tId) { setUser(u); setTripId(tId); }

  async function handleSignOut() {
    await signOut(auth);
    setUser(null); setTripId(null); setTrip(null); setReservations([]);
  }

  async function switchTrip(tId) {
    await updateDoc(doc(db, "users", user.uid), { tripId: tId });
    setTripId(tId);
    setShowTripSelector(false);
  }

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#1a6bb5"}}>
      <div style={{fontSize:48,marginBottom:12}}>✈️</div>
      <div style={{fontSize:16,color:"white",opacity:0.9}}>Chargement...</div>
    </div>
  );

  if (!user || !tripId) return (
    <div style={{maxWidth:430,margin:"0 auto",height:"100dvh",overflow:"hidden"}}>
      <AuthPage onAuth={handleAuth} darkMode={dm} C={C} />
    </div>
  );

  const memberInitials = trip ? Object.entries(trip.memberNames || {}).map(([uid, name], i) => ({ uid, initial: name?.[0]?.toUpperCase() || "?", name })) : [];
  const countdown = daysUntil();

  return (
    <div style={{maxWidth:430,margin:"0 auto",height:"100dvh",overflow:"hidden",position:"relative",background:C.bg}}>
      <div style={{height:"100%",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",position:"relative"}}>

        {/* HEADER */}
        <div style={{background:"#1a6bb5",paddingTop:"max(env(safe-area-inset-top),16px)",paddingBottom:12,paddingLeft:20,paddingRight:20,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{cursor:"pointer",flex:1,minWidth:0}} onClick={() => setShowTripSelector(true)}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:17,fontWeight:700,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trip?.destination || trip?.name || "Mon voyage"}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",flexShrink:0}}>▾</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"nowrap"}}>
                <div style={{fontSize:11,opacity:0.8,color:"white",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {trip?.dateStart && trip?.dateEnd ? `${trip.dateStart} → ${trip.dateEnd}` : ""}
                  {" · "}{(trip?.members?.length || 1)} voyageur{(trip?.members?.length || 1) > 1 ? "s" : ""}
                </div>
                {countdown && (
                  <div style={{flexShrink:0,background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"2px 10px",fontSize:12,fontWeight:700,color:"white",whiteSpace:"nowrap"}}>
                    J-{countdown}
                  </div>
                )}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:12,flexShrink:0}}>
              <div style={{width:7,height:7,background:"#4ade80",borderRadius:"50%"}}></div>
              <button onClick={() => setShowNotifs(true)} style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.2)",border:"none",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>🔔</button>
              <div style={{display:"flex"}}>
                {memberInitials.slice(0,3).map((m,i) => (
                  <button key={m.uid} onClick={() => setShowShare(true)}
                    style={{width:30,height:30,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.5)",color:"white",fontSize:11,fontWeight:700,cursor:"pointer",marginLeft:i===0?0:-6,zIndex:3-i,background:"rgba(255,255,255,0.25)"}}>
                    {m.initial}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NAV */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.bg,flexShrink:0}}>
          {["agenda","reservations","budget"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{flex:1,padding:"11px 8px",fontSize:12,color:tab===t?"#1a6bb5":C.text2,border:"none",background:"none",borderBottom:tab===t?"2px solid #1a6bb5":"2px solid transparent",cursor:"pointer",fontWeight:tab===t?700:400}}>
              {t==="agenda"?"Agenda":t==="reservations"?"Réservations":"Budget"}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{flex:1,overflowY:"auto",padding:16,position:"relative"}}>
          {tab==="agenda" && <AgendaTab reservations={reservations} trip={trip} onAdd={() => setShowForm(true)} onEdit={r => { setEditingReservation(r); setShowForm(true); }} currentUser={user} C={C} />}
          {tab==="reservations" && <ReservationsTab reservations={reservations} onAdd={() => setShowForm(true)} onEdit={r => { setEditingReservation(r); setShowForm(true); }} onDelete={deleteReservation} currentUser={user} C={C} tripId={tripId} />}
          {tab==="budget" && <BudgetTab reservations={reservations} trip={trip} tripId={tripId} C={C} />}
        </div>

        {/* TOOLS FAB — bas droite */}
        <button onClick={() => setShowTools(true)}
          style={{position:"absolute",bottom:"max(env(safe-area-inset-bottom),16px)",right:20,width:50,height:50,borderRadius:"50%",background:"#1a6bb5",border:"none",cursor:"pointer",fontSize:24,boxShadow:"0 4px 12px rgba(26,107,181,0.4)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
          🧰
        </button>

        {showForm && <ReservationForm onClose={() => { setShowForm(false); setEditingReservation(null); }} onSave={addReservation} onUpdate={updateReservation} trip={trip} editing={editingReservation} C={C} tripId={tripId} />}
        {showTools && <ToolsSheet onClose={() => setShowTools(false)} C={C} />}
        {showShare && <SharePanel trip={trip} tripId={tripId} onClose={() => setShowShare(false)} onSignOut={handleSignOut} currentUser={user} C={C} />}
        {showNotifs && <NotificationsPanel tripId={tripId} onClose={() => setShowNotifs(false)} C={C} />}
        {showTripSelector && <TripSelector user={user} currentTripId={tripId} onSwitch={switchTrip} onClose={() => setShowTripSelector(false)} C={C} />}
      </div>
    </div>
  );
}
