import { showDropdown } from "./dropdown.js"
import { hideDropdownWithDelay } from "./dropdown.js"

const params = new URLSearchParams(window.location.search);
const msg = params.get('msg');
const messageElement = document.querySelector(".message");

if (messageElement) {
if (msg === 'registered') messageElement.textContent = "✅ Account created! You can log in now.";
else if (msg === 'userexists') messageElement.textContent = "⚠️ That username already exists.";
else if (msg === 'invalid') messageElement.textContent = "❌ Invalid username or password.";
}

// --- Check if user is logged in ---
document.addEventListener("base:ready", async() => {
    fetch("/check-login", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) {
            // Prevent dropdown from appearing on hover
            console.log("Logged in");
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
            });
            userButton.addEventListener("mouseleave", () => {
                userButton.style.transform = 'scale(1)';
            });
            try {
                document.querySelector(".profile-name").textContent = data.user.name;
                document.getElementById("display-name-input").value = data.user.name;
                document.querySelector(".profile-username").textContent = "@"+data.user.username;
                document.getElementById("display-username-input").value = data.user.username;
                document.getElementById("display-email-input").value = data.user.email;
                document.getElementById("display-bio-input").value = data.user.bio;
                document.getElementById("display-location-input").value = data.user.location;
                document.getElementById("display-birthday-input").value = data.user.birthday;
                document.getElementById("display-shirt-size-input").value = data.user.shirt_size;
                document.getElementById("display-shoe-size-input").value = data.user.shoe_size;
                document.getElementById("display-waist-size-input").value = data.user.waist_size;
                document.getElementById("display-inseam-input").value = data.user.inseam;
                document.getElementById("display-chest-size-input").value = data.user.chest_size;
                document.getElementById("display-height-input").value = data.user.height;
                if (data.user.dark_mode == "true") {
                    document.getElementById("dark-mode-switch").classList.add("active");
                } else {
                    document.getElementById("dark-mode-switch").classList.remove("active");
                } if (data.user.push_notifications == "true") {
                    document.getElementById("push-notifications-switch").classList.add("active");
                } else {
                    document.getElementById("push-notifications-switch").classList.remove("active");
                } if (data.user.email_updates == "true") {
                    document.getElementById("email-updates-switch").classList.add("active");
                } else {
                    document.getElementById("email-updates-switch").classList.remove("active");
                } if (data.user.private_profile == "true") {
                    document.getElementById("private-profile-switch").classList.add("active");
                } else {
                    document.getElementById("private-profile-switch").classList.remove("active");
                } if (data.user.show_size_recommendations == "true") {
                    document.getElementById("show-recommendations-switch").classList.add("active");
                } else {
                    document.getElementById("show-recommendations-switch").classList.remove("active");
                } if (data.user.hide_saved_content == "true") {
                    document.getElementById("hide-saved-switch").classList.add("active");
                } else {
                    document.getElementById("hide-saved-switch").classList.remove("active");
                } if (data.user.show_following == "true") {
                    document.getElementById("show-following-switch").classList.add("active");
                } else {
                    document.getElementById("show-following-switch").classList.remove("active");
                } if (data.user.show_followers == "true") {
                    document.getElementById("show-followers-switch").classList.add("active");
                } else {
                    document.getElementById("show-followers-switch").classList.remove("active");
                }
                document.getElementById("display-preferred-style-input").value = data.user.preferred_style;
                document.getElementById("display-language-input").value = data.user.language;
            } catch {
                // Nothing
            }
        } else {
            console.log("Don't welcome back");
        }
    })
    .catch(err => console.error("check-login failed:", err));
})