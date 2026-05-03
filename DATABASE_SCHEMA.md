# Database Schema Documentation

## Firebase Firestore Collections

### 1. `questions` Collection
Stores educational questions that appear during gameplay, organized by question sets (game modes).

**Document Structure:**
```typescript
{
  question: string;        // The question text
  options: string[];       // Array of answer options
  correct: string;         // The correct answer (must be one of the options)
  questionSetId: string;   // Question set identifier (e.g., 'math-basics', 'science-fundamentals', 'programming', 'advanced-math')
  difficulty?: string;     // Optional: difficulty level ('easy', 'medium', 'hard')
  category?: string;       // Optional: question category
  createdAt?: Timestamp;   // When the question was created
}
```

**Question Sets (Game Modes):**
- `math-basics`: Basic arithmetic and algebra questions
- `science-fundamentals`: Physics, chemistry, and biology basics
- `programming`: Coding concepts and logic questions
- `advanced-math`: Calculus, trigonometry, and complex equations
- `mixed`: Used when all questions should be available (for mixed challenge mode)

**Example:**
```json
{
  "question": "What is the time complexity of binary search?",
  "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
  "correct": "O(log n)",
  "questionSetId": "programming",
  "difficulty": "medium",
  "category": "algorithms",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### 2. `students` Collection
Stores student account information and game statistics.

**Document ID:** User's Firebase Auth UID

**Document Structure:**
```typescript
{
  // User Info (from Firebase Auth)
  email: string;                    // User's email
  displayName?: string;             // User's display name
  photoURL?: string;                // User's profile photo URL
  
  // Game Statistics
  totalGames: number;               // Total number of games played
  totalWaves: number;               // Total waves survived across all games
  totalEnemiesKilled: number;      // Total enemies defeated
  totalMoneyEarned: number;         // Total money earned across all games
  highestWave: number;             // Best wave reached in any game
  
  // Progression System
  credits: number;                  // Credits earned (can be used for unlocks)
  unlockedTowers: string[];         // Array of tower keys that are unlocked
  
  // Timestamps
  createdAt: Timestamp;            // When account was created
  lastPlayed: Timestamp;           // Last time user played
  updatedAt: Timestamp;            // Last time status was updated
}
```

**Example:**
```json
{
  "email": "student@example.com",
  "displayName": "John Doe",
  "photoURL": "https://...",
  "totalGames": 15,
  "totalWaves": 127,
  "totalEnemiesKilled": 3450,
  "totalMoneyEarned": 125000,
  "highestWave": 23,
  "credits": 1250,
  "unlockedTowers": ["ARCHER", "CANNON", "WIZARD"],
  "createdAt": "2024-01-15T10:00:00Z",
  "lastPlayed": "2024-01-20T15:30:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

---

### 3. `leaderboard` Collection (Future)
Stores leaderboard rankings.

**Document Structure:**
```typescript
{
  userId: string;                   // Reference to student document
  highestWave: number;             // Best wave reached
  totalEnemiesKilled: number;      // Total enemies killed
  rank: number;                    // Current rank
  updatedAt: Timestamp;            // Last update time
}
```

---

## Security Rules (Firestore)

Recommended Firestore security rules:

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
    
    // Leaderboard: Read for all, write only for own data
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Authentication

### Google SSO Setup
1. Enable Google Sign-In in Firebase Console
2. Add authorized domains in Firebase Authentication settings
3. Configure OAuth consent screen in Google Cloud Console

### User Flow
1. User clicks "Continue with Google"
2. Firebase handles OAuth flow
3. On first sign-in, create student document in `students` collection
4. On subsequent sign-ins, load existing student document

---

## Data Flow

### Game End Flow
1. Game ends → `GameOverModal` displays stats
2. User clicks "Back to Menu" → `onGameEnd` callback triggered
3. `MenuScreen` calls `updateStudentStatusAfterGame()`
4. Service updates Firestore document with:
   - Increment counters
   - Update highest wave if new record
   - Add credits based on money earned
   - Update `lastPlayed` timestamp
5. Reload student status to show updated stats

---

## Credits System

**Earning Credits:**
- 1 credit per 10 money earned in a game
- Formula: `creditsEarned = Math.floor(moneyEarned / 10)`

**Using Credits:**
- Unlock new towers (future feature)
- Lucky draw system (future feature)
- Purchase upgrades (future feature)

---

## Notes

- All timestamps use Firestore `serverTimestamp()` for consistency
- Student documents are created automatically on first sign-in
- Statistics are cumulative across all games
- Credits are persistent and never expire
