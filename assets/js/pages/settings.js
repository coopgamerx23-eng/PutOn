function switchTab(event, tab) {
    // Remove active class from all buttons
    document.querySelectorAll('.posts-toggle button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load content based on tab
    if (tab === 'posts') {
        loadUserPosts();
    } else {
        console.log('Switched to:', tab);
        // TODO: Implement other tabs (liked, saved, reposted)
    }
}

// Load user's posts
async function loadUserPosts() {
    const postsGrid = document.getElementById('postsGrid');
    
    try {
        const response = await fetch('/api/posts', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear existing posts but keep the add button
            postsGrid.innerHTML = '<div class="post-item add-post">+</div>';
            
            // Add user posts
            data.posts.forEach(post => {
                const postWrapper = document.createElement('div');
                postWrapper.className = 'post-item-wrapper';
                postWrapper.dataset.postUrl = post.url;
                
                postWrapper.innerHTML = `
                    <div class="canvas">
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                    </div>
                    <div class="post-item">
                        <img src="${post.url}" alt="${post.caption || 'User post'}">
                        <div class="post-overlay">
                            <button class="delete-post-btn" onclick="deletePost('${post.url}', this)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
                
                postsGrid.appendChild(postWrapper);
            });
            
            if (data.posts.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-posts-message';
                emptyMessage.innerHTML = `
                    <p>No posts yet</p>
                    <small>Click the + button to create your first post!</small>
                `;
                postsGrid.appendChild(emptyMessage);
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Delete a post - make it globally accessible
window.deletePost = async function(postUrl, button) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    // Extract filename from URL
    const filename = postUrl.split('/').pop();
    
    try {
        const response = await fetch(`/api/posts/${filename}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove the post from DOM
            const postWrapper = button.closest('.post-item-wrapper');
            postWrapper.style.transition = 'all 0.3s';
            postWrapper.style.opacity = '0';
            postWrapper.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                postWrapper.remove();
                
                // Check if there are any posts left
                const remainingPosts = document.querySelectorAll('.post-item-wrapper');
                if (remainingPosts.length === 0) {
                    const postsGrid = document.getElementById('postsGrid');
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-posts-message';
                    emptyMessage.innerHTML = `
                        <p>No posts yet</p>
                        <small>Click the + button to create your first post!</small>
                    `;
                    postsGrid.appendChild(emptyMessage);
                }
            }, 300);
        } else {
            alert('Failed to delete post: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Load user posts on page load
    loadUserPosts();
    
    const logoutBtn = document.querySelector(".logout-button");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                const response = await fetch("http://localhost:3000/logout", {
                    method: "POST",
                    credentials: "include",
                });

                const data = await response.json();

                if (data.success) {
                    console.log("✅ Logged out successfully");
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

    const addPost = document.querySelector(".add-post");
    if (addPost) {
        addPost.addEventListener("click", async () => {
            window.location.href = "/pages/new-post.html";
        });
    }

    const saveButton = document.querySelector(".save-button");
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const name = document.getElementById("display-name-input").value.trim();
            const username = document.getElementById("display-username-input").value.trim();
            const email = document.getElementById("display-email-input").value.trim();
            const bio = document.getElementById("display-bio-input").value.trim();
            const location = document.getElementById("display-location-input").value.trim();
            const birthday = document.getElementById("display-birthday-input").value.trim();
            const shirt_size = document.getElementById("display-shirt-size-input").value.trim();
            const shoe_size = document.getElementById("display-shoe-size-input").value.trim();
            const waist_size = document.getElementById("display-waist-size-input").value.trim();
            const inseam = document.getElementById("display-inseam-input").value.trim();
            const chest_size = document.getElementById("display-chest-size-input").value.trim();
            const height = document.getElementById("display-height-input").value.trim();
            const dark_mode = String(document.getElementById("dark-mode-switch").classList.contains("active"));
            const push_notifications = String(document.getElementById("push-notifications-switch").classList.contains("active"));
            const email_updates = String(document.getElementById("email-updates-switch").classList.contains("active"));
            const private_profile = String(document.getElementById("private-profile-switch").classList.contains("active"));
            const show_size_recommendations = String(document.getElementById("show-recommendations-switch").classList.contains("active"));
            const preferred_style = document.getElementById("display-preferred-style-input").value.trim();

            try {
                const res = await fetch("/update-user", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ 
                        name, username, email, bio, location, birthday, shirt_size, 
                        shoe_size, waist_size, inseam, chest_size, height,
                        dark_mode, push_notifications, email_updates,
                        private_profile, show_size_recommendations, preferred_style 
                    }),
                });

                const data = await res.json();

                if (data.success) {
                    document.querySelector(".profile-name").textContent = name;
                    document.querySelector(".profile-username").textContent = "@" + username;
                    
                    // Show success message
                    const saveBtn = document.querySelector(".save-button");
                    const originalText = saveBtn.textContent;
                    saveBtn.textContent = "✓ Saved!";
                    saveBtn.style.background = "rgba(46, 125, 50, 0.9)";
                    
                    setTimeout(() => {
                        saveBtn.textContent = originalText;
                        saveBtn.style.background = "";
                    }, 2000);
                } else {
                    alert("Failed to save changes: " + data.message);
                }
            } catch (err) {
                console.error("Error updating user:", err);
                alert("Error saving changes. Please try again.");
            }
        });
    }
});