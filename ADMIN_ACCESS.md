# Admin Panel Access Guide

## Overview

The Admin Panel is a **hidden page** accessible only to authorized teachers. It is not visible in the student lobby and can only be accessed via a direct URL.

## Access URL

**Admin Panel URL:** `/admin`

Example: `http://localhost:5174/admin` or `https://yourdomain.com/admin`

## Teacher Authorization

### Current Authorization Method

Teachers are authorized using a **simple passcode system**. 

**Passcode:** `cpss-teacher`

### How It Works

1. Navigate to `/admin` URL
2. Enter the teacher passcode
3. If correct → Access granted (stored in session)
4. If incorrect → Access denied
5. Session expires when browser is closed

### Changing the Passcode

To change the passcode, edit `src/components/AdminLogin.tsx`:

```typescript
const TEACHER_PASSCODE = 'your-new-passcode';
```

**Security Note:** For production, consider:
- Using environment variables for the passcode
- Implementing more robust authentication (Firebase Auth, OAuth, etc.)
- Adding rate limiting to prevent brute force attacks

## Passcode Management

The current passcode is: **`cpss-teacher`**

### To Change the Passcode

1. Open `src/components/AdminLogin.tsx`
2. Find the `TEACHER_PASSCODE` constant
3. Update the value:
   ```typescript
   const TEACHER_PASSCODE = 'your-new-passcode';
   ```

### Using Environment Variables (Recommended for Production)

1. Create `.env.local`:
   ```env
   VITE_TEACHER_PASSCODE=cpss-teacher
   ```
2. Update `AdminLogin.tsx`:
   ```typescript
   const TEACHER_PASSCODE = import.meta.env.VITE_TEACHER_PASSCODE || 'cpss-teacher';
   ```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit passcode to public repositories**
   - Use environment variables for production
   - Add `.env.local` to `.gitignore`
   - Consider using a more secure authentication method for production

2. **Session Management**
   - Passcode authentication is stored in `sessionStorage`
   - Session expires when browser is closed
   - Clear session on sign out

3. **Restrict Firestore write access**
   - Only teachers should be able to write to questions collection
   - Update Firestore security rules:
   ```javascript
   match /questions/{questionId} {
     allow read: if request.auth != null;
     allow write: if false; // Only admins can write (set via Firebase Console)
   }
   ```

4. **For Production:**
   - Consider implementing Firebase Authentication with custom claims
   - Add rate limiting to prevent brute force attacks
   - Use HTTPS to protect passcode transmission
   - Consider implementing 2FA for additional security

## Usage

1. **Navigate to Admin URL:**
   - Go to `/admin` in your browser
   - Example: `http://localhost:5174/admin`

2. **Enter Passcode:**
   - Enter the teacher passcode: `cpss-teacher`
   - Click "Access Admin Panel"

3. **Access Denied:**
   - If passcode is incorrect, you'll see "Incorrect passcode"
   - Try again with the correct passcode

4. **Use Admin Panel:**
   - Bulk import questions
   - Add individual questions
   - View and manage all questions
   - Delete questions

5. **Sign Out:**
   - Click "Sign Out" button
   - Session is cleared and you'll need to enter passcode again

## Troubleshooting

### "Incorrect passcode" error
- Verify you're entering the correct passcode: `cpss-teacher`
- Check for typos (passcode is case-sensitive)
- Make sure there are no extra spaces before or after the passcode

### Can't access `/admin` page
- Verify URL is exactly `/admin`
- Check that `App.tsx` routing is correct
- Clear browser cache and try again

### Questions not importing
- Check Firestore security rules allow writes
- Verify question JSON format is correct
- Check browser console for errors
- Ensure user is authenticated

## Future Improvements

- [ ] Firebase Custom Claims integration
- [ ] Teacher management UI
- [ ] Activity logging
- [ ] Question analytics dashboard
- [ ] Bulk export questions
- [ ] Question validation preview

---

**Last Updated:** 2024-01-20
