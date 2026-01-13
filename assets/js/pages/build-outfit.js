// Drag and Drop Functionality
let draggedItem = null;

// Pagination state with active filters
const paginationState = {
    yourPieces: { 
        currentPage: 1, 
        itemsPerPage: 5, 
        totalItems: 0, 
        allItems: [],
        activeFilter: 'all' // Add filter state
    },
    putOns: { 
        currentPage: 1, 
        itemsPerPage: 5, 
        totalItems: 0, 
        allItems: [],
        activeFilter: 'all' // Add filter state
    }
};

// ========================================
// PAGINATION HELPERS
// ========================================
function getFilteredItems(section) {
    const state = paginationState[section];
    const filter = state.activeFilter;
    
    if (filter === 'all') {
        return state.allItems;
    }
    
    // Filter items by category
    return state.allItems.filter(item => {
        const category = mapTypeToCategory(item.type);
        return category === filter;
    });
}

function getTotalPages(section) {
    const filteredItems = getFilteredItems(section);
    return Math.ceil(filteredItems.length / paginationState[section].itemsPerPage);
}

function getPageItems(section) {
    const state = paginationState[section];
    const filteredItems = getFilteredItems(section);
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    return filteredItems.slice(start, end);
}

function updatePaginationControls(section, gridId) {
    const totalPages = getTotalPages(section);
    const currentPage = paginationState[section].currentPage;
    const filteredItems = getFilteredItems(section);
    const totalItems = filteredItems.length;
    
    const card = document.querySelector(`#${gridId}`).closest('.collection-card');
    const paginationControls = card.querySelector('.pagination-controls');
    const prevBtn = card.querySelector('.prev-btn');
    const nextBtn = card.querySelector('.next-btn');
    const pageInfo = card.querySelector('.pagination-info');
    
    // Hide pagination if 5 or fewer items
    if (totalItems <= 5) {
        if (paginationControls) paginationControls.style.display = 'none';
    } else {
        if (paginationControls) paginationControls.style.display = 'flex';
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages || 1}`;
    }
}

function renderPage(section, gridId) {
    const grid = document.getElementById(gridId);
    const items = getPageItems(section);
    
    grid.classList.add('page-transitioning');
    
    setTimeout(() => {
        grid.innerHTML = '';
        
        if (items.length === 0) {
            const filter = paginationState[section].activeFilter;
            let message;
            
            if (filter === 'all') {
                message = section === 'yourPieces' 
                    ? 'No wardrobe items yet. Add items from the Virtual Wardrobe page!'
                    : 'No items yet. Add items from the Explore page!';
            } else {
                message = `No ${filter} items found.`;
            }
            
            grid.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">
                    ${message}
                </p>`;
        } else {
            items.forEach(item => {
                const itemCard = createItemCard(item);
                grid.appendChild(itemCard);
            });
            initializeDragHandlers();
        }
        
        grid.classList.remove('page-transitioning');
        updatePaginationControls(section, gridId);
    }, 150);
}

function changePage(section, gridId, direction) {
    const totalPages = getTotalPages(section);
    const newPage = paginationState[section].currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        paginationState[section].currentPage = newPage;
        renderPage(section, gridId);
    }
}

// ========================================
// FILTER FUNCTIONALITY (FIXED)
// ========================================
function applyFilter(section, gridId, category) {
    // Update the active filter in state
    paginationState[section].activeFilter = category;
    
    // Reset to page 1 when filter changes
    paginationState[section].currentPage = 1;
    
    // Re-render with the new filter
    renderPage(section, gridId);
}

// ========================================
// LOAD WARDROBE ITEMS
// ========================================
async function loadWardrobeItems() {
    try {
        console.log('🔍 Loading Wardrobe items from database...');

        const res = await fetch('http://localhost:3000/api/wardrobe', {
            method: 'GET',
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error(`Server error ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Loaded wardrobe items:', data);

        if (!data.success || !Array.isArray(data.items)) {
            paginationState.yourPieces.allItems = [];
            paginationState.yourPieces.totalItems = 0;
            renderPage('yourPieces', 'yourPieces');
            return;
        }

        // Format items
        const formattedItems = data.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.category,
            image: item.image,
            brand: item.brand,
            color: item.color,
            size: item.size,
            price: item.price
        }));

        paginationState.yourPieces.allItems = formattedItems;
        paginationState.yourPieces.totalItems = formattedItems.length;
        
        // Keep current filter but reset to page 1
        const currentFilter = paginationState.yourPieces.activeFilter;
        paginationState.yourPieces.currentPage = 1;
        
        renderPage('yourPieces', 'yourPieces');
        
        // Restore active filter button state
        restoreFilterState('yourPieces', currentFilter);

    } catch (err) {
        console.error('❌ Error loading wardrobe items:', err);
        paginationState.yourPieces.allItems = [];
        paginationState.yourPieces.totalItems = 0;
        renderPage('yourPieces', 'yourPieces');
    }
}

// ========================================
// LOAD SAVED ITEMS FROM DATABASE
// ========================================
async function loadPutOns() {
    try {
        console.log('🔍 Loading Put-Ons from database...');

        const res = await fetch('http://localhost:3000/api/putons', {
            method: 'GET',
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error(`Server error ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Loaded from DB:', data);

        if (!data.success || !Array.isArray(data.items)) {
            paginationState.putOns.allItems = [];
            paginationState.putOns.totalItems = 0;
            renderPage('putOns', 'putOns');
            return;
        }

        paginationState.putOns.allItems = data.items;
        paginationState.putOns.totalItems = data.items.length;
        
        // Keep current filter but reset to page 1
        const currentFilter = paginationState.putOns.activeFilter;
        paginationState.putOns.currentPage = 1;
        
        renderPage('putOns', 'putOns');
        
        // Restore active filter button state
        restoreFilterState('putOns', currentFilter);

    } catch (err) {
        console.error('❌ Error loading Put-Ons:', err);
        paginationState.putOns.allItems = [];
        paginationState.putOns.totalItems = 0;
        renderPage('putOns', 'putOns');
    }
}

// ========================================
// RESTORE FILTER BUTTON STATE
// ========================================
function restoreFilterState(section, activeFilter) {
    const gridId = section === 'yourPieces' ? 'yourPieces' : 'putOns';
    const card = document.querySelector(`#${gridId}`).closest('.collection-card');
    const filterBtns = card.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        if (btn.dataset.category === activeFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ========================================
// CREATE ITEM CARD ELEMENT
// ========================================
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.draggable = true;
    
    const category = mapTypeToCategory(item.type);
    card.dataset.category = category;
    card.dataset.item = item.id || item.name.toLowerCase().replace(/\s+/g, '-');
    
    const img = document.createElement('img');
    const imageUrl = item.imageData || item.imageSrc || item.sourceImage || item.image;
    
    if (imageUrl) {
        img.src = imageUrl;
    } else {
        img.src = '/assets/images/icons/placeholder.jpg';
    }
    
    img.alt = item.name;
    img.onerror = function() {
        this.src = '/assets/images/icons/placeholder.jpg';
    };
    
    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = item.name;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-item-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Remove item';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteItem(item.id, card);
    };
    
    card.appendChild(deleteBtn);
    card.appendChild(img);
    card.appendChild(name);
    
    return card;
}

// ========================================
// MAP CLOTHING TYPE TO CATEGORY
// ========================================
function mapTypeToCategory(type) {
    if (!type) return 'shirt';
    
    const lowerType = type.toLowerCase().trim();
    
    const typeMap = {
        'top': 'shirt', 'bottom': 'pants', 'footwear': 'shoes',
        'outerwear': 'outerwear', 'dress': 'pants', 'accessories': 'accessories',
        'tops': 'shirt', 'bottoms': 'pants', 'dresses': 'pants',
        'jacket': 'outerwear', 'coat': 'outerwear', 'hoodie': 'outerwear',
        'sweater': 'outerwear', 'blazer': 'outerwear', 'cardigan': 'outerwear',
        't-shirt': 'shirt', 'shirt': 'shirt', 'blouse': 'shirt',
        'tank': 'shirt', 'tank top': 'shirt', 'tee': 'shirt',
        'jeans': 'pants', 'pants': 'pants', 'trousers': 'pants',
        'shorts': 'pants', 'skirt': 'pants', 'gown': 'pants',
        'sneakers': 'shoes', 'boots': 'shoes', 'shoes': 'shoes', 'sandals': 'shoes',
        'hat': 'accessories', 'cap': 'accessories', 'bag': 'accessories',
        'watch': 'accessories', 'sunglasses': 'accessories', 'glasses': 'accessories',
        'scarf': 'accessories', 'jewelry': 'accessories'
    };
    
    return typeMap[lowerType] || 'shirt';
}

// ========================================
// DELETE ITEM
// ========================================
async function deleteItem(itemId, cardElement) {
    try {
        const res = await fetch(`http://localhost:3000/api/putons/${itemId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to delete');

        cardElement.style.transition = 'all 0.3s ease';
        cardElement.style.transform = 'scale(0)';
        cardElement.style.opacity = '0';
        setTimeout(() => {
            // Remove from state
            paginationState.putOns.allItems = paginationState.putOns.allItems.filter(item => item.id !== itemId);
            paginationState.putOns.totalItems = paginationState.putOns.allItems.length;
            
            // Adjust current page if needed
            const totalPages = getTotalPages('putOns');
            if (paginationState.putOns.currentPage > totalPages && totalPages > 0) {
                paginationState.putOns.currentPage = totalPages;
            }
            
            renderPage('putOns', 'putOns');
        }, 300);

        console.log('✅ Item deleted from database');
    } catch (err) {
        console.error('❌ Error deleting item:', err);
        alert('Failed to delete item.');
    }
}

// ========================================
// INITIALIZE DRAG HANDLERS
// ========================================
function initializeDragHandlers() {
    const allItemCards = document.querySelectorAll('.item-card');
    
    allItemCards.forEach(card => {
        card.ondragstart = null;
        card.ondragend = null;
        
        card.addEventListener('dragstart', (e) => {
            draggedItem = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            draggedItem = null;
        });
    });
}

// ========================================
// SLOT DROP EVENTS
// ========================================
const outfitSlots = document.querySelectorAll('.outfit-slot');

outfitSlots.forEach(slot => {
    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedItem) {
            const itemCategory = draggedItem.dataset.category;
            const slotType = slot.dataset.slot;
            
            if (itemCategory === slotType) {
                slot.classList.add('drag-over');
            }
        }
    });

    slot.addEventListener('dragleave', (e) => {
        slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        
        if (draggedItem) {
            const itemCategory = draggedItem.dataset.category;
            const slotType = slot.dataset.slot;
            
            if (itemCategory !== slotType) {
                showNotification(`This item doesn't fit in the ${slotType} slot!`, 'error');
                return;
            }
            
            const placeholder = slot.querySelector('.slot-placeholder');
            if (placeholder) placeholder.remove();
            
            const existingItem = slot.querySelector('.slot-item');
            if (existingItem) existingItem.remove();
            
            const itemImg = draggedItem.querySelector('img');
            const itemId = draggedItem.dataset.item;
            const itemName = draggedItem.querySelector('.item-name').textContent;
            const itemImageSrc = itemImg.src;
            
            if (itemImg) {
                const newImg = itemImg.cloneNode(true);
                newImg.classList.add('slot-item');
                newImg.dataset.itemId = itemId;
                newImg.dataset.itemName = itemName;
                newImg.dataset.itemImage = itemImageSrc;
                slot.appendChild(newImg);
                slot.classList.add('has-item');
            }
        }
    });

    slot.addEventListener('click', (e) => {
        if (slot.classList.contains('has-item')) {
            const itemImg = slot.querySelector('.slot-item');
            if (itemImg) itemImg.remove();
            
            slot.classList.remove('has-item');
            
            if (!slot.querySelector('.slot-placeholder')) {
                const placeholder = document.createElement('span');
                placeholder.className = 'slot-placeholder';
                const slotName = slot.dataset.slot.charAt(0).toUpperCase() + slot.dataset.slot.slice(1);
                placeholder.textContent = `Drop ${slotName.toLowerCase()} here`;
                slot.appendChild(placeholder);
            }
        }
    });
});

// ========================================
// SAVE OUTFIT FUNCTIONALITY
// ========================================
document.getElementById('saveOutfitBtn').addEventListener('click', async () => {
    const slots = document.querySelectorAll('.outfit-slot');
    const outfitItems = [];
    let hasItems = false;
    
    slots.forEach(slot => {
        const itemImg = slot.querySelector('.slot-item');
        if (itemImg && itemImg.dataset.itemId) {
            outfitItems.push({
                category: slot.dataset.slot,
                itemId: itemImg.dataset.itemId,
                itemName: itemImg.dataset.itemName || 'Unknown',
                imageUrl: itemImg.src
            });
            hasItems = true;
        }
    });
    
    if (!hasItems) {
        showNotification('Please add at least one item to your outfit!', 'error');
        return;
    }
    
    const outfitName = prompt('Give your outfit a name:', 'My Awesome Outfit');
    if (!outfitName || outfitName.trim() === '') return;
    
    try {
        const response = await fetch('http://localhost:3000/api/outfits', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: outfitName.trim(),
                items: outfitItems
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Outfit saved successfully! 🎉', 'success');
            clearOutfitSlots();
        } else {
            showNotification(data.message || 'Failed to save outfit', 'error');
        }
    } catch (error) {
        console.error('❌ Error saving outfit:', error);
        showNotification('Failed to save outfit.', 'error');
    }
});

// ========================================
// HELPER FUNCTIONS
// ========================================
function clearOutfitSlots() {
    const slots = document.querySelectorAll('.outfit-slot');
    slots.forEach(slot => {
        const itemImg = slot.querySelector('.slot-item');
        if (itemImg) itemImg.remove();
        
        slot.classList.remove('has-item');
        
        if (!slot.querySelector('.slot-placeholder')) {
            const placeholder = document.createElement('span');
            placeholder.className = 'slot-placeholder';
            const slotName = slot.dataset.slot.charAt(0).toUpperCase() + slot.dataset.slot.slice(1);
            placeholder.textContent = `Drop ${slotName.toLowerCase()} here`;
            slot.appendChild(placeholder);
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? 'rgba(244, 67, 54, 0.95)' : 'rgba(76, 175, 80, 0.95)'};
        color: white;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// SETUP PAGINATION CONTROLS & FILTERS
// ========================================
function setupPaginationControls() {
    // Your Pieces pagination
    const yourPiecesCard = document.querySelector('#yourPieces').closest('.collection-card');
    
    const yourPiecesControls = document.createElement('div');
    yourPiecesControls.className = 'pagination-controls';
    yourPiecesControls.innerHTML = `
        <button class="pagination-btn prev-btn" onclick="changePage('yourPieces', 'yourPieces', -1)">←</button>
        <span class="pagination-info">1 / 1</span>
        <button class="pagination-btn next-btn" onclick="changePage('yourPieces', 'yourPieces', 1)">→</button>
    `;
    yourPiecesCard.querySelector('.pagination-container').appendChild(yourPiecesControls);
    
    // Put-Ons pagination
    const putOnsCard = document.querySelector('#putOns').closest('.collection-card');
    
    const putOnsControls = document.createElement('div');
    putOnsControls.className = 'pagination-controls';
    putOnsControls.innerHTML = `
        <button class="pagination-btn prev-btn" onclick="changePage('putOns', 'putOns', -1)">←</button>
        <span class="pagination-info">1 / 1</span>
        <button class="pagination-btn next-btn" onclick="changePage('putOns', 'putOns', 1)">→</button>
    `;
    putOnsCard.querySelector('.pagination-container').appendChild(putOnsControls);
}

function setupFilterListeners() {
    // Your Pieces filters
    const yourPiecesCard = document.querySelector('#yourPieces').closest('.collection-card');
    const yourPiecesFilters = yourPiecesCard.querySelectorAll('.filter-btn');
    
    yourPiecesFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            // Update button states
            yourPiecesFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            applyFilter('yourPieces', 'yourPieces', category);
        });
    });
    
    // Put-Ons filters (keep existing behavior for friends/ai)
    const putOnsCard = document.querySelector('#putOns').closest('.collection-card');
    const putOnsFilters = putOnsCard.querySelectorAll('.filter-btn');
    
    putOnsFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            // Update button states
            putOnsFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // For now, just treat friends/ai as 'all'
            // You can implement specific logic later
            const filterCategory = (category === 'friends' || category === 'ai') ? 'all' : category;
            applyFilter('putOns', 'putOns', filterCategory);
        });
    });
}

// Make functions globally accessible
window.changePage = changePage;

// ========================================
// VIEW ALL OUTFITS BUTTON
// ========================================
function createViewOutfitsButton() {
    const outfitCard = document.querySelector('.outfit-card');
    
    const viewOutfitsBtn = document.createElement('button');
    viewOutfitsBtn.className = 'view-outfits-btn';
    viewOutfitsBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
        </svg>
        View All Outfits
    `;
    
    viewOutfitsBtn.addEventListener('click', () => {
        window.location.href = '/pages/virtual-wardrobe.html?tab=outfits';
    });
    
    outfitCard.appendChild(viewOutfitsBtn);
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Build Outfit page loaded');
    setupPaginationControls();
    setupFilterListeners();
    createViewOutfitsButton();
    loadWardrobeItems();
    loadPutOns();
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ Page became visible, reloading items...');
        loadWardrobeItems();
        loadPutOns();
    }
});

window.reloadPutOns = function() {
    console.log('🔄 Manually reloading items...');
    loadWardrobeItems();
    loadPutOns();
};