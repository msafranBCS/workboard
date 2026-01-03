/**
 * WorkBoard Storage Module
 * Manages all Firestore operations for the application
 */

/**
 * Initialize storage - check Firestore connection
 */
async function initStorage() {
    try {
        // Check if Firebase is initialized
        if (!window.db) {
            console.error('Firebase not initialized. Make sure firebase.js is loaded first.');
            return false;
        }
        // Test connection by attempting to read from Firestore
        await window.db.collection('workers').limit(1).get();
        return true;
    } catch (error) {
        console.error('Storage initialization error:', error);
        return false;
    }
}

/**
 * Get all workers from Firestore
 */
async function getWorkers() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('workers').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting workers:', error);
        return [];
    }
}

/**
 * Get all work records from Firestore
 */
async function getWorkRecords() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('works').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting work records:', error);
        return [];
    }
}

/**
 * Get all payment records from Firestore
 */
async function getPaymentRecords() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('payments').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting payment records:', error);
        return [];
    }
}

/**
 * Get all data (for backward compatibility)
 * Returns a promise that resolves to an object with workers, workRecords, paymentRecords
 */
async function getAllData() {
    try {
        const [workers, workRecords, paymentRecords] = await Promise.all([
            getWorkers(),
            getWorkRecords(),
            getPaymentRecords()
        ]);
        
        return {
            workers: workers,
            workRecords: workRecords,
            paymentRecords: paymentRecords
        };
    } catch (error) {
        console.error('Error getting all data:', error);
        return {
            workers: [],
            workRecords: [],
            paymentRecords: []
        };
    }
}

/**
 * Clear all data (useful for testing or reset)
 * WARNING: This will delete all data from Firestore
 */
async function clearAllData() {
    try {
        if (!window.db) return false;
        
        // Delete all workers (cascade will be handled by application logic)
        const workersSnapshot = await window.db.collection('workers').get();
        const workersBatch = window.db.batch();
        workersSnapshot.docs.forEach(doc => {
            workersBatch.delete(doc.ref);
        });
        await workersBatch.commit();

        // Delete all work records
        const worksSnapshot = await window.db.collection('works').get();
        const worksBatch = window.db.batch();
        worksSnapshot.docs.forEach(doc => {
            worksBatch.delete(doc.ref);
        });
        await worksBatch.commit();

        // Delete all payment records
        const paymentsSnapshot = await window.db.collection('payments').get();
        const paymentsBatch = window.db.batch();
        paymentsSnapshot.docs.forEach(doc => {
            paymentsBatch.delete(doc.ref);
        });
        await paymentsBatch.commit();

        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
}
