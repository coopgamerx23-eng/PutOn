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

    // ========================================
    // STORAGE HELPER FUNCTIONS
    // ========================================
    function saveItemToYourPieces(item) {
        try {
            // Get existing items from localStorage
            const existingItems = JSON.parse(localStorage.getItem('yourPieces') || '[]');
            
            // Add unique ID and timestamp
            const itemToSave = {
                ...item,
                id: Date.now() + Math.random(), // Unique ID
                addedAt: new Date().toISOString(),
                sourceImage: images[currentIndex]?.src || ''
            };
            
            // Add to array
            existingItems.push(itemToSave);
            
            // Save back to localStorage
            localStorage.setItem('yourPieces', JSON.stringify(existingItems));
            
            console.log('✅ Item saved to Your Pieces:', itemToSave);
            return true;
        } catch (error) {
            console.error('❌ Error saving item:', error);
            return false;
        }
    }

    // function saveItemToPutOns(item) {
    //     try {
    //         // Get existing items from localStorage
    //         const existingItems = JSON.parse(localStorage.getItem('putOns') || '[]');
            
    //         // Add unique ID and timestamp
    //         const itemToSave = {
    //             ...item,
    //             id: Date.now() + Math.random(), // Unique ID
    //             addedAt: new Date().toISOString(),
    //             sourceImage: images[currentIndex]?.src || ''
    //         };
            
    //         // Add to array
    //         existingItems.push(itemToSave);
            
    //         // Save back to localStorage
    //         localStorage.setItem('putOns', JSON.stringify(existingItems));
            
    //         console.log('✅ Item saved to Put Ons:', itemToSave);
    //         return true;
    //     } catch (error) {
    //         console.error('❌ Error saving item:', error);
    //         return false;
    //     }
    // }

    // ========================================
    // AI CLOTHING DETECTION FUNCTION
    // ========================================
    async function detectClothing(imageUrl) {
        // Show loading state
        clothingDetails.innerHTML = `
        <div class="ai-analyzing">
            <div class="spinner"></div>
            <span>Analyzing clothing items...</span>
        </div>
        `;

        try {
            // Make sure URL is complete
            const fullImageUrl = imageUrl.startsWith('http') 
                ? imageUrl 
                : window.location.origin + imageUrl;

            console.log('🔍 Sending image to AI:', fullImageUrl);

            // Call our backend API
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
            
            if (data.success && data.items && data.items.length > 0) {
                currentItems = data.items; // Store items
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
        // Add your replacement finding logic here
    }

    async function handleAddToPieces(item, button) {
        try {
            // Build item data
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

            // Send to backend
            const res = await fetch("http://localhost:3000/api/putons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // keep session cookies
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
            // Build item data
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

            // ✅ Use full backend URL (change port if needed)
            const res = await fetch("http://localhost:3000/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(wishlistItem),

                // ✅ Include cookies (session)
                credentials: "include"
            });

            // ✅ Parse safely
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
        // Create notification element
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
        
        // Remove after 3 seconds
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
            // Collapse the item
            targetItem.classList.remove('expanded');
            targetItem.querySelector('.expanded-content').style.display = 'none';
            
            // Show all other items
            allItems.forEach(item => {
                item.style.display = 'block';
            });
            
            // Reset grid layout
            clothingGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            // Collapse all items first
            allItems.forEach(item => {
                item.classList.remove('expanded');
                item.querySelector('.expanded-content').style.display = 'none';
            });
            
            // Expand the target item
            targetItem.classList.add('expanded');
            targetItem.querySelector('.expanded-content').style.display = 'block';
            
            // Hide other items
            allItems.forEach(item => {
                if (item !== targetItem) {
                    item.style.display = 'none';
                }
            });
            
            // Make grid single column for expanded view
            clothingGrid.style.gridTemplateColumns = '1fr';
        }
    }

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
        
        // Create all image elements in the reel
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
        
        // Hide the original placeholder
        placeholderImg.style.opacity = '0';
        placeholderImg.style.pointerEvents = 'none';
    }

    function openImage(index) {
        if (!reel || reel.querySelectorAll(".reel-image").length !== images.length) {
            if (reel) reel.remove();
            createReel();
        }
        
        currentIndex = index;
        
        // Position the reel to show the current image
        reel.style.transform = `translateY(-${currentIndex * 100}%)`;
        
        // Fade in current image, fade out others
        const reelImages = reel.querySelectorAll('.reel-image');
        reelImages.forEach((container, i) => {
            if (i === currentIndex) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
        
        // Run AI detection on the current image
        detectClothing(images[currentIndex].src);
        
        imageInfoScreen.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function showNextImage() {
        if (currentIndex < images.length - 1 && !isScrolling) {
            isScrolling = true;
            currentIndex++;
            
            const reelImages = reel.querySelectorAll('.reel-image');
            
            // Fade out current, fade in next
            reelImages[currentIndex - 1].classList.remove('active');
            reelImages[currentIndex].classList.add('active');
            
            // Scroll the reel
            reel.style.transform = `translateY(-${currentIndex * 100}%)`;
            
            // Run AI detection on new image
            detectClothing(images[currentIndex].src);
            
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
            
            // Fade out current, fade in previous
            reelImages[currentIndex + 1].classList.remove('active');
            reelImages[currentIndex].classList.add('active');
            
            // Scroll the reel
            reel.style.transform = `translateY(-${currentIndex * 100}%)`;
            
            // Run AI detection on new image
            detectClothing(images[currentIndex].src);
            
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