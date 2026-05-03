# Google OAuth Setup Guide

This guide will help you set up Google OAuth for direct authentication (replacing Firebase Auth).

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: **Tower Defense Game**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Add `openid`, `email`, `profile`
   - Click **Save and Continue**
   - Test users: Add your email (if using External)
   - Click **Save and Continue**

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Tower Defense Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - Click **Create**

7. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

## Step 2: Configure Environment Variables

1. Create a `.env` file in the project root (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Add your Google Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

3. (Optional) For Google Drive backup feature, also add:
   ```env
   VITE_GOOGLE_API_KEY=your-api-key-here
   ```

## Step 3: Enable Google APIs (Optional - for Drive backup)

If you want to use the Google Drive backup feature:

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google Drive API**
   - **Google Identity Services API**

## Step 4: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Click "Continue with Google"
4. You should see the Google sign-in popup
5. After signing in, you should be redirected to the lobby

## Troubleshooting

### Error: "Google Client ID not configured"
- Make sure you created a `.env` file with `VITE_GOOGLE_CLIENT_ID`
- Restart the dev server after adding environment variables

### Error: "Unauthorized domain"
- Make sure your domain is added to **Authorized JavaScript origins** in Google Cloud Console
- For localhost, use `http://localhost:5173` (or your Vite port)

### Error: "Redirect URI mismatch"
- Make sure the redirect URI in Google Cloud Console matches exactly
- Check that you're using `http://` for localhost (not `https://`)

### Sign-in popup doesn't appear
- Check browser console for errors
- Make sure Google Identity Services script loads (check Network tab)
- Verify your Client ID is correct

## Security Notes

- Never commit your `.env` file to version control
- The Client ID is safe to expose in frontend code (it's public)
- For production, make sure to add your production domain to authorized origins
- Consider using environment-specific Client IDs for dev/prod

## Migration from Firebase Auth

The new OAuth system:
- ✅ Uses direct Google OAuth (no Firebase dependency)
- ✅ Stores user data in PostgreSQL (local database)
- ✅ Maintains same user experience
- ✅ Compatible with existing student status system

No data migration needed - student status is stored in PostgreSQL and will work with the new auth system.
