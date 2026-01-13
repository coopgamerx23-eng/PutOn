// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    // Add filter logic here
    });
});

// Search functionality
document.querySelector('.search-box input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Add search logic here
    console.log('Searching for:', searchTerm);
});

// Brand detail navigation
function openBrandDetail(brandId) {
    // Navigate to brand detail page
    window.location.href = `/pages/brand-detail.html?brand=${brandId}`;
}