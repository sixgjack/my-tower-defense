# Quick Start Guide - Google OAuth Setup

## ✅ Credentials Configured

Your Google OAuth credentials have been set up:
- **Client ID**: `853641374592-pals90c6l8pek49hoqjm7qkt63pd3b8u.apps.googleusercontent.com`
- **API Key**: `AIzaSyDgXndlZJtWr1mjGZ97Spl943vddK8xjuQ`

## 🚀 Start Testing

### Step 1: Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5173` (or port 5174 if 5173 is busy)

### Step 2: Configure Google Cloud Console

**IMPORTANT:** Before testing, you need to add your domain to Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:5174` (if using that port)
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173`
   - `http://localhost:5174` (if using that port)
6. Click **Save**
7. Wait 1-2 minutes for changes to propagate

### Step 3: Test Sign-In

1. Open `http://localhost:5173` in your browser
2. Click **"CONTINUE WITH GOOGLE"**
3. Select your Google account
4. Grant permissions
5. You should see your profile!

### Step 4: Verify Database

1. Open browser DevTools (F12)
2. Go to **Application** → **IndexedDB**
3. Check `tower-defense-db` database
4. You should see tables: `questions`, `students`, `question_sets`

## 🧪 Test in Browser Console

Open browser console and run:

```javascript
// Test OAuth
import { testOAuth } from './src/utils/testOAuth';
testOAuth();

// Test Database
import { testDatabase } from './src/utils/testDatabase';
testDatabase();
```

## ⚠️ Common Issues

### "Unauthorized domain" error
- **Fix**: Add `http://localhost:5173` to Authorized JavaScript origins in Google Cloud Console
- Wait 1-2 minutes after saving

### "Google Client ID not configured"
- **Fix**: Make sure `.env` file exists in project root
- Restart dev server after creating `.env`

### Sign-in popup blocked
- **Fix**: Allow popups for localhost
- Try in incognito mode

## 📝 Next Steps

1. ✅ Test sign-in works
2. ✅ Add questions via Admin Panel
3. ✅ Play a game and verify questions load
4. ✅ Check that stats save after game ends
5. ✅ Verify data persists after refresh

## 🔍 Verify Setup

Check these files exist:
- ✅ `.env` (with your credentials)
- ✅ `src/services/googleAuth.ts`
- ✅ `src/services/postgresDatabase.ts`

Check these are working:
- ✅ Dev server runs without errors
- ✅ Google sign-in button appears
- ✅ No console errors about missing Client ID
