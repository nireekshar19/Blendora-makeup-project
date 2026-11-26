
/* =====================================
   BLENDORA - FIREBASE CONFIGURATION
===================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAzFguY77XumlEnJPAHso4D-4fyfCRrnzU",
    authDomain: "blendora-makeup.firebaseapp.com",
    projectId: "blendora-makeup",
    storageBucket: "blendora-makeup.firebasestorage.app",
    messagingSenderId: "908659870142",
    appId: "1:908659870142:web:3cc73ec7ab0316c97111ef",
    measurementId: "G-E9J4KRXNHB"
};

// Initialize Firebase
if (typeof firebase !== "undefined") {

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Firebase Authentication
    window.blendoraAuth = firebase.auth();

    // Firebase Firestore
    window.blendoraDatabase = firebase.firestore();

    console.log("Blendora Firebase initialized successfully!");

} else {
    console.error("Firebase SDK not loaded. Check Firebase scripts.");
}
