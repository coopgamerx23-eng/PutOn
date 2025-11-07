import { showDropdown } from "./dropdown.js"
import { hideDropdownWithDelay } from "./dropdown.js"


const form = document.getElementById("signup-form");

try {
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // prevent page reload


        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const res = await fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include"
            });


            const result = await res.json();


            if (result.success) {
                console.log("Signup successful!");
                // Hide side bar
                document.querySelector(".overlay").style.display = "none";
                document.querySelector(".create-account-page").style.display = "none";


                // Prevent dropdown from appearing on hover
                const userButton = document.getElementById('header-user-button');
                userButton.removeEventListener("mouseenter", showDropdown);
                userButton.removeEventListener("mouseleave", hideDropdownWithDelay);
                userButton.addEventListener("click", function() {
                    window.location.href = "/pages/account-settings.html";
                });
                userButton.addEventListener("mouseenter", () => {
                    userButton.style.transform = 'scale(1.3)';
                    userButton.style.paddingTop = '0';
                    userButton.style.paddingBottom = '0';
                })
                userButton.addEventListener("mouseleave", () => {
                    userButton.style.transform = 'scale(1)';
                })


                window.location.href = "/pages/user-preferences.html";


            } else {
                let message = result.message;
                console.log(message);
                if (message.includes("missing")) {
                    document.getElementById(message.split("missing ")[1]).classList.add("visible");
                }
                if (message.includes("invalid")) {
                    console.log(document.getElementById(message.split("invalid ")[1]));
                    document.getElementById(message.split("invalid ")[1]).focus();
                }
                if (message.includes("exists")) {
                    document.getElementById(message.split("exists ")[1]+"-existing").classList.add("visible");
                    document.getElementById(message.split("exists")[1]).focus();
                }
            }
        } catch (err) {
            console.error("Signup failed:", err);
        }
    });


    // Check user inputs
    const nameInput = document.getElementById("name");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPassInput = document.getElementById("confirm");


    const usernameReq = document.getElementById("username-requirements");
    const emailReq = document.getElementById("email-requirements");
    const passwordReq = document.getElementById("password-requirements");
    const confirmPassReq = document.getElementById("confirm-password-requirements");


    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    nameInput.addEventListener("input", () => {
        document.getElementById("name-required").classList.remove("visible");
    })


    usernameInput.addEventListener("input", () => {
        document.getElementById("username-required").classList.remove("visible");
        document.getElementById("username-existing").classList.remove("visible");
        if (usernameRegex.test(usernameInput.value)) {
            usernameReq.classList.add("valid");
        } else {
            usernameReq.classList.remove("valid");
        }
    });


    emailInput.addEventListener("input", () => {
        document.getElementById("email-required").classList.remove("visible");
        document.getElementById("email-existing").classList.remove("visible");
        if (emailRegex.test(emailInput.value)) {
            emailReq.classList.add("valid");
        } else {
            emailReq.classList.remove("valid");
        }
    });


    passwordInput.addEventListener("input", () => {
        document.getElementById("password-required").classList.remove("visible");
        if (passwordRegex.test(passwordInput.value)) {
            passwordReq.classList.add("valid");
        } else {
            passwordReq.classList.remove("valid");
        }
    });


    confirmPassInput.addEventListener("input", () => {
        document.getElementById("confirm-password-required").classList.remove("visible");
        if (confirmPassInput.value == passwordInput.value) {
            confirmPassReq.classList.add("valid");
        } else {
            confirmPassReq.classList.remove("valid");
        }
    })


    confirmPassInput.addEventListener("click", () => {
        document.getElementById("confirm-password-required").classList.remove("visible");
        if (confirmPassInput.value == passwordInput.value) {
            confirmPassReq.classList.add("valid");
        } else {
            confirmPassReq.classList.remove("valid");
        }
    })
} catch { /* Already logged in */ }