import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

// Firebase Config
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

// Student Data
const studentsData = {
  "sneha@assignx.com": { name: "Sneha Singh", rollNo: "240010130100", password: "240010130100", cgpa: 8.7,
    minor1: { "MPI": 14, "CN": 15, "DBMS": 16, "ADA": 17, "SE": 18, "Java": 16 },
    minor2: { "MPI": 16, "CN": 17, "DBMS": 18, "ADA": 19, "SE": 20, "Java": 18 }
  },
  "bhumikagoyal@assignx.com": { name: "Bhumika Goyal", rollNo: "240010130095", password: "240010130095", cgpa: 8.2,
    minor1: { "MPI": 16, "CN": 15, "DBMS": 19, "ADA": 18, "SE": 17, "Java": 15 },
    minor2: { "MPI": 18, "CN": 17, "DBMS": 21, "ADA": 20, "SE": 19, "Java": 17 }
  },
  "gauri@assignx.com": { name: "Gauri", rollNo: "240010130104", password: "240010130104", cgpa: 8.4,
    minor1: { "MPI": 14, "CN": 13, "DBMS": 19, "ADA": 18, "SE": 19, "Java": 15 },
    minor2: { "MPI": 16, "CN": 15, "DBMS": 21, "ADA": 20, "SE": 21, "Java": 17 }
  }
};

// Courses
const allCourses = [
  { id: "MPI", name: "Microprocessor and Interfacing", code: "PCC-CSE205-T", faculty: "Prof. Sharma", facultyEmail: "faculty.mpi@assignx.com" },
  { id: "CN", name: "Computer Networks", code: "PCC-CSE206-T", faculty: "Prof. Verma", facultyEmail: "faculty.cn@assignx.com" },
  { id: "DBMS", name: "Database Management System", code: "PCC-CSE207-T", faculty: "Prof. Singh", facultyEmail: "faculty.dbms@assignx.com" },
  { id: "ADA", name: "Analysis of Algorithms", code: "PCC-CSE208-T", faculty: "Prof. Gupta", facultyEmail: "faculty.ada@assignx.com" },
  { id: "SE", name: "Software Engineering", code: "PCC-CSE209-T", faculty: "Prof. Patel", facultyEmail: "faculty.se@assignx.com" },
  { id: "Java", name: "Java Programming", code: "PCC-CSE210-T", faculty: "Prof. Kumar", facultyEmail: "faculty.java@assignx.com" }
];

// Syllabus
const syllabusData = {
  "MPI": ["Unit 1: 8085 Architecture", "Unit 2: 8085 Programming", "Unit 3: 8086 Architecture", "Unit 4: Interfacing"],
  "CN": ["Unit 1: OSI Model", "Unit 2: Data Link Layer", "Unit 3: Network Layer", "Unit 4: Transport Layer"],
  "DBMS": ["Unit 1: DBMS Concepts", "Unit 2: ER Model", "Unit 3: SQL", "Unit 4: Normalization"],
  "ADA": ["Unit 1: Algorithm Analysis", "Unit 2: Divide and Conquer", "Unit 3: Dynamic Programming", "Unit 4: Graph Algorithms"],
  "SE": ["Unit 1: SDLC Models", "Unit 2: Requirements", "Unit 3: Design", "Unit 4: Testing"],
  "Java": ["Unit 1: Java Fundamentals", "Unit 2: OOP Concepts", "Unit 3: Exception Handling", "Unit 4: GUI Programming"]
};

// Faculty Data
const facultyData = {
  "faculty.mpi@assignx.com": { name: "Prof. Sharma", password: "faculty123", subjectId: "MPI", subjectName: "Microprocessor and Interfacing", role: "faculty" },
  "faculty.cn@assignx.com": { name: "Prof. Verma", password: "faculty123", subjectId: "CN", subjectName: "Computer Networks", role: "faculty" },
  "faculty.dbms@assignx.com": { name: "Prof. Singh", password: "faculty123", subjectId: "DBMS", subjectName: "Database Management System", role: "faculty" },
  "faculty.ada@assignx.com": { name: "Prof. Gupta", password: "faculty123", subjectId: "ADA", subjectName: "Analysis of Algorithms", role: "faculty" },
  "faculty.se@assignx.com": { name: "Prof. Patel", password: "faculty123", subjectId: "SE", subjectName: "Software Engineering", role: "faculty" },
  "faculty.java@assignx.com": { name: "Prof. Kumar", password: "faculty123", subjectId: "Java", subjectName: "Java Programming", role: "faculty" },
  "coordinator@assignx.com": { name: "Dr. Coordinator", password: "coordinator123", subjectId: "all", subjectName: "All Subjects", role: "coordinator" }
};

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [liveAssignments, setLiveAssignments] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);

  useEffect(() => {
    if (userType === 'student' && selectedSubject) {
      const q = query(collection(db, 'assignments'), where('subjectId', '==', selectedSubject), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const assignments = [];
        snapshot.forEach((doc) => assignments.push({ id: doc.id, ...doc.data() }));
        setLiveAssignments(assignments);
      });
    }
  }, [userType, selectedSubject]);

  useEffect(() => {
    if (userType === 'student' && user) {
      const q = query(collection(db, 'submissions'), where('studentId', '==', user.email));
      return onSnapshot(q, (snapshot) => {
        const submissions = [];
        snapshot.forEach((doc) => submissions.push({ id: doc.id, ...doc.data() }));
        setStudentSubmissions(submissions);
      });
    }
  }, [userType, user]);

  const handleStudentLogin = (email, password) => {
    setLoading(true);
    const student = studentsData[email.toLowerCase()];
    if (student && student.password === password) {
      setUser({ email, type: 'student' });
      setUserType('student');
      setUserData(student);
    } else {
      setError('Invalid student credentials');
    }
    setLoading(false);
  };

  const handleFacultyLogin = (email, password) => {
    setLoading(true);
    const faculty = facultyData[email.toLowerCase()];
    if (faculty && faculty.password === password) {
      setUser({ email, type: faculty.role });
      setUserType(faculty.role);
      setUserData(faculty);
      if (faculty.role !== 'coordinator') setSelectedSubject(faculty.subjectId);
    } else {
      setError('Invalid faculty credentials');
    }
    setLoading(false);
  };

  const createAssignment = async (title, description, dueDate, maxMarks, subjectId, subjectName) => {
    try {
      await addDoc(collection(db, 'assignments'), {
        title, description, dueDate: Timestamp.fromDate(new Date(dueDate)), maxMarks,
        subjectId, subjectName, createdBy: user.email, facultyName: userData.name,
        createdAt: Timestamp.now(), isActive: true
      });
      alert('Assignment created successfully!');
      return true;
    } catch (error) {
      alert('Error: ' + error.message);
      return false;
    }
  };

  const submitAssignment = async (assignmentId, submissionLink) => {
    try {
      await addDoc(collection(db, 'submissions'), {
        assignmentId, studentId: user.email, studentName: userData.name,
        rollNo: userData.rollNo, submissionLink, subjectId: selectedSubject,
        submittedAt: Timestamp.now(), status: 'submitted'
      });
      alert('Assignment submitted successfully!');
      return true;
    } catch (error) {
      alert('Error: ' + error.message);
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null); setUserType(null); setUserData(null);
    setSelectedSubject(null); setSelectedView(null);
  };

  if (!user) {
    return <LoginScreen onStudentLogin={handleStudentLogin} onFacultyLogin={handleFacultyLogin} loading={loading} error={error} />;
  }

  if (userType === 'student') {
    if (selectedSubject && selectedView === 'assignments') {
      const course = allCourses.find(c => c.id === selectedSubject);
      const isSubmitted = (id) => studentSubmissions.some(s => s.assignmentId === id);
      return <StudentAssignmentsView course={course} assignments={liveAssignments} userData={userData} isSubmitted={isSubmitted} onSubmitAssignment={submitAssignment} onBack={() => setSelectedView(null)} onLogout={handleLogout} />;
    }
    if (selectedSubject && selectedView === 'syllabus') {
      const course = allCourses.find(c => c.id === selectedSubject);
      const syllabus = syllabusData[selectedSubject] || [];
      return <StudentSyllabusView course={course} syllabus={syllabus} userData={userData} onBack={() => setSelectedView(null)} onLogout={handleLogout} />;
    }
    if (selectedSubject) {
      const course = allCourses.find(c => c.id === selectedSubject);
      return <StudentCourseView course={course} userData={userData} onSelectAssignments={() => setSelectedView('assignments')} onSelectSyllabus={() => setSelectedView('syllabus')} onBack={() => setSelectedSubject(null)} onLogout={handleLogout} />;
    }
    return <StudentDashboardView userData={userData} courses={allCourses} onSelectSubject={setSelectedSubject} onLogout={handleLogout} />;
  }

  if (userType === 'faculty') {
    const myCourse = allCourses.find(c => c.id === userData.subjectId);
    if (selectedView === 'create') {
      return <FacultyCreateView userData={userData} myCourse={myCourse} onCreateAssignment={(t,d,dt,m) => createAssignment(t,d,dt,m,userData.subjectId,userData.subjectName)} onBack={() => setSelectedView(null)} onLogout={handleLogout} />;
    }
    if (selectedView === 'manage') {
      const syllabus = syllabusData[userData.subjectId] || [];
      return <FacultyManageView myCourse={myCourse} syllabus={syllabus} students={Object.values(studentsData)} userData={userData} onBack={() => setSelectedView(null)} onLogout={handleLogout} />;
    }
    if (selectedView === 'submissions') {
      return <FacultySubmissionsView myCourse={myCourse} userData={userData} onBack={() => setSelectedView(null)} onLogout={handleLogout} />;
    }
    return <FacultyDashboardView userData={userData} myCourse={myCourse} onCreateAssignment={() => setSelectedView('create')} onManageSubject={() => setSelectedView('manage')} onViewSubmissions={() => setSelectedView('submissions')} onLogout={handleLogout} />;
  }

  if (userType === 'coordinator') {
    if (selectedView === 'create') {
      return <CoordinatorCreateView userData={userData} courses={allCourses} onCreateAssignment={createAssignment} onBack={() => setSelectedView(null)} onLogout={handleLogout} />;
    }
    if (selectedView === 'manage' && selectedSubject) {
      const course = allCourses.find(c => c.id === selectedSubject);
      const syllabus = syllabusData[selectedSubject] || [];
      return <CoordinatorManageView course={course} syllabus={syllabus} students={Object.values(studentsData)} userData={userData} onBack={() => { setSelectedView(null); setSelectedSubject(null); }} onLogout={handleLogout} />;
    }
    if (selectedSubject) {
      const course = allCourses.find(c => c.id === selectedSubject);
      return <CoordinatorSubjectView course={course} userData={userData} onManage={() => setSelectedView('manage')} onBack={() => setSelectedSubject(null)} onLogout={handleLogout} />;
    }
    return <CoordinatorDashboardView userData={userData} courses={allCourses} onSelectSubject={setSelectedSubject} onCreateAssignment={() => setSelectedView('create')} onLogout={handleLogout} />;
  }

  return null;
}

// Login Screen
function LoginScreen({ onStudentLogin, onFacultyLogin, loading, error }) {
  const [loginType, setLoginType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (loginType === null) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.logoSection}>
          <h1 style={styles.logoText}>AssignX</h1>
          <p style={styles.tagline}>ASSIGN | LEARN | GROW</p>
          <p style={styles.subTagline}>Assignments that build skills, not just grades.</p>
        </div>
        <div style={styles.choiceContainer}>
          <div style={styles.choiceCard} onClick={() => setLoginType('student')}>
            <h2>Student Login</h2>
            <p>Access your courses, assignments, and marks</p>
          </div>
          <div style={styles.choiceCard} onClick={() => setLoginType('faculty')}>
            <h2>Faculty Login</h2>
            <p>Manage courses, create live assignments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.loginCard}>
      <button onClick={() => setLoginType(null)} style={styles.backBtn}>Back</button>
      <h2 style={styles.subtitle}>{loginType === 'student' ? 'Student Login' : 'Faculty Login'}</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form onSubmit={(e) => { e.preventDefault(); if (loginType === 'student') onStudentLogin(email, password); else onFacultyLogin(email, password); }}>
        <input type="email" placeholder="Email Address" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <div style={styles.demoInfo}>
        {loginType === 'student' ? (
          <div><strong>Student Logins:</strong><br/>sneha@assignx.com / 240010130100<br/>bhumikagoyal@assignx.com / 240010130095<br/>gauri@assignx.com / 240010130104</div>
        ) : (
          <div><strong>Faculty Logins:</strong><br/>faculty.mpi@assignx.com / faculty123<br/>faculty.cn@assignx.com / faculty123<br/>faculty.dbms@assignx.com / faculty123<br/>faculty.ada@assignx.com / faculty123<br/>faculty.se@assignx.com / faculty123<br/>faculty.java@assignx.com / faculty123<br/><strong>Coordinator:</strong> coordinator@assignx.com / coordinator123</div>
        )}
      </div>
    </div>
  );
}

// Student Views
function StudentDashboardView({ userData, courses, onSelectSubject, onLogout }) {
  const totalMarks = Object.values(userData.minor1).reduce((a,b)=>a+b,0) + Object.values(userData.minor2).reduce((a,b)=>a+b,0);
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX - Student</h1><div style={styles.userInfo}><span>Hello, {userData.name}</span><span>CGPA: {userData.cgpa}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></div></nav>
      <div style={styles.content}>
        <div style={styles.welcomeCard}><h2>Welcome, {userData.name}!</h2><p>Roll No: {userData.rollNo} | Percentage: {(totalMarks/360*100).toFixed(1)}%</p></div>
        <h2 style={styles.sectionTitle}>Your Courses</h2>
        <div style={styles.courseGrid}>{courses.map(c => (<div key={c.id} style={styles.courseCard} onClick={() => onSelectSubject(c.id)}><h3>{c.name}</h3><p>{c.code}</p><div style={styles.courseStats}><span>Minor1: {userData.minor1[c.id]}/30</span><span>Minor2: {userData.minor2[c.id]}/30</span></div><button style={styles.viewBtn}>View Course -{'>'}</button></div>))}</div>
      </div>
    </div>
  );
}

function StudentCourseView({ course, userData, onSelectAssignments, onSelectSyllabus, onBack, onLogout }) {
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX</h1><div style={styles.userInfo}><span>{userData.name}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></div></nav>
      <div style={styles.content}>
        <button onClick={onBack} style={styles.backBtn}>Back to Dashboard</button>
        <div style={styles.courseHeader}><h1>{course.name}</h1><p>Code: {course.code} | Faculty: {course.faculty}</p></div>
        <div style={styles.choiceContainer}>
          <div style={styles.choiceCardLarge} onClick={onSelectAssignments}><h2>Live Assignments</h2><p>View and submit assignments</p><button style={styles.viewBtn}>View Assignments -{'>'}</button></div>
          <div style={styles.choiceCardLarge} onClick={onSelectSyllabus}><h2>Syllabus</h2><p>Course syllabus and material</p><button style={styles.viewBtn}>View Syllabus -{'>'}</button></div>
        </div>
      </div>
    </div>
  );
}

function StudentAssignmentsView({ course, assignments, userData, isSubmitted, onSubmitAssignment, onBack, onLogout }) {
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(null);
  const handleSubmit = async (id) => { if (!link) { alert('Enter submission link'); return; } await onSubmitAssignment(id, link); setSubmitting(null); setLink(''); };
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX</h1><div style={styles.userInfo}><span>{userData.name}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></div></nav>
      <div style={styles.content}>
        <button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.courseHeader}><h1>{course.name} - Assignments</h1></div>
        <div style={styles.assignmentsContainer}>
          {assignments.length === 0 ? <div style={styles.emptyState}>No assignments yet.</div> : assignments.map(a => {
            const submitted = isSubmitted(a.id);
            return (<div key={a.id} style={styles.assignmentCard}><div style={styles.assignmentHeader}><h3>{a.title}</h3><span style={submitted ? styles.submittedBadge : styles.pendingBadge}>{submitted ? 'Submitted' : 'Pending'}</span></div><p>{a.description}</p><div style={styles.assignmentDetails}><span>Due: {a.dueDate?.toDate().toLocaleDateString()}</span><span>Max Marks: {a.maxMarks}</span><span>Faculty: {a.facultyName}</span></div>{!submitted && submitting === a.id ? (<div><input type="url" placeholder="Submission Link" style={styles.inputSmall} value={link} onChange={(e) => setLink(e.target.value)} /><div style={styles.formActions}><button onClick={() => handleSubmit(a.id)} style={styles.submitBtn}>Confirm</button><button onClick={() => setSubmitting(null)} style={styles.cancelBtn}>Cancel</button></div></div>) : !submitted && <button onClick={() => setSubmitting(a.id)} style={styles.submitBtn}>Submit</button>}</div>);
          })}
        </div>
      </div>
    </div>
  );
}

function StudentSyllabusView({ course, syllabus, userData, onBack, onLogout }) {
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX</h1><div style={styles.userInfo}><span>{userData.name}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></div></nav>
      <div style={styles.content}>
        <button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.courseHeader}><h1>{course.name} - Syllabus</h1></div>
        <div style={styles.syllabusContainer}>{syllabus.map((unit, i) => (<div key={i} style={styles.unitCard}><h3>{unit}</h3></div>))}</div>
      </div>
    </div>
  );
}

// Faculty Views
function FacultyDashboardView({ userData, myCourse, onCreateAssignment, onManageSubject, onViewSubmissions, onLogout }) {
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX - Faculty</h1><div style={styles.userInfo}><span>{userData.name}</span><span>Teaching: {userData.subjectName}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></div></nav>
      <div style={styles.content}>
        <div style={styles.welcomeCard}><h2>Welcome, {userData.name}!</h2><p>Teaching: <strong>{userData.subjectName}</strong></p></div>
        <div style={styles.singleCourseCard}><h3>{myCourse.name}</h3><p>{myCourse.code}</p><div style={styles.buttonGroup}><button onClick={onCreateAssignment} style={styles.secondaryBtn}>Create Assignment</button><button onClick={onManageSubject} style={styles.primaryBtn}>Syllabus</button><button onClick={onViewSubmissions} style={styles.infoBtn}>Submissions</button></div></div>
      </div>
    </div>
  );
}

function FacultyCreateView({ userData, myCourse, onCreateAssignment, onBack, onLogout }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [due, setDue] = useState(''); const [marks, setMarks] = useState(30);
  const handleSubmit = (e) => { e.preventDefault(); if (!title || !desc || !due) { alert('Fill all fields'); return; } onCreateAssignment(title, desc, due, marks); setTitle(''); setDesc(''); setDue(''); onBack(); };
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>Create Assignment</h1><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></nav>
      <div style={styles.content}><button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.formCard}><h2>Create Assignment for {userData.subjectName}</h2><form onSubmit={handleSubmit}><input placeholder="Title" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required /><textarea placeholder="Description" rows="3" style={styles.input} value={desc} onChange={(e) => setDesc(e.target.value)} required /><input type="date" style={styles.input} value={due} onChange={(e) => setDue(e.target.value)} required /><input type="number" placeholder="Max Marks" style={styles.input} value={marks} onChange={(e) => setMarks(parseInt(e.target.value))} required /><button type="submit" style={styles.publishBtn}>Publish</button></form></div>
      </div>
    </div>
  );
}

function FacultyManageView({ myCourse, syllabus, students, userData, onBack, onLogout }) {
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>Syllabus</h1><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></nav>
      <div style={styles.content}><button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.courseHeader}><h1>{myCourse.name} - Syllabus</h1></div>
        <div style={styles.syllabusContainer}>{syllabus.map((unit, i) => (<div key={i} style={styles.unitCard}><h3>{unit}</h3></div>))}</div>
      </div>
    </div>
  );
}

function FacultySubmissionsView({ myCourse, userData, onBack, onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'submissions'));
    return onSnapshot(q, (snapshot) => {
      const allSubs = [];
      snapshot.forEach((doc) => allSubs.push({ id: doc.id, ...doc.data() }));
      setSubmissions(allSubs);
    });
  }, []);
  const courseSubmissions = submissions.filter(s => s.subjectId === myCourse.id);
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>Submissions</h1><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></nav>
      <div style={styles.content}><button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.courseHeader}><h1>{myCourse.name} - Submissions</h1></div>
        <div style={styles.assignmentsContainer}>{courseSubmissions.length === 0 ? <div style={styles.emptyState}>No submissions yet.</div> : courseSubmissions.map(sub => (<div key={sub.id} style={styles.assignmentCard}><div style={styles.assignmentHeader}><h3>{sub.studentName} ({sub.rollNo})</h3><span style={styles.pendingBadge}>Pending</span></div><p><strong>Link:</strong> <a href={sub.submissionLink} target="_blank" rel="noopener noreferrer">View</a></p><div style={styles.assignmentDetails}><span>Submitted: {sub.submittedAt?.toDate().toLocaleDateString()}</span></div><button style={styles.submitBtn}>Evaluate</button></div>))}</div>
      </div>
    </div>
  );
}

// Coordinator Views
function CoordinatorDashboardView({ userData, courses, onSelectSubject, onCreateAssignment, onLogout }) {
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX - Coordinator</h1><div style={styles.userInfo}><span>{userData.name}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></div></nav>
      <div style={styles.content}>
        <div style={styles.welcomeCard}><h2>Welcome, {userData.name}!</h2><p>Access to all subjects</p></div>
        <h2 style={styles.sectionTitle}>All Subjects</h2>
        <div style={styles.courseGrid}>{courses.map(c => (<div key={c.id} style={styles.courseCard} onClick={() => onSelectSubject(c.id)}><h3>{c.name}</h3><p>{c.code} | Faculty: {c.faculty}</p><button style={styles.viewBtn}>Manage -{'>'}</button></div>))}<div style={styles.courseCard} onClick={onCreateAssignment}><h3>Create Assignment</h3><p>Post for any subject</p><button style={styles.viewBtn}>Create -{'>'}</button></div></div>
      </div>
    </div>
  );
}

function CoordinatorSubjectView({ course, userData, onManage, onBack, onLogout }) {
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>AssignX</h1><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></nav>
      <div style={styles.content}><button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.courseHeader}><h1>{course.name}</h1><p>{course.code} | Faculty: {course.faculty}</p></div>
        <div style={styles.choiceContainerLarge}><div style={styles.choiceCardLarge} onClick={onManage}><h2>Manage Subject</h2><p>View syllabus and students</p><button style={styles.viewBtn}>Manage -{'>'}</button></div></div>
      </div>
    </div>
  );
}

function CoordinatorManageView({ course, syllabus, students, userData, onBack, onLogout }) {
  const [tab, setTab] = useState('syllabus');
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>Manage {course.name}</h1><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></nav>
      <div style={styles.content}><button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.tabContainer}><button onClick={() => setTab('syllabus')} style={{...styles.tab, background: tab === 'syllabus' ? '#667eea' : '#f0f0f0', color: tab === 'syllabus' ? 'white' : '#333'}}>Syllabus</button><button onClick={() => setTab('students')} style={{...styles.tab, background: tab === 'students' ? '#667eea' : '#f0f0f0', color: tab === 'students' ? 'white' : '#333'}}>Students</button></div>
        {tab === 'syllabus' && (<div style={styles.syllabusContainer}>{syllabus.map((unit, i) => (<div key={i} style={styles.unitCard}><h3>{unit}</h3></div>))}</div>)}
        {tab === 'students' && (<div style={styles.studentsTable}><table style={{width:'100%'}}><thead><tr style={{background:'#667eea', color:'white'}}><th>Roll No</th><th>Name</th><th>Minor1</th><th>Minor2</th><th>Total</th><th>%</th></tr></thead><tbody>{students.map(s => { const m1 = s.minor1[course.id] || 0; const m2 = s.minor2[course.id] || 0; const t = m1 + m2; return (<tr key={s.rollNo}><td>{s.rollNo}</td><td>{s.name}</td><td>{m1}/30</td><td>{m2}/30</td><td>{t}/60</td><td>{((t/60)*100).toFixed(1)}%</td></tr>); })}</tbody></table></div>)}
      </div>
    </div>
  );
}

function CoordinatorCreateView({ userData, courses, onCreateAssignment, onBack, onLogout }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [due, setDue] = useState(''); const [marks, setMarks] = useState(30); const [subject, setSubject] = useState('');
  const selected = courses.find(c => c.id === subject);
  const handleSubmit = (e) => { e.preventDefault(); if (!title || !desc || !due || !subject) { alert('Fill all fields'); return; } onCreateAssignment(title, desc, due, marks, subject, selected.name); setTitle(''); setDesc(''); setDue(''); setSubject(''); onBack(); };
  return (
    <div>
      <nav style={styles.navbar}><div style={styles.navContent}><h1 style={styles.logo}>Create Assignment</h1><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div></nav>
      <div style={styles.content}><button onClick={onBack} style={styles.backBtn}>Back</button>
        <div style={styles.formCard}><h2>Create Assignment</h2><form onSubmit={handleSubmit}><select style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required><option value="">Select Subject</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input placeholder="Title" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required /><textarea placeholder="Description" rows="3" style={styles.input} value={desc} onChange={(e) => setDesc(e.target.value)} required /><input type="date" style={styles.input} value={due} onChange={(e) => setDue(e.target.value)} required /><input type="number" placeholder="Max Marks" style={styles.input} value={marks} onChange={(e) => setMarks(parseInt(e.target.value))} required /><button type="submit" style={styles.publishBtn}>Publish</button></form></div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  loginContainer: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  logoSection: { textAlign: 'center', marginBottom: '50px' },
  logoText: { fontSize: '56px', fontWeight: 'bold', color: 'white', letterSpacing: '2px' },
  tagline: { fontSize: '20px', color: 'rgba(255,255,255,0.9)', letterSpacing: '4px', marginTop: '10px' },
  subTagline: { fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginTop: '10px' },
  choiceContainer: { display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' },
  choiceCard: { background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', width: '280px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
  subtitle: { fontSize: '24px', textAlign: 'center', marginBottom: '30px', color: '#333' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  inputSmall: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
  button: { width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  error: { background: '#fee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' },
  demoInfo: { marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '10px', fontSize: '12px', maxHeight: '200px', overflowY: 'auto' },
  navbar: { background: '#667eea', padding: '15px 30px', color: 'white' },
  navContent: { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  logo: { fontSize: '24px', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '1400px', margin: '0 auto', padding: '30px' },
  welcomeCard: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '30px', borderRadius: '20px', marginBottom: '30px', textAlign: 'center' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', color: '#333' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  courseCard: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', textAlign: 'center' },
  courseStats: { display: 'flex', justifyContent: 'space-between', margin: '15px 0', fontSize: '13px', color: '#666' },
  viewBtn: { width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' },
  courseHeader: { background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  choiceContainer: { display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' },
  choiceCardLarge: { background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', width: '350px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  choiceContainerLarge: { display: 'flex', justifyContent: 'center', marginTop: '20px' },
  assignmentsContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  assignmentCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  assignmentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' },
  submittedBadge: { background: '#c8e6c9', color: '#2e7d32', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' },
  pendingBadge: { background: '#fff3e0', color: '#e65100', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' },
  assignmentDetails: { display: 'flex', gap: '20px', marginTop: '10px', fontSize: '13px', color: '#666', flexWrap: 'wrap' },
  submitBtn: { marginTop: '10px', padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { marginTop: '10px', padding: '8px 16px', background: '#999', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' },
  formActions: { display: 'flex', gap: '10px', marginTop: '10px' },
  syllabusContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  unitCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  studentsTable: { background: 'white', borderRadius: '15px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%' },
  emptyState: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px', color: '#666' },
  formCard: { background: 'white', padding: '30px', borderRadius: '20px', maxWidth: '600px', margin: '0 auto' },
  publishBtn: { width: '100%', padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  singleCourseCard: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px', margin: '0 auto' },
  buttonGroup: { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', flexWrap: 'wrap' },
  primaryBtn: { padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  secondaryBtn: { padding: '12px 24px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  infoBtn: { padding: '12px 24px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }
};

export default App;
