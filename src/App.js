import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, updateDoc, increment, Timestamp, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAcu94iTuUGZxM0rxAYA54DcQr2KaFnPfc",
  authDomain: "assign-x-f8826.firebaseapp.com",
  projectId: "assign-x-f8826",
  storageBucket: "assign-x-f8826.firebasestorage.app",
  messagingSenderId: "508284491776",
  appId: "1:508284491776:web:2ac3a64c5eb01116b120e5",
  measurementId: "G-8WLVS8SWLT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ============ MAIN APP ============
function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const data = userDoc.data();
        setUser(firebaseUser);
        setUserRole(data?.role || 'student');
        setUserName(data?.name || firebaseUser.email);
      } else {
        setUser(null);
        setUserRole(null);
        setCurrentView('login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <LoadingScreen />;

  if (currentView === 'login') {
    return <LoginPage onLogin={(u, r, n) => { setUser(u); setUserRole(r); setUserName(n); setCurrentView(r === 'faculty' ? 'faculty' : 'student'); }} />;
  }
  if (currentView === 'signup') {
    return <SignupPage onSignup={() => setCurrentView('login')} />;
  }
  if (currentView === 'student') {
    return <StudentDashboard user={user} userName={userName} onLogout={() => { signOut(auth); setCurrentView('login'); }} />;
  }
  if (currentView === 'faculty') {
    return <FacultyDashboard user={user} userName={userName} onLogout={() => { signOut(auth); setCurrentView('login'); }} />;
  }
  return null;
}

// ============ LOADING SCREEN ============
function LoadingScreen() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <h2>Loading AssignX...</h2>
      <p>Preparing your learning platform</p>
    </div>
  );
}

// ============ LOGIN PAGE ============
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const data = userDoc.data();
      onLogin(result.user, data?.role || 'student', data?.name || result.user.email);
    } catch (err) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <span style={styles.logoEmoji}>??</span>
          <h1 style={styles.title}>AssignX</h1>
          <p style={styles.tagline}>Transform assignments into measurable skills</p>
        </div>
        <h2 style={styles.subtitle}>{'Welcome Back'}</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email Address" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p style={styles.footer}>New user? <button onClick={() => window.location.reload()} style={styles.link}>Create Account</button></p>
        <div style={styles.demoBox}>
          <p><strong>?? Demo Accounts:</strong></p>
          <p>?? faculty@assignx.com / 123456</p>
          <p>?? student@assignx.com / 123456</p>
        </div>
      </div>
    </div>
  );
}

// ============ SIGNUP PAGE ============
function SignupPage({ onSignup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', result.user.uid), {
        name, email, role, totalEcoScore: 0, createdAt: new Date().toISOString()
      });
      alert('? Account created successfully! Please login.');
      onSignup();
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}><span style={styles.logoEmoji}>??</span><h1 style={styles.title}>AssignX</h1></div>
        <h2 style={styles.subtitle}>Create Account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSignup}>
          <input type="text" placeholder="Full Name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email Address" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 6 characters)" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}><input type="radio" value="student" checked={role === 'student'} onChange={(e) => setRole(e.target.value)} /> ????? Student</label>
            <label style={styles.radioLabel}><input type="radio" value="faculty" checked={role === 'faculty'} onChange={(e) => setRole(e.target.value)} /> ????? Faculty</label>
          </div>
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  );
}

// ============ STUDENT DASHBOARD ============
function StudentDashboard({ user, userName, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmit, setShowSubmit] = useState(null);
  const [proofLink, setProofLink] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewingPortfolio, setViewingPortfolio] = useState(false);
  const [ecoScore, setEcoScore] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const assignmentsSnap = await getDocs(query(collection(db, 'assignments'), where('isActive', '==', true)));
    setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const submissionsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', user.uid)));
    setSubmissions(submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    setEcoScore(userDoc.data()?.totalEcoScore || 0);
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `submissions/${user.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (assignmentId) => {
    setUploading(true);
    try {
      let fileUrl = proofLink;
      if (selectedFile) {
        fileUrl = await handleFileUpload(selectedFile);
      }
      await addDoc(collection(db, 'submissions'), {
        assignmentId, studentId: user.uid, proofLink: fileUrl, description,
        status: 'submitted', submittedAt: Timestamp.now(), ecoScore: 15
      });
      await updateDoc(doc(db, 'users', user.uid), { totalEcoScore: increment(15) });
      alert('? Assignment submitted successfully!');
      setShowSubmit(null);
      setProofLink('');
      setDescription('');
      setSelectedFile(null);
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
    setUploading(false);
  };

  const isSubmitted = (assignmentId) => submissions.some(s => s.assignmentId === assignmentId);
  const getSubmission = (assignmentId) => submissions.find(s => s.assignmentId === assignmentId);
  const totalPages = submissions.length * 15;
  const treesSaved = Math.floor(totalPages / 500);

  if (viewingPortfolio) {
    return <PortfolioView user={user} submissions={submissions} assignments={assignments} onBack={() => setViewingPortfolio(false)} />;
  }

  const pendingCount = assignments.filter(a => !isSubmitted(a.id)).length;
  const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>?? AssignX</h1>
          <div style={styles.navLinks}>
            <button onClick={() => setViewingPortfolio(false)} style={styles.navLink}>Dashboard</button>
            <button onClick={() => setViewingPortfolio(true)} style={styles.navLink}>?? Portfolio</button>
            <span style={styles.userInfo}>?? {userName}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.content}>
        {/* Eco Score Hero Banner */}
        <div style={styles.ecoHero}>
          <div><h2 style={styles.heroTitle}>?? Your Eco Impact</h2><p>Every digital submission saves paper and trees!</p></div>
          <div style={styles.heroStats}>
            <div><div style={styles.statNumber}>{totalPages}</div><div>Pages Saved</div></div>
            <div><div style={styles.statNumber}>{treesSaved}</div><div>Trees Saved</div></div>
            <div><div style={styles.statNumber}>{submissions.length}</div><div>Submissions</div></div>
          </div>
        </div>

        {/* Progress Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><h3>?? Pending</h3><div style={styles.statBig}>{pendingCount}</div><p>assignments to complete</p></div>
          <div style={styles.statCard}><h3>? Evaluated</h3><div style={styles.statBig}>{evaluatedCount}</div><p>assignments graded</p></div>
          <div style={styles.statCard}><h3>?? Avg Score</h3><div style={styles.statBig}>{Math.round(submissions.filter(s => s.marks).reduce((a,b) => a + (b.marks?.total || 0), 0) / (submissions.filter(s => s.marks).length || 1))}</div><p>out of 20</p></div>
        </div>

        <h2 style={styles.sectionTitle}>?? Current Assignments</h2>
        <div style={styles.grid}>
          {assignments.map(assign => {
            const submitted = isSubmitted(assign.id);
            const sub = getSubmission(assign.id);
            return (
              <div key={assign.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3>{assign.title}</h3>
                  {submitted ? <span style={styles.submittedBadge}>? Submitted</span> : <span style={styles.pendingBadge}>? Pending</span>}
                </div>
                <p style={styles.cardDesc}>{assign.description}</p>
                <div style={styles.cardInfo}>
                  <span>?? Total: {assign.totalMarks || 20} marks</span>
                  <span>?? Due: {assign.dueDate?.toDate().toLocaleDateString() || 'N/A'}</span>
                </div>
                {assign.rubric && (
                  <div style={styles.rubricPreview}>
                    <span>?? {assign.rubric.implementation} marks</span>
                    <span>?? {assign.rubric.creativity} marks</span>
                    <span>?? {assign.rubric.presentation} marks</span>
                  </div>
                )}
                {submitted && sub?.marks && (
                  <div style={styles.scoreBox}>
                    <span>?? Score: {sub.marks.total}/{assign.totalMarks || 20}</span>
                    {sub.feedback && <span>?? "{sub.feedback}"</span>}
                  </div>
                )}
                {!submitted && showSubmit === assign.id ? (
                  <div style={styles.submitForm}>
                    <input placeholder="GitHub / YouTube / Drive Link" style={styles.inputSmall} value={proofLink} onChange={(e) => setProofLink(e.target.value)} />
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files[0])} style={styles.fileInput} />
                    <textarea placeholder="Describe your work..." rows="2" style={styles.textareaSmall} value={description} onChange={(e) => setDescription(e.target.value)} />
                    <div style={styles.formActions}>
                      <button onClick={() => handleSubmit(assign.id)} style={styles.submitBtn} disabled={uploading}>{uploading ? 'Uploading...' : 'Submit'}</button>
                      <button onClick={() => setShowSubmit(null)} style={styles.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                ) : !submitted && (
                  <button onClick={() => setShowSubmit(assign.id)} style={styles.actionBtn}>?? Submit Work</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ PORTFOLIO VIEW ============
function PortfolioView({ user, submissions, assignments, onBack }) {
  const totalPages = submissions.length * 15;
  const treesSaved = Math.floor(totalPages / 500);

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>?? AssignX</h1>
          <div style={styles.navLinks}>
            <button onClick={onBack} style={styles.navLink}>? Back to Dashboard</button>
            <span style={styles.userInfo}>?? {user.displayName || user.email}</span>
            <button onClick={() => signOut(auth)} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.portfolioContainer}>
        <div style={styles.portfolioHeader}>
          <h1>?? Student Portfolio</h1>
          <p>Proof of skills, not just marksheets</p>
        </div>
        <div style={styles.portfolioStats}>
          <div><strong>{submissions.length}</strong> Submissions</div>
          <div><strong>{totalPages}</strong> Pages Saved</div>
          <div><strong>{treesSaved}</strong> Trees Equivalent</div>
          <div><strong>{submissions.filter(s => s.status === 'evaluated').length}</strong> Evaluated</div>
        </div>
        <div style={styles.portfolioGrid}>
          {submissions.map(sub => {
            const assign = assignments.find(a => a.id === sub.assignmentId);
            return (
              <div key={sub.id} style={styles.portfolioCard}>
                <h3>{assign?.title || 'Assignment'}</h3>
                <p><strong>Status:</strong> {sub.status === 'evaluated' ? '? Evaluated' : '? Pending'}</p>
                {sub.marks && <p><strong>Score:</strong> {sub.marks.total}/20</p>}
                {sub.feedback && <p><strong>Feedback:</strong> "{sub.feedback}"</p>}
                <p><strong>Submission:</strong> <a href={sub.proofLink} target="_blank" rel="noopener noreferrer">View Work ??</a></p>
                <p><small>Submitted: {sub.submittedAt?.toDate().toLocaleDateString()}</small></p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ FACULTY DASHBOARD ============
function FacultyDashboard({ user, userName, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentType, setAssignmentType] = useState('Practical');
  const [implMarks, setImplMarks] = useState(10);
  const [creativeMarks, setCreativeMarks] = useState(5);
  const [presMarks, setPresMarks] = useState(5);
  const [evaluating, setEvaluating] = useState(null);
  const [marks, setMarks] = useState({ implementation: 0, creativity: 0, presentation: 0 });
  const [feedback, setFeedback] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const assignmentsSnap = await getDocs(collection(db, 'assignments'));
    setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const submissionsSnap = await getDocs(collection(db, 'submissions'));
    setSubmissions(submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    const studentsData = {};
    studentsSnap.docs.forEach(doc => { studentsData[doc.id] = doc.data().name; });
    setStudents(studentsData);
  };

  const createAssignment = async () => {
    if (!title || !description || !dueDate) { alert('Please fill all fields'); return; }
    try {
      await addDoc(collection(db, 'assignments'), {
        title, description, assignmentType, dueDate: Timestamp.fromDate(new Date(dueDate)),
        rubric: { implementation: implMarks, creativity: creativeMarks, presentation: presMarks },
        totalMarks: implMarks + creativeMarks + presMarks, createdBy: user.uid, createdAt: Timestamp.now(), isActive: true
      });
      alert('? Assignment created!');
      setShowForm(false);
      setTitle(''); setDescription(''); setDueDate('');
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const evaluateSubmission = async (submissionId, rubric) => {
    const total = marks.implementation + marks.creativity + marks.presentation;
    if (total > (rubric.implementation + rubric.creativity + rubric.presentation)) {
      alert('Marks exceed maximum allowed!');
      return;
    }
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        marks: { ...marks, total }, feedback, status: 'evaluated', evaluatedAt: Timestamp.now()
      });
      alert('? Evaluation submitted!');
      setEvaluating(null);
      setMarks({ implementation: 0, creativity: 0, presentation: 0 });
      setFeedback('');
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const totalSubmissions = submissions.length;
  const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;
  const totalEcoScore = submissions.length * 15;

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>?? AssignX - Faculty</h1>
          <div style={styles.navLinks}>
            <span style={styles.userInfo}>????? {userName}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.content}>
        {/* Stats Overview */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><h3>?? Assignments</h3><div style={styles.statBig}>{assignments.length}</div><p>created</p></div>
          <div style={styles.statCard}><h3>?? Submissions</h3><div style={styles.statBig}>{totalSubmissions}</div><p>received</p></div>
          <div style={styles.statCard}><h3>? Evaluated</h3><div style={styles.statBig}>{evaluatedCount}</div><p>completed</p></div>
          <div style={styles.statCard}><h3>?? Eco Impact</h3><div style={styles.statBig}>{totalEcoScore}</div><p>pages saved</p></div>
        </div>

        <div style={styles.header}><h2>?? Manage Assignments</h2><button onClick={() => setShowForm(!showForm)} style={styles.createBtn}>+ Create Assignment</button></div>
        
        {showForm && (
          <div style={styles.formCard}>
            <h3>Create New Assignment</h3>
            <input placeholder="Assignment Title" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Description" rows="3" style={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
            <select style={styles.input} value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
              <option>Practical</option><option>Field Project</option><option>Research</option><option>Portfolio</option>
            </select>
            <input type="date" style={styles.input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <h4>Rubric Configuration</h4>
            <div style={styles.rubricRow}><label>Implementation: {implMarks}/10</label><input type="range" min="0" max="10" value={implMarks} onChange={(e) => setImplMarks(parseInt(e.target.value))} /></div>
            <div style={styles.rubricRow}><label>Creativity: {creativeMarks}/5</label><input type="range" min="0" max="5" value={creativeMarks} onChange={(e) => setCreativeMarks(parseInt(e.target.value))} /></div>
            <div style={styles.rubricRow}><label>Presentation: {presMarks}/5</label><input type="range" min="0" max="5" value={presMarks} onChange={(e) => setPresMarks(parseInt(e.target.value))} /></div>
            <p style={styles.totalMarks}>Total Marks: {implMarks + creativeMarks + presMarks}</p>
            <button onClick={createAssignment} style={styles.publishBtn}>?? Publish Assignment</button>
          </div>
        )}

        <h2 style={styles.sectionTitle}>Your Assignments</h2>
        <div style={styles.grid}>
          {assignments.map(assign => {
            const subForAssign = submissions.filter(s => s.assignmentId === assign.id);
            return (
              <div key={assign.id} style={styles.card}>
                <div style={styles.cardHeader}><h3>{assign.title}</h3><span style={styles.typeBadge}>{assign.assignmentType || 'Practical'}</span></div>
                <p style={styles.cardDesc}>{assign.description}</p>
                <div style={styles.cardInfo}><span>?? {assign.totalMarks} marks</span><span>?? Due: {assign.dueDate?.toDate().toLocaleDateString()}</span><span>?? {subForAssign.length} submissions</span></div>
                <div style={styles.rubricPreview}><span>?? Impl: {assign.rubric?.implementation}</span><span>?? Creative: {assign.rubric?.creativity}</span><span>?? Pres: {assign.rubric?.presentation}</span></div>
                {subForAssign.map(sub => evaluating === sub.id ? (
                  <div key={sub.id} style={styles.evalBox}>
                    <p><strong>Student:</strong> {students[sub.studentId] || sub.studentId.substring(0, 10)}</p>
                    <p><strong>Submission:</strong> <a href={sub.proofLink} target="_blank" rel="noopener noreferrer">View Work ??</a></p>
                    <p><strong>Description:</strong> {sub.description}</p>
                    <div><label>Implementation: </label><input type="range" min="0" max={assign.rubric?.implementation || 10} onChange={(e) => setMarks({...marks, implementation: parseInt(e.target.value)})} /> <span>{marks.implementation}</span></div>
                    <div><label>Creativity: </label><input type="range" min="0" max={assign.rubric?.creativity || 5} onChange={(e) => setMarks({...marks, creativity: parseInt(e.target.value)})} /> <span>{marks.creativity}</span></div>
                    <div><label>Presentation: </label><input type="range" min="0" max={assign.rubric?.presentation || 5} onChange={(e) => setMarks({...marks, presentation: parseInt(e.target.value)})} /> <span>{marks.presentation}</span></div>
                    <textarea placeholder="Write feedback for student..." style={styles.inputSmall} rows="2" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                    <div style={styles.formActions}>
                      <button onClick={() => evaluateSubmission(sub.id, assign.rubric)} style={styles.submitBtn}>Submit Evaluation</button>
                      <button onClick={() => setEvaluating(null)} style={styles.cancelBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={sub.id} style={styles.subBox}>
                    <div><strong>{students[sub.studentId] || sub.studentId.substring(0, 10)}</strong> - {sub.status === 'evaluated' ? `? Scored: ${sub.marks?.total}/${assign.totalMarks}` : '? Pending'}</div>
                    {sub.status !== 'evaluated' && <button onClick={() => setEvaluating(sub.id)} style={styles.evaluateBtn}>?? Evaluate</button>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ STYLES ============
const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  spinner: { width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logoSection: { textAlign: 'center', marginBottom: '20px' },
  logoEmoji: { fontSize: '48px' },
  title: { fontSize: '36px', fontWeight: 'bold', color: '#667eea', margin: '10px 0 5px' },
  tagline: { color: '#666', fontSize: '14px' },
  subtitle: { fontSize: '20px', textAlign: 'center', marginBottom: '25px', color: '#333' },
  input: { width: '100%', padding: '14px', marginBottom: '15px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' },
  inputSmall: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  textareaSmall: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  fileInput: { marginBottom: '10px' },
  button: { width: '100%', padding: '14px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  error: { backgroundColor: '#fee', color: '#c62828', padding: '12px', borderRadius: '10px', marginBottom: '15px', textAlign: 'center' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#666' },
  link: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' },
  demoBox: { marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '10px', fontSize: '12px', textAlign: 'center' },
  radioGroup: { marginBottom: '15px', display: 'flex', gap: '20px', justifyContent: 'center' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
  navbar: { backgroundColor: '#667eea', padding: '15px 30px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 },
  navContent: { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '24px', margin: 0 },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  navLink: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', padding: '8px 12px', borderRadius: '8px' },
  userInfo: { fontSize: '14px', opacity: 0.9 },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '1400px', margin: '0 auto', padding: '30px' },
  ecoHero: { background: 'linear-gradient(135deg, #2e7d32, #4caf50)', borderRadius: '20px', padding: '30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  heroTitle: { fontSize: '28px', marginBottom: '10px' },
  heroStats: { display: 'flex', gap: '40px', textAlign: 'center' },
  statNumber: { fontSize: '32px', fontWeight: 'bold' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  statBig: { fontSize: '36px', fontWeight: 'bold', color: '#667eea', margin: '10px 0' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', color: '#333' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' },
  card: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardDesc: { color: '#666', marginBottom: '15px', lineHeight: '1.5' },
  cardInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginBottom: '15px' },
  rubricPreview: { display: 'flex', gap: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' },
  submittedBadge: { background: '#c8e6c9', color: '#2e7d32', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' },
  pendingBadge: { background: '#fff3e0', color: '#e65100', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' },
  typeBadge: { background: '#e3f2fd', color: '#1565c0', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' },
  scoreBox: { background: '#e8eaf6', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' },
  submitForm: { marginTop: '15px' },
  formActions: { display: 'flex', gap: '10px' },
  actionBtn: { width: '100%', padding: '12px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '10px' },
  submitBtn: { flex: 1, padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '10px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  evaluateBtn: { padding: '6px 12px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  createBtn: { padding: '12px 24px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' },
  formCard: { background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '30px' },
  publishBtn: { width: '100%', padding: '14px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  rubricRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
  totalMarks: { fontWeight: 'bold', marginTop: '10px', color: '#667eea' },
  evalBox: { marginTop: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '10px' },
  subBox: { marginTop: '10px', padding: '12px', backgroundColor: '#f0f4ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  portfolioContainer: { maxWidth: '1400px', margin: '0 auto', padding: '30px' },
  portfolioHeader: { textAlign: 'center', marginBottom: '30px' },
  portfolioStats: { display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '30px', padding: '20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '15px', color: 'white' },
  portfolioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  portfolioCard: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
};

// Add animation keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default App;
