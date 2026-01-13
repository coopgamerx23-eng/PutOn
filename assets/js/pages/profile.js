// Get userId from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const profileUserId = parseInt(urlParams.get('userId')) || null;

let currentUserId = null;
let currentTab = 'posts';
let currentEditingPost = null;
let allWardrobeItems = [];
let selectedWardrobeItemIds = [];
let selectedEditTags = {
  gender: [],
  style: [],
  season: []
};

// Check if user is logged in and get current user ID
async function checkCurrentUser() {
  try {
    const response = await fetch('/check-login', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.loggedIn) {
      currentUserId = parseInt(data.user.id) || null;
    }
  } catch (error) {
    console.error('Error checking login:', error);
  }
}

// Load profile data
async function loadProfile() {
  if (!profileUserId) {
    showError('No user ID provided');
    return;
  }

  try {
    const response = await fetch(`/api/profile/${profileUserId}`);
    const data = await response.json();

    if (!data.success) {
      showError('User not found');
      return;
    }

    const profile = data.profile;

    // Update profile info
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileUsername').textContent = `@${profile.username}`;
    document.getElementById('profileBio').textContent = profile.bio || '';
    document.getElementById('profileLocation').textContent = profile.location || '';
    
    // Update profile picture
    const profilePic = document.getElementById('profilePic');
    if (profile.profile_picture) {
      profilePic.src = profile.profile_picture;
    } else {
      profilePic.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2a7f62&color=fff&size=400`;
    }

    // Load follow counts
    const countsResponse = await fetch(`/api/follow-counts/${profileUserId}`);
    const counts = await countsResponse.json();
    
    if (counts.success) {
      document.getElementById('followingCount').textContent = counts.following || 0;
      document.getElementById('followersCount').textContent = counts.followers || 0;
      document.getElementById('postsCount').textContent = profile.postsCount || 0;
    }

    // Make stats clickable
    const stats = document.querySelectorAll('.stat');
    stats.forEach((stat, index) => {
      stat.style.cursor = 'pointer';
      stat.style.transition = 'all 0.3s ease';
      
      stat.addEventListener('mouseenter', () => {
        stat.style.transform = 'translateY(-2px)';
        stat.style.opacity = '0.8';
      });
      
      stat.addEventListener('mouseleave', () => {
        stat.style.transform = 'translateY(0)';
        stat.style.opacity = '1';
      });

      stat.addEventListener('click', () => {
        // First stat is Following, Second is Followers, Third is Posts
        if (index === 0) {
          window.location.href = `/pages/follow-page.html?userId=${profileUserId}&tab=following`;
        } else if (index === 1) {
          window.location.href = `/pages/follow-page.html?userId=${profileUserId}&tab=followers`;
        }
      });
    });

    // Show appropriate button (Follow or Edit Profile)
    if (currentUserId && currentUserId === profileUserId) {
      document.getElementById('editProfileBtn').style.display = 'block';
      document.getElementById('followBtn').style.display = 'none';
    } else {
      document.getElementById('editProfileBtn').style.display = 'none';
      const followBtn = document.getElementById('followBtn');
      followBtn.style.display = 'block';
      
      // Check if already following
      if (currentUserId) {
        const followStatusResponse = await fetch(`/api/follow-status/${profileUserId}`, {
          credentials: 'include'
        });
        const followStatus = await followStatusResponse.json();
        
        if (followStatus.success && followStatus.isFollowing) {
          followBtn.classList.add('following');
          followBtn.textContent = 'Following';
        }
      }
    }

    // Load posts
    loadPosts();
  } catch (error) {
    console.error('Error loading profile:', error);
    showError('Failed to load profile');
  }
}

// Load posts based on current tab
async function loadPosts() {
  const postsGrid = document.getElementById('postsGrid');
  
  postsGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading posts...</p>
    </div>
  `;

  try {
    let posts = [];

    if (currentTab === 'posts') {
      const response = await fetch(`/api/profile/${profileUserId}/posts`);
      const data = await response.json();
      if (data.success) {
        posts = data.posts;
      }
    } else if (currentTab === 'liked') {
      if (currentUserId == profileUserId) {
        const response = await fetch('/api/posts/liked', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          posts = data.posts.map(p => ({ url: p.post_url }));
        }
      }
    } else if (currentTab === 'saved') {
      if (currentUserId == profileUserId) {
        const response = await fetch('/api/posts/saved', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          posts = data.posts.map(p => ({ url: p.post_url }));
        }
      }
    } else if (currentTab === 'reposted') {
      if (currentUserId == profileUserId) {
        const response = await fetch('/api/posts/reposted', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          posts = data.posts.map(p => ({ url: p.post_url }));
        }
      }
    }

    displayPosts(posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    postsGrid.innerHTML = `
      <div class="empty-state">
        <h3>Error Loading Posts</h3>
        <p>Could not load posts. Please try again.</p>
      </div>
    `;
  }
}

// Display posts in grid
function displayPosts(posts) {
  const postsGrid = document.getElementById('postsGrid');

  if (posts.length === 0) {
    postsGrid.innerHTML = `
      <div class="empty-state">
        <h3>No Posts Yet</h3>
        <p>No posts to display.</p>
      </div>
    `;
    return;
  }

  // Check if viewing own profile and on posts tab
  const isOwnProfile = currentUserId && currentUserId === profileUserId;
  const showEditDelete = isOwnProfile && currentTab === 'posts';

  postsGrid.innerHTML = posts.map(post => `
    <div class="post-item">
      <img src="${post.url}" alt="Post" onerror="this.src='/assets/images/icons/placeholder.jpg'">
      <div class="post-item-overlay">
        <button class="view-post-btn" onclick="event.stopPropagation(); openViewModal('${post.url}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        ${showEditDelete ? `
          <button class="edit-post-btn" onclick="event.stopPropagation(); openEditModal('${post.url}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="delete-post-btn" onclick="event.stopPropagation(); deletePost('${post.url}', this)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

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
      
      // Reload posts to show updated data
      setTimeout(() => {
        loadPosts();
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
      showNotification('Post deleted successfully!', 'success');
      
      // Reload posts after a brief delay
      setTimeout(() => {
        loadPosts();
      }, 500);
    } else {
      alert('Failed to delete post: ' + data.message);
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Error deleting post. Please try again.');
  }
};

// Show error message
function showError(message) {
  const postsGrid = document.getElementById('postsGrid');
  postsGrid.innerHTML = `
    <div class="empty-state">
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
}

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

// Tab switching
document.querySelectorAll('.posts-toggle button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.posts-toggle button').forEach(btn => {
      btn.classList.remove('active');
    });

    e.target.classList.add('active');
    currentTab = e.target.dataset.tab;
    loadPosts();
  });
});

// Follow button handler
document.getElementById('followBtn').addEventListener('click', async function() {
  const isFollowing = this.classList.contains('following');
  const action = isFollowing ? 'unfollow' : 'follow';
  
  try {
    const response = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId: profileUserId, action })
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.classList.toggle('following');
      this.textContent = data.isFollowing ? 'Following' : 'Follow';
      
      // Update follower count
      const followersCountEl = document.getElementById('followersCount');
      const currentCount = parseInt(followersCountEl.textContent) || 0;
      followersCountEl.textContent = data.isFollowing ? currentCount + 1 : currentCount - 1;
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
  }
});

// Initialize edit modal handlers when DOM loads
document.addEventListener('DOMContentLoaded', () => {
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

// Initialize
(async () => {
  await checkCurrentUser();
  await loadProfile();
})();


window.openViewModal = async function(postUrl) {
  const modal = document.getElementById('viewPostModal');
  const modalBody = document.getElementById('viewModalBody');
  const postImage = document.getElementById('viewPostImage');
  
  modal.classList.add('active');
  modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  postImage.src = postUrl;
  
  try {
    // Load post data from images.json
    const response = await fetch('/data/images.json');
    const imagesData = await response.json();
    const postData = imagesData.find(img => img.url === postUrl);
    
    if (!postData) {
      throw new Error('Post not found');
    }
    
    // Get interaction stats
    let interactionStats = {
      likes: 0,
      reposts: 0,
      saves: 0
    };
    
    try {
      const encodedUrl = encodeURIComponent(postUrl);
      const statsResponse = await fetch(`/api/posts/interactions/${encodedUrl}`, {
        credentials: 'include'
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        interactionStats = {
          likes: statsData.likes || 0,
          reposts: statsData.reposts || 0,
          saves: statsData.saves || 0
        };
      }
    } catch (error) {
      console.log('Could not load interaction stats');
    }
    
    // Build modal content
    let content = '';
    
    // Caption section
    if (postData.caption) {
      content += `
        <div class="view-post-section">
          <h4>Caption</h4>
          <p class="view-post-caption">${escapeHtml(postData.caption)}</p>
        </div>
      `;
    }
    
    // Tags section
    const allTags = [
      ...(postData.Gender || []),
      ...(postData.Style || []),
      ...(postData.Season || [])
    ];
    
    if (allTags.length > 0) {
      content += `
        <div class="view-post-section">
          <h4>Tags</h4>
          <div class="view-post-tags">
            ${allTags.map(tag => `<span class="view-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    // Wardrobe items section
    if (postData.wardrobeItems && postData.wardrobeItems.length > 0) {
      content += `
        <div class="view-post-section">
          <h4>Tagged Items (${postData.wardrobeItems.length})</h4>
          <div class="view-wardrobe-grid">
            ${postData.wardrobeItems.map(item => `
              <div class="view-wardrobe-item">
                <img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.src='/assets/images/icons/placeholder.jpg'">
                <div class="view-wardrobe-info">
                  <div class="view-wardrobe-name">${escapeHtml(item.name)}</div>
                  <div class="view-wardrobe-details">
                    ${item.brand ? escapeHtml(item.brand) : ''} ${item.color ? '• ' + escapeHtml(item.color) : ''}
                    ${item.size ? '• ' + escapeHtml(item.size) : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Stats section
    content += `
      <div class="view-post-section">
        <h4>Engagement</h4>
        <div class="view-post-stats">
          <div class="view-stat-item">
            <span class="view-stat-value">${interactionStats.likes}</span>
            <span class="view-stat-label">Likes</span>
          </div>
          <div class="view-stat-item">
            <span class="view-stat-value">${interactionStats.reposts}</span>
            <span class="view-stat-label">Reposts</span>
          </div>
          <div class="view-stat-item">
            <span class="view-stat-value">${interactionStats.saves}</span>
            <span class="view-stat-label">Saves</span>
          </div>
        </div>
      </div>
    `;
    
    // Posted by section
    if (postData.userName) {
      content += `
        <div class="view-post-section">
          <h4>Posted By</h4>
          <p class="view-post-caption">@${escapeHtml(postData.userName)}</p>
        </div>
      `;
    }
    
    // Timestamp
    if (postData.timestamp) {
      const date = new Date(postData.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      content += `
        <div class="view-post-section">
          <h4>Posted On</h4>
          <p class="view-post-caption">${formattedDate}</p>
        </div>
      `;
    }
    
    modalBody.innerHTML = content || '<div class="empty-view-state"><p>No details available</p></div>';
    
  } catch (error) {
    console.error('Error loading post details:', error);
    modalBody.innerHTML = `
      <div class="empty-view-state">
        <h3>Error Loading Post</h3>
        <p>Could not load post details. Please try again.</p>
      </div>
    `;
  }
};

// Close view modal
window.closeViewModal = function() {
  const modal = document.getElementById('viewPostModal');
  modal.classList.remove('active');
};

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}