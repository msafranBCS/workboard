/**
 * WorkBoard Authentication Module
 * Manages admin authentication using Firestore and sessionStorage
 */

const ADMIN_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';
const SESSION_KEY = 'admin_session';

/**
 * Simple hash function for password (SHA-256 via Web Crypto API)
 */
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        // Fallback to simple hash if crypto API fails
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
}

/**
 * Initialize authentication - set default admin if not exists in Firestore
 */
async function initAuth() {
    try {
        if (!window.db) {
            console.error('Firestore not initialized');
            return;
        }

        // Check if admin document exists
        const adminDoc = await db.collection('admin').doc('credentials').get();
        
        if (!adminDoc.exists) {
            // Create default admin
            const defaultHash = await hashPassword(DEFAULT_PASSWORD);
            await db.collection('admin').doc('credentials').set({
                username: ADMIN_USERNAME,
                passwordHash: defaultHash,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Default admin user created');
        }
    } catch (error) {
        console.error('Error initializing auth:', error);
        // Don't throw - this is called during initialization and shouldn't block
    }
}

/**
 * Login function
 */
async function login(username, password) {
    try {
        // Check if Firebase is initialized
        if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
            return { 
                success: false, 
                message: 'Firebase not initialized. Please check your Firebase configuration in js/firebase.js' 
            };
        }

        if (!window.db) {
            return { 
                success: false, 
                message: 'Firestore not initialized. Please check your Firebase configuration and make sure Firestore is enabled in Firebase Console.' 
            };
        }

        // Check Firebase config - if still has placeholder values, show helpful error
        const config = window.firebaseApp?.options;
        if (config && (config.apiKey === 'YOUR_API_KEY' || config.projectId === 'YOUR_PROJECT_ID')) {
            return { 
                success: false, 
                message: 'Firebase configuration not set. Please update js/firebase.js with your Firebase project credentials.' 
            };
        }

        await initAuth();
        
        // Get admin credentials from Firestore
        const adminDoc = await db.collection('admin').doc('credentials').get();
        
        if (!adminDoc.exists) {
            return { success: false, message: 'Admin credentials not found' };
        }

        const adminData = adminDoc.data();
        const passwordHash = await hashPassword(password);

        if (username === adminData.username && passwordHash === adminData.passwordHash) {
            // Set session
            sessionStorage.setItem(SESSION_KEY, 'authenticated');
            sessionStorage.setItem('admin_username', username);
            return { success: true, message: 'Login successful' };
        } else {
            return { success: false, message: 'Invalid username or password' };
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Provide more helpful error messages
        let errorMessage = 'Login failed';
        
        if (error.code === 'failed-precondition') {
            errorMessage = 'Firestore is not enabled. Please enable Firestore Database in Firebase Console.';
        } else if (error.code === 'unavailable' || error.message.includes('offline')) {
            errorMessage = 'Cannot connect to Firestore. Please check: 1) Your internet connection, 2) Firebase configuration in js/firebase.js, 3) Firestore is enabled in Firebase Console.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check Firestore security rules in Firebase Console.';
        } else {
            errorMessage = 'Login failed: ' + (error.message || error.code || 'Unknown error');
        }
        
        return { success: false, message: errorMessage };
    }
}

/**
 * Logout function
 */
function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('admin_username');
    window.location.href = 'login.html';
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
}

/**
 * Require authentication - redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize auth on load
if (typeof window !== 'undefined') {
    // Wait for Firestore to be ready
    if (window.db) {
        initAuth();
    } else {
        // Wait a bit for firebase.js to load
        setTimeout(() => {
            if (window.db) {
                initAuth();
            }
        }, 100);
    }
}
