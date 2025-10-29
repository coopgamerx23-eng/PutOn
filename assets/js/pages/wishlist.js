// ===============================
// Wishlist JS (server-connected)
// ===============================

let items = [];
let currentAddMethod = 'upload';
let imagePreview = '';

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

  document.getElementById('upload-tab').addEventListener('click', () => switchAddMethod('upload'));
  document.getElementById('url-tab').addEventListener('click', () => switchAddMethod('url'));

  document.getElementById('add-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-modal') closeModal();
  });
}

// ===============================
// Load Wishlist from backend
// ===============================
async function loadItems() {
  try {
    const res = await fetch("/api/wishlist");
    const data = await res.json();

    if (data.success && Array.isArray(data.items)) {
      items = data.items;
    } else {
      items = [];
    }
    renderItems();
  } catch (error) {
    console.error("❌ Error loading wishlist:", error);
    items = [];
    renderItems();
  }
}

// ===============================
// Render Wishlist
// ===============================
function renderItems() {
  const wishlistView = document.getElementById('wishlist-view');
  const emptyState = document.getElementById('empty-state');

  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filteredItems.length === 0) {
    wishlistView.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    wishlistView.innerHTML = filteredItems.map(item => `
      <div class="wishlist-card">
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
          ${item.brand ? `<p class="item-brand">${item.brand}</p>` : ''}
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
// Delete Wishlist Item
// ===============================
async function deleteItem(id) {
  if (!confirm('Are you sure you want to remove this item from your wishlist?')) return;

  try {
    const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      items = items.filter(item => String(item.id) !== String(id));
      renderItems();
    } else {
      alert("Failed to delete item.");
    }
  } catch (error) {
    console.error("❌ Error deleting wishlist item:", error);
    alert("Failed to delete item.");
  }
}

// ===============================
// Move to Wardrobe (placeholder)
// ===============================
async function moveToWardrobe(id) {
  const item = items.find(i => String(i.id) === String(id));
  if (!item) return;

  if (!confirm('Move this item to your wardrobe? It will be removed from your wishlist.')) return;

  try {
    // TODO: Replace this with your wardrobe API once created
    console.log("Moving item to wardrobe:", item);

    // Delete after moving
    await deleteItem(id);
    alert('✅ Item moved to wardrobe successfully!');
  } catch (error) {
    console.error("❌ Error moving item:", error);
    alert('Failed to move item to wardrobe.');
  }
}

// Make functions available globally
window.deleteItem = deleteItem;
window.moveToWardrobe = moveToWardrobe;
window.addTestItem = addTestItem;