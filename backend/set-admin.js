
const { db } = require("./firebase");

const ADMIN_UID = "8iFiWwkfEaeoYsQOCFypndPCk5y1";

async function setAdmin() {
    await db.collection("users").doc(ADMIN_UID).update({
        role: "superadmin",
        status: "active"
    });

    console.log("Super Admin role assigned successfully!");
    process.exit(0);
}

setAdmin().catch(error => {
    console.error(error);
    process.exit(1);
});
