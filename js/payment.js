/**
 * WorkBoard Payment Record Management Module
 * Handles payment record CRUD operations using Firestore
 */

/**
 * Add a payment record
 */
async function addPayment(workerId, date, amount, paymentType, note) {
    if (!workerId || !date || amount === undefined || amount === null || !paymentType) {
        return { success: false, message: 'Worker, date, amount, and payment type are required' };
    }

    if (amount <= 0) {
        return { success: false, message: 'Payment amount must be greater than 0' };
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

        const paymentRecord = {
            workerId: workerId,
            date: isoDate,
            amount: parseFloat(amount),
            paymentType: paymentType.trim(),
            note: (note || '').trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await window.db.collection('payments').add(paymentRecord);
        
        return { 
            success: true, 
            message: 'Payment record added successfully', 
            paymentRecord: { id: docRef.id, ...paymentRecord } 
        };
    } catch (error) {
        console.error('Error adding payment:', error);
        return { success: false, message: 'Failed to save payment record: ' + error.message };
    }
}

/**
 * Get payment records by worker ID
 */
async function getPaymentsByWorker(workerId) {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('payments')
            .where('workerId', '==', workerId)
            .orderBy('date', 'desc')
            .get();
        
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
 * Get all payment records
 */
async function getAllPayments() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection('payments')
            .orderBy('date', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all payment records:', error);
        return [];
    }
}

/**
 * Get payment record by ID
 */
async function getPayment(id) {
    try {
        if (!window.db) return null;
        const doc = await window.db.collection('payments').doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting payment record:', error);
        return null;
    }
}

/**
 * Update payment record
 */
async function updatePayment(id, updates) {
    try {
        if (!window.db) {
            return { success: false, message: 'Firestore not initialized. Please refresh the page.' };
        }
        const paymentRef = window.db.collection('payments').doc(id);
        const paymentDoc = await paymentRef.get();
        
        if (!paymentDoc.exists) {
            return { success: false, message: 'Payment record not found' };
        }

        // Convert date if needed
        if (updates.date && updates.date.includes('/')) {
            const parts = updates.date.split('/');
            if (parts.length === 3) {
                updates.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        if (updates.amount !== undefined && updates.amount <= 0) {
            return { success: false, message: 'Payment amount must be greater than 0' };
        }

        const updateData = {};
        if (updates.date !== undefined) updateData.date = updates.date;
        if (updates.paymentType !== undefined) updateData.paymentType = updates.paymentType.trim();
        if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount);
        if (updates.note !== undefined) updateData.note = updates.note.trim();

        await paymentRef.update(updateData);

        return { success: true, message: 'Payment record updated successfully' };
    } catch (error) {
        console.error('Error updating payment record:', error);
        return { success: false, message: 'Failed to update payment record: ' + error.message };
    }
}

/**
 * Delete payment record
 */
async function deletePayment(id) {
    try {
        if (!window.db) {
            return { success: false, message: 'Firestore not initialized. Please refresh the page.' };
        }
        const paymentRef = window.db.collection('payments').doc(id);
        const paymentDoc = await paymentRef.get();
        
        if (!paymentDoc.exists) {
            return { success: false, message: 'Payment record not found' };
        }

        await paymentRef.delete();

        return { success: true, message: 'Payment record deleted successfully' };
    } catch (error) {
        console.error('Error deleting payment record:', error);
        return { success: false, message: 'Failed to delete payment record: ' + error.message };
    }
}

/**
 * Calculate total paid for a worker
 */
async function calculateTotalPaid(workerId) {
    try {
        const records = await getPaymentsByWorker(workerId);
        return records.reduce((total, record) => total + (record.amount || 0), 0);
    } catch (error) {
        console.error('Error calculating total paid:', error);
        return 0;
    }
}
