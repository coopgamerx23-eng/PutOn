// Drag and Drop Functionality
let draggedItem = null;

// ========================================
// LOAD SAVED ITEMS FROM DATABASE
// ========================================
async function loadPutOns() {
    try {
        const putOnsGrid = document.getElementById('putOns');
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

        if (!data.success || !Array.isArray(data.items) || data.items.length === 0) {
            putOnsGrid.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">
                    No items yet. Add items from the Explore page!
                </p>`;
            return;
        }

        putOnsGrid.innerHTML = '';
        data.items.forEach(item => {
            const itemCard = createItemCard(item);
            putOnsGrid.appendChild(itemCard);
        });

        initializeDragHandlers();

    } catch (err) {
        console.error('❌ Error loading Put-Ons:', err);
        document.getElementById('putOns').innerHTML = `
            <p style="text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">
                Failed to load Put-Ons. Please try again later.
            </p>`;
    }
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
    
    console.log('📦 Created card:', {
        name: item.name,
        originalType: item.type,
        mappedCategory: category
    });
    
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
    if (!type) {
        console.warn('⚠️ No type provided, defaulting to shirt');
        return 'shirt';
    }
    
    const lowerType = type.toLowerCase().trim();
    console.log('🔍 Mapping type:', lowerType);
    
    // Map based on the exact types from your server's CLOTHING_CATEGORIES
    const typeMap = {
        // Outerwear
        'jacket': 'outerwear',
        'coat': 'outerwear',
        'hoodie': 'outerwear',
        'sweater': 'outerwear',
        'blazer': 'outerwear',
        'cardigan': 'outerwear',
        'outerwear': 'outerwear',
        
        // Shirts/Tops
        't-shirt': 'shirt',
        'shirt': 'shirt',
        'blouse': 'shirt',
        'top': 'shirt',
        'tank': 'shirt',
        'tank top': 'shirt',
        
        // Pants/Bottoms
        'jeans': 'pants',
        'pants': 'pants',
        'trousers': 'pants',
        'shorts': 'pants',
        'skirt': 'pants',
        'bottom': 'pants',
        
        // Dress
        'dress': 'pants', // Map dress to pants slot or you can create a dress slot
        'gown': 'pants',
        
        // Shoes
        'sneakers': 'shoes',
        'boots': 'shoes',
        'shoes': 'shoes',
        'sandals': 'shoes',
        'footwear': 'shoes',
        
        // Accessories
        'hat': 'accessories',
        'cap': 'accessories',
        'bag': 'accessories',
        'watch': 'accessories',
        'sunglasses': 'accessories',
        'glasses': 'accessories',
        'scarf': 'accessories',
        'jewelry': 'accessories',
        'accessories': 'accessories'
    };
    
    const category = typeMap[lowerType];
    
    if (!category) {
        console.warn(`⚠️ Unknown type "${type}", defaulting to shirt`);
        return 'shirt';
    }
    
    console.log(`✅ Mapped "${type}" → "${category}"`);
    return category;
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
        setTimeout(() => cardElement.remove(), 300);

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
// SLOT DROP EVENTS - WITH CATEGORY MATCHING
// ========================================
const outfitSlots = document.querySelectorAll('.outfit-slot');

outfitSlots.forEach(slot => {
    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedItem) {
            const itemCategory = draggedItem.dataset.category;
            const slotType = slot.dataset.slot;
            
            console.log('🎯 Drag over:', {
                itemCategory: itemCategory,
                slotType: slotType,
                matches: itemCategory === slotType
            });
            
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
                console.log(`❌ Cannot drop ${itemCategory} into ${slotType} slot`);
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
            const itemImageSrc = itemImg.src; // Get the actual item image
            
            if (itemImg) {
                const newImg = itemImg.cloneNode(true);
                newImg.classList.add('slot-item');
                newImg.dataset.itemId = itemId;
                newImg.dataset.itemName = itemName;
                newImg.dataset.itemImage = itemImageSrc; // Store the item's actual image
                slot.appendChild(newImg);
                slot.classList.add('has-item');
                console.log(`✅ Added ${itemCategory} to ${slotType} slot (ID: ${itemId})`);
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
// FILTER FUNCTIONALITY
// ========================================
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const parent = btn.closest('.collection-card');
        const btns = parent.querySelectorAll('.filter-btn');
        const grid = parent.querySelector('.items-grid');
        const category = btn.dataset.category;
        
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const items = grid.querySelectorAll('.item-card');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
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
    
    console.log('💾 Saving outfit:', { name: outfitName, items: outfitItems });
    
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
        showNotification('Failed to save outfit. Please make sure the server endpoint exists.', 'error');
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
// INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Build Outfit page loaded');
    loadPutOns();
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('👁️ Page became visible, reloading items...');
        loadPutOns();
    }
});

window.reloadPutOns = function() {
    console.log('🔄 Manually reloading Put-Ons...');
    loadPutOns();
};