import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState("auth"); // "auth" | "trip"
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [tripForm, setTripForm] = useState({ name: "", destination: "", dateStart: "", dateEnd: "", inviteCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setTrip = (k, v) => setTripForm(f => ({ ...f, [k]: v }));

  async function createTrip(user) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tripId = `trip_${Date.now()}`;
    await setDoc(doc(db, "trips", tripId), {
      name: tripForm.name || "Mon voyage",
      destination: tripForm.destination || "",
      dateStart: tripForm.dateStart || "",
      dateEnd: tripForm.dateEnd || "",
      code,
      members: [user.uid],
      memberNames: { [user.uid]: user.displayName || form.firstName },
      createdBy: user.uid,
      createdAt: Date.now()
    });
    await setDoc(doc(db, "users", user.uid), { tripId, displayName: user.displayName || form.firstName }, { merge: true });
    onAuth(user, tripId);
  }

  async function joinTrip(user) {
    const code = tripForm.inviteCode.trim().toUpperCase();
    // find trip by code
    const { getDocs, collection, query, where } = await import("firebase/firestore");
    const q = query(collection(db, "trips"), where("code", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) { setError("Code d'invitation introuvable."); return; }
    const tripDoc = snap.docs[0];
    const tripId = tripDoc.id;
    const tripData = tripDoc.data();
    const newMembers = [...new Set([...tripData.members, user.uid])];
    const newNames = { ...tripData.memberNames, [user.uid]: user.displayName || form.firstName };
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "trips", tripId), { members: newMembers, memberNames: newNames });
    await setDoc(doc(db, "users", user.uid), { tripId, displayName: user.displayName || form.firstName }, { merge: true });
    onAuth(user, tripId);
  }

  async function handleRegister() {
    setError(""); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: `${form.firstName} ${form.lastName}`.trim() });
      setStep("trip");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (userDoc.exists() && userDoc.data().tripId) {
        onAuth(cred.user, userDoc.data().tripId);
      } else {
        setStep("trip");
      }
    } catch (e) { setError("Email ou mot de passe incorrect."); }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (userDoc.exists() && userDoc.data().tripId) {
        onAuth(cred.user, userDoc.data().tripId);
      } else {
        setStep("trip");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleTripAction(action) {
    setError(""); setLoading(true);
    try {
      if (action === "create") await createTrip(auth.currentUser);
      else await joinTrip(auth.currentUser);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  if (step === "trip") return (
    <div style={styles.screen}>
      <div style={styles.authHeader}>
        <div style={styles.logo}>✈️</div>
        <div style={styles.appName}>Pommepoire</div>
        <div style={styles.tagline}>Votre voyage partagé</div>
      </div>
      <div style={styles.authBody}>
        <div style={styles.authTitle}>Votre voyage</div>
        <div style={styles.authSub}>Créez un nouveau voyage ou rejoignez celui d'un proche.</div>
        {error && <div style={styles.errorBox}>{error}</div>}
        <div style={styles.joinCard}>
          <div style={styles.joinCardTitle}>Créer un nouveau voyage</div>
          <input style={styles.input} placeholder="Nom du voyage (ex : Barcelone 2026)" value={tripForm.name} onChange={e => setTrip("name", e.target.value)} />
          <input style={styles.input} placeholder="Destination" value={tripForm.destination} onChange={e => setTrip("destination", e.target.value)} />
          <div style={styles.row}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"#888",marginBottom:4}}>Date de départ</div>
              <input style={{...styles.input}} type="date" value={tripForm.dateStart} onChange={e => setTrip("dateStart", e.target.value)} />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"#888",marginBottom:4}}>Date de retour</div>
              <input style={{...styles.input}} type="date" value={tripForm.dateEnd} min={tripForm.dateStart} onChange={e => setTrip("dateEnd", e.target.value)} />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={() => handleTripAction("create")} disabled={loading}>
            {loading ? "Création..." : "Créer le voyage"}
          </button>
        </div>
        <div style={styles.joinCard}>
          <div style={styles.joinCardTitle}>Rejoindre un voyage</div>
          <input style={styles.input} placeholder="Code d'invitation (ex : BCN-X4K2)" value={tripForm.inviteCode} onChange={e => setTrip("inviteCode", e.target.value)} />
          <button style={{...styles.btnPrimary, background:"#fff", color:"#1a6bb5", border:"1px solid #1a6bb5"}} onClick={() => handleTripAction("join")} disabled={loading}>
            {loading ? "Recherche..." : "Rejoindre"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.screen}>
      <div style={styles.authHeader}>
        <div style={styles.logo}>✈️</div>
        <div style={styles.appName}>Pommepoire</div>
        <div style={styles.tagline}>Planifiez et partagez vos voyages</div>
      </div>
      <div style={styles.authBody}>
        <div style={styles.tabRow}>
          <button style={{...styles.tabBtn, ...(tab==="login" ? styles.tabActive : {})}} onClick={() => setTab("login")}>Connexion</button>
          <button style={{...styles.tabBtn, ...(tab==="register" ? styles.tabActive : {})}} onClick={() => setTab("register")}>Créer un compte</button>
        </div>
        {error && <div style={styles.errorBox}>{error}</div>}
        {tab === "register" && (
          <div style={styles.row}>
            <input style={{...styles.input, flex:1}} placeholder="Prénom" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
            <input style={{...styles.input, flex:1}} placeholder="Nom" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
          </div>
        )}
        <input style={styles.input} type="email" placeholder="Email" value={form.email} onChange={e => set("email", e.target.value)} />
        <input style={styles.input} type="password" placeholder="Mot de passe" value={form.password} onChange={e => set("password", e.target.value)} />
        <button style={styles.btnPrimary} onClick={tab === "login" ? handleLogin : handleRegister} disabled={loading}>
          {loading ? "..." : tab === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
        <div style={styles.divider}>ou</div>
        <button style={{...styles.btnPrimary, background:"#fff", color:"#333", border:"1px solid #ddd"}} onClick={handleGoogle} disabled={loading}>
          🔗 &nbsp;Continuer avec Google
        </button>
      </div>
    </div>
  );
}

const styles = {
  screen: { display:"flex", flexDirection:"column", height:"100%", fontFamily:"system-ui, sans-serif" },
  authHeader: { background:"#1a6bb5", padding:"32px 24px 28px", color:"white", textAlign:"center" },
  logo: { fontSize:40, marginBottom:8 },
  appName: { fontSize:24, fontWeight:600 },
  tagline: { fontSize:13, opacity:0.8, marginTop:4 },
  authBody: { flex:1, padding:"24px 20px", overflowY:"auto" },
  authTitle: { fontSize:18, fontWeight:600, marginBottom:6, color:"#111" },
  authSub: { fontSize:13, color:"#666", marginBottom:20, lineHeight:1.5 },
  tabRow: { display:"flex", background:"#f4f4f4", borderRadius:10, padding:3, marginBottom:20 },
  tabBtn: { flex:1, padding:"8px", textAlign:"center", fontSize:13, borderRadius:8, border:"none", background:"none", color:"#666", cursor:"pointer" },
  tabActive: { background:"#fff", color:"#1a6bb5", fontWeight:600, border:"0.5px solid #ddd" },
  input: { width:"100%", padding:"11px 12px", border:"1px solid #ddd", borderRadius:10, fontSize:14, marginBottom:10, background:"#fff", boxSizing:"border-box" },
  row: { display:"flex", gap:10 },
  btnPrimary: { width:"100%", padding:13, background:"#1a6bb5", border:"none", borderRadius:12, color:"white", fontSize:15, fontWeight:600, cursor:"pointer", marginTop:4 },
  divider: { textAlign:"center", fontSize:12, color:"#999", margin:"14px 0" },
  errorBox: { background:"#fee", border:"1px solid #fcc", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#c00", marginBottom:12 },
  joinCard: { background:"#f8f9fa", border:"1px solid #e8e8e8", borderRadius:12, padding:16, marginBottom:12 },
  joinCardTitle: { fontSize:14, fontWeight:600, color:"#111", marginBottom:10 },
};
