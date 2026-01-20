// Brand detail page data loader
document.addEventListener('DOMContentLoaded', async function() {
    // Get brand ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const brandId = urlParams.get('brand');
    
    if (!brandId) {
        console.error('No brand ID provided');
        return;
    }
    
    // Try to get brand data from sessionStorage first (passed from brands page)
    let brandData = sessionStorage.getItem('currentBrand');
    
    if (brandData) {
        brandData = JSON.parse(brandData);
    } else {
        // If not in sessionStorage, fetch from JSON file
        try {
            const response = await fetch('/data/brands.json');
            const allBrands = await response.json();
            brandData = allBrands[brandId];
        } catch (error) {
            console.error('Error loading brand data:', error);
            return;
        }
    }
    
    if (!brandData) {
        console.error('Brand data not found for:', brandId);
        return;
    }
    
    // Update page title
    document.title = `${brandData.name} - PutOn`;
    
    // Update page header
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        pageHeader.textContent = brandData.name;
    }
    
    const pageSubtitle = document.querySelector('.page-header p');
    if (pageSubtitle && brandData.tagline) {
        pageSubtitle.textContent = brandData.tagline;
    }
    
    // Update hero image
    const heroImage = document.querySelector('.hero-image');
    if (heroImage && brandData.heroImage) {
        heroImage.src = brandData.heroImage;
        heroImage.alt = `${brandData.name} showcase`;
    }
    
    // Update brand logo
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
        if (brandData.logoImage) {
            // If there's a logo image URL, use it
            brandLogo.innerHTML = `<img src="${brandData.logoImage}" alt="${brandData.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 16px;">`;
        } else {
            // Otherwise use the first letter
            brandLogo.textContent = brandData.name.charAt(0).toUpperCase();
        }
    }
    
    // Update brand title and subtitle
    const brandTitle = document.querySelector('.brand-title h2');
    if (brandTitle) {
        brandTitle.textContent = brandData.name;
    }
    
    const brandSubtitle = document.querySelector('.brand-subtitle');
    if (brandSubtitle) {
        brandSubtitle.textContent = brandData.category;
    }
    
    // Update brand description
    const brandDescription = document.querySelector('.brand-description');
    if (brandDescription) {
        brandDescription.textContent = brandData.description;
    }
    
    // Update brand stats
    const stats = document.querySelectorAll('.stat');
    if (stats.length >= 3) {
        // Founded
        if (brandData.founded) {
            stats[0].querySelector('.stat-value').textContent = brandData.founded;
        }
        
        // Origin/Headquarters
        if (brandData.headquarters || brandData.origin) {
            stats[1].querySelector('.stat-value').textContent = brandData.headquarters || brandData.origin;
        }
        
        // Category
        if (brandData.category) {
            stats[2].querySelector('.stat-value').textContent = brandData.category;
        }
    }
    
    // Add additional stats if available
    if (brandData.additionalStats) {
        const statsContainer = document.querySelector('.brand-stats');
        brandData.additionalStats.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'stat';
            statDiv.innerHTML = `
                <span class="stat-label">${stat.label}</span>
                <span class="stat-value">${stat.value}</span>
            `;
            statsContainer.appendChild(statDiv);
        });
    }
    
    // Update products grid
    const productsGrid = document.querySelector('.products-grid');
    const sectionHeader = document.querySelector('.section-header');
    
    if (brandData.products && brandData.products.length > 0) {
        productsGrid.innerHTML = ''; // Clear existing products
        
        brandData.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img class="product-image" src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price}</div>
                </div>
            `;
            
            // Add click handler if product has a link
            if (product.link) {
                productCard.style.cursor = 'pointer';
                productCard.addEventListener('click', () => {
                    window.open(product.link, '_blank');
                });
            }
            
            productsGrid.appendChild(productCard);
        });
        
        // Show the section header
        if (sectionHeader) {
            sectionHeader.style.display = 'block';
        }
    } else {
        // Hide the products section if no products
        if (productsGrid) {
            productsGrid.style.display = 'none';
        }
        if (sectionHeader) {
            sectionHeader.style.display = 'none';
        }
    }
    
    // Update section header
    if (sectionHeader && brandData.productsTitle && brandData.products && brandData.products.length > 0) {
        sectionHeader.querySelector('h3').textContent = brandData.productsTitle;
    }
    
    // Update CTA section
    const ctaTitle = document.querySelector('.cta-section h3');
    if (ctaTitle && brandData.ctaTitle) {
        ctaTitle.textContent = brandData.ctaTitle;
    }
    
    const ctaText = document.querySelector('.cta-section p');
    if (ctaText && brandData.ctaText) {
        ctaText.textContent = brandData.ctaText;
    }
    
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        if (brandData.website) {
            ctaButton.href = brandData.website;
            ctaButton.target = '_blank';
        }
        if (brandData.ctaButtonText) {
            ctaButton.textContent = brandData.ctaButtonText;
        }
    }
    
    // Clear sessionStorage after using it
    sessionStorage.removeItem('currentBrand');
});