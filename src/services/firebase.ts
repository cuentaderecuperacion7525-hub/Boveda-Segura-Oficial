import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence noisy internal @firebase/firestore WebChannel transport fallback logs
// so offline/proxied preview environments don't trigger false runtime error alerts.
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

// Initialize Firebase App (singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific database ID and long-polling support
// to ensure stable communication behind Cloud Run proxies and mobile WebViews.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

/**
 * Validate Firestore readiness safely when online and authenticated.
 * Avoids forcing unauthenticated server roundtrips on cold offline boot.
 */
export async function testFirestoreConnection() {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }
    if (!auth.currentUser) {
      return;
    }
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('connection timeout')), 3500)
    );
    await Promise.race([
      getDoc(doc(db, 'users', auth.currentUser.uid)),
      timeoutPromise,
    ]);
  } catch {
    // Gracefully operate in local/offline mode without throwing
  }
}

