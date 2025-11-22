document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.querySelector("#gallery");
    const imageInfoScreen = document.querySelector(".image-info-screen");
    const imageHalf = imageInfoScreen.querySelector(".image-half");
    const placeholderImg = imageInfoScreen.querySelector(".placeholder-img");
    const overlay = document.querySelector(".overlay");
    const clothingDetails = document.getElementById("clothingDetails");

    let images = [];
    let currentIndex = -1;
    let isScrolling = false;
    let reel = null;
    let currentItems = []; // Store current detected items
    let imagesData = []; // Store full image data from JSON

    // ========================================
    // POST INFO FUNCTIONS
    // ========================================
    
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
        
        return postDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    function createPostInfoOverlay(postData, interactionData = {}) {
        const { 
            caption = '', 
            timestamp = '', 
            userId = null,
            userName = 'Anonymous User',
            userProfilePic = null, // Add this
            Gender = [], 
            Style = [], 
            Season = []
        } = postData;
        
        const {
            likes = 0,
            reposts = 0,
            saves = 0,
            isLiked = false,
            isReposted = false,
            isSaved = false
        } = interactionData;
        
        // Use custom profile picture or fall back to generated avatar
        const profilePicSrc = userProfilePic 
            ? userProfilePic 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2a7f62&color=fff`;
        
        return `
            <div class="post-info-overlay" id="postInfoOverlay">  
                <p class="post-date-overlay">${formatPostDate(timestamp)}</p>

                <div class="post-author-wrapper" 
                    onclick="window.location.href='/pages/profile.html?userId=${userId}'" 
                    style="cursor: pointer; transition: opacity 0.2s ease;"
                    onmouseover="this.style.opacity='0.8'" 
                    onmouseout="this.style.opacity='1'">
                    <img src="${profilePicSrc}" 
                        alt="${userName}" 
                        class="post-author-avatar-overlay"
                        onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2a7f62&color=fff'">
                    <h3 class="post-author-name-overlay">${userName}</h3>
                </div>
                
                <div class="post-interactions-overlay">
                    <button class="interaction-btn-overlay ${isLiked ? 'liked' : ''}" 
                            onclick="event.stopPropagation(); toggleLike('${postData.url}', this)">
                        <svg viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span class="interaction-count-overlay">${likes}</span>
                    </button>
                    
                    <button class="interaction-btn-overlay ${isReposted ? 'reposted' : ''}" 
                            onclick="event.stopPropagation(); toggleRepost('${postData.url}', this)">
                        <svg viewBox="0 0 24 24">
                            <path d="M17 1l4 4-4 4"/>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                            <path d="M7 23l-4-4 4-4"/>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </svg>
                        <span class="interaction-count-overlay">${reposts}</span>
                    </button>
                    
                    <button class="interaction-btn-overlay ${isSaved ? 'saved' : ''}" 
                            onclick="event.stopPropagation(); toggleSave('${postData.url}', this)">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span class="interaction-count-overlay">${saves}</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Toggle post info collapse/expand
    window.togglePostInfo = function() {
        const overlay = document.getElementById('postInfoOverlay');
        if (overlay) {
            overlay.classList.toggle('collapsed');
        }
    };

    // Toggle like
    window.toggleLike = async function(postUrl, button) {
        try {
            const isLiked = button.classList.contains('liked');
            const action = isLiked ? 'unlike' : 'like';
            
            const response = await fetch('/api/posts/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postUrl, action })
            });
            
            const data = await response.json();
            
            if (data.success) {
                button.classList.toggle('liked');
                
                // Update count in overlay
                const countSpan = button.querySelector('.interaction-count-overlay');
                if (countSpan) {
                    countSpan.textContent = data.likes;
                }
                
                // Animation
                if (!isLiked) {
                    button.style.transform = 'scale(1.15) translateY(-2px)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 200);
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            showNotification('Please log in to like posts', 'error');
        }
    };

    // Toggle repost
    window.toggleRepost = async function(postUrl, button) {
        try {
            const isReposted = button.classList.contains('reposted');
            
            if (!isReposted && !confirm('Repost this to your profile?')) return;
            
            const action = isReposted ? 'unrepost' : 'repost';
            
            const response = await fetch('/api/posts/repost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postUrl, action })
            });
            
            const data = await response.json();
            
            if (data.success) {
                button.classList.toggle('reposted');
                
                // Update count in overlay
                const countSpan = button.querySelector('.interaction-count-overlay');
                if (countSpan) {
                    countSpan.textContent = data.reposts;
                }
                
                showNotification(isReposted ? 'Removed from reposts' : 'Reposted!');
            }
        } catch (error) {
            console.error('Error toggling repost:', error);
            showNotification('Please log in to repost', 'error');
        }
    };

    // Toggle save
    window.toggleSave = async function(postUrl, button) {
        try {
            const isSaved = button.classList.contains('saved');
            const action = isSaved ? 'unsave' : 'save';
            
            const response = await fetch('/api/posts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postUrl, action })
            });
            
            const data = await response.json();
            
            if (data.success) {
                button.classList.toggle('saved');
                
                // Update count in overlay
                const countSpan = button.querySelector('.interaction-count-overlay');
                if (countSpan) {
                    countSpan.textContent = data.saves;
                }
                
                showNotification(isSaved ? 'Removed from saved' : 'Saved!');
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            showNotification('Please log in to save posts', 'error');
        }
    };

    // ========================================
    // AI CLOTHING DETECTION FUNCTION
    // ========================================
    async function detectClothing(imageUrl, postData = {}) {
        // Fetch interaction data first
        let interactionData = {};
        try {
            const encodedUrl = encodeURIComponent(imageUrl);
            const response = await fetch(`/api/posts/interactions/${encodedUrl}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                interactionData = data;
            }
        } catch (error) {
            console.error('Error fetching interactions:', error);
        }

        // Add post info overlay to the image half (LEFT SIDE)
        const existingOverlay = imageHalf.querySelector('.post-info-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlayHTML = createPostInfoOverlay(postData, interactionData);
        imageHalf.insertAdjacentHTML('beforeend', overlayHTML);

        // Show loading state on right side (clothing details)
        clothingDetails.innerHTML = `
        <div class="ai-analyzing">
            <div class="spinner"></div>
            <span>Analyzing clothing items...</span>
        </div>
        `;

        try {
            const fullImageUrl = imageUrl.startsWith('http') 
                ? imageUrl 
                : window.location.origin + imageUrl;

            console.log('🔍 Sending image to AI:', fullImageUrl);

            const response = await fetch('http://localhost:3000/api/detect-clothing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: fullImageUrl })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Received detection results:', data);
            
            // Remove the loading spinner
            const spinner = clothingDetails.querySelector('.ai-analyzing');
            if (spinner) spinner.remove();
            
            if (data.success && data.items && data.items.length > 0) {
                currentItems = data.items;
                displayClothingItems(data.items);
            } else {
                currentItems = [];
                clothingDetails.innerHTML = `
                <h2>No Clothing Detected</h2>
                <p>No clothing items were identified in this image.</p>
                `;
            }
        } catch (error) {
            console.error('❌ Detection error:', error);
            currentItems = [];
            const spinner = clothingDetails.querySelector('.ai-analyzing');
            if (spinner) spinner.remove();
            clothingDetails.innerHTML = `
                <h2>Connection Error</h2>
                <p>Could not connect to the detection service.</p>
                <p style="color: #999; font-size: 12px;">Make sure the backend server is running on port 3000.</p>
                <p style="color: #999; font-size: 12px;">Error: ${error.message}</p>
            `;
        }
    }

    // Display detected clothing items in a grid layout
    function displayClothingItems(items) {
        let html = '<h2>Detected Clothing Items</h2>';
        
        if (items.length === 0) {
            html += '<p>No clothing items detected in this image.</p>';
        } else {
            html += '<div class="clothing-grid" id="clothingGrid">';
            items.forEach((item, index) => {
                html += `
                <div class="clothing-item" data-item-index="${index}">
                    <button class="expand-btn" data-index="${index}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 2L6 6M14 2L10 6M2 14L6 10M14 14L10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <div class="clothing-item-header">
                        <div class="clothing-item-content">
                            <h3>${item.type}</h3>
                            <p><strong>Item:</strong> ${item.name}</p>
                            <p class="brand"><strong>Brand:</strong> ${item.brand}</p>
                            <p><strong>Color:</strong> ${item.color}</p>
                            <p><strong>Size:</strong> ${item.size}</p>
                            <p class="price">${item.price}</p>
                            ${item.confidence ? `<p style="font-size: 11px; color: #999;">Confidence: ${item.confidence}%</p>` : ''}
                        </div>
                        <div class="clothing-item-image">
                            <img src="${item.image || '/assets/images/icons/placeholder.jpg'}" 
                                alt="${item.name}" 
                                onerror="this.src='/assets/images/icons/placeholder.jpg'">
                        </div>
                    </div>
                    <div class="expanded-content" style="display: none;">
                        <p><strong>Material:</strong> ${item.material || 'Cotton blend'}</p>
                        <p><strong>Condition:</strong> ${item.condition || 'New with tags'}</p>
                        <p><strong>Style Code:</strong> ${item.styleCode || 'N/A'}</p>
                        <p><strong>Description:</strong> ${item.description || 'A versatile piece perfect for any occasion.'}</p>
                        <div class="action-buttons">
                            <button class="btn-find-replacements" data-index="${index}">Find Replacements</button>
                            <button class="btn-add-wishlist" data-index="${index}">Add to Wishlist</button>
                            <button class="btn-add-pieces" data-index="${index}">Add to Your Pieces</button>
                        </div>
                    </div>
                </div>
                `;
            });
            html += '</div>';
        }

        html += `
        <div class="info-section">
            <h2>About This Detection</h2>
            <p>These items were detected using AI image recognition technology. Results may vary based on image quality.</p>
        </div>
        `;

        clothingDetails.innerHTML = html;
        
        // Add click handlers for expand buttons
        const expandBtns = clothingDetails.querySelectorAll('.expand-btn');
        expandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                toggleExpand(index);
            });
        });

        // Add click handlers for action buttons
        const findReplacementsBtns = clothingDetails.querySelectorAll('.btn-find-replacements');
        findReplacementsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                handleFindReplacements(currentItems[index]);
            });
        });

        const addPiecesBtns = clothingDetails.querySelectorAll('.btn-add-pieces');
        addPiecesBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                handleAddToPieces(currentItems[index], btn);
            });
        });

        const addWishlistBtns = clothingDetails.querySelectorAll('.btn-add-wishlist');
        addWishlistBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                handleAddWishlist(currentItems[index], btn);
            });
        });
    }

    function handleFindReplacements(item) {
        alert(`Finding replacements for ${item.name}...`);
    }

    async function handleAddToPieces(item, button) {
        try {
            const pieceData = {
                name: item.name || "Unnamed item",
                type: item.type || "Unknown",
                brand: item.brand || "",
                color: item.color || "",
                size: item.size || "",
                price: item.price || "",
                image: item.image || "",
                category: item.category || "misc",
                notes: item.notes || "",
                sourceImage: images[currentIndex]?.src || ""
            };

            const res = await fetch("http://localhost:3000/api/putons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(pieceData)
            });

            const text = await res.text();
            console.log("📥 Raw response (pieces):", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Invalid JSON response (probably HTML)");
            }

            if (data.success) {
                console.log("✅ Added to Your Pieces:", data);
                showNotification("Item added to Your Pieces!");

                const originalWidth = button.offsetWidth;
                const originalHeight = button.offsetHeight;

                button.textContent = "✓ Added!";
                button.style.background = "#4CAF50";
                button.style.width = `${originalWidth}px`;
                button.style.height = `${originalHeight}px`;
                button.disabled = true;

                setTimeout(() => {
                    button.textContent = "Add to Your Pieces";
                    button.style.background = "";
                    button.disabled = false;
                }, 2000);
            } else if (res.status === 401) {
                alert("Please log in to save pieces.");
            } else {
                console.error("❌ Failed to add piece:", data.message);
                showNotification("Failed to save piece.", "error");
            }

        } catch (err) {
            console.error("❌ Error adding piece:", err);
            showNotification("Error saving piece. Please try again.", "error");
        }
    }

    async function handleAddWishlist(item) {
        try {
            const wishlistItem = {
                name: item.name || "Unnamed item",
                type: item.type || "Unknown",
                brand: item.brand || "",
                color: item.color || "",
                size: item.size || "",
                price: item.price || "",
                image: item.image || "",
                category: item.category || "misc",
                notes: item.notes || ""
            };

            const res = await fetch("http://localhost:3000/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(wishlistItem),
                credentials: "include"
            });

            const text = await res.text();
            console.log("📥 Raw wishlist response:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Invalid JSON response (probably HTML)");
            }

            if (data.success) {
                console.log("✅ Added to wishlist:", data.item);
                alert("Added to wishlist!");
            } else if (res.status === 401) {
                alert("Please log in to add items to your wishlist.");
            } else {
                console.error("❌ Failed to add to wishlist:", data.message);
                alert("Error adding to wishlist.");
            }

        } catch (err) {
            console.error("❌ Error adding to wishlist:", err);
            alert("Error adding to wishlist.");
        }
    }

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

    function toggleExpand(index) {
        const clothingGrid = document.getElementById('clothingGrid');
        const allItems = clothingGrid.querySelectorAll('.clothing-item');
        const targetItem = clothingGrid.querySelector(`[data-item-index="${index}"]`);
        
        const isExpanded = targetItem.classList.contains('expanded');
        
        if (isExpanded) {
            targetItem.classList.remove('expanded');
            targetItem.querySelector('.expanded-content').style.display = 'none';
            
            allItems.forEach(item => {
                item.style.display = 'block';
            });
            
            clothingGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            allItems.forEach(item => {
                item.classList.remove('expanded');
                item.querySelector('.expanded-content').style.display = 'none';
            });
            
            targetItem.classList.add('expanded');
            targetItem.querySelector('.expanded-content').style.display = 'block';
            
            allItems.forEach(item => {
                if (item !== targetItem) {
                    item.style.display = 'none';
                }
            });
            
            clothingGrid.style.gridTemplateColumns = '1fr';
        }
    }

    // Get image data by URL
    function getImageData(imageUrl) {
        // Try to find matching image data from the loaded JSON
        const relativePath = imageUrl.replace(window.location.origin, '');
        return imagesData.find(img => img.url === relativePath) || {
            url: relativePath,
            caption: '',
            timestamp: '',
            userId: null,
            userName: 'Anonymous User',
            Gender: [],
            Style: [],
            Season: []
        };
    }

    // Load images data from JSON
    async function loadImagesData() {
        try {
            const response = await fetch('/data/images.json');
            imagesData = await response.json();
            console.log('✅ Loaded images data:', imagesData.length, 'images');
        } catch (error) {
            console.error('Error loading images data:', error);
            imagesData = [];
        }
    }

    // Initialize images data
    loadImagesData();

    // Wait for dynamically loaded images
    const observer = new MutationObserver(() => {
        images = Array.from(gallery.querySelectorAll("img"));
        images.forEach((img, index) => {
            img.addEventListener("click", () => openImage(index));
        });
    });
    observer.observe(gallery, { childList: true, subtree: true });

    // Fallback if images already exist
    setTimeout(() => {
        images = Array.from(gallery.querySelectorAll("img"));
        images.forEach((img, index) => {
            img.addEventListener("click", () => openImage(index));
        });
    }, 1000);

    function createReel() {
        reel = document.createElement('div');
        reel.className = 'image-reel';
        
        images.forEach((img, index) => {
            const reelImageContainer = document.createElement('div');
            reelImageContainer.className = 'reel-image';
            
            const reelImg = document.createElement('img');
            reelImg.src = img.src;
            
            reelImageContainer.appendChild(reelImg);
            reelImageContainer.style.top = `${index * 100}%`;
            reel.appendChild(reelImageContainer);
        });
        
        imageHalf.appendChild(reel);
        
        placeholderImg.style.opacity = '0';
        placeholderImg.style.pointerEvents = 'none';
    }

    function openImage(index) {
        if (!reel || reel.querySelectorAll(".reel-image").length !== images.length) {
            if (reel) reel.remove();
            createReel();
        }
        
        currentIndex = index;
        
        reel.style.transform = `translateY(-${currentIndex * 100}%)`;
        
        const reelImages = reel.querySelectorAll('.reel-image');
        reelImages.forEach((container, i) => {
            if (i === currentIndex) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
        
        // Get post data and run detection
        const postData = getImageData(images[currentIndex].src);
        detectClothing(images[currentIndex].src, postData);
        
        imageInfoScreen.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function showNextImage() {
        if (currentIndex < images.length - 1 && !isScrolling) {
            isScrolling = true;
            currentIndex++;
            
            const reelImages = reel.querySelectorAll('.reel-image');
            
            reelImages[currentIndex - 1].classList.remove('active');
            reelImages[currentIndex].classList.add('active');
            
            reel.style.transform = `translateY(-${currentIndex * 100}%)`;
            
            const postData = getImageData(images[currentIndex].src);
            detectClothing(images[currentIndex].src, postData);
            
            setTimeout(() => {
                isScrolling = false;
            }, 200);
        }
    }

    function showPrevImage() {
        if (currentIndex > 0 && !isScrolling) {
            isScrolling = true;
            currentIndex--;
            
            const reelImages = reel.querySelectorAll('.reel-image');
            
            reelImages[currentIndex + 1].classList.remove('active');
            reelImages[currentIndex].classList.add('active');
            
            reel.style.transform = `translateY(-${currentIndex * 100}%)`;
            
            const postData = getImageData(images[currentIndex].src);
            detectClothing(images[currentIndex].src, postData);
            
            setTimeout(() => {
                isScrolling = false;
            }, 200);
        }
    }

    // Scroll wheel navigation
    imageHalf.addEventListener("wheel", (e) => {
        if (!imageInfoScreen.classList.contains("active")) return;
        e.preventDefault();
        if (e.deltaY > 0) showNextImage();
        else if (e.deltaY < 0) showPrevImage();
    });

    // Arrow key navigation
    document.addEventListener("keydown", (e) => {
        if (!imageInfoScreen.classList.contains("active")) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") showNextImage();
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") showPrevImage();
    });
});