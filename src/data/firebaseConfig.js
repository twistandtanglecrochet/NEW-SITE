// The Firebase project's public client config. This is not a secret — it's
// meant to be visible in the browser (real protection comes from Firestore's
// security rules, not from hiding this). It's kept in its own plain file
// (no Firebase SDK calls here) so both src/firebase.js *and* the build-time
// script (scripts/generate-seo.mjs, run by plain Node, not Vite) can read
// the project ID without pulling in the whole Firebase SDK.
//
// public/admin.html is a standalone static page outside this build, so it
// necessarily keeps its own separate copy of this same config — if this
// project is ever moved to a different Firebase project, update it there too.
export const firebaseConfig = {
  apiKey: "AIzaSyDWU7UDR7Q0s9k1ZAfdiqmoupKoOAVHuC8",
  authDomain: "ttc1-e7b35.firebaseapp.com",
  projectId: "ttc1-e7b35",
  storageBucket: "ttc1-e7b35.firebasestorage.app",
  messagingSenderId: "351259501918",
  appId: "1:351259501918:web:e1dc45ea924f71e5a31bcf",
  measurementId: "G-J3C8GHWQ1X",
};
