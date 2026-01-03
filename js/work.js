/**
 * WorkBoard Work Record Management Module
 * Handles work record CRUD operations using Firestore
 */

/**
 * Add a work record
 */
async function addWorkRecord(workerId, date, workType, earnedAmount) {
    if (!workerId || !date || !workType || earnedAmount === undefined || earnedAmount === null) {
        return { success: false, message: 'All fields are required' };
    }

    if (earnedAmount < 0) {
        return { success: false, message: 'Earned amount cannot be negative' };
    }

    try {
        if (!window.db) {
            return { success: false, message: 'Firestore not initialized. Please refresh the page.' };
        }

        // Validate worker exists
        const workerDoc = await window.db.collection('workers').doc(workerId).get();
        if (!workerDoc.exists) {
            return { success: false, message: 'Worker not found' };
        }

        // Convert date to ISO format (YYYY-MM-DD)
        let isoDate = date;
        if (date.includes('/')) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const parts = date.split('/');
            if (parts.length === 3) {
                isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        const workRecord = {
            workerId: workerId,
            date: isoDate,
            workType: workType.trim(),
            earnedAmount: parseFloat(earnedAmount),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await window.db.collection('works').add(workRecord);
        
        return { 
            success: true, 
            message: 'Work record added successfully', 
            workRecord: { id: docRef.id, ...workRecord } 
        };
    } catch (error) {
        console.error('Error adding work record:', error);
        return { success: false, message: 'Failed to save work record: ' + error.message };
    }
}

/**
 * Get work records by worker ID
 */
async function getWorkRecordsByWorker(workerId) {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('works')
            .where('workerId', '==', workerId)
            .orderBy('date', 'desc')
            .get();
        
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
 * Get all work records
 */
async function getAllWorkRecords() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('works')
            .orderBy('date', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all work records:', error);
        return [];
    }
}

/**
 * Get work record by ID
 */
async function getWorkRecord(id) {
    try {
        if (!window.db) return null;
        const doc = await window.db.collection('works').doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting work record:', error);
        return null;
    }
}

/**
 * Update work record
 */
async function updateWorkRecord(id, updates) {
    try {
        if (!window.db) {
            return { success: false, message: 'Firestore not initialized. Please refresh the page.' };
        }
        const workRef = window.db.collection('works').doc(id);
        const workDoc = await workRef.get();
        
        if (!workDoc.exists) {
            return { success: false, message: 'Work record not found' };
        }

        // Convert date if needed
        if (updates.date && updates.date.includes('/')) {
            const parts = updates.date.split('/');
            if (parts.length === 3) {
                updates.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        if (updates.earnedAmount !== undefined && updates.earnedAmount < 0) {
            return { success: false, message: 'Earned amount cannot be negative' };
        }

        const updateData = {};
        if (updates.date !== undefined) updateData.date = updates.date;
        if (updates.workType !== undefined) updateData.workType = updates.workType.trim();
        if (updates.earnedAmount !== undefined) updateData.earnedAmount = parseFloat(updates.earnedAmount);

        await workRef.update(updateData);

        return { success: true, message: 'Work record updated successfully' };
    } catch (error) {
        console.error('Error updating work record:', error);
        return { success: false, message: 'Failed to update work record: ' + error.message };
    }
}

/**
 * Delete work record
 */
async function deleteWorkRecord(id) {
    try {
        if (!window.db) {
            return { success: false, message: 'Firestore not initialized. Please refresh the page.' };
        }
        const workRef = window.db.collection('works').doc(id);
        const workDoc = await workRef.get();
        
        if (!workDoc.exists) {
            return { success: false, message: 'Work record not found' };
        }

        await workRef.delete();

        return { success: true, message: 'Work record deleted successfully' };
    } catch (error) {
        console.error('Error deleting work record:', error);
        return { success: false, message: 'Failed to delete work record: ' + error.message };
    }
}

/**
 * Calculate total earned for a worker
 */
async function calculateTotalEarned(workerId) {
    try {
        const records = await getWorkRecordsByWorker(workerId);
        return records.reduce((total, record) => total + (record.earnedAmount || 0), 0);
    } catch (error) {
        console.error('Error calculating total earned:', error);
        return 0;
    }
}
