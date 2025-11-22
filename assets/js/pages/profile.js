// Get userId from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const profileUserId = parseInt(urlParams.get('userId')) || null;

let currentUserId = null;
let currentTab = 'posts';

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

    // ... rest of your code ...

    // Show appropriate button (Follow or Edit Profile)
    if (currentUserId && currentUserId === profileUserId) { // ← Use strict equality
      // This is the current user's profile
      document.getElementById('editProfileBtn').style.display = 'block';
      document.getElementById('followBtn').style.display = 'none';
    } else {
      // This is someone else's profile
      document.getElementById('editProfileBtn').style.display = 'none';
      document.getElementById('followBtn').style.display = 'block';
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
      // Load user's posts
      const response = await fetch(`/api/profile/${profileUserId}/posts`);
      const data = await response.json();
      if (data.success) {
        posts = data.posts;
      }
    } else if (currentTab === 'liked') {
      // Load liked posts (only if viewing own profile)
      if (currentUserId == profileUserId) {
        const response = await fetch('/api/posts/liked', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          posts = data.posts.map(p => ({ url: p.post_url }));
        }
      }
    } else if (currentTab === 'saved') {
      // Load saved posts (only if viewing own profile)
      if (currentUserId == profileUserId) {
        const response = await fetch('/api/posts/saved', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          posts = data.posts.map(p => ({ url: p.post_url }));
        }
      }
    } else if (currentTab === 'reposted') {
      // Load reposted posts (only if viewing own profile)
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

  postsGrid.innerHTML = posts.map(post => `
    <div class="post-item" onclick="window.location.href='/?view=${encodeURIComponent(post.url)}'">
      <img src="${post.url}" alt="Post" onerror="this.src='/assets/images/icons/placeholder.jpg'">
    </div>
  `).join('');
}

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

// Tab switching
document.querySelectorAll('.posts-toggle button').forEach(button => {
  button.addEventListener('click', (e) => {
    // Remove active class from all buttons
    document.querySelectorAll('.posts-toggle button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active class to clicked button
    e.target.classList.add('active');

    // Update current tab
    currentTab = e.target.dataset.tab;

    // Load posts for new tab
    loadPosts();
  });
});

// Follow button handler
document.getElementById('followBtn').addEventListener('click', function() {
  this.classList.toggle('following');
  this.textContent = this.classList.contains('following') ? 'Following' : 'Follow';
  
  // TODO: Add API call to follow/unfollow user
});

// Initialize
(async () => {
  await checkCurrentUser();
  await loadProfile();
})();