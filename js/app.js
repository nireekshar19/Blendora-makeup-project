
/* =================================
   BLENDORA - MAIN APPLICATION
================================= */

// Run after the HTML page loads
document.addEventListener("DOMContentLoaded", function () {

    console.log("Welcome to Blendora!");

    // Smooth scrolling for navigation links
    const navigationLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    navigationLinks.forEach(function(link) {

        link.addEventListener("click", function(event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                event.preventDefault();

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // Update footer year automatically
    const yearElement = document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Display welcome message if available
    const welcomeElement = document.getElementById("welcomeMessage");

    const savedProfile = localStorage.getItem("blendoraProfile");

    if (welcomeElement && savedProfile) {

        try {
            const profile = JSON.parse(savedProfile);

            if (profile.name) {
                welcomeElement.textContent =
                    "Welcome, " + profile.name + "!";
            }

        } catch (error) {
            console.error("Unable to load customer profile:", error);
        }
    }

});


// Get current customer profile
function getCurrentProfile() {

    try {
        return JSON.parse(
            localStorage.getItem("blendoraProfile") || "null"
        );
    } catch (error) {
        console.error("Profile loading error:", error);
        return null;
    }
}


// Display notification message
function showMessage(message, elementId) {

    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = message;
    }
}


// Format Indian currency
function formatPrice(price) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(price) || 0);

}
