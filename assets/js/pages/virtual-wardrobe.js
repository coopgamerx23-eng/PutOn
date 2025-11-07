// Virtual Wardrobe JavaScript
let items = [];
let outfits = [];
let currentView = 'items';
let currentAddMethod = 'upload';
let imagePreview = '';

const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  loadOutfits();
  initEventListeners();
});

// Event Listeners
function initEventListeners() {
  // View toggle buttons
  document.getElementById('items-view-btn').addEventListener('click', () => switchView('items'));
  document.getElementById('outfits-view-btn').addEventListener('click', () => switchView('outfits'));

  // Search and filter
  document.getElementById('search-input').addEventListener('input', renderCurrentView);
  document.getElementById('category-filter').addEventListener('change', renderCurrentView);

  // Add item modal
  document.getElementById('add-item-btn').addEventListener('click', openModal);
  document.getElementById('close-modal-btn').addEventListener('click', closeModal);
  document.getElementById('cancel-btn').addEventListener('click', closeModal);

  // Add method tabs
  document.getElementById('upload-tab').addEventListener('click', () => switchAddMethod('upload'));
  document.getElementById('url-tab').addEventListener('click', () => switchAddMethod('url'));

  // File and URL inputs
  document.getElementById('file-input').addEventListener('change', handleFileChange);
  document.getElementById('url-text-input').addEventListener('input', handleUrlChange);

  // Save item
  document.getElementById('save-item-btn').addEventListener('click', addItem);

  // Close modal on background click
  document.getElementById('add-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-modal') closeModal();
  });

  // Event delegation for delete buttons
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const itemId = deleteBtn.getAttribute('data-item-id');
      const outfitId = deleteBtn.getAttribute('data-outfit-id');
      
      if (itemId) {
        deleteItem(itemId);
      } else if (outfitId) {
        deleteOutfit(outfitId);
      }
    }
  });
}

// Load items from storage
async function loadItems() {
  try {
    const res = await fetch('http://localhost:3000/api/wardrobe', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    items = data.items || [];
    renderCurrentView();
    console.log('✅ Loaded wardrobe items from database:', items.length);
  } catch (err) {
    console.error('❌ Error loading wardrobe items:', err);
  }
}

// Load outfits from the database
async function loadOutfits() {
  try {
    const res = await fetch('http://localhost:3000/api/outfits', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    outfits = data.outfits || [];
    renderCurrentView();
    console.log('✅ Loaded outfits from database:', outfits.length);
  } catch (error) {
    console.error('❌ Error loading outfits:', error);
    outfits = [];
    renderCurrentView();
  }
}

// Switch between items and outfits view
function switchView(view) {
  currentView = view;
  
  const itemsBtn = document.getElementById('items-view-btn');
  const outfitsBtn = document.getElementById('outfits-view-btn');
  const categoryFilter = document.getElementById('category-filter');
  const addItemBtn = document.getElementById('add-item-btn');
  const searchInput = document.getElementById('search-input');
  
  if (view === 'items') {
    itemsBtn.classList.add('active');
    outfitsBtn.classList.remove('active');
    categoryFilter.classList.remove('hidden');
    addItemBtn.classList.remove('hidden');
    searchInput.placeholder = 'Search items...';
  } else {
    outfitsBtn.classList.add('active');
    itemsBtn.classList.remove('active');
    categoryFilter.classList.add('hidden');
    addItemBtn.classList.add('hidden');
    searchInput.placeholder = 'Search outfits...';
  }
  
  renderCurrentView();
}

// Render current view
function renderCurrentView() {
  if (currentView === 'items') {
    renderItems();
  } else {
    renderOutfits();
  }
}

// Render items
function renderItems() {
  const itemsView = document.getElementById('items-view');
  const outfitsView = document.getElementById('outfits-view');
  const emptyState = document.getElementById('empty-state');
  
  itemsView.classList.remove('hidden');
  outfitsView.classList.add('hidden');
  
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;
  
  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });
  
  if (filteredItems.length === 0) {
    itemsView.innerHTML = '';
    emptyState.classList.remove('hidden');
    document.getElementById('empty-icon').innerHTML = '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>';
    document.getElementById('empty-title').textContent = 'No items found';
    document.getElementById('empty-message').textContent = 'Add your first clothing item to get started!';
  } else {
    emptyState.classList.add('hidden');
    itemsView.innerHTML = filteredItems.map(item => `
      <div class="item-card">
        <div class="item-image-wrapper">
          <img src="${item.image}" alt="${item.name}" class="item-image" />
          <button class="delete-btn" data-item-id="${item.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="item-info">
          <p class="item-name">${item.name}</p>
          <p class="item-category">${item.category}</p>
        </div>
      </div>
    `).join('');
  }
}

// Render outfits
function renderOutfits() {
  const itemsView = document.getElementById('items-view');
  const outfitsView = document.getElementById('outfits-view');
  const emptyState = document.getElementById('empty-state');
  
  itemsView.classList.add('hidden');
  outfitsView.classList.remove('hidden');
  
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  
  const filteredOutfits = outfits.filter(outfit => 
    outfit.name.toLowerCase().includes(searchQuery)
  );
  
  if (filteredOutfits.length === 0) {
    outfitsView.innerHTML = '';
    emptyState.classList.remove('hidden');
    document.getElementById('empty-icon').innerHTML = '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>';
    document.getElementById('empty-title').textContent = 'No outfits found';
    document.getElementById('empty-message').textContent = 'Create your first outfit to see it here!';
  } else {
    emptyState.classList.add('hidden');
    outfitsView.innerHTML = filteredOutfits.map(outfit => `
      <div class="outfit-card">
        <div class="outfit-header">
          <h3 class="outfit-name">${outfit.name}</h3>
          <button class="delete-btn" data-outfit-id="${outfit.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="outfit-body">
          <div class="outfit-items-grid">
            ${outfit.items && outfit.items.length > 0 ? outfit.items.map(item => `
              <div class="outfit-item">
                <img src="${item.image}" alt="${item.name}" />
              </div>
            `).join('') : '<p class="outfit-empty">No items in this outfit</p>'}
          </div>
          ${outfit.items && outfit.items.length > 0 ? `
            <p class="outfit-count">
              ${outfit.items.length} ${outfit.items.length === 1 ? 'item' : 'items'}
            </p>
          ` : ''}
        </div>
      </div>
    `).join('');
  }
}

// Modal functions
function openModal() {
  document.getElementById('add-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('add-modal').classList.add('hidden');
  resetModal();
}

function resetModal() {
  document.getElementById('file-input').value = '';
  document.getElementById('url-text-input').value = '';
  document.getElementById('item-name-input').value = '';
  document.getElementById('category-input').value = 'tops';
  document.getElementById('image-preview').classList.add('hidden');
  imagePreview = '';
  switchAddMethod('upload');
}

// Switch add method
function switchAddMethod(method) {
  currentAddMethod = method;
  
  const uploadTab = document.getElementById('upload-tab');
  const urlTab = document.getElementById('url-tab');
  const uploadInput = document.getElementById('upload-input');
  const urlInput = document.getElementById('url-input');
  
  if (method === 'upload') {
    uploadTab.classList.add('active');
    urlTab.classList.remove('active');
    uploadInput.classList.remove('hidden');
    urlInput.classList.add('hidden');
  } else {
    urlTab.classList.add('active');
    uploadTab.classList.remove('active');
    urlInput.classList.remove('hidden');
    uploadInput.classList.add('hidden');
  }
}

// Handle file upload
function handleFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    resizeImage(file, 800, 800, 0.8).then(resizedImage => {
      imagePreview = resizedImage;
      showImagePreview(imagePreview);
    });
  }
}

// Resize image to max dimensions and compress
function resizeImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Handle URL input
function handleUrlChange(e) {
  imagePreview = e.target.value;
  if (imagePreview) {
    showImagePreview(imagePreview);
  }
}

// Show image preview
function showImagePreview(src) {
  const previewContainer = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');
  previewImg.src = src;
  previewContainer.classList.remove('hidden');
}

// Add item
async function addItem() {
  const itemName = document.getElementById('item-name-input').value.trim();
  const category = document.getElementById('category-input').value;

  if (!itemName || !imagePreview) {
    alert('Please provide an item name and image');
    return;
  }

  const newItem = {
    name: itemName,
    category: category,
    image: imagePreview
  };

  try {
    const res = await fetch('http://localhost:3000/api/wardrobe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newItem)
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    items.push(data.item);
    renderCurrentView();
    closeModal();
    console.log('✅ Saved item to database:', data.item);
  } catch (error) {
    console.error('❌ Error saving item:', error);
    alert('Failed to save item.');
  }
}

// Delete item
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  try {
    const res = await fetch(`http://localhost:3000/api/wardrobe/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    items = items.filter(item => item.id !== id);
    renderCurrentView();
    console.log('🗑️ Deleted item from database:', id);
  } catch (error) {
    console.error('❌ Error deleting item:', error);
    alert('Failed to delete item.');
  }
}

// Delete outfit
async function deleteOutfit(id) {
  if (!confirm('Are you sure you want to delete this outfit?')) return;

  try {
    const res = await fetch(`http://localhost:3000/api/outfits/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    outfits = outfits.filter(outfit => outfit.id !== id);
    renderCurrentView();
    console.log('🗑️ Deleted outfit from database:', id);
  } catch (error) {
    console.error('❌ Error deleting outfit:', error);
    alert('Failed to delete outfit.');
  }
}