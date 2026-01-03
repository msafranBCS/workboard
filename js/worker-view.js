import { db } from "./firebase.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Get all workers
export async function getAllWorkers() {
    const workers = [];
    const querySnapshot = await getDocs(collection(db, "workers"));
    querySnapshot.forEach(doc => {
        workers.push({ id: doc.id, ...doc.data() });
    });
    return workers;
}

// Get single worker by ID
export async function getWorker(workerId) {
    const docRef = doc(db, "workers", workerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

// Get work records for a worker
export async function getWorkRecordsByWorker(workerId) {
    const workRecords = [];
    const q = query(collection(db, "works"), where("workerId", "==", workerId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        workRecords.push({ id: doc.id, ...doc.data() });
    });
    return workRecords;
}

// Get payment records for a worker
export async function getPaymentsByWorker(workerId) {
    const payments = [];
    const q = query(collection(db, "payments"), where("workerId", "==", workerId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        payments.push({ id: doc.id, ...doc.data() });
    });
    return payments;
}

// Calculate total earned
export async function calculateTotalEarned(workerId) {
    const workRecords = await getWorkRecordsByWorker(workerId);
    return workRecords.reduce((sum, record) => sum + (record.earnedAmount || 0), 0);
}

// Calculate total paid
export async function calculateTotalPaid(workerId) {
    const payments = await getPaymentsByWorker(workerId);
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}
