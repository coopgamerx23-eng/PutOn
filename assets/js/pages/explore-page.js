import loadImages, { resizeGridItem } from '/assets/js/components/load-images.js';

const pages = document.querySelectorAll(".page");
const underline = document.querySelector(".underline");

function moveUnderline(p) {
    const { offsetLeft, offsetWidth } = p;
    const newWidth = offsetWidth / 2;
    const newLeft = offsetLeft + (offsetWidth / 2) - (newWidth / 2);

    underline.style.width = newWidth + 'px';
    underline.style.left = newLeft + 'px';
    p.style.color = "black";
}

let imageElements = [];
const grid = document.querySelector(".grid");
const infoScreen = document.querySelector(".image-info-screen");
const mainImage = document.querySelector(".placeholder-img");
const backButton = document.querySelector(".back-button");

// Load the first page (small) by default
let currentPage = "fyp";
loadPageImages({ page: [currentPage] });

// Move underline to first page
moveUnderline(pages[0]);

pages.forEach((p, index) => {
    p.addEventListener("click", async () => {
        moveUnderline(p);

        pages.forEach(page => (page.style.color = "rgb(91, 89, 89)"));
        p.style.color = "black";

        // Pick the size based on which page index
        if (index === 0) currentPage = "fyp";
        else if (index === 1) currentPage = "friends";
        else if (index === 2) currentPage = "brandoftheday";
        else if (index === 3) currentPage = "following";
        else if (index === 4) currentPage = "trending";
        await loadPageImages({ page: [currentPage] });

        grid.style.display = "grid";
        infoScreen.style.display = "none";
        mainImage.style.display = "none";
        mainImage.src = "/assets/images/icons/placeholder.jpg";
    });
});

async function loadPageImages(selectedFilters) {
    const imageInfoScreen = document.querySelector(".image-info-screen");
    const placeholderImg = document.querySelector(".placeholder-img");
    const reel = document.querySelector(".image-reel");
    
    if (reel) reel.remove();
    placeholderImg.src = "/assets/images/icons/placeholder.jpg";
    imageInfoScreen.classList.remove("active");

    // Pass the filters object directly
    console.log(selectedFilters);
    imageElements = await loadImages(selectedFilters);

    imageElements.forEach((img) => {
        img.addEventListener("click", function () {
            grid.style.display = "none";
            infoScreen.style.display = "flex";
            mainImage.src = this.src;
            mainImage.style.display = "block";
        });
    });
}

backButton.addEventListener("click", function() {
    grid.style.display = "grid";
    infoScreen.style.display = "none";
    mainImage.style.display = "none";
    mainImage.src = "/assets/images/icons/placeholder.jpg";

    setTimeout(() => {
        imageElements.forEach(img => resizeGridItem(img));
    }, 50);
});

// Sidebar toggle
const filterToggle = document.getElementById('filterToggle');
const filterSidebar = document.querySelector('.filter-side-bar');
filterToggle.addEventListener('click', () => {
    filterSidebar.classList.toggle('collapsed');
    filterToggle.textContent = filterSidebar.classList.contains('collapsed') ? '→' : '←';
});

// Filters
const filters = document.querySelectorAll(".choice input");

filters.forEach((filter) => {
  filter.addEventListener("change", async () => {
    const selectedFilters = {page: [currentPage]}; // { Gender: ["Men"], Style: ["Streetwear", "Date night"], ... }

    filters.forEach((f) => {
      if (f.checked) {
        const category = f.closest(".choices").previousElementSibling.textContent.trim();
        const subCategory = f.nextElementSibling.textContent.trim();

        // Initialize array if first time
        if (!selectedFilters[category]) {
          selectedFilters[category] = [];
        }

        selectedFilters[category].push(subCategory);
      }
    });

    // Send object to loadPageImages
    await loadPageImages(selectedFilters);

    grid.style.display = "grid";
    infoScreen.style.display = "none";
    mainImage.style.display = "none";
    mainImage.src = "/assets/images/icons/placeholder.jpg";
  });
});


////////////////////////////////////////////////////////////
// Claude new code

// Format date to readable string
function formatPostDate(dateString) {
    if (!dateString) return 'Recently';
    
    const postDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Format as "Jan 15, 2024"
    return postDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

// Create post info HTML
function createPostInfoHTML(postData) {
    const { 
        caption = '', 
        timestamp = '', 
        userId = null,
        userName = 'Anonymous User',
        Gender = [], 
        Style = [], 
        Season = [],
        likes = 0,
        reposts = 0,
        saves = 0
    } = postData;
    
    // Get current user's interaction state (you'll need to track this in your app)
    const isLiked = checkIfLiked(postData.url);
    const isReposted = checkIfReposted(postData.url);
    const isSaved = checkIfSaved(postData.url);
    
    // Create tags HTML
    let tagsHTML = '';
    if (Gender.length > 0) {
        tagsHTML += Gender.map(tag => `<span class="post-tag gender">${tag}</span>`).join('');
    }
    if (Style.length > 0) {
        tagsHTML += Style.map(tag => `<span class="post-tag style">${tag}</span>`).join('');
    }
    if (Season.length > 0) {
        tagsHTML += Season.map(tag => `<span class="post-tag season">${tag}</span>`).join('');
    }
    
    return `
        <div class="post-info-section">
            <div class="post-header">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2a7f62&color=fff" 
                     alt="${userName}" 
                     class="post-author-avatar">
                <div class="post-author-info">
                    <h3 class="post-author-name">${userName}</h3>
                    <p class="post-date">${formatPostDate(timestamp)}</p>
                </div>
            </div>
            
            ${caption ? `<p class="post-caption">${caption}</p>` : ''}
            
            ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ''}
            
            <div class="post-stats">
                <div class="post-stat">
                    <strong>${likes || 0}</strong> likes
                </div>
                <div class="post-stat">
                    <strong>${reposts || 0}</strong> reposts
                </div>
                <div class="post-stat">
                    <strong>${saves || 0}</strong> saves
                </div>
            </div>
            
            <div class="post-interactions">
                <button class="interaction-btn ${isLiked ? 'liked' : ''}" 
                        onclick="toggleLike('${postData.url}', this)">
                    <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>Like</span>
                </button>
                
                <button class="interaction-btn ${isReposted ? 'reposted' : ''}" 
                        onclick="toggleRepost('${postData.url}', this)">
                    <svg viewBox="0 0 24 24">
                        <path d="M17 1l4 4-4 4"/>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <path d="M7 23l-4-4 4-4"/>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                    <span>Repost</span>
                </button>
                
                <button class="interaction-btn ${isSaved ? 'saved' : ''}" 
                        onclick="toggleSave('${postData.url}', this)">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Save</span>
                </button>
            </div>
        </div>
    `;
}

// Check interaction states (stored in localStorage for now)
function checkIfLiked(postUrl) {
    const liked = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    return liked.includes(postUrl);
}

function checkIfReposted(postUrl) {
    const reposted = JSON.parse(localStorage.getItem('repostedPosts') || '[]');
    return reposted.includes(postUrl);
}

function checkIfSaved(postUrl) {
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    return saved.includes(postUrl);
}

// Toggle like
window.toggleLike = async function(postUrl, button) {
    const liked = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    const index = liked.indexOf(postUrl);
    
    if (index > -1) {
        // Unlike
        liked.splice(index, 1);
        button.classList.remove('liked');
    } else {
        // Like
        liked.push(postUrl);
        button.classList.add('liked');
        
        // Add animation
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }
    
    localStorage.setItem('likedPosts', JSON.stringify(liked));
    
    // TODO: Send to backend
    try {
        await fetch('/api/posts/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ postUrl, action: index > -1 ? 'unlike' : 'like' })
        });
    } catch (error) {
        console.error('Error updating like:', error);
    }
};

// Toggle repost
window.toggleRepost = async function(postUrl, button) {
    const reposted = JSON.parse(localStorage.getItem('repostedPosts') || '[]');
    const index = reposted.indexOf(postUrl);
    
    if (index > -1) {
        // Unrepost
        reposted.splice(index, 1);
        button.classList.remove('reposted');
    } else {
        // Repost
        if (!confirm('Repost this to your profile?')) return;
        reposted.push(postUrl);
        button.classList.add('reposted');
    }
    
    localStorage.setItem('repostedPosts', JSON.stringify(reposted));
    
    // TODO: Send to backend
    try {
        await fetch('/api/posts/repost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ postUrl, action: index > -1 ? 'unrepost' : 'repost' })
        });
    } catch (error) {
        console.error('Error updating repost:', error);
    }
};

// Toggle save
window.toggleSave = async function(postUrl, button) {
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    const index = saved.indexOf(postUrl);
    
    if (index > -1) {
        // Unsave
        saved.splice(index, 1);
        button.classList.remove('saved');
    } else {
        // Save
        saved.push(postUrl);
        button.classList.add('saved');
        
        // Show feedback
        const span = button.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Saved!';
        setTimeout(() => {
            span.textContent = originalText;
        }, 1500);
    }
    
    localStorage.setItem('savedPosts', JSON.stringify(saved));
    
    // TODO: Send to backend
    try {
        await fetch('/api/posts/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ postUrl, action: index > -1 ? 'unsave' : 'save' })
        });
    } catch (error) {
        console.error('Error updating save:', error);
    }
};

// Usage: Call this when displaying post details
// Example in your existing code where you show the image-info-screen:
function showPostDetails(postData) {
    const clothingDetails = document.getElementById('clothingDetails');
    
    // Insert post info at the beginning
    const postInfoHTML = createPostInfoHTML(postData);
    
    // Clear existing content and add post info first
    clothingDetails.innerHTML = postInfoHTML;
    
    // Then add your existing clothing detection results below
    // ... your existing code to show clothing items ...
}