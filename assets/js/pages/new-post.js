let uploadedFile = null;
let wardrobeItems = [];
let taggedItemIds = [];
const selectedTags = {
    gender: [],
    style: [],
    season: []
};

// File upload handling
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const publishBtn = document.getElementById('publishBtn');
const message = document.getElementById('message');
const loading = document.getElementById('loading');

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadedFile = file;
        displayPreview(file);
        validateForm();
    }
}

function displayPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadSection.style.display = 'none';
        previewContainer.classList.add('active');
    };
    reader.readAsDataURL(file);
}

window.removeImage = function() {
    uploadedFile = null;
    previewImage.src = '';
    previewContainer.classList.remove('active');
    uploadSection.style.display = 'block';
    fileInput.value = '';
    validateForm();
}

// Drag and drop
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('drag-over');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('drag-over');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadedFile = file;
        displayPreview(file);
        validateForm();
    }
});

// Load wardrobe items
async function loadWardrobeItems() {
    try {
        const response = await fetch('/api/wardrobe');
        const data = await response.json();
        
        if (data.success) {
            wardrobeItems = data.items;
            displayWardrobeItems();
        }
    } catch (error) {
        console.error('Error loading wardrobe:', error);
    }
}

function displayWardrobeItems() {
    const grid = document.getElementById('wardrobeItemsGrid');
    
    if (wardrobeItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-wardrobe" style="grid-column: 1/-1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <p>Your wardrobe is empty</p>
                <p><a href="/pages/wardrobe.html">Add items to your wardrobe</a> to tag them in posts</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = wardrobeItems.map(item => `
        <div class="wardrobe-item" data-id="${item.id}" onclick="toggleWardrobeItem(${item.id})">
            <img src="${item.image}" alt="${item.name}">
            <div class="wardrobe-item-name">${item.name}</div>
            <div class="check-mark">✓</div>
        </div>
    `).join('');
}

window.toggleWardrobeItem = function(itemId) {
    const itemElement = document.querySelector(`.wardrobe-item[data-id="${itemId}"]`);
    const index = taggedItemIds.indexOf(itemId);
    
    if (index > -1) {
        taggedItemIds.splice(index, 1);
        itemElement.classList.remove('selected');
    } else {
        taggedItemIds.push(itemId);
        itemElement.classList.add('selected');
    }
    
    updateTaggedItemsSummary();
}

function updateTaggedItemsSummary() {
    const summary = document.getElementById('taggedItemsSummary');
    const list = document.getElementById('taggedItemsList');
    
    if (taggedItemIds.length === 0) {
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'block';
    list.innerHTML = taggedItemIds.map(id => {
        const item = wardrobeItems.find(i => i.id === id);
        return `
            <div class="tagged-item-chip">
                ${item.name}
                <button onclick="event.stopPropagation(); toggleWardrobeItem(${id})">×</button>
            </div>
        `;
    }).join('');
}

// Tag selection
document.querySelectorAll('#genderTags .tag-option').forEach(tag => {
    tag.addEventListener('click', () => {
        const tagValue = tag.dataset.tag;
        if (tag.classList.contains('selected')) {
            tag.classList.remove('selected');
            selectedTags.gender = selectedTags.gender.filter(t => t !== tagValue);
        } else {
            tag.classList.add('selected');
            selectedTags.gender.push(tagValue);
        }
        validateForm();
    });
});

document.querySelectorAll('#styleTags .tag-option').forEach(tag => {
    tag.addEventListener('click', () => {
        const tagValue = tag.dataset.tag;
        if (tag.classList.contains('selected')) {
            tag.classList.remove('selected');
            selectedTags.style = selectedTags.style.filter(t => t !== tagValue);
        } else {
            tag.classList.add('selected');
            selectedTags.style.push(tagValue);
        }
        validateForm();
    });
});

document.querySelectorAll('#seasonTags .tag-option').forEach(tag => {
    tag.addEventListener('click', () => {
        const tagValue = tag.dataset.tag;
        if (tag.classList.contains('selected')) {
            tag.classList.remove('selected');
            selectedTags.season = selectedTags.season.filter(t => t !== tagValue);
        } else {
            tag.classList.add('selected');
            selectedTags.season.push(tagValue);
        }
        validateForm();
    });
});

// Form validation
function validateForm() {
    const hasImage = uploadedFile !== null;
    publishBtn.disabled = !hasImage;
}

// Show message
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type} active`;
    setTimeout(() => {
        message.classList.remove('active');
    }, 5000);
}

// Publish post
publishBtn.addEventListener('click', async () => {
    if (!uploadedFile) {
        showMessage('Please upload an image', 'error');
        return;
    }

    loading.classList.add('active');
    publishBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('image', uploadedFile);
        formData.append('caption', document.getElementById('caption').value.trim());
        formData.append('gender', JSON.stringify(selectedTags.gender));
        formData.append('style', JSON.stringify(selectedTags.style));
        formData.append('season', JSON.stringify(selectedTags.season));
        formData.append('wardrobeItems', JSON.stringify(taggedItemIds));

        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Post published successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/pages/explore.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Failed to publish post');
        }
    } catch (error) {
        console.error('Error publishing post:', error);
        showMessage(error.message || 'Failed to publish post. Please try again.', 'error');
        publishBtn.disabled = false;
    } finally {
        loading.classList.remove('active');
    }
});

window.handleCancel = function() {
    if (uploadedFile || document.getElementById('caption').value) {
        if (confirm('Are you sure you want to discard this post?')) {
            window.location.href = '/pages/account-settings.html';
        }
    } else {
        window.location.href = '/pages/account-settings.html';
    }
}

// Initialize
loadWardrobeItems();