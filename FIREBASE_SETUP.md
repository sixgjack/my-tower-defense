# Firebase Setup Guide for Neon Defense

This guide will walk you through setting up Firebase for the Neon Defense tower defense game.

## Prerequisites

- A Firebase account (free tier is sufficient)
- Node.js and npm installed
- Basic understanding of Firebase Console

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "neon-defense")
4. (Optional) Enable Google Analytics (recommended for tracking)
5. Click **"Create project"**
6. Wait for the project to be created, then click **"Continue"**

---

## Step 2: Enable Firebase Services

### 2.1 Enable Authentication (Google Sign-In)

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click on the **"Sign-in method"** tab
3. Click on **"Google"** provider
4. Toggle **"Enable"**
5. Enter a **Project support email** (your email)
6. Click **"Save"**

### 2.2 Enable Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Select **"Start in production mode"** (we'll set up security rules next)
3. Choose a **location** for your database (choose the closest to your users)
4. Click **"Enable"**

---

## Step 3: Configure Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Questions: Read-only for authenticated users
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write (set via Firebase Console)
    }
    
    // Students: Users can only read/write their own data
    match /students/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Prevent deletion
    }
    
    // Leaderboard: Read for all, write only for own data (future feature)
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Neon Defense Web")
5. Copy the Firebase configuration object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Update `src/firebase.ts` with your configuration:

```typescript
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always prompt user to select account
});
```

---

## Step 5: Set Up Collections and Data

### 5.1 Create Questions Collection

1. Go to **Firestore Database** → **Data** tab
2. Click **"Start collection"**
3. Collection ID: `questions`
4. Click **"Next"**

#### Question Document Structure

Each question document should have the following fields:

```typescript
{
  question: string;        // The question text
  options: string[];       // Array of answer options (usually 4)
  correct: string;         // The correct answer (must match one of the options exactly)
  questionSetId: string;   // Question set identifier (see below)
  difficulty?: string;     // Optional: 'easy', 'medium', 'hard'
  category?: string;       // Optional: question category
  createdAt?: Timestamp;   // Optional: creation timestamp
}
```

#### Question Set IDs (Game Modes)

The game supports 5 question sets that correspond to game modes:

- **`math-basics`**: Basic arithmetic and algebra questions (Easy)
- **`science-fundamentals`**: Physics, chemistry, and biology basics (Easy)
- **`programming`**: Coding concepts and logic questions (Medium)
- **`advanced-math`**: Calculus, trigonometry, and complex equations (Hard)
- **`mixed`**: Used for mixed challenge mode (shows all questions)

#### Example Question Documents

**Example 1: Math Basics**
```
Document ID: math-001 (or auto-generated)
Fields:
  question: "What is 15 × 8?"
  options: ["100", "110", "120", "130"]
  correct: "120"
  questionSetId: "math-basics"
  difficulty: "easy"
  category: "arithmetic"
```

**Example 2: Programming**
```
Document ID: prog-001 (or auto-generated)
Fields:
  question: "What is the time complexity of binary search?"
  options: ["O(n)", "O(log n)", "O(n²)", "O(1)"]
  correct: "O(log n)"
  questionSetId: "programming"
  difficulty: "medium"
  category: "algorithms"
```

**Example 3: Science Fundamentals**
```
Document ID: sci-001 (or auto-generated)
Fields:
  question: "What is the chemical symbol for gold?"
  options: ["Go", "Gd", "Au", "Ag"]
  correct: "Au"
  questionSetId: "science-fundamentals"
  difficulty: "easy"
  category: "chemistry"
```

#### Adding Questions via Firebase Console

1. Click **"Add document"** in the `questions` collection
2. You can either:
   - Use auto-generated document ID (recommended)
   - Or enter a custom ID (e.g., `math-001`)
3. Add fields one by one:
   - Click **"Add field"**
   - Field name: `question`, Type: `string`, Value: `"Your question text?"`
   - Field name: `options`, Type: `array`, Value: `["Option 1", "Option 2", "Option 3", "Option 4"]`
   - Field name: `correct`, Type: `string`, Value: `"Option 1"` (must match one option exactly)
   - Field name: `questionSetId`, Type: `string`, Value: `"math-basics"` (one of the 5 IDs above)
   - (Optional) Field name: `difficulty`, Type: `string`, Value: `"easy"`
   - (Optional) Field name: `category`, Type: `string`, Value: `"arithmetic"`
4. Click **"Save"**

#### Bulk Import (Recommended for Many Questions)

For adding many questions, use the Firebase CLI:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Create a JSON file with your questions:

```json
// questions.json
[
  {
    "question": "What is 15 × 8?",
    "options": ["100", "110", "120", "130"],
    "correct": "120",
    "questionSetId": "math-basics",
    "difficulty": "easy",
    "category": "arithmetic"
  },
  {
    "question": "What is the time complexity of binary search?",
    "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    "correct": "O(log n)",
    "questionSetId": "programming",
    "difficulty": "medium",
    "category": "algorithms"
  }
]
```

5. Use a script to import (or manually add via console)

---

### 5.2 Students Collection (Auto-Created)

The `students` collection is automatically created when users sign in for the first time. No manual setup needed!

**Document Structure** (auto-created):
```typescript
{
  totalGames: number;               // Total games played
  totalWaves: number;               // Total waves survived
  totalEnemiesKilled: number;       // Total enemies defeated
  totalMoneyEarned: number;         // Total money earned
  highestWave: number;              // Best wave reached
  credits: number;                  // Credits for unlocks
  unlockedTowers: string[];         // Array of unlocked tower keys
  lastPlayed: Timestamp;            // Last play timestamp
}
```

---

## Step 6: Configure Authorized Domains

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domain (for production):
   - `localhost` is already included for development
   - Add your production domain (e.g., `yourdomain.com`)
   - Add custom domains if hosting on platforms like Vercel, Netlify, etc.

---

## Step 7: Testing

### Test Authentication

1. Run your app: `npm run dev`
2. Click "Continue with Google"
3. Sign in with a test Google account
4. Verify that:
   - Sign-in works
   - A student document is created in Firestore
   - User can access the lobby

### Test Questions

1. Add a few test questions with different `questionSetId` values
2. Start a game and select different modes
3. Verify that:
   - Questions appear in the game
   - Questions are filtered by the selected mode
   - Correct answers allow progress
   - Incorrect answers block actions

### Verify Security Rules

1. Try to access questions without authentication (should fail)
2. Try to modify another user's student document (should fail)
3. Verify users can only read/write their own data

---

## Step 8: Production Considerations

### Environment Variables

For production, consider using environment variables for Firebase config:

1. Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

2. Update `src/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### Database Indexes

If you add filters to queries later, you may need to create indexes:
1. Go to **Firestore Database** → **Indexes** tab
2. Click **"Create Index"** when prompted
3. Or create indexes proactively for common queries

### Monitoring

1. Set up **Firebase Performance Monitoring** (optional)
2. Enable **Error Reporting** (optional)
3. Monitor **Firestore Usage** in the console
4. Set up **Usage Alerts** to avoid unexpected charges

---

## Troubleshooting

### Common Issues

**1. Authentication not working**
- Check that Google Sign-In is enabled
- Verify authorized domains include your domain
- Check browser console for errors
- Verify Firebase config is correct

**2. Questions not appearing**
- Verify questions collection exists
- Check that questions have `questionSetId` field
- Verify security rules allow read access
- Check browser console for errors

**3. Student document not created**
- Check that user is authenticated
- Verify security rules allow create
- Check browser console for errors
- Verify Firestore is enabled

**4. Wrong questions showing**
- Verify `questionSetId` matches the selected mode
- Check that questions are filtered correctly
- Verify question document structure is correct

**5. Security rule errors**
- Test rules in Firebase Console → Firestore → Rules → Rules Playground
- Verify user is authenticated (`request.auth != null`)
- Check that user ID matches document ID

---

## Next Steps

1. **Add more questions** across all question sets
2. **Test all game modes** with different question sets
3. **Monitor usage** and adjust quotas if needed
4. **Set up backups** (Firestore has automatic backups)
5. **Consider implementing** leaderboard features
6. **Add question analytics** to track popular questions

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase Console logs
3. Check browser console for errors
4. Verify all steps were completed correctly
5. Consult Firebase documentation

---

**Last Updated:** 2024-01-20
**Version:** 2.0 (Updated for Question Sets & Mode Selection)