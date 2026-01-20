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

// Sort brands by points
function sortBrandsByPoints(order = 'desc') {
    const grid = document.querySelector('.brands-grid');
    const cards = Array.from(grid.querySelectorAll('.brand-card'));
    
    cards.sort((a, b) => {
        const pointsA = parseFloat(a.querySelector('.brand-points strong').textContent.replace('K', '')) * 1000;
        const pointsB = parseFloat(b.querySelector('.brand-points strong').textContent.replace('K', '')) * 1000;
        
        return order === 'desc' ? pointsB - pointsA : pointsA - pointsB;
    });
    
    // Clear and re-append sorted cards
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
}

// Add sort dropdown to filters section and reorganize layout
document.addEventListener('DOMContentLoaded', function() {
    const filtersSection = document.querySelector('.filters-section');
    const featuredBrand = document.querySelector('.featured-brand');
    const brandsTitle = document.querySelector('.brands-section-title');
    
    // Move "All Brands" title after featured brand
    featuredBrand.parentNode.insertBefore(brandsTitle, filtersSection);
    
    // Move filters section after the title
    brandsTitle.parentNode.insertBefore(filtersSection, brandsTitle.nextSibling);
    
    // Create sort dropdown container
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort-container';
    sortContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-left: 16px;';
    
    const sortLabel = document.createElement('span');
    sortLabel.textContent = 'Sort:';
    sortLabel.style.cssText = 'font-size: 14px; font-weight: 600; color: #2d5a46;';
    
    const sortSelect = document.createElement('select');
    sortSelect.className = 'sort-select';
    sortSelect.style.cssText = `
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.6);
        border: 2px solid transparent;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #3a5a4a;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    sortSelect.innerHTML = `
        <option value="desc">Points: High to Low</option>
        <option value="asc">Points: Low to High</option>
    `;
    
    sortSelect.addEventListener('change', function() {
        sortBrandsByPoints(this.value);
    });
    
    sortSelect.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 255, 255, 0.8)';
        this.style.borderColor = '#2d5a46';
    });
    
    sortSelect.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 255, 255, 0.6)';
        this.style.borderColor = 'transparent';
    });
    
    sortContainer.appendChild(sortLabel);
    sortContainer.appendChild(sortSelect);
    
    // Insert before search box
    const searchBox = filtersSection.querySelector('.search-box');
    filtersSection.insertBefore(sortContainer, searchBox);
    
    // Initial sort (high to low by default)
    sortBrandsByPoints('desc');
});