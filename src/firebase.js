import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAcu94iTuUGZxM0rxAYA54DcQr2KaFnPfc",
  authDomain: "assign-x-f8826.firebaseapp.com",
  projectId: "assign-x-f8826",
  storageBucket: "assign-x-f8826.firebasestorage.app",
  messagingSenderId: "508284491776",
  appId: "1:508284491776:web:2ac3a64c5eb01116b120e5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions'
};

// Create assignment
export const createAssignment = async (assignmentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ASSIGNMENTS), {
      ...assignmentData,
      createdAt: Timestamp.now(),
      dueDate: Timestamp.fromDate(new Date(assignmentData.dueDate)),
      isActive: true
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get assignments for a subject (real-time)
export const getAssignmentsBySubject = (subjectId, callback) => {
  const q = query(
    collection(db, COLLECTIONS.ASSIGNMENTS),
    where('subjectId', '==', subjectId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const assignments = [];
    snapshot.forEach((doc) => {
      assignments.push({ id: doc.id, ...doc.data() });
    });
    callback(assignments);
  });
};

// Get all assignments for coordinator
export const getAllAssignments = (callback) => {
  const q = query(collection(db, COLLECTIONS.ASSIGNMENTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const assignments = [];
    snapshot.forEach((doc) => {
      assignments.push({ id: doc.id, ...doc.data() });
    });
    callback(assignments);
  });
};

// Submit assignment
export const submitAssignment = async (submissionData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), {
      ...submissionData,
      submittedAt: Timestamp.now(),
      status: 'submitted'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get student submissions
export const getStudentSubmissions = (studentId, callback) => {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('studentId', '==', studentId),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const submissions = [];
    snapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    callback(submissions);
  });
};
