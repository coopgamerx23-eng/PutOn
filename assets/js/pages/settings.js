function switchTab(event, tab) {
    // Remove active class from all buttons
    document.querySelectorAll('.posts-toggle button').forEach(btn => {
    btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // In a real app, you would load different content here
    console.log('Switched to:', tab);
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout-button");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("http://localhost:3000/logout", {
          method: "POST",
          credentials: "include", // important: send session cookie
        });

        const data = await response.json();

        if (data.success) {
          console.log("✅ Logged out successfully");
          // Redirect to sign-in or home page
          window.location.href = "/pages/homepage.html";
        } else {
          console.error("❌ Logout failed:", data.message);
          alert("Logout failed. Try again.");
        }
      } catch (err) {
        console.error("Error during logout:", err);
        alert("Error during logout. Please try again.");
      }
    });
  }
});