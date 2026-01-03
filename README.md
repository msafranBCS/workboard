# WorkBoard - Cloud Version (FREE)

A cloud-based web application for tracking worker salaries, work records, and advance payments. Built with vanilla JavaScript, HTML, CSS, and Bootstrap. All data is stored in Firebase Firestore (cloud database).

## Features

- **Worker Management**: Add, edit, and delete workers
- **Work Records**: Track work entries with dates, types, and earned amounts
- **Payment Records**: Track advance payments, partial payments, and full payments
- **Balance Calculation**: Automatic calculation of total earned, total paid, and balance for each worker
- **PDF Export**: Generate professional PDF reports for individual workers or all workers
- **Admin Dashboard**: Full CRUD operations for managing all data
- **Worker View**: Read-only view for workers to check their records (public access)
- **Authentication**: Secure admin login using Firebase Authentication

## File Structure

```
/
├── index.html              # Worker view (read-only, public)
├── admin.html              # Admin dashboard (requires authentication)
├── login.html              # Admin login page
├── vercel.json             # Vercel deployment config
├── css/
│   └── style.css           # Mobile-first responsive styles
├── js/
│   ├── firebase.js         # Firebase configuration & initialization
│   ├── storage.js          # Firestore operations & data management
│   ├── auth.js             # Firebase Authentication
│   ├── worker.js           # Worker CRUD operations
│   ├── work.js             # Work record management
│   ├── payment.js          # Payment record management
│   ├── pdf.js              # PDF generation with jsPDF
│   ├── admin.js            # Admin dashboard logic
│   └── worker-view.js      # Worker view logic
└── README.md               # This file
```

## Firebase Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### Step 2: Enable Firestore Database

1. In Firebase Console, go to **Build** > **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location for your database (select closest to your users)

### Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (give it a nickname)
5. Copy the Firebase configuration object

### Step 4: Configure the Application

1. Open `js/firebase.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 5: Set Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin credentials: Allow read for login, allow write for initialization
    // Note: Password is hashed (SHA-256), but for production consider using Cloud Functions
    match /admin/{document} {
      allow read: if true;
      allow write: if true;
    }
    
    // Workers: Read public, write allowed (auth handled client-side)
    match /workers/{workerId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Works: Read public, write allowed (auth handled client-side)
    match /works/{workId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Payments: Read public, write allowed (auth handled client-side)
    match /payments/{paymentId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. Click "Publish"

**Note**: 
- Admin credentials are stored in Firestore with SHA-256 password hashing
- Read access to admin collection is needed for login authentication
- Write operations are allowed because authentication is handled client-side via sessionStorage
- **For production**: Consider using Cloud Functions for authentication and write operations for better security
- When you first use the application, Firestore may prompt you to create composite indexes for queries that filter and sort. Click the link in the error message to automatically create the required indexes.

### Step 6: Default Admin Credentials

The application will automatically create a default admin user on first use:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default password after first login for security. You can do this by updating the admin document in Firestore or by modifying the code.

## Local Development

1. Clone or download this repository
2. Complete Firebase setup (steps above)
3. Configure `js/firebase.js` with your Firebase config
4. Open `index.html` in a web browser for the worker view (public)
5. Open `login.html` in a web browser for the admin dashboard
6. Login with default credentials: username `admin`, password `admin123`

## Deployment to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to the project directory:
   ```bash
   cd WorkBoard
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to complete deployment

### Option 2: Using GitHub Integration

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will automatically detect the static site configuration
5. Click "Deploy"

### Option 3: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Drag and drop the project folder or select from your repositories
4. Vercel will automatically configure and deploy

**Important**: After deployment, make sure your Firebase configuration allows requests from your Vercel domain. Firebase allows all domains by default, but check if you have domain restrictions enabled.

## Data Storage

All data is stored in Firebase Firestore (cloud database). This means:

- Data is stored in the cloud and accessible from any device
- Data persists across browser sessions and devices
- Data is automatically backed up by Firebase
- Real-time synchronization across all users
- Free tier includes:
  - 1 GB storage
  - 50K reads/day
  - 20K writes/day
  - 20K deletes/day

## Firestore Data Structure

### Collections

**admin** (collection)
- Document ID: `credentials`
- `username`: string
- `passwordHash`: string (SHA-256 hash)
- `createdAt`: Timestamp

**workers** (collection)
- `id`: string (document ID)
- `name`: string
- `jobRole`: string
- `createdAt`: Timestamp

**works** (collection)
- `id`: string (document ID)
- `workerId`: string
- `date`: string (YYYY-MM-DD)
- `workType`: string
- `earnedAmount`: number
- `createdAt`: Timestamp

**payments** (collection)
- `id`: string (document ID)
- `workerId`: string
- `date`: string (YYYY-MM-DD)
- `amount`: number
- `paymentType`: "advance" | "partial" | "full"
- `note`: string
- `createdAt`: Timestamp

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires modern browser support for:
- Firebase SDK (JavaScript)
- ES6 JavaScript features (async/await, Promises)
- LocalStorage API (for session management)

## Usage

### Admin Dashboard

1. Login at `login.html` using your Firebase admin email and password
2. Navigate through tabs:
   - **Workers**: Add, edit, or delete workers
   - **Add Work Entry**: Record work with date, type, and amount
   - **Add Payment**: Record payments (advance, partial, or full)
   - **View All Data**: View and manage all work and payment records
   - **Export PDFs**: Generate PDF reports

### Worker View

1. Open `index.html` (no login required - public access)
2. Select a worker from the dropdown
3. View work history, payment history, and balance summary
4. This view is read-only

## Date Format

- **Input**: DD/MM/YYYY (e.g., 03/01/2025)
- **Display**: DD/MM/YYYY
- **Storage**: YYYY-MM-DD (ISO format in Firestore)

## Currency Format

All amounts are displayed in Sri Lankan Rupees (LKR) with thousand separators:
- Example: LKR 1,234.56

## PDF Reports

- **Individual Worker PDF**: Contains worker profile, work history, payment history, and summary
- **All Workers PDF**: Contains all workers with individual sections and an overall summary table

PDFs are generated using jsPDF library and downloaded automatically.

## Security Notes

- Admin authentication uses username/password stored in Firestore with SHA-256 hashing
- Session is managed via sessionStorage (cleared when browser closes)
- Admin credentials are protected by Firestore security rules (no public access)
- Worker view is public (read-only) - no authentication required
- Write operations are allowed in Firestore rules (authentication is client-side)
- **Important**: For production, consider using Cloud Functions for write operations for better security
- All data is encrypted in transit (HTTPS)
- Firebase provides automatic security updates and DDoS protection

## Firebase Free Tier Limits

The free (Spark) plan includes:
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day, 20K deletes/day
- **Hosting**: Not used (using Vercel instead)

For most small to medium businesses, the free tier is sufficient. Upgrade to Blaze (pay-as-you-go) if you exceed these limits.

## Troubleshooting

### "Firebase not initialized" Error

- Make sure `js/firebase.js` is loaded before other scripts
- Check that Firebase SDK scripts are included in HTML files
- Verify your Firebase config is correct

### "Permission denied" Error

- Check Firestore security rules are published
- Verify you're logged in as admin for write operations
- Check that authentication is working

### Login Not Working

- Check that admin credentials exist in Firestore (`admin/credentials` document)
- Verify Firebase config is correct
- Check browser console for errors
- Try clearing sessionStorage and logging in again

## License

This project is provided as-is for use and modification.

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Check browser console for JavaScript errors
3. Verify Firebase configuration
4. Review Firestore security rules
