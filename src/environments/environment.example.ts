// Copy this file to environment.ts and environment.prod.ts (set production: true there)
// and fill in your Firebase project's config from:
// Firebase console → Project settings → Your apps → Web app → SDK setup and configuration.
// The real files are in .gitignore so your keys are never committed.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
