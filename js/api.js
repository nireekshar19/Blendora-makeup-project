
const API_BASE_URL = "https://blendora-makeup-project.onrender.com";

async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();

        console.log("Backend connection:", data.message);
        return data;
    } catch (error) {
        console.error("Backend connection failed:", error);
    }
}

checkBackend();
