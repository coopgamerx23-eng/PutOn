let uploadedFile = null;
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

    // Show loading
    loading.classList.add('active');
    publishBtn.disabled = true;

    try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('caption', document.getElementById('caption').value.trim());
    formData.append('gender', JSON.stringify(selectedTags.gender));
    formData.append('style', JSON.stringify(selectedTags.style));
    formData.append('season', JSON.stringify(selectedTags.season));

    // Send to backend
    const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        showMessage('Post published successfully!', 'success');
        
        // Redirect after short delay
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