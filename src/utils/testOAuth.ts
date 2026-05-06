// src/utils/testOAuth.ts
// Test script for Google OAuth

import { initGoogleAuth, signInWithGoogle, getCurrentUser, isAuthenticated } from '../services/googleAuth';

export async function testOAuth() {
  console.log('🧪 Testing Google OAuth...\n');

  try {
    // Test 1: Initialize Google Auth
    console.log('Test 1: Initializing Google Auth...');
    await initGoogleAuth();
    console.log('✅ Google Auth initialized');

    // Test 2: Check if authenticated
    console.log('\nTest 2: Checking authentication status...');
    const authenticated = isAuthenticated();
    console.log(`✅ Is authenticated: ${authenticated}`);

    // Test 3: Get current user
    console.log('\nTest 3: Getting current user...');
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log('✅ Current user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      });
    } else {
      console.log('ℹ️  No user currently signed in');
    }

    // Test 4: Sign in (this will open a popup)
    console.log('\nTest 4: Attempting to sign in...');
    console.log('⚠️  This will open a Google sign-in popup');
    console.log('⚠️  Please sign in when prompted');
    
    const user = await signInWithGoogle();
    console.log('✅ Signed in successfully!');
    console.log('User:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    // Test 5: Verify user is stored
    console.log('\nTest 5: Verifying user storage...');
    const storedUser = getCurrentUser();
    if (storedUser && storedUser.uid === user.uid) {
      console.log('✅ User correctly stored and retrieved');
    } else {
      console.log('❌ User storage verification failed');
    }

    // Test 6: Sign out (optional - comment out if you want to stay signed in)
    // console.log('\nTest 6: Signing out...');
    // await signOut();
    // console.log('✅ Signed out successfully');

    console.log('\n🎉 OAuth tests completed!');
    return { success: true, user };
  } catch (error: any) {
    console.error('\n❌ OAuth test failed:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// Auto-run in browser console
if (typeof window !== 'undefined') {
  (window as any).testOAuth = testOAuth;
  console.log('💡 Run testOAuth() in the console to test Google OAuth');
}
