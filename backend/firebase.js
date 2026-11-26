
const {
    initializeApp,
    cert,
    getApps
} = require("firebase-admin/app");

const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");

const localKeyPath = path.join(__dirname, "serviceAccountKey.json");
const renderKeyPath = "/etc/secrets/serviceAccountKey.json";

const keyPath = fs.existsSync(renderKeyPath)
    ? renderKeyPath
    : localKeyPath;

if (!fs.existsSync(keyPath)) {
    throw new Error("Firebase service account key not found!");
}

const serviceAccount = JSON.parse(
    fs.readFileSync(keyPath, "utf8")
);

const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount)
    });

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };
