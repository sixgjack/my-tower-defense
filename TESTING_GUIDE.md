# Testing Guide - Google OAuth & PostgreSQL

## Quick Setup Checklist

✅ **Environment Variables Configured**
- Client ID: `853641374592-pals90c6l8pek49hoqjm7qkt63pd3b8u.apps.googleusercontent.com`
- API Key: `AIzaSyDgXndlZJtWr1mjGZ97Spl943vddK8xjuQ`
- Stored in `.env` file

## Testing Steps

### 1. Start the Development Server

```bash
npm run dev
```

The server should start on `http://localhost:5173`

### 2. Test Google OAuth Sign-In

1. Open `http://localhost:5173` in your browser
2. Click **"CONTINUE WITH GOOGLE"** button
3. A Google sign-in popup should appear
4. Select your Google account
5. Grant permissions if prompted
6. You should be redirected back and see your user profile

### 3. Test Database Operations

Open browser console and run:

```javascript
// Test database
import { testDatabase } from './src/utils/testDatabase';
testDatabase();

// Test OAuth
import { testOAuth } from './src/utils/testOAuth';
testOAuth();
```

### 4. Test Full Flow

1. **Sign In** → Should see your profile
2. **Enter Lobby** → Should load your stats
3. **Start Combat** → Should load questions from PostgreSQL
4. **Play Game** → Questions should appear when building towers
5. **Game End** → Stats should update in PostgreSQL
6. **Check Stats** → Should persist after refresh

### 5. Verify PostgreSQL Database

Open browser DevTools → Application → IndexedDB → `tower-defense-db`

You should see:
- `questions` table
- `students` table  
- `question_sets` table

## Common Issues & Solutions

### Issue: "Google Client ID not configured"
**Solution:** 
- Check that `.env` file exists in project root
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Restart dev server after creating `.env`

### Issue: "Unauthorized domain"
**Solution:**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to **APIs & Services** → **Credentials**
- Edit your OAuth 2.0 Client ID
- Add `http://localhost:5173` to **Authorized JavaScript origins**
- Add `http://localhost:5173` to **Authorized redirect URIs**
- Save and wait 1-2 minutes for changes to propagate

### Issue: Sign-in popup doesn't appear
**Solution:**
- Check browser console for errors
- Verify Google Identity Services script loads (Network tab)
- Make sure popup blocker is disabled
- Try in incognito mode

### Issue: "Failed to fetch user info"
**Solution:**
- Check that OAuth consent screen is configured
- Verify scopes include `openid`, `email`, `profile`
- Check browser console for detailed error

### Issue: Database not initializing
**Solution:**
- Check browser console for errors
- Verify IndexedDB is enabled in browser
- Try clearing browser data and retry
- Check that PGlite package is installed: `npm list @electric-sql/pglite`

## Expected Behavior

### After Sign-In:
- ✅ User profile displayed with name and email
- ✅ Student status loaded from PostgreSQL
- ✅ Can enter lobby
- ✅ Stats displayed correctly

### In Game:
- ✅ Questions load from PostgreSQL
- ✅ Questions filtered by question set
- ✅ Game progress saves to PostgreSQL
- ✅ Credits update correctly

### After Game:
- ✅ Stats update in PostgreSQL
- ✅ Credits earned calculated correctly
- ✅ Highest wave updated if new record
- ✅ Data persists after page refresh

## Manual Database Inspection

To inspect the PostgreSQL database:

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB**
4. Click on `tower-defense-db`
5. Browse tables:
   - `questions` - All question data
   - `students` - Student status data
   - `question_sets` - Question set metadata

## Testing Checklist

- [ ] Google OAuth sign-in works
- [ ] User profile displays correctly
- [ ] Student status loads from PostgreSQL
- [ ] Questions load in game
- [ ] Game stats save after game ends
- [ ] Data persists after page refresh
- [ ] Lucky draw uses PostgreSQL
- [ ] Admin panel can add questions to PostgreSQL
- [ ] No console errors related to auth or database

## Next Steps After Testing

Once everything works:
1. Add questions via Admin Panel
2. Test different question sets
3. Test Google Drive backup (optional)
4. Deploy to production with production OAuth credentials
