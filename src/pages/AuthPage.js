import { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState("auth");
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"" });
  const [tripForm, setTripForm] = useState({ name:"", destination:"", dateStart:"", dateEnd:"", inviteCode:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setTrip = (k,v) => setTripForm(f=>({...f,[k]:v}));

  function validateDates() {
    if (tripForm.dateStart && tripForm.dateEnd && tripForm.dateEnd < tripForm.dateStart) {
      setError("La date de retour ne peut pas précéder la date de départ.");
      return false;
    }
    return true;
  }

  async function createTrip(user) {
    if (!validateDates()) return;
    const code = Math.random().toString(36).substring(2,8).toUpperCase();
    const ref = doc(collection(db, "trips"));
    await setDoc(ref, {
      name: tripForm.name || tripForm.destination || "Mon voyage",
      destination: tripForm.destination || "",
      dateStart: tripForm.dateStart || "",
      dateEnd: tripForm.dateEnd || "",
      code, members:[user.uid],
      memberNames:{ [user.uid]: user.displayName || tripForm.firstName },
      createdBy: user.uid, createdAt: Date.now()
    });
    await setDoc(doc(db,"users",user.uid), { tripId: ref.id, displayName: user.displayName || tripForm.firstName }, { merge:true });
    onAuth(user, ref.id);
  }

  async function joinTrip(user) {
    const code = tripForm.inviteCode.trim().toUpperCase();
    const q = query(collection(db,"trips"), where("code","==",code));
    const snap = await getDocs(q);
    if (snap.empty) { setError("Code d'invitation introuvable."); return; }
    const tripDoc = snap.docs[0];
    const tripId = tripDoc.id, tripData = tripDoc.data();
    const newMembers = [...new Set([...tripData.members, user.uid])];
    const newNames = { ...tripData.memberNames, [user.uid]: user.displayName || tripForm.firstName };
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db,"trips",tripId), { members:newMembers, memberNames:newNames });
    await setDoc(doc(db,"users",user.uid), { tripId, displayName: user.displayName||tripForm.firstName }, { merge:true });
    onAuth(user, tripId);
  }

  async function handleRegister() {
    setError(""); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName:`${form.firstName} ${form.lastName}`.trim() });
      setStep("trip");
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  async function handleLogin() {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const userDoc = await getDoc(doc(db,"users",cred.user.uid));
      if (userDoc.exists() && userDoc.data().tripId) onAuth(cred.user, userDoc.data().tripId);
      else setStep("trip");
    } catch(e) { setError("Email ou mot de passe incorrect."); }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db,"users",cred.user.uid));
      if (userDoc.exists() && userDoc.data().tripId) onAuth(cred.user, userDoc.data().tripId);
      else setStep("trip");
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  async function handleTripAction(action) {
    setError(""); setLoading(true);
    try {
      if (action==="create") await createTrip(auth.currentUser);
      else await joinTrip(auth.currentUser);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  if (step==="trip") return (
    <div style={s.screen}>
      <div style={s.header}><div style={s.logo}>✈️</div><div style={s.appName}>Pommepoire</div><div style={s.tagline}>Votre voyage partagé</div></div>
      <div style={s.body}>
        <div style={s.title}>Votre voyage</div>
        <div style={s.sub}>Créez un nouveau voyage ou rejoignez celui d'un proche.</div>
        {error && <div style={s.err}>{error}</div>}
        <div style={s.card}>
          <div style={s.cardTitle}>Créer un nouveau voyage</div>
          <input style={s.inp} placeholder="Destination (ex : Barcelone)" value={tripForm.destination} onChange={e => { setTrip("destination",e.target.value); setError(""); }} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div style={s.fieldLabel}>Date de départ</div><input style={s.inp} type="date" value={tripForm.dateStart} onChange={e => { setTrip("dateStart",e.target.value); setError(""); }} /></div>
            <div><div style={s.fieldLabel}>Date de retour</div><input style={s.inp} type="date" value={tripForm.dateEnd} min={tripForm.dateStart} onChange={e => { setTrip("dateEnd",e.target.value); setError(""); }} /></div>
          </div>
          {tripForm.dateStart && tripForm.dateEnd && tripForm.dateEnd < tripForm.dateStart && (
            <div style={s.warn}>⚠️ La date de retour précède la date de départ</div>
          )}
          <button style={s.btn} onClick={() => handleTripAction("create")} disabled={loading}>{loading?"Création...":"Créer le voyage"}</button>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Rejoindre un voyage</div>
          <input style={s.inp} placeholder="Code d'invitation (ex : BCN-X4K2)" value={tripForm.inviteCode} onChange={e => setTrip("inviteCode",e.target.value)} />
          <button style={{...s.btn,background:"#fff",color:"#1a6bb5",border:"1px solid #1a6bb5"}} onClick={() => handleTripAction("join")} disabled={loading}>{loading?"Recherche...":"Rejoindre"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.screen}>
      <div style={s.header}><div style={s.logo}>✈️</div><div style={s.appName}>Pommepoire</div><div style={s.tagline}>Planifiez et partagez vos voyages</div></div>
      <div style={s.body}>
        <div style={s.tabs}>
          <button style={{...s.tab,...(tab==="login"?s.tabA:{})}} onClick={() => setTab("login")}>Connexion</button>
          <button style={{...s.tab,...(tab==="register"?s.tabA:{})}} onClick={() => setTab("register")}>Créer un compte</button>
        </div>
        {error && <div style={s.err}>{error}</div>}
        {tab==="register" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input style={s.inp} placeholder="Prénom" value={form.firstName} onChange={e => set("firstName",e.target.value)} />
            <input style={s.inp} placeholder="Nom" value={form.lastName} onChange={e => set("lastName",e.target.value)} />
          </div>
        )}
        <input style={s.inp} type="email" placeholder="Email" value={form.email} onChange={e => set("email",e.target.value)} />
        <input style={s.inp} type="password" placeholder="Mot de passe" value={form.password} onChange={e => set("password",e.target.value)} />
        <button style={s.btn} onClick={tab==="login"?handleLogin:handleRegister} disabled={loading}>
          {loading?"...":(tab==="login"?"Se connecter":"Créer mon compte")}
        </button>
        <div style={{textAlign:"center",fontSize:12,color:"#999",margin:"12px 0"}}>ou</div>
        <button style={{...s.btn,background:"#fff",color:"#333",border:"1px solid #ddd"}} onClick={handleGoogle} disabled={loading}>🔗 &nbsp;Continuer avec Google</button>
      </div>
    </div>
  );
}

const s = {
  screen:{display:"flex",flexDirection:"column",height:"100%",fontFamily:"system-ui,sans-serif"},
  header:{background:"#1a6bb5",paddingTop:"max(env(safe-area-inset-top),32px)",paddingBottom:28,paddingLeft:24,paddingRight:24,color:"white",textAlign:"center"},
  logo:{fontSize:40,marginBottom:8},
  appName:{fontSize:24,fontWeight:700},
  tagline:{fontSize:13,opacity:0.8,marginTop:4},
  body:{flex:1,padding:"24px 20px",overflowY:"auto"},
  title:{fontSize:18,fontWeight:700,marginBottom:6,color:"#111"},
  sub:{fontSize:13,color:"#666",marginBottom:20,lineHeight:1.5},
  tabs:{display:"flex",background:"#f4f4f4",borderRadius:10,padding:3,marginBottom:20},
  tab:{flex:1,padding:8,textAlign:"center",fontSize:13,borderRadius:8,border:"none",background:"none",color:"#666",cursor:"pointer"},
  tabA:{background:"#fff",color:"#1a6bb5",fontWeight:700,border:"0.5px solid #ddd"},
  inp:{width:"100%",padding:"11px 12px",border:"1px solid #ddd",borderRadius:10,fontSize:14,marginBottom:10,background:"#fff",boxSizing:"border-box"},
  btn:{width:"100%",padding:13,background:"#1a6bb5",border:"none",borderRadius:12,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4},
  err:{background:"#fee",border:"1px solid #fcc",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#c00",marginBottom:12},
  warn:{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#f57c00",marginBottom:10},
  card:{background:"#f8f9fa",border:"1px solid #e8e8e8",borderRadius:12,padding:16,marginBottom:12},
  cardTitle:{fontSize:14,fontWeight:700,color:"#111",marginBottom:10},
  fieldLabel:{fontSize:11,color:"#888",marginBottom:3},
};
