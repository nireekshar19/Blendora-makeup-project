
/* BLENDORA - AUTHENTICATION */

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    // Switch between login and signup
    const showSignup = document.getElementById("showSignup");
    const showLogin = document.getElementById("showLogin");

    if (showSignup && loginForm && signupForm) {
        showSignup.addEventListener("click", function () {
            loginForm.style.display = "none";
            signupForm.style.display = "block";
        });
    }

    if (showLogin && loginForm && signupForm) {
        showLogin.addEventListener("click", function () {
            signupForm.style.display = "none";
            loginForm.style.display = "block";
        });
    }

    // Signup using Firebase Authentication
    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("signupName")?.value.trim();
            const email = document.getElementById("signupEmail")?.value.trim();
            const password = document.getElementById("signupPassword")?.value;

            if (!name || !email || !password) {
                alert("Please fill in all required fields.");
                return;
            }

            if (!window.blendoraAuth) {
                alert("Firebase is not configured yet.");
                return;
            }

            try {
                const result = await window.blendoraAuth
                    .createUserWithEmailAndPassword(email, password);

                await result.user.updateProfile({
                    displayName: name
                });

                localStorage.setItem("blendoraProfile", JSON.stringify({
                    name: name,
                    email: email,
                    phone: "",
                    address: ""
                }));

                window.location.href = "index.html";

            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Login using Firebase Authentication
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("loginEmail")?.value.trim();
            const password = document.getElementById("loginPassword")?.value;

            if (!email || !password) {
                alert("Enter your email and password.");
                return;
            }

            if (!window.blendoraAuth) {
                alert("Firebase is not configured yet.");
                return;
            }

            try {
                const result = await window.blendoraAuth
                    .signInWithEmailAndPassword(email, password);

                const user = result.user;

                localStorage.setItem("blendoraProfile", JSON.stringify({
                    name: user.displayName || "",
                    email: user.email || "",
                    phone: "",
                    address: ""
                }));

                window.location.href = "index.html";

            } catch (error) {
                alert("Login failed: " + error.message);
            }
        });
    }

});
