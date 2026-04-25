import React, { useState, useEffect } from 'react';
import { 
  db, COLLECTIONS, createAssignment, getLiveAssignments, 
  submitAssignment, getStudentSubmissions 
} from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Student Data
const studentsData = {
  "sneha@assignx.com": { 
    name: "Sneha Singh", rollNo: "240010130100", password: "240010130100", cgpa: 8.7,
    minor1: { "CN": 15, "DBMS": 16, "ADA": 17, "SE": 18, "MPI": 14, "Java": 16 },
    minor2: { "CN": 17, "DBMS": 18, "ADA": 19, "SE": 20, "MPI": 16, "Java": 18 }
  },
  "bhumiks@assignx.com": { 
    name: "Bhumik S", rollNo: "240010130101", password: "240010130101", cgpa: 7.2,
    minor1: { "CN": 9, "DBMS": 19, "ADA": 17, "SE": 19, "MPI": 11, "Java": 14 },
    minor2: { "CN": 11, "DBMS": 21, "ADA": 19, "SE": 21, "MPI": 13, "Java": 16 }
  },
  "bhumikagoyal@assignx.com": { 
    name: "Bhumika Goyal", rollNo: "240010130095", password: "240010130095", cgpa: 8.2,
    minor1: { "CN": 15, "DBMS": 19, "ADA": 18, "SE": 17, "MPI": 16, "Java": 15 },
    minor2: { "CN": 17, "DBMS": 21, "ADA": 20, "SE": 19, "MPI": 18, "Java": 17 }
  },
  "gauri@assignx.com": { 
    name: "Gauri", rollNo: "240010130104", password: "240010130104", cgpa: 8.4,
    minor1: { "CN": 13, "DBMS": 19, "ADA": 18, "SE": 19, "MPI": 14, "Java": 15 },
    minor2: { "CN": 15, "DBMS": 21, "ADA": 20, "SE": 21, "MPI": 16, "Java": 17 }
  },
  "nikita@assignx.com": { 
    name: "Nikita Yadav", rollNo: "240010130094", password: "240010130094", cgpa: 7.8,
    minor1: { "CN": 13, "DBMS": 19, "ADA": 16, "SE": 18, "MPI": 12, "Java": 14 },
    minor2: { "CN": 15, "DBMS": 21, "ADA": 18, "SE": 20, "MPI": 14, "Java": 16 }
  },
  "angel@assignx.com": { 
    name: "Angel", rollNo: "240010139012", password: "240010139012", cgpa: 7.5,
    minor1: { "CN": 9, "DBMS": 20, "ADA": 14, "SE": 19, "MPI": 10, "Java": 13 },
    minor2: { "CN": 11, "DBMS": 22, "ADA": 16, "SE": 21, "MPI": 12, "Java": 15 }
  },
  "rashi@assignx.com": { 
    name: "Rashi", rollNo: "2400101301013", password: "2400101301013", cgpa: 7.6,
    minor1: { "CN": 11, "DBMS": 18, "ADA": 18, "SE": 17, "MPI": 12, "Java": 13 },
    minor2: { "CN": 13, "DBMS": 20, "ADA": 20, "SE": 19, "MPI": 14, "Java": 15 }
  },
  "vani@assignx.com": { 
    name: "Vani", rollNo: "240010130130", password: "240010130130", cgpa: 7.9,
    minor1: { "CN": 14, "DBMS": 17, "ADA": 16, "SE": 18, "MPI": 13, "Java": 15 },
    minor2: { "CN": 16, "DBMS": 19, "ADA": 18, "SE": 20, "MPI": 15, "Java": 17 }
  },
  "kashish@assignx.com": { 
    name: "Kashish", rollNo: "240010130109", password: "240010130109", cgpa: 7.3,
    minor1: { "CN": 12, "DBMS": 16, "ADA": 15, "SE": 17, "MPI": 11, "Java": 14 },
    minor2: { "CN": 14, "DBMS": 18, "ADA": 17, "SE": 19, "MPI": 13, "Java": 16 }
  }
};

// Complete Course Data
const allCourses = [
  { id: "MPI", name: "Microprocessor and Interfacing", code: "PCC-CSE205-T", faculty: "Prof. Sharma", credits: 3, icon: "??", color: "#FF6B6B" },
  { id: "CN", name: "Computer Networks", code: "PCC-CSE206-T", faculty: "Prof. Verma", credits: 3, icon: "??", color: "#4ECDC4" },
  { id: "DBMS", name: "Database Management System", code: "PCC-CSE207-T", faculty: "Prof. Singh", credits: 3, icon: "???", color: "#45B7D1" },
  { id: "ADA", name: "Analysis of Algorithms", code: "PCC-CSE208-T", faculty: "Prof. Gupta", credits: 3, icon: "??", color: "#96CEB4" },
  { id: "SE", name: "Software Engineering", code: "PCC-CSE209-T", faculty: "Prof. Patel", credits: 3, icon: "??", color: "#FFEAA7" },
  { id: "Java", name: "Java Programming", code: "PCC-CSE210-T", faculty: "Prof. Kumar", credits: 3, icon: "?", color: "#D4A5A5" }
];

// Syllabus Data
const syllabusData = {
  "MPI": ["Unit 1: 8085 Architecture, Pin Diagram", "Unit 2: 8085 Instruction Set, Programming", "Unit 3: 8086 Architecture, Memory Segmentation", "Unit 4: 8255 PPI, 8259 PIC, Interfacing"],
  "CN": ["Unit 1: OSI Model, TCP/IP Model, Topologies", "Unit 2: Data Link Layer, Error Detection", "Unit 3: Network Layer, IP Addressing, Routing", "Unit 4: Transport Layer, UDP, TCP"],
  "DBMS": ["Unit 1: DBMS Concepts, Architecture", "Unit 2: ER Model, Relational Model", "Unit 3: SQL Queries, Joins, Subqueries", "Unit 4: Normalization, 1NF to BCNF"],
  "ADA": ["Unit 1: Algorithm Analysis, Asymptotic Notations", "Unit 2: Divide and Conquer, Sorting", "Unit 3: Dynamic Programming, LCS, Knapsack", "Unit 4: Graph Algorithms, MST, Shortest Path"],
  "SE": ["Unit 1: Software Process Models, SDLC", "Unit 2: Requirement Engineering, SRS", "Unit 3: Software Design, UML Diagrams", "Unit 4: Testing, Quality Assurance"],
  "Java": ["Unit 1: Java Fundamentals, OOP Concepts", "Unit 2: Inheritance, Polymorphism", "Unit 3: Exception Handling, Multithreading", "Unit 4: Swing, JDBC, Collections"]
};

// Faculty Data - Each faculty teaches ONE specific subject
const facultyData = {
  "faculty.mpi@assignx.com": { name: "Prof. Sharma", password: "faculty123", subjectId: "MPI", subjectName: "Microprocessor and Interfacing", department: "CSE" },
  "faculty.cn@assignx.com": { name: "Prof. Verma", password: "faculty123", subjectId: "CN", subjectName: "Computer Networks", department: "CSE" },
  "faculty.dbms@assignx.com": { name: "Prof. Singh", password: "faculty123", subjectId: "DBMS", subjectName: "Database Management System", department: "CSE" },
  "faculty.ada@assignx.com": { name: "Prof. Gupta", password: "faculty123", subjectId: "ADA", subjectName: "Analysis of Algorithms", department: "CSE" },
  "faculty.se@assignx.com": { name: "Prof. Patel", password: "faculty123", subjectId: "SE", subjectName: "Software Engineering", department: "CSE" },
  "faculty.java@assignx.com": { name: "Prof. Kumar", password: "faculty123", subjectId: "Java", subjectName: "Java Programming", department: "CSE" }
};

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [liveAssignments, setLiveAssignments] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);

  // Listen for live assignments for the selected subject (Student)
  useEffect(() => {
    if (userType === 'student' && selectedSubject) {
      const unsubscribe = getLiveAssignments(selectedSubject, (assignments) => {
        console.log("Live assignments for", selectedSubject, ":", assignments);
        setLiveAssignments(assignments);
      });
      return () => unsubscribe();
    }
  }, [userType, selectedSubject]);

  // Listen for student's submissions
  useEffect(() => {
    if (userType === 'student' && user) {
      const unsubscribe = getStudentSubmissions(user.email, (submissions) => {
        setStudentSubmissions(submissions);
      });
      return () => unsubscribe();
    }
  }, [userType, user]);

  const handleStudentLogin = (email, password) => {
    setLoading(true);
    setError('');
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
    setError('');
    const faculty = facultyData[email.toLowerCase()];
    if (faculty && faculty.password === password) {
      setUser({ email, type: 'faculty' });
      setUserType('faculty');
      setUserData(faculty);
      // Set the selected subject to faculty's assigned subject
      setSelectedSubject(faculty.subjectId);
    } else {
      setError('Invalid faculty credentials');
    }
    setLoading(false);
  };

  const handleCreateAssignment = async (title, description, dueDate, maxMarks) => {
    const result = await createAssignment({
      title, description, dueDate, maxMarks,
      subjectId: userData.subjectId,
      subjectName: userData.subjectName,
      createdBy: user.email,
      facultyName: userData.name
    });
    if (result.success) {
      alert('? Assignment created successfully! Students can see it live.');
    } else {
      alert('? Error: ' + result.error);
    }
  };

  const handleSubmitAssignment = async (assignmentId, submissionLink) => {
    const result = await submitAssignment({
      assignmentId,
      studentId: user.email,
      studentName: userData.name,
      rollNo: userData.rollNo,
      submissionLink,
      subjectId: selectedSubject
    });
    if (result.success) {
      alert('? Assignment submitted successfully!');
    } else {
      alert('? Error: ' + result.error);
    }
  };

  const handleLogout = () => {
    setUser(null); setUserType(null); setUserData(null);
    setSelectedSubject(null); setLiveAssignments([]);
  };

  if (!user) {
    return <LoginSelectionPage 
      onStudentLogin={handleStudentLogin} 
      onFacultyLogin={handleFacultyLogin}
      loading={loading} 
      error={error}
      facultyList={facultyData}
    />;
  }

  if (userType === 'student') {
    if (selectedSubject) {
      const course = allCourses.find(c => c.id === selectedSubject);
      const syllabus = syllabusData[selectedSubject] || [];
      const isSubmitted = (assignmentId) => studentSubmissions.some(s => s.assignmentId === assignmentId);
      const getSubmission = (assignmentId) => studentSubmissions.find(s => s.assignmentId === assignmentId);
      return (
        <StudentCourseDetailPage
          course={course}
          syllabus={syllabus}
          assignments={liveAssignments}
          userData={userData}
          isSubmitted={isSubmitted}
          getSubmission={getSubmission}
          onSubmitAssignment={handleSubmitAssignment}
          onBack={() => setSelectedSubject(null)}
          onLogout={handleLogout}
        />
      );
    }
    return (
      <StudentDashboardPage
        userData={userData}
        courses={allCourses}
        onSelectSubject={setSelectedSubject}
        onLogout={handleLogout}
      />
    );
  }

  if (userType === 'faculty') {
    if (selectedSubject === 'create') {
      const course = allCourses.find(c => c.id === userData.subjectId);
      return (
        <FacultyCreateAssignmentPage
          userData={userData}
          course={course}
          onCreateAssignment={handleCreateAssignment}
          onBack={() => setSelectedSubject(userData.subjectId)}
          onLogout={handleLogout}
        />
      );
    }
    if (selectedSubject) {
      const course = allCourses.find(c => c.id === selectedSubject);
      const syllabus = syllabusData[selectedSubject] || [];
      // Filter students - show all students (they all take this subject)
      const allStudents = Object.values(studentsData);
      return (
        <FacultySubjectDetailPage
          course={course}
          syllabus={syllabus}
          students={allStudents}
          userData={userData}
          onBack={() => setSelectedSubject(null)}
          onLogout={handleLogout}
        />
      );
    }
    // Faculty sees ONLY their assigned subject
    const facultyCourse = allCourses.find(c => c.id === userData.subjectId);
    return (
      <FacultyDashboardPage
        userData={userData}
        course={facultyCourse}
        studentsData={studentsData}
        onSelectSubject={setSelectedSubject}
        onLogout={handleLogout}
      />
    );
  }
  return null;
}

// ============ LOGIN SELECTION PAGE ============
function LoginSelectionPage({ onStudentLogin, onFacultyLogin, loading, error, facultyList }) {
  const [loginType, setLoginType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (loginType === null) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>??</div>
          <h1 style={styles.logoText}>AssignX</h1>
          <p style={styles.tagline}>ASSIGN | LEARN | GROW</p>
          <p style={styles.subTagline}>Assignments that build skills, not just grades.</p>
        </div>
        <div style={styles.loginChoiceContainer}>
          <div style={styles.choiceCard} onClick={() => setLoginType('student')}>
            <div style={styles.choiceIcon}>?????</div>
            <h2>Student Login</h2>
            <p>Access your courses, assignments, and marks</p>
          </div>
          <div style={styles.choiceCard} onClick={() => setLoginType('faculty')}>
            <div style={styles.choiceIcon}>?????</div>
            <h2>Faculty Login</h2>
            <p>Manage your subject, create live assignments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.loginContainer}>
      <div style={styles.card}>
        <button onClick={() => setLoginType(null)} style={styles.backBtn}>? Back</button>
        <h2 style={styles.subtitle}>{loginType === 'student' ? 'Student Login' : 'Faculty Login'}</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); if (loginType === 'student') onStudentLogin(email, password); else onFacultyLogin(email, password); }}>
          <input type="email" placeholder="Email Address" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div style={styles.demoInfo}>
          {loginType === 'student' ? (
            <details><summary>?? Student Demo Logins</summary>
              <div>?? Sneha Singh: sneha@assignx.com / 240010130100</div>
              <div>?? Bhumika Goyal: bhumikagoyal@assignx.com / 240010130095</div>
              <div>?? Gauri: gauri@assignx.com / 240010130104</div>
            </details>
          ) : (
            <details><summary>????? Faculty Demo Logins (Each teaches one subject)</summary>
              <div>?? Prof. Sharma (MPI): faculty.mpi@assignx.com / faculty123</div>
              <div>?? Prof. Verma (CN): faculty.cn@assignx.com / faculty123</div>
              <div>??? Prof. Singh (DBMS): faculty.dbms@assignx.com / faculty123</div>
              <div>?? Prof. Gupta (ADA): faculty.ada@assignx.com / faculty123</div>
              <div>?? Prof. Patel (SE): faculty.se@assignx.com / faculty123</div>
              <div>? Prof. Kumar (Java): faculty.java@assignx.com / faculty123</div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ STUDENT DASHBOARD ============
function StudentDashboardPage({ userData, courses, onSelectSubject, onLogout }) {
  const totalMarks = Object.values(userData.minor1).reduce((a,b)=>a+b,0) + Object.values(userData.minor2).reduce((a,b)=>a+b,0);
  const percentage = (totalMarks / 360) * 100;
  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}><h1 style={styles.logo}>?? AssignX - Student Portal</h1>
          <div style={styles.userInfo}><span>?? Hello, {userData.name}</span><span>?? CGPA: {userData.cgpa}</span><button onClick={onLogout} style={styles.logoutBtn}>?? Logout</button></div>
        </div>
      </nav>
      <div style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2>Welcome, {userData.name}!</h2>
          <p>?? Roll No: {userData.rollNo} | ?? Overall Percentage: {percentage.toFixed(1)}%</p>
        </div>
        <h2 style={styles.sectionTitle}>?? Your Courses</h2>
        <div style={styles.courseGrid}>
          {courses.map(course => (
            <div key={course.id} style={{...styles.courseCard, borderTop: `4px solid ${course.color}`}} onClick={() => onSelectSubject(course.id)}>
              <div style={styles.courseIcon}>{course.icon}</div>
              <h3>{course.name}</h3>
              <p>{course.code}</p>
              <div style={styles.courseStats}>
                <span>?? Minor 1: {userData.minor1[course.id]}/30</span>
                <span>?? Minor 2: {userData.minor2[course.id]}/30</span>
              </div>
              <button style={styles.viewBtn}>?? View Course ?</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ STUDENT COURSE DETAIL WITH LIVE ASSIGNMENTS ============
function StudentCourseDetailPage({ course, syllabus, assignments, userData, isSubmitted, getSubmission, onSubmitAssignment, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('assignments');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submittingFor, setSubmittingFor] = useState(null);
  const minor1 = userData.minor1[course.id], minor2 = userData.minor2[course.id];

  const handleSubmit = async (assignmentId) => {
    if (!submissionLink) { alert('Please enter a submission link'); return; }
    await onSubmitAssignment(assignmentId, submissionLink);
    setSubmittingFor(null); setSubmissionLink('');
  };

  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}><h1 style={styles.logo}>?? AssignX</h1>
          <div style={styles.userInfo}><span>?? {userData.name}</span><button onClick={onLogout} style={styles.logoutBtn}>?? Logout</button></div>
        </div>
      </nav>
      <div style={styles.content}>
        <button onClick={onBack} style={styles.backBtn}>? Back to Dashboard</button>
        <div style={{...styles.courseHeader, borderTop: `4px solid ${course.color}`}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}><div style={{fontSize:'48px'}}>{course.icon}</div><div><h1>{course.name}</h1><p>?? Code: {course.code} | ????? Faculty: {course.faculty}</p></div></div>
          <div style={styles.courseProgress}>
            <div><span>?? Minor 1: {minor1}/30</span><div style={styles.progressBar}><div style={{ width: `${(minor1/30)*100}%`, background: '#4caf50', height: '6px' }}></div></div></div>
            <div><span>?? Minor 2: {minor2}/30</span><div style={styles.progressBar}><div style={{ width: `${(minor2/30)*100}%`, background: '#2196f3', height: '6px' }}></div></div></div>
          </div>
        </div>
        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('assignments')} style={{...styles.tab, background: activeTab === 'assignments' ? '#667eea' : '#f0f0f0', color: activeTab === 'assignments' ? 'white' : '#333'}}>?? Live Assignments ({assignments.length})</button>
          <button onClick={() => setActiveTab('syllabus')} style={{...styles.tab, background: activeTab === 'syllabus' ? '#667eea' : '#f0f0f0', color: activeTab === 'syllabus' ? 'white' : '#333'}}>?? Syllabus</button>
        </div>
        {activeTab === 'assignments' && (
          <div style={styles.assignmentsContainer}>
            {assignments.length === 0 ? (
              <div style={styles.emptyState}>?? No assignments yet. Faculty will post assignments for this subject here.</div>
            ) : (
              assignments.map(assign => {
                const submitted = isSubmitted(assign.id);
                const submission = getSubmission(assign.id);
                return (
                  <div key={assign.id} style={styles.assignmentCard}>
                    <div style={styles.assignmentHeader}>
                      <h3>?? {assign.title}</h3>
                      <span style={submitted ? styles.submittedBadge : styles.pendingBadge}>
                        {submitted ? '? Submitted' : '? Pending'}
                      </span>
                    </div>
                    <p>{assign.description}</p>
                    <div style={styles.assignmentDetails}>
                      <span>?? Due: {assign.dueDate?.toDate().toLocaleDateString()}</span>
                      <span>? Max Marks: {assign.maxMarks}</span>
                      <span>????? Faculty: {assign.facultyName}</span>
                    </div>
                    {submitted && submission && (
                      <div style={styles.submissionInfo}>
                        <span>?? Submitted: {submission.submittedAt?.toDate().toLocaleDateString()}</span>
                        {submission.marks && <span>?? Marks: {submission.marks}/{assign.maxMarks}</span>}
                        {submission.feedback && <span>?? Feedback: {submission.feedback}</span>}
                      </div>
                    )}
                    {!submitted && submittingFor === assign.id ? (
                      <div>
                        <input type="url" placeholder="?? Submission Link (GitHub/Drive/YouTube)" style={styles.inputSmall} value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} />
                        <div style={styles.formActions}>
                          <button onClick={() => handleSubmit(assign.id)} style={styles.submitBtn}>? Confirm Submit</button>
                          <button onClick={() => setSubmittingFor(null)} style={styles.cancelBtn}>? Cancel</button>
                        </div>
                      </div>
                    ) : !submitted && (
                      <button onClick={() => setSubmittingFor(assign.id)} style={styles.submitBtn}>?? Submit Assignment</button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        {activeTab === 'syllabus' && (
          <div style={styles.syllabusContainer}>{syllabus.map((unit, idx) => (<div key={idx} style={styles.unitCard}><h3>?? {unit}</h3></div>))}</div>
        )}
      </div>
    </div>
  );
}

// ============ FACULTY DASHBOARD - SHOWS ONLY THEIR SUBJECT ============
function FacultyDashboardPage({ userData, course, studentsData, onSelectSubject, onLogout }) {
  const allStudents = Object.values(studentsData);
  
  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>?? AssignX - Faculty Portal</h1>
          <div style={styles.userInfo}>
            <span>????? {userData.name}</span>
            <span>?? Subject: {userData.subjectName}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>?? Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2>Welcome, {userData.name}!</h2>
          <p>?? You are teaching: <strong>{userData.subjectName}</strong> ({userData.subjectId})</p>
          <p>????? Total Students: {allStudents.length}</p>
        </div>
        
        <h2 style={styles.sectionTitle}>?? Your Subject</h2>
        <div style={styles.courseGrid}>
          <div key={course.id} style={{...styles.courseCard, borderTop: `4px solid ${course.color}`, cursor: 'pointer'}} onClick={() => onSelectSubject(course.id)}>
            <div style={styles.courseIcon}>{course.icon}</div>
            <h3>{course.name}</h3>
            <p>{course.code}</p>
            <button style={styles.viewBtn}>?? Manage Subject ?</button>
          </div>
          <div style={styles.courseCard} onClick={() => onSelectSubject('create')}>
            <div style={styles.courseIcon}>?</div>
            <h3>Create Assignment</h3>
            <p>Post live assignments for {userData.subjectName}</p>
            <button style={styles.viewBtn}>? Create ?</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ FACULTY SUBJECT DETAIL PAGE ============
function FacultySubjectDetailPage({ course, syllabus, students, userData, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('students');
  
  // Fetch assignments for this subject (will be done via Firebase listener in real app)
  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>?? AssignX - Faculty</h1>
          <div style={styles.userInfo}>
            <span>????? {userData.name}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>?? Logout</button>
          </div>
        </div>
      </nav>
      <div style={styles.content}>
        <button onClick={onBack} style={styles.backBtn}>? Back to Dashboard</button>
        <div style={{...styles.courseHeader, borderTop: `4px solid ${course.color}`}}>
          <div><div style={{fontSize:'48px'}}>{course.icon}</div>
          <h1>{course.name}</h1>
          <p>?? Code: {course.code} | ????? Faculty: {userData.name}</p></div>
        </div>
        <div style={styles.tabContainer}>
          <button onClick={() => setActiveTab('students')} style={{...styles.tab, background: activeTab === 'students' ? '#667eea' : '#f0f0f0', color: activeTab === 'students' ? 'white' : '#333'}}>????? Students Performance</button>
          <button onClick={() => setActiveTab('syllabus')} style={{...styles.tab, background: activeTab === 'syllabus' ? '#667eea' : '#f0f0f0', color: activeTab === 'syllabus' ? 'white' : '#333'}}>?? Syllabus</button>
        </div>
        {activeTab === 'students' && (
          <div style={styles.studentsTable}>
            <table style={{ width: '100%' }}>
              <thead><tr style={{ background: '#667eea', color: 'white' }}>
                <th>?? Roll No</th><th>?? Name</th><th>?? Minor 1</th><th>?? Minor 2</th><th>?? Total</th><th>? %</th>
              </tr></thead>
              <tbody>
                {students.map(s => {
                  const m1 = s.minor1[course.id] || 0, m2 = s.minor2[course.id] || 0, total = m1 + m2;
                  return (
                    <tr key={s.rollNo} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={styles.td}>{s.rollNo}</td>
                      <td style={styles.td}>{s.name}</td>
                      <td style={styles.td}>{m1}/30</td>
                      <td style={styles.td}>{m2}/30</td>
                      <td style={styles.td}>{total}/60</td>
                      <td style={styles.td}>? {((total/60)*100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'syllabus' && (
          <div style={styles.syllabusContainer}>{syllabus.map((unit, idx) => (<div key={idx} style={styles.unitCard}><h3>?? {unit}</h3></div>))}</div>
        )}
      </div>
    </div>
  );
}

// ============ FACULTY CREATE ASSIGNMENT PAGE ============
function FacultyCreateAssignmentPage({ userData, course, onCreateAssignment, onBack, onLogout }) {
  const [title, setTitle] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [dueDate, setDueDate] = useState(''); 
  const [maxMarks, setMaxMarks] = useState(30);
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (!title || !description || !dueDate) { alert('Please fill all fields'); return; } 
    onCreateAssignment(title, description, dueDate, maxMarks); 
    setTitle(''); setDescription(''); setDueDate(''); 
    onBack(); 
  };
  
  return (
    <div>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <h1 style={styles.logo}>?? Create Assignment</h1>
          <button onClick={onLogout} style={styles.logoutBtn}>?? Logout</button>
        </div>
      </nav>
      <div style={styles.content}>
        <button onClick={onBack} style={styles.backBtn}>? Back</button>
        <div style={styles.formCard}>
          <h2>? Create New Assignment for {userData.subjectName}</h2>
          <p>?? This will be visible to students immediately under {userData.subjectName}</p>
          <form onSubmit={handleSubmit}>
            <input placeholder="?? Assignment Title" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea placeholder="?? Description" rows="3" style={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} required />
            <input type="date" style={styles.input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <input type="number" placeholder="? Maximum Marks" style={styles.input} value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value))} required />
            <button type="submit" style={styles.publishBtn}>?? Publish Assignment (Students See Instantly)</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============ STYLES ============
const styles = {
  loginContainer: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginChoiceContainer: { display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' },
  choiceCard: { background: 'white', padding: '40px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', width: '280px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  choiceIcon: { fontSize: '60px' },
  logoSection: { textAlign: 'center', marginBottom: '40px' },
  logoIcon: { fontSize: '80px' },
  logoText: { fontSize: '48px', fontWeight: 'bold', color: 'white', margin: '10px 0' },
  tagline: { fontSize: '20px', color: 'rgba(255,255,255,0.9)', letterSpacing: '4px' },
  subTagline: { fontSize: '16px', color: 'rgba(255,255,255,0.7)' },
  card: { background: 'white', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
  subtitle: { fontSize: '24px', textAlign: 'center', marginBottom: '30px', color: '#333' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  inputSmall: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
  button: { width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  error: { background: '#fee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' },
  demoInfo: { marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '10px', fontSize: '12px' },
  navbar: { background: '#667eea', padding: '15px 30px', color: 'white' },
  navContent: { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  logo: { fontSize: '24px', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '1400px', margin: '0 auto', padding: '30px' },
  welcomeCard: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '30px', borderRadius: '20px', marginBottom: '30px' },
  statsRow: { display: 'flex', gap: '30px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  statBox: { textAlign: 'center' },
  statValue: { display: 'block', fontSize: '36px', fontWeight: 'bold' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', color: '#333' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  courseCard: { background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s' },
  courseIcon: { fontSize: '40px', textAlign: 'center', marginBottom: '10px' },
  courseStats: { display: 'flex', justifyContent: 'space-between', margin: '15px 0', fontSize: '13px', color: '#666', flexWrap: 'wrap', gap: '8px' },
  viewBtn: { width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' },
  backBtn: { background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '16px', marginBottom: '20px' },
  courseHeader: { background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '20px' },
  courseProgress: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' },
  progressBar: { background: '#e0e0e0', borderRadius: '4px', height: '6px', overflow: 'hidden', marginTop: '5px' },
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  assignmentsContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  assignmentCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  assignmentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' },
  submittedBadge: { background: '#c8e6c9', color: '#2e7d32', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' },
  pendingBadge: { background: '#fff3e0', color: '#e65100', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' },
  assignmentDetails: { display: 'flex', gap: '20px', marginTop: '10px', fontSize: '13px', color: '#666', flexWrap: 'wrap' },
  submissionInfo: { marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '15px', flexWrap: 'wrap' },
  submitBtn: { marginTop: '10px', padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { marginTop: '10px', padding: '8px 16px', background: '#999', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' },
  formActions: { display: 'flex', gap: '10px', marginTop: '10px' },
  syllabusContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  unitCard: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  studentsTable: { background: 'white', borderRadius: '15px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  td: { padding: '12px', borderBottom: '1px solid #eee' },
  emptyState: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px', color: '#666' },
  formCard: { background: 'white', padding: '30px', borderRadius: '20px', maxWidth: '600px', margin: '0 auto' },
  publishBtn: { width: '100%', padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }
};

export default App;
