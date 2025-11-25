// Show all posts function - Updated to navigate to new page
window.showAllPosts = async function(tab) {
    console.log('showAllPosts called with tab:', tab);
    
    try {
        const response = await fetch('/check-login', { credentials: 'include' });
        const data = await response.json();
        
        if (data.loggedIn && data.user) {
            window.location.href = `/pages/profile.html?userId=${data.user.id}`;
        } else {
            window.location.href = '/pages/homepage.html'; // Redirect to login if not logged in
        }
    } catch (error) {
        console.error('Error getting user ID:', error);
        window.location.href = '/pages/homepage.html';
    }
};

// Profile Picture Upload Handler
const profilePicInput = document.getElementById('profilePicInput');
const profilePicImg = document.getElementById('settingsProfilePic');
const removeBtn = document.getElementById('removeProfilePicBtn');

let currentUser = null;

// Handle profile picture upload
if (profilePicInput) {
    profilePicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const container = document.querySelector('.profile-pic-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'upload-progress';
        loadingDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: #2a7f62;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        container.appendChild(loadingDiv);

        try {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await fetch('/api/profile/upload-picture', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                profilePicImg.src = data.profilePicture + '?t=' + Date.now();
                if (removeBtn) removeBtn.style.display = 'block';
                showNotification('Profile picture updated!', 'success');
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Failed to upload profile picture', 'error');
        } finally {
            loadingDiv.remove();
            profilePicInput.value = '';
        }
    });
}

// Handle remove profile picture
if (removeBtn) {
    removeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Remove your profile picture?')) return;

        try {
            const response = await fetch('/api/profile/delete-picture', {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                const userName = currentUser?.name || 'User';
                profilePicImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2a7f62&color=fff&size=400`;
                removeBtn.style.display = 'none';
                showNotification('Profile picture removed', 'success');
            } else {
                throw new Error(data.message || 'Remove failed');
            }
        } catch (error) {
            console.error('Remove error:', error);
            showNotification('Failed to remove profile picture', 'error');
        }
    });
}

// Load user profile picture on page load
async function loadUserProfilePic() {
    try {
        const response = await fetch('/check-login', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.loggedIn) {
            currentUser = data.user;
            
            if (data.user.profile_picture) {
                profilePicImg.src = data.user.profile_picture + '?t=' + Date.now();
                if (removeBtn) removeBtn.style.display = 'block';
            } else {
                profilePicImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=2a7f62&color=fff&size=400`;
                if (removeBtn) removeBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading profile picture:', error);
    }
}

function switchTab(event, tab) {
    document.querySelectorAll('.posts-toggle button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    if (tab === 'posts') {
        loadUserPosts();
    } else if (tab === 'liked') {
        loadLikedPosts();
    } else if (tab === 'saved') {
        loadSavedPosts();
    } else if (tab === 'reposted') {
        loadRepostedPosts();
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
            postsGrid.innerHTML = '<div class="post-item add-post">+</div>';
            
            const postsToShow = data.posts.slice(0, 4);
            const hasMore = data.posts.length > 4;
            
            postsToShow.forEach(post => {
                const postWrapper = document.createElement('div');
                postWrapper.className = 'post-item-wrapper';
                postWrapper.dataset.postUrl = post.url;
                
                postWrapper.innerHTML = `
                    <div class="canvas" style="pointer-events: none;">
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                    </div>
                    <div class="post-item">
                        <img src="${post.url}" alt="${post.caption || 'User post'}">
                        <div class="post-overlay">
                            <button class="edit-post-btn" onclick="event.stopPropagation(); openEditModal('${post.url}')" style="background: rgba(33, 150, 243, 0.9); border: 2px solid white; color: white; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); margin-right: 12px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
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
            
            if (hasMore) {
                const seeMoreWrapper = document.createElement('div');
                seeMoreWrapper.className = 'post-item-wrapper';
                seeMoreWrapper.dataset.tab = 'posts';
                seeMoreWrapper.innerHTML = `
                    <div class="post-item see-more-btn" style="cursor: pointer; z-index: 300; position: relative;">
                        <div class="see-more-content">
                            <span class="dots">...</span>
                            <span class="see-more-text">See More</span>
                            <span class="post-count">+${data.posts.length - 4} posts</span>
                        </div>
                    </div>
                `;
                postsGrid.appendChild(seeMoreWrapper);
            }
            
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

// Load liked posts
async function loadLikedPosts() {
    const postsGrid = document.getElementById('postsGrid');
    postsGrid.innerHTML = '';
    
    try {
        const response = await fetch('/api/posts/liked', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.posts.length > 0) {
            const postsToShow = data.posts.slice(0, 5);
            const hasMore = data.posts.length > 5;
            
            postsToShow.forEach(post => {
                const postWrapper = document.createElement('div');
                postWrapper.className = 'post-item-wrapper';
                postWrapper.innerHTML = `
                    <div class="canvas" style="pointer-events: none;">
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                    </div>
                    <div class="post-item" onclick="window.location.href='/?view=${encodeURIComponent(post.post_url)}'" style="cursor: pointer;">
                        <img src="${post.post_url}" alt="Liked post">
                    </div>
                `;
                postsGrid.appendChild(postWrapper);
            });
            
            if (hasMore) {
                const seeMoreWrapper = document.createElement('div');
                seeMoreWrapper.className = 'post-item-wrapper';
                seeMoreWrapper.dataset.tab = 'liked';
                seeMoreWrapper.innerHTML = `
                    <div class="post-item see-more-btn" style="cursor: pointer; z-index: 300; position: relative;">
                        <div class="see-more-content">
                            <span class="dots">...</span>
                            <span class="see-more-text">See More</span>
                            <span class="post-count">+${data.posts.length - 5} posts</span>
                        </div>
                    </div>
                `;
                postsGrid.appendChild(seeMoreWrapper);
            }
        } else {
            postsGrid.innerHTML = '<div class="empty-posts-message"><p>No liked posts yet</p></div>';
        }
    } catch (error) {
        console.error('Error loading liked posts:', error);
    }
}

// Load saved posts
async function loadSavedPosts() {
    const postsGrid = document.getElementById('postsGrid');
    postsGrid.innerHTML = '';
    
    try {
        const response = await fetch('/api/posts/saved', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.posts.length > 0) {
            const postsToShow = data.posts.slice(0, 5);
            const hasMore = data.posts.length > 5;
            
            postsToShow.forEach(post => {
                const postWrapper = document.createElement('div');
                postWrapper.className = 'post-item-wrapper';
                postWrapper.innerHTML = `
                    <div class="canvas" style="pointer-events: none;">
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                    </div>
                    <div class="post-item" onclick="window.location.href='/?view=${encodeURIComponent(post.post_url)}'" style="cursor: pointer;">
                        <img src="${post.post_url}" alt="Saved post">
                    </div>
                `;
                postsGrid.appendChild(postWrapper);
            });
            
            if (hasMore) {
                const seeMoreWrapper = document.createElement('div');
                seeMoreWrapper.className = 'post-item-wrapper';
                seeMoreWrapper.dataset.tab = 'saved';
                seeMoreWrapper.innerHTML = `
                    <div class="post-item see-more-btn" style="cursor: pointer; z-index: 300; position: relative;">
                        <div class="see-more-content">
                            <span class="dots">...</span>
                            <span class="see-more-text">See More</span>
                            <span class="post-count">+${data.posts.length - 5} posts</span>
                        </div>
                    </div>
                `;
                postsGrid.appendChild(seeMoreWrapper);
            }
        } else {
            postsGrid.innerHTML = '<div class="empty-posts-message"><p>No saved posts yet</p></div>';
        }
    } catch (error) {
        console.error('Error loading saved posts:', error);
    }
}

// Load reposted posts
async function loadRepostedPosts() {
    const postsGrid = document.getElementById('postsGrid');
    postsGrid.innerHTML = '';
    
    try {
        const response = await fetch('/api/posts/reposted', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.posts.length > 0) {
            const postsToShow = data.posts.slice(0, 5);
            const hasMore = data.posts.length > 5;
            
            postsToShow.forEach(post => {
                const postWrapper = document.createElement('div');
                postWrapper.className = 'post-item-wrapper';
                postWrapper.innerHTML = `
                    <div class="canvas" style="pointer-events: none;">
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                        <div></div><div></div><div></div><div></div><div></div>
                    </div>
                    <div class="post-item" onclick="window.location.href='/?view=${encodeURIComponent(post.post_url)}'" style="cursor: pointer;">
                        <img src="${post.post_url}" alt="Reposted post">
                    </div>
                `;
                postsGrid.appendChild(postWrapper);
            });
            
            if (hasMore) {
                const seeMoreWrapper = document.createElement('div');
                seeMoreWrapper.className = 'post-item-wrapper';
                seeMoreWrapper.dataset.tab = 'reposted';
                seeMoreWrapper.innerHTML = `
                    <div class="post-item see-more-btn" style="cursor: pointer; z-index: 300; position: relative;">
                        <div class="see-more-content">
                            <span class="dots">...</span>
                            <span class="see-more-text">See More</span>
                            <span class="post-count">+${data.posts.length - 5} posts</span>
                        </div>
                    </div>
                `;
                postsGrid.appendChild(seeMoreWrapper);
            }
        } else {
            postsGrid.innerHTML = '<div class="empty-posts-message"><p>No reposted posts yet</p></div>';
        }
    } catch (error) {
        console.error('Error loading reposted posts:', error);
    }
}

// Delete a post
window.deletePost = async function(postUrl, button) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    const filename = postUrl.split('/').pop();
    
    try {
        const response = await fetch(`/api/posts/${filename}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            const postWrapper = button.closest('.post-item-wrapper');
            postWrapper.style.transition = 'all 0.3s';
            postWrapper.style.opacity = '0';
            postWrapper.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                postWrapper.remove();
                
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

// Notification helper
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    loadUserProfilePic();
    loadUserPosts();

    const viewProfileBtn = document.querySelector('.view-profile-btn');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', async (e) => {
            e.preventDefault();         
            try {
                const response = await fetch('/check-login', { credentials: 'include' });
                const data = await response.json();
                
                if (data.loggedIn && data.user) {
                    window.location.href = `/pages/profile.html?userId=${data.user.id}`;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
    
    // EVENT DELEGATION for posts grid clicks
    const postsGrid = document.getElementById("postsGrid");
    if (postsGrid) {
        postsGrid.addEventListener("click", (e) => {
            console.log('Click on grid:', e.target);
            
            // Check if See More button was clicked
            const seeMoreBtn = e.target.closest('.see-more-btn');
            if (seeMoreBtn) {
                console.log('🎯 See More clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                const wrapper = seeMoreBtn.closest('.post-item-wrapper');
                const tab = wrapper?.dataset.tab || 'posts';
                console.log('Navigating to tab:', tab);
                showAllPosts(tab);
                return;
            }
            
            // Check if add-post button was clicked
            if (e.target.closest(".add-post")) {
                window.location.href = "/pages/new-post.html";
            }
        });
    }
    
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
            
            const hide_saved_content = String(document.getElementById("hide-saved-switch").classList.contains("active"));
            const show_following = String(document.getElementById("show-following-switch").classList.contains("active"));
            const show_followers = String(document.getElementById("show-followers-switch").classList.contains("active"));
            const language = document.getElementById("display-language-input").value.trim();

            try {
                const res = await fetch("/update-user", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name, username, email, bio, location, birthday, shirt_size, 
                        shoe_size, waist_size, inseam, chest_size, height,
                        dark_mode, push_notifications, email_updates,
                        private_profile, show_size_recommendations, preferred_style,
                        hide_saved_content, show_following, show_followers, language
                    }),
                });

                const data = await res.json();

                if (data.success) {
                    const profileNameEl = document.querySelector(".profile-name");
                    const profileUsernameEl = document.querySelector(".profile-username");
                    if (profileNameEl) profileNameEl.textContent = name;
                    if (profileUsernameEl) profileUsernameEl.textContent = "@" + username;
                    
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

let currentEditingPost = null;
let allWardrobeItems = [];
let selectedWardrobeItemIds = [];
let selectedEditTags = {
    gender: [],
    style: [],
    season: []
};

// Open edit modal
window.openEditModal = async function(postUrl) {
    const modal = document.getElementById('editPostModal');
    const loading = document.getElementById('editLoading');
    const formContent = document.getElementById('editFormContent');
    
    modal.classList.add('active');
    loading.classList.add('active');
    formContent.style.display = 'none';
    
    try {
        // Load post data from images.json
        const response = await fetch('/data/images.json');
        const imagesData = await response.json();
        const postData = imagesData.find(img => img.url === postUrl);
        
        if (!postData) {
            throw new Error('Post not found');
        }
        
        currentEditingPost = postData;
        
        // Load wardrobe items
        const wardrobeResponse = await fetch('/api/wardrobe', {
            credentials: 'include'
        });
        const wardrobeData = await wardrobeResponse.json();
        
        if (wardrobeData.success) {
            allWardrobeItems = wardrobeData.items;
        }
        
        // Populate form
        document.getElementById('editPostImage').src = postData.url;
        document.getElementById('editCaption').value = postData.caption || '';
        
        // Set selected tags
        selectedEditTags = {
            gender: postData.Gender || [],
            style: postData.Style || [],
            season: postData.Season || []
        };
        
        // Set selected wardrobe items
        selectedWardrobeItemIds = (postData.wardrobeItems || []).map(item => item.id);
        
        // Update UI
        updateTagsUI();
        displayEditWardrobeItems();
        
        loading.classList.remove('active');
        formContent.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading post data:', error);
        alert('Failed to load post data');
        closeEditModal();
    }
};

// Close modal
window.closeEditModal = function() {
    const modal = document.getElementById('editPostModal');
    modal.classList.remove('active');
    currentEditingPost = null;
    selectedWardrobeItemIds = [];
    selectedEditTags = { gender: [], style: [], season: [] };
};

// Display wardrobe items
function displayEditWardrobeItems() {
    const grid = document.getElementById('editWardrobeGrid');
    
    if (allWardrobeItems.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No wardrobe items available</p>';
        return;
    }
    
    grid.innerHTML = allWardrobeItems.map(item => `
        <div class="wardrobe-item ${selectedWardrobeItemIds.includes(item.id) ? 'selected' : ''}" 
             data-id="${item.id}" 
             onclick="toggleWardrobeItemEdit(${item.id})">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='/assets/images/icons/placeholder.jpg'">
            <div class="wardrobe-item-name">${item.name}</div>
            <div class="check-mark">✓</div>
        </div>
    `).join('');
}

// Toggle wardrobe item selection
window.toggleWardrobeItemEdit = function(itemId) {
    const index = selectedWardrobeItemIds.indexOf(itemId);
    const itemElement = document.querySelector(`#editWardrobeGrid .wardrobe-item[data-id="${itemId}"]`);
    
    if (index > -1) {
        selectedWardrobeItemIds.splice(index, 1);
        itemElement.classList.remove('selected');
    } else {
        selectedWardrobeItemIds.push(itemId);
        itemElement.classList.add('selected');
    }
};

// Update tags UI
function updateTagsUI() {
    // Gender tags
    document.querySelectorAll('#editGenderTags .tag-option').forEach(tag => {
        const tagValue = tag.dataset.tag;
        if (selectedEditTags.gender.includes(tagValue)) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });
    
    // Style tags
    document.querySelectorAll('#editStyleTags .tag-option').forEach(tag => {
        const tagValue = tag.dataset.tag;
        if (selectedEditTags.style.includes(tagValue)) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });
    
    // Season tags
    document.querySelectorAll('#editSeasonTags .tag-option').forEach(tag => {
        const tagValue = tag.dataset.tag;
        if (selectedEditTags.season.includes(tagValue)) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });
}

// Initialize tag click handlers for edit modal
function initEditTagHandlers() {
    document.querySelectorAll('#editGenderTags .tag-option').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.dataset.tag;
            if (tag.classList.contains('selected')) {
                tag.classList.remove('selected');
                selectedEditTags.gender = selectedEditTags.gender.filter(t => t !== tagValue);
            } else {
                tag.classList.add('selected');
                selectedEditTags.gender.push(tagValue);
            }
        });
    });

    document.querySelectorAll('#editStyleTags .tag-option').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.dataset.tag;
            if (tag.classList.contains('selected')) {
                tag.classList.remove('selected');
                selectedEditTags.style = selectedEditTags.style.filter(t => t !== tagValue);
            } else {
                tag.classList.add('selected');
                selectedEditTags.style.push(tagValue);
            }
        });
    });

    document.querySelectorAll('#editSeasonTags .tag-option').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.dataset.tag;
            if (tag.classList.contains('selected')) {
                tag.classList.remove('selected');
                selectedEditTags.season = selectedEditTags.season.filter(t => t !== tagValue);
            } else {
                tag.classList.add('selected');
                selectedEditTags.season.push(tagValue);
            }
        });
    });
}

// Save post edit
window.savePostEdit = async function() {
    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const caption = document.getElementById('editCaption').value.trim();
        
        const response = await fetch('/api/posts/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                postUrl: currentEditingPost.url,
                caption: caption,
                gender: selectedEditTags.gender,
                style: selectedEditTags.style,
                season: selectedEditTags.season,
                wardrobeItemIds: selectedWardrobeItemIds
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Post updated successfully!', 'success');
            closeEditModal();
            
            // Reload the page to show updated data
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            throw new Error(data.message || 'Failed to update post');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showNotification('Failed to update post. Please try again.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
};

// Initialize edit modal handlers when DOM loads
const originalDOMContentLoaded = document.addEventListener;
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the modal HTML to be in the DOM
    setTimeout(() => {
        initEditTagHandlers();
        
        // Close modal when clicking outside
        const modal = document.getElementById('editPostModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeEditModal();
                }
            });
        }
    }, 100);
});