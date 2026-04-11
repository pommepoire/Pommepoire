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

export default function App() {
  const [user, setUser] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [trip, setTrip] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [tab, setTab] = useState("agenda");
  const [showTools, setShowTools] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists() && userDoc.data().tripId) {
          setTripId(userDoc.data().tripId);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!tripId) return;
    const unsub = onSnapshot(doc(db, "trips", tripId), (snap) => {
      if (snap.exists()) setTrip({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    const unsub = onSnapshot(collection(db, "trips", tripId, "reservations"), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.dateStart || "").localeCompare(b.dateStart || ""));
      setReservations(items);
    });
    return unsub;
  }, [tripId]);

  async function addReservation(data) {
    await addDoc(collection(db, "trips", tripId, "reservations"), {
      ...data,
      createdBy: user.uid,
      createdByName: user.displayName || "Moi",
      createdAt: serverTimestamp()
    });
    // log activity
    await addDoc(collection(db, "trips", tripId, "activity"), {
      text: `${user.displayName || "Un voyageur"} a ajouté : ${data.name}`,
      icon: data.type === "vol" ? "✈️" : data.type === "hotel" ? "🏨" : data.type === "transport" ? "🚌" : "🎭",
      createdAt: serverTimestamp(),
      uid: user.uid
    });
  }

  async function deleteReservation(id) {
    await deleteDoc(doc(db, "trips", tripId, "reservations", id));
  }

  function handleAuth(u, tId) {
    setUser(u);
    setTripId(tId);
  }

  async function handleSignOut() {
    await signOut(auth);
    setUser(null);
    setTripId(null);
    setTrip(null);
    setReservations([]);
  }

  if (loading) return (
    <div style={appStyles.loadingScreen}>
      <div style={{fontSize:40, marginBottom:12}}>✈️</div>
      <div style={{fontSize:16, color:"#666"}}>Chargement...</div>
    </div>
  );

  if (!user || !tripId) return (
    <div style={appStyles.phoneFrame}>
      <AuthPage onAuth={handleAuth} />
    </div>
  );

  const memberCount = trip?.members?.length || 1;
  const memberInitials = trip ? Object.entries(trip.memberNames || {}).map(([uid, name]) => ({
    uid,
    initial: name ? name[0].toUpperCase() : "?",
    name
  })) : [];

  return (
    <div style={appStyles.phoneFrame}>
      <div style={appStyles.app}>
        {/* HEADER */}
        <div style={appStyles.header}>
          <div style={appStyles.headerTop}>
            <div>
              <div style={appStyles.headerTrip}>{trip?.destination || trip?.name || "Mon voyage"}</div>
              <div style={appStyles.headerSub}>
                {trip?.dateStart && trip?.dateEnd
                  ? `${trip.dateStart} → ${trip.dateEnd} · `
                  : ""}
                {memberCount} voyageur{memberCount > 1 ? "s" : ""}
              </div>
            </div>
            <div style={appStyles.headerActions}>
              <div style={appStyles.syncDot}></div>
              <button style={appStyles.iconBtn} onClick={() => setShowNotifs(true)}>🔔</button>
              <div style={{display:"flex"}}>
                {memberInitials.slice(0,3).map((m, i) => (
                  <button key={m.uid} onClick={() => setShowShare(true)}
                    style={{...appStyles.avatarBtn, marginLeft: i===0 ? 0 : -6, zIndex: 3-i,
                      background: i===0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.2)"}}>
                    {m.initial}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NAV */}
        <div style={appStyles.nav}>
          {["agenda","reservations","budget"].map(t => (
            <button key={t} style={{...appStyles.navBtn, ...(tab===t ? appStyles.navBtnActive : {})}}
              onClick={() => setTab(t)}>
              {t === "agenda" ? "Agenda" : t === "reservations" ? "Réservations" : "Budget"}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={appStyles.content}>
          {tab === "agenda" && <AgendaTab reservations={reservations} trip={trip} onAdd={() => setShowForm(true)} currentUser={user} />}
          {tab === "reservations" && <ReservationsTab reservations={reservations} onAdd={() => setShowForm(true)} onDelete={deleteReservation} currentUser={user} />}
          {tab === "budget" && <BudgetTab reservations={reservations} trip={trip} tripId={tripId} />}
        </div>

        {/* TOOLS FAB */}
        <div style={appStyles.toolsBar}>
          <button style={appStyles.fab} onClick={() => setShowTools(true)}>⚙️</button>
        </div>

        {/* OVERLAYS */}
        {showForm && <ReservationForm onClose={() => setShowForm(false)} onSave={addReservation} trip={trip} />}
        {showTools && <ToolsSheet onClose={() => setShowTools(false)} />}
        {showShare && <SharePanel trip={trip} tripId={tripId} onClose={() => setShowShare(false)} onSignOut={handleSignOut} currentUser={user} />}
        {showNotifs && <NotificationsPanel tripId={tripId} onClose={() => setShowNotifs(false)} />}
      </div>
    </div>
  );
}

const appStyles = {
  loadingScreen: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#f5f5f5" },
  phoneFrame: { maxWidth:430, margin:"0 auto", height:"100dvh", overflow:"hidden", position:"relative" },
  app: { height:"100%", display:"flex", flexDirection:"column", background:"#fff", fontFamily:"system-ui,-apple-system,sans-serif", position:"relative" },
  header: { background:"#1a6bb5", padding:"env(safe-area-inset-top, 16px) 20px 12px", paddingTop:"max(env(safe-area-inset-top), 16px)", color:"white", flexShrink:0 },
  headerTop: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  headerTrip: { fontSize:18, fontWeight:600 },
  headerSub: { fontSize:12, opacity:0.8, marginTop:2 },
  headerActions: { display:"flex", alignItems:"center", gap:8 },
  syncDot: { width:7, height:7, background:"#4ade80", borderRadius:"50%" },
  iconBtn: { width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"none", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" },
  avatarBtn: { width:30, height:30, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.5)", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" },
  nav: { display:"flex", borderBottom:"1px solid #eee", background:"#fff", flexShrink:0 },
  navBtn: { flex:1, padding:"11px 8px", fontSize:12, color:"#888", border:"none", background:"none", borderBottom:"2px solid transparent", cursor:"pointer" },
  navBtnActive: { color:"#1a6bb5", borderBottomColor:"#1a6bb5", fontWeight:600 },
  content: { flex:1, overflowY:"auto", padding:16 },
  toolsBar: { display:"flex", justifyContent:"center", padding:"8px 0 6px", borderTop:"1px solid #eee", flexShrink:0 },
  fab: { width:46, height:46, borderRadius:"50%", background:"#1a6bb5", border:"none", cursor:"pointer", fontSize:22, boxShadow:"0 2px 8px rgba(26,107,181,0.3)" },
};
