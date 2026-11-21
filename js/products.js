
/* BLENDORA - FIREBASE CONFIGURATION */

/*
  Replace the placeholder values with your Firebase
  project's actual configuration.

  Add Firebase compat SDK scripts before this file
  in the HTML pages that use Firebase.
*/

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (typeof firebase !== "undefined") {

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    window.blendoraAuth = firebase.auth();
    window.blendoraDatabase = firebase.firestore();

    console.log("Blendora Firebase initialized.");

} else {
    console.warn(
        "Firebase SDK not loaded. Firebase features are unavailable."
    );
}
