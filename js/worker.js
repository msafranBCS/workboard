/**
 * WorkBoard Worker Management Module
 * Handles CRUD operations for workers using Firestore
 */

/**
 * Add a new worker
 */
async function addWorker(id, name, jobRole) {
    if (!id || !name || !jobRole) {
        return { success: false, message: 'All fields are required' };
    }

    try {
        // Check if worker ID already exists
        const existingDoc = await db.collection('workers').doc(id).get();
        if (existingDoc.exists) {
            return { success: false, message: 'Worker ID already exists' };
        }

        const worker = {
            name: name.trim(),
            jobRole: jobRole.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('workers').doc(id.trim()).set(worker);

        return { 
            success: true, 
            message: 'Worker added successfully', 
            worker: { id: id.trim(), ...worker } 
        };
    } catch (error) {
        console.error('Error adding worker:', error);
        return { success: false, message: 'Failed to save worker: ' + error.message };
    }
}

/**
 * Get all workers
 */
async function getAllWorkers() {
    try {
        const workers = await getWorkers();
        return workers.sort((a, b) => {
            // Sort by name alphabetically
            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error('Error getting workers:', error);
        return [];
    }
}

/**
 * Get worker by ID
 */
async function getWorker(id) {
    try {
        const doc = await db.collection('workers').doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting worker:', error);
        return null;
    }
}

/**
 * Update worker details
 */
async function updateWorker(id, updates) {
    try {
        const workerRef = db.collection('workers').doc(id);
        const workerDoc = await workerRef.get();
        
        if (!workerDoc.exists) {
            return { success: false, message: 'Worker not found' };
        }

        // Don't allow ID change if it conflicts
        if (updates.id && updates.id !== id) {
            const newIdDoc = await db.collection('workers').doc(updates.id).get();
            if (newIdDoc.exists) {
                return { success: false, message: 'Worker ID already exists' };
            }
        }

        // Prepare update data (exclude id from updates object)
        const updateData = {};
        if (updates.name !== undefined) updateData.name = updates.name.trim();
        if (updates.jobRole !== undefined) updateData.jobRole = updates.jobRole.trim();

        // If ID is changing, we need to create new document and delete old one
        if (updates.id && updates.id !== id) {
            const newWorkerData = {
                name: updates.name || workerDoc.data().name,
                jobRole: updates.jobRole || workerDoc.data().jobRole,
                createdAt: workerDoc.data().createdAt || firebase.firestore.FieldValue.serverTimestamp()
            };

            // Create new document with new ID
            await db.collection('workers').doc(updates.id).set(newWorkerData);

            // Update worker ID in related records
            await updateWorkerIdInRecords(id, updates.id);

            // Delete old document
            await workerRef.delete();

            return { success: true, message: 'Worker updated successfully' };
        } else {
            // Simple update
            await workerRef.update(updateData);
            return { success: true, message: 'Worker updated successfully' };
        }
    } catch (error) {
        console.error('Error updating worker:', error);
        return { success: false, message: 'Failed to update worker: ' + error.message };
    }
}

/**
 * Helper function to update worker ID in related records
 */
async function updateWorkerIdInRecords(oldId, newId) {
    try {
        // Update work records
        const workSnapshot = await db.collection('works')
            .where('workerId', '==', oldId)
            .get();
        
        const workBatch = db.batch();
        workSnapshot.docs.forEach(doc => {
            workBatch.update(doc.ref, { workerId: newId });
        });
        await workBatch.commit();

        // Update payment records
        const paymentSnapshot = await db.collection('payments')
            .where('workerId', '==', oldId)
            .get();
        
        const paymentBatch = db.batch();
        paymentSnapshot.docs.forEach(doc => {
            paymentBatch.update(doc.ref, { workerId: newId });
        });
        await paymentBatch.commit();
    } catch (error) {
        console.error('Error updating worker ID in records:', error);
        throw error;
    }
}

/**
 * Delete worker (cascade delete related records)
 */
async function deleteWorker(id) {
    try {
        const workerRef = db.collection('workers').doc(id);
        const workerDoc = await workerRef.get();
        
        if (!workerDoc.exists) {
            return { success: false, message: 'Worker not found' };
        }

        // Delete related work records
        const workSnapshot = await db.collection('works')
            .where('workerId', '==', id)
            .get();
        
        const workBatch = db.batch();
        workSnapshot.docs.forEach(doc => {
            workBatch.delete(doc.ref);
        });
        await workBatch.commit();

        // Delete related payment records
        const paymentSnapshot = await db.collection('payments')
            .where('workerId', '==', id)
            .get();
        
        const paymentBatch = db.batch();
        paymentSnapshot.docs.forEach(doc => {
            paymentBatch.delete(doc.ref);
        });
        await paymentBatch.commit();

        // Delete worker
        await workerRef.delete();

        return { success: true, message: 'Worker and all related records deleted successfully' };
    } catch (error) {
        console.error('Error deleting worker:', error);
        return { success: false, message: 'Failed to delete worker: ' + error.message };
    }
}
