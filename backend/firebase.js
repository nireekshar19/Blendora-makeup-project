
const {
    initializeApp,
    cert,
    getApps
} = require("firebase-admin/app");

const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing!");
}

const serviceAccount = JSON.parse(serviceAccountJSON);

const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount)
    });

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };
