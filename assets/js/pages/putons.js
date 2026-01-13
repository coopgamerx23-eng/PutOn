let items = [];
let imagePreview = '';
let uploadedFile = null;

const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  initEventListeners();
});

// Event listeners
function initEventListeners() {
  document.getElementById('search-input').addEventListener('input', renderItems);
  document.getElementById('category-filter').addEventListener('change', renderItems);

  document.getElementById('add-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-modal') closeModal();
  });
}

// ===============================
// Modal Functions
// ===============================
function openModal() {
  document.getElementById('add-modal').classList.remove('hidden');
  resetForm();
}

function closeModal() {
  document.getElementById('add-modal').classList.add('hidden');
  resetForm();
}

function resetForm() {
  document.getElementById('item-name').value = '';
  document.getElementById('item-category').value = '';
  document.getElementById('item-brand').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-color').value = '';
  document.getElementById('item-size').value = '';
  document.getElementById('item-notes').value = '';
  document.getElementById('image-upload').value = '';
  document.getElementById('item-url-input').value = '';
  document.getElementById('image-preview-container').classList.add('hidden');
  imagePreview = '';
  uploadedFile = null;
}

// ===============================
// Image Handling
// ===============================
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  uploadedFile = file;
  
  // Clear URL input when uploading a file
  document.getElementById('image-url-input').value = '';
  
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview = e.target.result;
    document.getElementById('image-preview').src = imagePreview;
    document.getElementById('image-preview-container').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// ===============================
// Save Item to Put Ons
// ===============================
async function saveItem() {
  const name = document.getElementById('item-name').value.trim();
  const category = document.getElementById('item-category').value;
  const brand = document.getElementById('item-brand').value.trim();
  const price = document.getElementById('item-price').value.trim();
  const color = document.getElementById('item-color').value.trim();
  const size = document.getElementById('item-size').value.trim();
  const notes = document.getElementById('item-notes').value.trim();
  
  // Validation
  if (!name) {
    alert('Please enter an item name');
    return;
  }
  
  if (!category) {
    alert('Please select a category');
    return;
  }
  
  if (!imagePreview && !uploadedFile) {
    alert('Please add an image');
    return;
  }
  
  try {
    let imageUrl = imagePreview;
    
    // If uploading a file, send it to the server first
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      
      const uploadRes = await fetch('/api/putons/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const uploadData = await uploadRes.json();
      
      if (uploadData.success) {
        imageUrl = uploadData.imageUrl;
      } else {
        alert('Failed to upload image');
        return;
      }
    }
    
    // Save item to Put Ons
    const res = await fetch('/api/putons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        type: category,
        category,
        brand,
        price,
        color,
        size,
        notes,
        image: imageUrl
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      closeModal();
      loadItems();
      showNotification('Item added to Put Ons! ✨', 'success');
    } else {
      alert(data.message || 'Failed to add item');
    }
  } catch (error) {
    console.error('❌ Error saving item:', error);
    alert('Failed to add item to Put Ons');
  }
}

// ===============================
// Load putons from backend
// ===============================
async function loadItems() {
  try {
    const res = await fetch("/api/putons", {
      credentials: 'include'
    });
    const data = await res.json();

    if (data.success && Array.isArray(data.items)) {
      items = data.items;
    } else {
      items = [];
    }
    renderItems();
  } catch (error) {
    console.error("❌ Error loading Put Ons:", error);
    items = [];
    renderItems();
  }
}

// ===============================
// Render Put Ons
// ===============================
function renderItems() {
  const putonsView = document.getElementById('putons-view');
  const emptyState = document.getElementById('empty-state');

  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filteredItems.length === 0) {
    putonsView.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    putonsView.innerHTML = filteredItems.map((item, index) => `
      <div class="puton-card" style="--card-index: ${index}">
        <div class="item-image-wrapper">
          <img src="${item.image || '/assets/images/icons/placeholder.jpg'}" alt="${item.name}" class="item-image" />
          <button onclick="deleteItem('${item.id}')" class="delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="item-content">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-category">${item.category || ''}</p>
          ${item.price ? `<p class="item-price">${item.price}</p>` : ''}
          ${item.brand ? `<p class="item-brand"><strong>Brand:</strong> ${item.brand}</p>` : ''}
          ${item.color ? `<p class="item-color"><strong>Color:</strong> ${item.color}</p>` : ''}
          ${item.size ? `<p class="item-size"><strong>Size:</strong> ${item.size}</p>` : ''}
          ${item.notes ? `<p class="item-notes">${item.notes}</p>` : ''}
          <button onclick="moveToWardrobe('${item.id}')" class="move-to-wardrobe-btn">
            Move to Wardrobe
          </button>
        </div>
      </div>
    `).join('');
  }
}

// ===============================
// Delete Put On
// ===============================
async function deleteItem(id) {
  if (!confirm('Are you sure you want to remove this item from Put Ons?')) return;

  try {
    const res = await fetch(`/api/putons/${id}`, { 
      method: "DELETE",
      credentials: 'include'
    });
    const data = await res.json();

    if (data.success) {
      items = items.filter(item => String(item.id) !== String(id));
      renderItems();
      showNotification('Item removed from Put Ons', 'success');
    } else {
      alert("Failed to delete item.");
    }
  } catch (error) {
    console.error("❌ Error deleting Put On item:", error);
    alert("Failed to delete item.");
  }
}

// ===============================
// Move to Wardrobe
// ===============================
async function moveToWardrobe(id) {
  const item = items.find(i => String(i.id) === String(id));
  if (!item) return;

  if (!confirm('Move this item to your wardrobe? It will be removed from Put Ons.')) return;

  try {
    // Add to wardrobe
    const addRes = await fetch('/api/wardrobe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        image: item.image,
        brand: item.brand || '',
        color: item.color || '',
        size: item.size || '',
        price: item.price || '',
        material: ''
      })
    });

    const addData = await addRes.json();

    if (addData.success) {
      // Delete from Put Ons
      await deleteItem(id);
      showNotification('✅ Item moved to wardrobe successfully!', 'success');
    } else {
      alert('Failed to move item to wardrobe.');
    }
  } catch (error) {
    console.error("❌ Error moving item:", error);
    alert('Failed to move item to wardrobe.');
  }
}

// ===============================
// Notification System
// ===============================
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'error' ? 'rgba(244, 67, 54, 0.95)' : 'rgba(76, 175, 80, 0.95)'};
    color: white;
    border-radius: 12px;
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

// Make functions available globally
window.openModal = openModal;
window.closeModal = closeModal;
window.handleImageUpload = handleImageUpload;
// window.handleImageUrl = handleImageUrl;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.moveToWardrobe = moveToWardrobe;