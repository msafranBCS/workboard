/**
 * WorkBoard Firebase Configuration
 * Initialize Firebase app and Firestore (no Auth needed)
 */

// Firebase configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase project configuration
// 
// Steps to get your Firebase config:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project or select existing one
// 3. Enable Firestore Database (Build > Firestore Database > Create database)
// 4. Go to Project Settings (gear icon) > General tab
// 5. Scroll to "Your apps" section and click web icon (</>)
// 6. Register your app and copy the config values below
//
const firebaseConfig = {
    apiKey: "AIzaSyBx3LCxkizuF3b6P5H5GWG1P-6Gtpjg7cE",
    authDomain: "work-fd115.firebaseapp.com",
    projectId: "work-fd115",
    storageBucket: "work-fd115.firebasestorage.app",
    messagingSenderId: "739916337344",
    appId: "1:739916337344:web:4abf16c1c48397217a1d25",
    measurementId: "G-3891V5D65L"
  };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Export for use in other modules
window.db = db;
window.firebaseApp = app;
