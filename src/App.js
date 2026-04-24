import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAcu94iTuUGZxM0rxAYA54DcQr2KaFnPfc",
  authDomain: "assign-x-f8826.firebaseapp.com",
  projectId: "assign-x-f8826",
  storageBucket: "assign-x-f8826.firebasestorage.app",
  messagingSenderId: "508284491776",
  appId: "1:508284491776:web:2ac3a64c5eb01116b120e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const semesterCourses = {
  theory: [
    { code: "PCC-CSE205-T", name: "Microprocessor and Interfacing", credits: 3 },
    { code: "PCC-CSE206-T", name: "Computer Networks", credits: 3 },
    { code: "PCC-CSE207-T", name: "Database Management System", credits: 3 },
    { code: "PCC-CSE208-T", name: "Analysis and Design of Algorithms", credits: 3 },
    { code: "PCC-CSE209-T", name: "Software Engineering", credits: 3 },
    { code: "PCC-CSE210-T", name: "Java Programming", credits: 3 }
  ],
  practical: [
    { code: "PCC-CSE205-P", name: "Microprocessor and Interfacing Lab", credits: 1 },
    { code: "PCC-CSE206-P", name: "Computer Networks Lab", credits: 1 },
    { code: "PCC-CSE207-P", name: "Database Management System Lab", credits: 1 },
    { code: "PCC-CSE210-P", name: "Java Programming Lab", credits: 2 }
  ]
};

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
  if (currentView === 'login') return <LoginPage onLogin={(u, r, n) => { setUser(u); setUserRole(r); setUserName(n); setCurrentView(r === 'faculty' ? 'faculty' : 'student'); }} />;
  if (currentView === 'signup') return <SignupPage onSignup={() => setCurrentView('login')} />;
  if (currentView === 'student') return <StudentDashboard user={user} userName={userName} onLogout={() => { signOut(auth); setCurrentView('login'); }} />;
  if (currentView === 'faculty') return <FacultyDashboard user={user} userName={userName} onLogout={() => { signOut(auth); setCurrentView('login'); }} />;
  return null;
}

function LoadingScreen() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <h2>Loading AssignX</h2>
      <p>Preparing your learning platform...</p>
    </div>
  );
}

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
          <div style={styles.logoIcon}>??</div>
          <h1 style={styles.title}>AssignX</h1>
          <p style={styles.tagline}>Transform assignments into measurable skills</p>
        </div>
        <h2 style={styles.subtitle}>Welcome Back</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email Address" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p style={styles.footer}>New user? <button onClick={() => window.location.reload()} style={styles.link}>Create Account</button></p>
        <div style={styles.demoBox}>
          <p><strong>Demo Accounts:</strong></p>
          <p>Faculty: faculty@assignx.com / test123456</p>
          <p>Student: student@assignx.com / test123456</p>
        </div>
      </div>
    </div>
  );
}

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
      alert('Account created successfully! Please login.');
      onSignup();
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>??</div>
          <h1 style={styles.title}>AssignX</h1>
        </div>
        <h2 style={styles.subtitle}>Create Account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSignup}>
          <input type="text" placeholder="Full Name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email Address" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 6 characters)" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}><input type="radio" value="student" checked={role === 'student'} onChange={(e) => setRole(e.target.value)} /> Student</label>
            <label style={styles.radioLabel}><input type="radio" value="faculty" checked={role === 'faculty'} onChange={(e) => setRole(e.target.value)} /> Faculty</label>
          </div>
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  );
}

function StudentDashboard({ user, userName, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmit, setShowSubmit] = useState(null);
  const [proofLink, setProofLink] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const [newDoubt, setNewDoubt] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const assignmentsSnap = await getDocs(query(collection(db, 'assignments'), where('isActive', '==', true)));
    setAssignments(assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const submissionsSnap = await getDocs(query(collection(db, 'submissions'), where('studentId', '==', user.uid)));
    setSubmissions(submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    const doubtsSnap = await getDocs(query(collection(db, 'doubts'), where('studentId', '==', user.uid)));
    setDoubts(doubtsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddDoubt = async () => {
    if (!newDoubt.trim()) return;
    await addDoc(collection(db, 'doubts'), {
      studentId: user.uid,
      studentName: userName,
      doubt: newDoubt,
      answer: '',
      status: 'pending',
      createdAt: Timestamp.now()
    });
    setNewDoubt('');
    loadData();
    alert('Doubt posted! Faculty will answer soon.');
  };

  const totalPages = submissions.length * 15;
  const treesSaved = Math.floor(totalPages / 500);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div>
            <div style={styles.ecoHero}>
              <div><h2 style={styles.heroTitle}>Your Eco Impact</h2><p>Every digital submission saves paper and trees</p></div>
              <div style={styles.heroStats}>
                <div><div style={styles.statNumber}>{totalPages}</div><div>Pages Saved</div></div>
                <div><div style={styles.statNumber}>{treesSaved}</div><div>Trees Saved</div></div>
                <div><div style={styles.statNumber}>{submissions.length}</div><div>Submissions</div></div>
              </div>
            </div>
            <h2 style={styles.sectionTitle}>Current Assignments</h2>
            <div style={styles.grid}>
              {assignments.map(assign => {
                const submitted = submissions.some(s => s.assignmentId === assign.id);
                const sub = submissions.find(s => s.assignmentId === assign.id);
                return (
                  <div key={assign.id} style={styles.card}>
                    <div style={styles.cardHeader}><h3>{assign.title}</h3>{submitted ? <span style={styles.submittedBadge}>Submitted</span> : <span style={styles.pendingBadge}>Pending</span>}</div>
                    <p style={styles.cardDesc}>{assign.description}</p>
                    <div style={styles.cardInfo}><span>Total: {assign.totalMarks} marks</span><span>Due: {assign.dueDate?.toDate().toLocaleDateString()}</span></div>
                    {assign.rubric && (<div style={styles.rubricPreview}><span>Implementation: {assign.rubric.implementation}</span><span>Creativity: {assign.rubric.creativity}</span><span>Presentation: {assign.rubric.presentation}</span></div>)}
                    {submitted && sub?.marks && (<div style={styles.scoreBox}><span>Score: {sub.marks.total}/{assign.totalMarks}</span>{sub.feedback && <span>Feedback: "{sub.feedback}"</span>}</div>)}
                    {!submitted && showSubmit === assign.id ? (
                      <div style={styles.submitForm}>
                        <input placeholder="GitHub / YouTube Link" style={styles.inputSmall} value={proofLink} onChange={(e) => setProofLink(e.target.value)} />
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files[0])} style={styles.fileInput} />
                        <textarea placeholder="Describe your work..." rows="2" style={styles.textareaSmall} value={description} onChange={(e) => setDescription(e.target.value)} />
                        <div style={styles.formActions}>
                          <button onClick={async () => { setUploading(true); try { let url = proofLink; if (selectedFile) { const storageRef = ref(storage, `submissions/${user.uid}/${Date.now()}_${selectedFile.name}`); await uploadBytes(storageRef, selectedFile); url = await getDownloadURL(storageRef); } await addDoc(collection(db, 'submissions'), { assignmentId: assign.id, studentId: user.uid, proofLink: url, description, status: 'submitted', submittedAt: Timestamp.now(), ecoScore: 15 }); await updateDoc(doc(db, 'users', user.uid), { totalEcoScore: increment(15) }); alert('Submitted!'); setShowSubmit(null); loadData(); } catch(err) { alert('Error: ' + err.message); } setUploading(false); }} style={styles.submitBtn} disabled={uploading}>{uploading ? 'Uploading...' : 'Submit'}</button>
                          <button onClick={() => setShowSubmit(null)} style={styles.cancelBtn}>Cancel</button>
                        </div>
                      </div>
                    ) : !submitted && (<button onClick={() => setShowSubmit(assign.id)} style={styles.actionBtn}>Submit Assignment</button>)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'courses':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Semester 4 - Computer Science Engineering</h2>
            <h3 style={styles.subsectionTitle}>Theory Courses</h3>
            <div style={styles.courseGrid}>
              {semesterCourses.theory.map(course => (
                <div key={course.code} style={styles.courseCard}>
                  <h4>{course.name}</h4>
                  <p><strong>Code:</strong> {course.code}</p>
                  <p><strong>Credits:</strong> {course.credits}</p>
                </div>
              ))}
            </div>
            <h3 style={styles.subsectionTitle}>Practical Courses</h3>
            <div style={styles.courseGrid}>
              {semesterCourses.practical.map(course => (
                <div key={course.code} style={styles.courseCard}>
                  <h4>{course.name}</h4>
                  <p><strong>Code:</strong> {course.code}</p>
                  <p><strong>Credits:</strong> {course.credits}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'doubts':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Ask a Doubt</h2>
            <div style={styles.doubtForm}>
              <textarea placeholder="Type your doubt here..." rows="3" style={styles.input} value={newDoubt} onChange={(e) => setNewDoubt(e.target.value)} />
              <button onClick={handleAddDoubt} style={styles.submitBtn}>Post Doubt</button>
            </div>
            <h3 style={styles.subsectionTitle}>Your Doubts</h3>
            <div style={styles.doubtsList}>
              {doubts.map(doubt => (
                <div key={doubt.id} style={styles.doubtCard}>
                  <p><strong>Question:</strong> {doubt.doubt}</p>
                  {doubt.answer ? <p><strong style={{ color: '#4caf50' }}>Answer:</strong> {doubt.answer}</p> : <p><strong style={{ color: '#ff9800' }}>Status:</strong> Waiting for faculty response...</p>}
                  <p><small>Posted: {doubt.createdAt?.toDate().toLocaleDateString()}</small></p>
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>AssignX</h1>
          <div style={styles.navTabs}>
            <button onClick={() => setActiveTab('dashboard')} style={{...styles.navTab, background: activeTab === 'dashboard' ? '#fff' : 'transparent', color: activeTab === 'dashboard' ? '#667eea' : 'white'}}>Dashboard</button>
            <button onClick={() => setActiveTab('courses')} style={{...styles.navTab, background: activeTab === 'courses' ? '#fff' : 'transparent', color: activeTab === 'courses' ? '#667eea' : 'white'}}>My Courses</button>
            <button onClick={() => setActiveTab('doubts')} style={{...styles.navTab, background: activeTab === 'doubts' ? '#fff' : 'transparent', color: activeTab === 'doubts' ? '#667eea' : 'white'}}>Ask Doubt</button>
          </div>
          <div style={styles.navLinks}>
            <span style={styles.userInfo}>Hello {userName}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.content}>{renderContent()}</div>
    </div>
  );
}

function FacultyDashboard({ user, userName, onLogout }) {
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState({});
  const [doubts, setDoubts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [implMarks, setImplMarks] = useState(10);
  const [creativeMarks, setCreativeMarks] = useState(5);
  const [presMarks, setPresMarks] = useState(5);
  const [evaluating, setEvaluating] = useState(null);
  const [marks, setMarks] = useState({ implementation: 0, creativity: 0, presentation: 0 });
  const [feedback, setFeedback] = useState('');
  const [answeringDoubt, setAnsweringDoubt] = useState(null);
  const [answerText, setAnswerText] = useState('');

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
    const doubtsSnap = await getDocs(collection(db, 'doubts'));
    setDoubts(doubtsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const createAssignment = async () => {
    if (!title || !description || !dueDate) { alert('Please fill all fields'); return; }
    try {
      await addDoc(collection(db, 'assignments'), {
        title, description, dueDate: Timestamp.fromDate(new Date(dueDate)),
        rubric: { implementation: implMarks, creativity: creativeMarks, presentation: presMarks },
        totalMarks: implMarks + creativeMarks + presMarks, createdBy: user.uid, createdAt: Timestamp.now(), isActive: true
      });
      alert('Assignment created! Visible to all students.');
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
      alert('Evaluation submitted! Student can see it.');
      setEvaluating(null);
      setMarks({ implementation: 0, creativity: 0, presentation: 0 });
      setFeedback('');
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const answerDoubt = async (doubtId) => {
    if (!answerText.trim()) return;
    try {
      await updateDoc(doc(db, 'doubts', doubtId), {
        answer: answerText,
        status: 'answered',
        answeredAt: Timestamp.now(),
        answeredBy: user.uid
      });
      alert('Answer posted! Student can see it.');
      setAnsweringDoubt(null);
      setAnswerText('');
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const studentPerformance = () => {
    const performance = {};
    Object.keys(students).forEach(studentId => {
      const studentSubs = submissions.filter(s => s.studentId === studentId);
      const totalMarks = studentSubs.reduce((sum, s) => sum + (s.marks?.total || 0), 0);
      const maxPossible = studentSubs.reduce((sum, s) => {
        const assign = assignments.find(a => a.id === s.assignmentId);
        return sum + (assign?.totalMarks || 0);
      }, 0);
      performance[studentId] = {
        name: students[studentId],
        submissions: studentSubs.length,
        totalMarks,
        maxPossible,
        percentage: maxPossible > 0 ? Math.round((totalMarks / maxPossible) * 100) : 0
      };
    });
    return performance;
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'assignments':
        return (
          <div>
            <div style={styles.header}><h2>Manage Assignments</h2><button onClick={() => setShowForm(!showForm)} style={styles.createBtn}>+ Create Assignment</button></div>
            {showForm && (
              <div style={styles.formCard}>
                <h3>Create New Assignment (All Students See Instantly)</h3>
                <input placeholder="Assignment Title" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea placeholder="Description" rows="3" style={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
                <input type="date" style={styles.input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <h4>Rubric</h4>
                <div><label>Implementation: {implMarks}/10</label><input type="range" min="0" max="10" value={implMarks} onChange={(e) => setImplMarks(parseInt(e.target.value))} /></div>
                <div><label>Creativity: {creativeMarks}/5</label><input type="range" min="0" max="5" value={creativeMarks} onChange={(e) => setCreativeMarks(parseInt(e.target.value))} /></div>
                <div><label>Presentation: {presMarks}/5</label><input type="range" min="0" max="5" value={presMarks} onChange={(e) => setPresMarks(parseInt(e.target.value))} /></div>
                <button onClick={createAssignment} style={styles.publishBtn}>Publish Assignment</button>
              </div>
            )}
            <h2 style={styles.sectionTitle}>Your Assignments</h2>
            <div style={styles.grid}>
              {assignments.map(assign => {
                const subForAssign = submissions.filter(s => s.assignmentId === assign.id);
                return (
                  <div key={assign.id} style={styles.card}>
                    <h3>{assign.title}</h3>
                    <p>{assign.description}</p>
                    <div>Due: {assign.dueDate?.toDate().toLocaleDateString()} | Submissions: {subForAssign.length}</div>
                    {subForAssign.map(sub => evaluating === sub.id ? (
                      <div key={sub.id} style={styles.evalBox}>
                        <p><strong>Student:</strong> {students[sub.studentId]}</p>
                        <p><strong>Submission:</strong> <a href={sub.proofLink} target="_blank">View Work</a></p>
                        <div><label>Implementation: </label><input type="range" min="0" max={assign.rubric?.implementation} onChange={(e) => setMarks({...marks, implementation: parseInt(e.target.value)})} /> {marks.implementation}</div>
                        <div><label>Creativity: </label><input type="range" min="0" max={assign.rubric?.creativity} onChange={(e) => setMarks({...marks, creativity: parseInt(e.target.value)})} /> {marks.creativity}</div>
                        <div><label>Presentation: </label><input type="range" min="0" max={assign.rubric?.presentation} onChange={(e) => setMarks({...marks, presentation: parseInt(e.target.value)})} /> {marks.presentation}</div>
                        <textarea placeholder="Feedback" rows="2" style={styles.inputSmall} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                        <button onClick={() => evaluateSubmission(sub.id, assign.rubric)} style={styles.submitBtn}>Submit Evaluation</button>
                        <button onClick={() => setEvaluating(null)} style={styles.cancelBtn}>Cancel</button>
                      </div>
                    ) : (
                      <div key={sub.id} style={styles.subBox}>
                        <span><strong>{students[sub.studentId]}</strong> - {sub.status === 'evaluated' ? `Scored: ${sub.marks?.total}/${assign.totalMarks}` : 'Pending'}</span>
                        {sub.status !== 'evaluated' && <button onClick={() => setEvaluating(sub.id)} style={styles.evaluateBtn}>Evaluate</button>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'performance':
        const performance = studentPerformance();
        return (
          <div>
            <h2 style={styles.sectionTitle}>Student Performance Overview</h2>
            <div style={styles.performanceTable}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#667eea', color: 'white' }}><th style={styles.th}>Student Name</th><th style={styles.th}>Submissions</th><th style={styles.th}>Total Marks</th><th style={styles.th}>Percentage</th><th style={styles.th}>Status</th></tr></thead>
                <tbody>
                  {Object.values(performance).map((student, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={styles.td}>{student.name}</td>
                      <td style={styles.td}>{student.submissions}</td>
                      <td style={styles.td}>{student.totalMarks}/{student.maxPossible}</td>
                      <td style={styles.td}>{student.percentage}%</td>
                      <td style={styles.td}>{student.percentage >= 60 ? 'Good' : student.percentage >= 40 ? 'Average' : 'Needs Improvement'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'doubts':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Student Doubts</h2>
            <div style={styles.doubtsList}>
              {doubts.map(doubt => answeringDoubt === doubt.id ? (
                <div key={doubt.id} style={styles.doubtCard}>
                  <p><strong>Student:</strong> {doubt.studentName}</p>
                  <p><strong>Question:</strong> {doubt.doubt}</p>
                  <textarea placeholder="Type your answer..." rows="3" style={styles.input} value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
                  <div style={styles.formActions}>
                    <button onClick={() => answerDoubt(doubt.id)} style={styles.submitBtn}>Post Answer</button>
                    <button onClick={() => setAnsweringDoubt(null)} style={styles.cancelBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div key={doubt.id} style={styles.doubtCard}>
                  <p><strong>Student:</strong> {doubt.studentName}</p>
                  <p><strong>Question:</strong> {doubt.doubt}</p>
                  {doubt.answer ? <p><strong style={{ color: '#4caf50' }}>Answer:</strong> {doubt.answer}</p> : <button onClick={() => setAnsweringDoubt(doubt.id)} style={styles.evaluateBtn}>Answer Doubt</button>}
                  <p><small>Posted: {doubt.createdAt?.toDate().toLocaleDateString()}</small></p>
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>AssignX - Faculty Portal</h1>
          <div style={styles.navTabs}>
            <button onClick={() => setActiveTab('assignments')} style={{...styles.navTab, background: activeTab === 'assignments' ? '#fff' : 'transparent', color: activeTab === 'assignments' ? '#667eea' : 'white'}}>Assignments</button>
            <button onClick={() => setActiveTab('performance')} style={{...styles.navTab, background: activeTab === 'performance' ? '#fff' : 'transparent', color: activeTab === 'performance' ? '#667eea' : 'white'}}>Student Performance</button>
            <button onClick={() => setActiveTab('doubts')} style={{...styles.navTab, background: activeTab === 'doubts' ? '#fff' : 'transparent', color: activeTab === 'doubts' ? '#667eea' : 'white'}}>Doubts</button>
          </div>
          <div style={styles.navLinks}>
            <span style={styles.userInfo}>Hello Professor {userName}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.content}>{renderContent()}</div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  spinner: { width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logoSection: { textAlign: 'center', marginBottom: '20px' },
  logoIcon: { fontSize: '48px' },
  title: { fontSize: '36px', fontWeight: 'bold', color: '#667eea', margin: '10px 0 5px' },
  tagline: { color: '#666', fontSize: '14px' },
  subtitle: { fontSize: '20px', textAlign: 'center', marginBottom: '25px', color: '#333' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  inputSmall: { width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' },
  textareaSmall: { width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' },
  fileInput: { marginBottom: '10px' },
  button: { width: '100%', padding: '12px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  error: { backgroundColor: '#fee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' },
  footer: { textAlign: 'center', marginTop: '20px', color: '#666' },
  link: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' },
  demoBox: { marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '10px', fontSize: '12px', textAlign: 'center' },
  radioGroup: { marginBottom: '15px', display: 'flex', gap: '20px', justifyContent: 'center' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
  navbar: { backgroundColor: '#667eea', padding: '15px 30px', color: 'white', position: 'sticky', top: 0, zIndex: 1000 },
  navContent: { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  logo: { fontSize: '24px', margin: 0 },
  navTabs: { display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.2)', padding: '5px', borderRadius: '10px' },
  navTab: { padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  userInfo: { fontSize: '14px', opacity: 0.9 },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '1400px', margin: '0 auto', padding: '30px' },
  ecoHero: { background: 'linear-gradient(135deg, #2e7d32, #4caf50)', borderRadius: '20px', padding: '30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' },
  heroTitle: { fontSize: '28px', marginBottom: '10px' },
  heroStats: { display: 'flex', gap: '40px', textAlign: 'center' },
  statNumber: { fontSize: '32px', fontWeight: 'bold' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', color: '#333' },
  subsectionTitle: { fontSize: '20px', margin: '20px 0 15px', color: '#555' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' },
  card: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardDesc: { color: '#666', marginBottom: '15px', lineHeight: '1.5' },
  cardInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginBottom: '15px' },
  rubricPreview: { display: 'flex', gap: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' },
  submittedBadge: { background: '#c8e6c9', color: '#2e7d32', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' },
  pendingBadge: { background: '#fff3e0', color: '#e65100', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' },
  scoreBox: { background: '#e8eaf6', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' },
  submitForm: { marginTop: '15px' },
  formActions: { display: 'flex', gap: '10px' },
  actionBtn: { width: '100%', padding: '12px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '10px' },
  submitBtn: { flex: 1, padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '10px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  evaluateBtn: { padding: '6px 12px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  createBtn: { padding: '12px 24px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px' },
  formCard: { background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '30px' },
  publishBtn: { width: '100%', padding: '12px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  evalBox: { marginTop: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '10px' },
  subBox: { marginTop: '10px', padding: '12px', backgroundColor: '#f0f4ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  courseCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  doubtsList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  doubtCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  doubtForm: { background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '30px' },
  performanceTable: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  th: { padding: '12px', textAlign: 'left' },
  td: { padding: '12px', borderBottom: '1px solid #eee' }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default App;
