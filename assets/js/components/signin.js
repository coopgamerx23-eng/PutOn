  document.querySelector(".sign-in-button").addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("sign-in-email").value.trim();
    const password = document.getElementById("sign-in-password").value.trim();

    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 👈 important for sessions!
      body: JSON.stringify({ username, password }),
    });

    const data = await response.text();
    if (response.ok) {
        document.querySelector(".incorrect-sign-in-message").classList.remove("visible");
        window.location.href = "/pages/homepage.html"; // or wherever you want
    } else {
        document.querySelector(".incorrect-sign-in-message").classList.add("visible");
    }
  });